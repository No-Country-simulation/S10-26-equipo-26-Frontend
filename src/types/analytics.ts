/**
 * Types for PriceScope - Métricas de Analítica B2B y Dashboard
 */

import { CurrencyCode } from './currency';

export interface InflationMetricPoint {
  date: string;
  headlineInflationMoM: number; // Month-over-month inflation % calculated by Backend
  foodAndBeverageMoM: number;
  personalCareMoM: number;
  householdCleaningMoM: number;
  basketCostArs: number;
  basketCostUsd?: number;
  sampleObservationsCount: number;
}

export interface StoreDispersionItem {
  storeId: string;
  storeName: string;
  averagePriceIndex: number; // 100 = market benchmark average
  cheapestProductsPercentage: number;
  averageDiscountPercentage: number;
  totalMonitoredListings: number;
  stockAvailabilityPercentage: number;
}

export interface DashboardSummary {
  monitoredProductsCount: number;
  monitoredStoresCount: number;
  trackedListingsCount: number;
  activePromotionsCount: number;
  promotionsRatePercentage: number;
  detectedShrinkflationAlertsCount: number;
  confirmedShrinkflationAlertsCount: number;
  
  // Backend-calculated inflation indicators
  periodInflationMoM: number;
  periodInflationYoY: number;
  calculatedAt: string;
  calculationMethod: string; // "Laspeyres Chain-weighted Index"
  
  // Top movers & recent highlights
  topInflationProducts: {
    productId: string;
    productName: string;
    brand: string;
    category: string;
    increasePercentage: number;
    currentPriceArs: number;
    currentPriceUsd?: number;
  }[];
  
  topDeflationOrPromoProducts: {
    productId: string;
    productName: string;
    brand: string;
    category: string;
    decreasePercentage: number;
    currentPriceArs: number;
    currentPriceUsd?: number;
  }[];
}
