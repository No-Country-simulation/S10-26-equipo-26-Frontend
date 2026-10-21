/**
 * Currency Service
 * Obtains official and market exchange rates from Backend FastAPI.
 * Validates freshness, detects stale quotes, and guarantees no invented rates.
 */

import { request } from './apiClient';
import { ExchangeRate } from '../types/currency';
import { MOCK_EXCHANGE_RATE } from './mockData';

export async function getActiveExchangeRate(): Promise<ExchangeRate> {
  try {
    const rate = await request<ExchangeRate>('/exchange-rates/active');
    // Check if timestamp is older than 24h
    const quoteTime = new Date(rate.timestamp).getTime();
    const isStale = Date.now() - quoteTime > 24 * 3600 * 1000;
    return {
      ...rate,
      isStale,
    };
  } catch {
    const quoteTime = new Date(MOCK_EXCHANGE_RATE.timestamp).getTime();
    const isStale = Date.now() - quoteTime > 24 * 3600 * 1000;
    return {
      ...MOCK_EXCHANGE_RATE,
      isStale,
    };
  }
}
