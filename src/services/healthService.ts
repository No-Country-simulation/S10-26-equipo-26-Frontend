/**
 * Health service — GET /api/v1/health (HU 0.4).
 * Contrato: { status, app, version } (ver OpenAPI del Backend).
 */

import { request } from './apiClient';

export interface HealthResponse {
  status: string;
  app: string;
  version: string;
}

export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health');
}

/** true si el Backend responde `status === "ok"`. */
export async function isBackendHealthy(): Promise<boolean> {
  try {
    const health = await getHealth();
    return health.status === 'ok';
  } catch {
    return false;
  }
}
