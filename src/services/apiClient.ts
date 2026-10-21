/**
 * PriceScope API Client
 * Centralized HTTP client communicating with FastAPI backend.
 * Provides typed requests, error handling, mock fallback detection,
 * and transparent offline resilience for development and evaluation.
 */

import { ApiError } from '../types/api';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

// Configurable state: whether we are using live FastAPI or mock fallback
let isMockFallbackActive = false;
let forceMockMode = true; // Default to true in standalone client preview if FastAPI is not yet running
const listeners: ((active: boolean) => void)[] = [];

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

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
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
      let errorBody: any = null;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { message: response.statusText };
      }

      const apiError: ApiError = {
        code: errorBody?.code || `HTTP_${response.status}`,
        message: errorBody?.message || errorBody?.detail || `Error en la petición: ${response.status}`,
        detail: errorBody?.detail,
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
  } catch (err: any) {
    if (err instanceof PriceScopeApiException) {
      throw err;
    }

    // Network error, backend not running, or abort => trigger mock fallback
    if (!isMockFallbackActive) {
      isMockFallbackActive = true;
      notifyListeners();
    }
    throw new Error('MOCK_FALLBACK_TRIGGERED');
  }
}
