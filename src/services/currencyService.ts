/**
 * Currency Service — contrato §2.2 Backend.
 * Ruta: GET /exchange-rates/as-of?ts=...
 * Mock solo via runWithMock (SPEC §2.3).
 */

import { request } from './apiClient';
import { runWithMock } from './mockGate';
import { ExchangeRate } from '../types/currency';
import { mapExchangeRate, type ApiHistorialDivisa } from './adapters';
import { MOCK_EXCHANGE_RATE } from './mockData';

export async function getActiveExchangeRate(): Promise<ExchangeRate> {
  return runWithMock(
    async () => {
      const ts = new Date().toISOString();
      const rate = await request<ApiHistorialDivisa>(
        `/exchange-rates/as-of?ts=${encodeURIComponent(ts)}`
      );
      return mapExchangeRate(rate);
    },
    () => {
      const quoteTime = new Date(MOCK_EXCHANGE_RATE.timestamp).getTime();
      const isStale = Date.now() - quoteTime > 24 * 3600 * 1000;
      return {
        ...MOCK_EXCHANGE_RATE,
        isStale,
      };
    }
  );
}
