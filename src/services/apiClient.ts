/**
 * PriceScope API Client
 * Centralized HTTP client communicating with FastAPI backend.
 *
 * Contrato (SPEC-IMPLEMENTACION §2.3):
 * - `VITE_API_BASE_URL`: prefijo base (default `/api/v1`).
 * - `VITE_ENABLE_MOCK`: mock SOLO si es `true` (dev local sin backend).
 *   Con mock desactivado los errores se propagan: nunca fallback silencioso.
 */

import { ApiError } from '../types/api';

const env = (
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env
) ?? {};

const DEFAULT_BASE_URL: string = env.VITE_API_BASE_URL || '/api/v1';
const DEFAULT_MOCK =
  String(env.VITE_ENABLE_MOCK ?? 'false').toLowerCase() === 'true';

/** Base efectiva (se puede sobreescribir en tests con __setConfigForTests). */
let baseUrl = DEFAULT_BASE_URL;
/** Si el entorno permite mock (VITE_ENABLE_MOCK=true). */
let mockEnabled = DEFAULT_MOCK;
/** Toggle del usuario en la UI. */
let forceMockMode = DEFAULT_MOCK;
let isMockFallbackActive = false;
const listeners: ((active: boolean) => void)[] = [];

/** Default documentado; la base efectiva se lee en cada request. */
export const API_BASE_URL = DEFAULT_BASE_URL;

/**
 * Seam de testing: `import.meta.env` es snapshot en Vitest, así que la
 * configuración se inyecta por código. Solo para tests.
 */
export function __setConfigForTests(config: {
  baseUrl?: string;
  mock?: boolean;
}): void {
  baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  mockEnabled = config.mock ?? DEFAULT_MOCK;
  forceMockMode = mockEnabled;
  isMockFallbackActive = false;
}

export function __resetConfigForTests(): void {
  __setConfigForTests({});
}

export function getIsMockMode(): boolean {
  return forceMockMode || isMockFallbackActive;
}

export function setForceMockMode(enabled: boolean) {
  forceMockMode = enabled;
  notifyListeners();
}

export function subscribeMockMode(callback: (active: boolean) => void): () => void {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function notifyListeners() {
  const current = getIsMockMode();
  listeners.forEach(fn => fn(current));
}

function activateFallback() {
  if (!isMockFallbackActive) {
    isMockFallbackActive = true;
    notifyListeners();
  }
}

export class PriceScopeApiException extends Error {
  code: string;
  statusCode: number;
  detail?: string | Record<string, unknown>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'PriceScopeApiException';
    this.code = error.code;
    this.statusCode = error.statusCode;
    this.detail = error.detail;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (forceMockMode) {
    throw new Error('MOCK_FALLBACK_TRIGGERED');
  }

  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody: { code?: string; message?: string; detail?: unknown } | null = null;
      try {
        errorBody = (await response.json()) as {
          code?: string;
          message?: string;
          detail?: unknown;
        };
      } catch {
        errorBody = { message: response.statusText };
      }

      const rawDetail = errorBody?.detail;
      const detail =
        typeof rawDetail === 'string' || (rawDetail !== null && typeof rawDetail === 'object')
          ? (rawDetail as ApiError['detail'])
          : undefined;
      const apiError: ApiError = {
        code: errorBody?.code || `HTTP_${response.status}`,
        message:
          errorBody?.message ||
          (typeof rawDetail === 'string' ? rawDetail : '') ||
          `Error en la petición: ${response.status}`,
        detail,
        statusCode: response.status,
      };
      throw new PriceScopeApiException(apiError);
    }

    const data = await response.json();
    if (isMockFallbackActive) {
      isMockFallbackActive = false;
      notifyListeners();
    }
    return data;
  } catch (err: unknown) {
    if (err instanceof PriceScopeApiException) {
      throw err;
    }

    // Error de red / timeout / abort:
    // - con VITE_ENABLE_MOCK=true (dev sin backend) => fallback a mock.
    // - con mock deshabilitado => se propaga el error original (SPEC §2.3).
    if (mockEnabled || getIsMockMode()) {
      activateFallback();
      throw new Error('MOCK_FALLBACK_TRIGGERED', { cause: err });
    }
    throw err;
  }
}
