/**
 * Mock gate (SPEC §2.3): fallback a mock SOLO si el modo mock está
 * habilitado. Con `VITE_ENABLE_MOCK=false` los errores se propagan.
 */

import { getIsMockMode } from './apiClient';

export function isMockFallbackTriggered(err: unknown): boolean {
  return err instanceof Error && err.message === 'MOCK_FALLBACK_TRIGGERED';
}

/**
 * Ejecuta `real`; si el mock está activo (env o toggle UI) o el cliente
 * lanza MOCK_FALLBACK_TRIGGERED, devuelve el resultado de `mock`.
 * Cualquier otro error se propaga (sin fallback silencioso).
 */
export async function runWithMock<T>(
  real: () => Promise<T>,
  mock: () => T | Promise<T>
): Promise<T> {
  if (getIsMockMode()) {
    return await mock();
  }
  try {
    return await real();
  } catch (err) {
    if (isMockFallbackTriggered(err)) {
      return await mock();
    }
    throw err;
  }
}
