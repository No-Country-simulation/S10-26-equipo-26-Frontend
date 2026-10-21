/**
 * Currency Context & Provider
 * Centralized multi-currency switcher with real backend exchange rate references,
 * staleness alerts, and strict no-hallucination currency formatting.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { CurrencyCode, ExchangeRate } from '../types/currency';
import { getActiveExchangeRate } from '../services/currencyService';

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  exchangeRate: ExchangeRate | null;
  isLoadingRate: boolean;
  rateError: string | null;
  refreshRate: () => Promise<void>;
  formatMoney: (amountArs?: number | null, amountUsd?: number | null) => string;
  formatUnitRate: (amountArs?: number | null, amountUsd?: number | null, unit?: string) => string;
  convertArsToCurrent: (amountArs?: number | null, explicitUsd?: number | null) => number | null;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<CurrencyCode>('ARS');
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(true);
  const [rateError, setRateError] = useState<string | null>(null);

  const fetchRate = async () => {
    setIsLoadingRate(true);
    setRateError(null);
    try {
      const rate = await getActiveExchangeRate();
      setExchangeRate(rate);
    } catch (err: any) {
      setRateError('No se pudo obtener la cotización oficial del Backend.');
    } finally {
      setIsLoadingRate(false);
    }
  };

  useEffect(() => {
    fetchRate();
  }, []);

  const convertArsToCurrent = (amountArs?: number | null, explicitUsd?: number | null): number | null => {
    if (amountArs === undefined || amountArs === null || isNaN(amountArs)) {
      return null;
    }
    if (currency === 'ARS') {
      return amountArs;
    }
    // Currency is USD
    if (explicitUsd !== undefined && explicitUsd !== null && !isNaN(explicitUsd)) {
      return explicitUsd;
    }
    if (exchangeRate && exchangeRate.rate > 0) {
      return Number((amountArs / exchangeRate.rate).toFixed(2));
    }
    return null;
  };

  const formatMoney = (amountArs?: number | null, amountUsd?: number | null): string => {
    if (amountArs === undefined || amountArs === null || isNaN(amountArs)) {
      return 'N/D';
    }

    if (currency === 'ARS') {
      // Spanish Argentina format: $ 1.450,00
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amountArs);
    } else {
      // Currency is USD
      const valUsd = convertArsToCurrent(amountArs, amountUsd);
      if (valUsd === null) {
        return 'Cotización N/D';
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(valUsd);
    }
  };

  const formatUnitRate = (
    amountArs?: number | null,
    amountUsd?: number | null,
    unit: string = 'kg'
  ): string => {
    const moneyStr = formatMoney(amountArs, amountUsd);
    if (moneyStr === 'N/D' || moneyStr === 'Cotización N/D') {
      return moneyStr;
    }
    return `${moneyStr} / ${unit}`;
  };

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      exchangeRate,
      isLoadingRate,
      rateError,
      refreshRate: fetchRate,
      formatMoney,
      formatUnitRate,
      convertArsToCurrent,
    }),
    [currency, exchangeRate, isLoadingRate, rateError]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
