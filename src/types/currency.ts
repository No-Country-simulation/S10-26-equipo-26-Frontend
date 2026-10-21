/**
 * Types for PriceScope - Selector de Moneda y Cotizaciones Oficiales / Backend
 */

export type CurrencyCode = 'ARS' | 'USD';

export interface ExchangeRate {
  baseCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  rate: number; // e.g. 1 USD = 1180.50 ARS => 1180.50
  rateType: 'official' | 'market_mep' | 'crypto' | 'weighted_index';
  source: string; // e.g. "BCRA / Backend TimescaleDB"
  timestamp: string; // ISO 8601 of the quote
  fetchedAt: string;
  isStale?: boolean; // True if quote is > 24h old without refresh
}

export interface CurrencyConversionState {
  currentCurrency: CurrencyCode;
  exchangeRate: ExchangeRate | null;
  isLoading: boolean;
  isStale: boolean;
  hasError: boolean;
  errorMessage?: string;
}
