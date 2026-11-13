/**
 * Types for PriceScope - Métricas de Analítica B2B y Dashboard
 */


export interface InflationMetricPoint {
  date: string;
  headlineInflationMoM: number; // variación % del índice vs. punto anterior
  foodAndBeverageMoM: number;
  personalCareMoM: number;
  householdCleaningMoM: number;
  sampleObservationsCount: number;
}

export interface StoreDispersionItem {
  storeId: string;
  storeName: string;
  averagePriceIndex: number; // 100 = market benchmark average
  cheapestProductsPercentage: number;
  averageDiscountPercentage: number;
  totalMonitoredListings: number;
  /** % de observaciones recientes en stock; null = sin datos (HU 2.1). */
  stockAvailabilityPercentage: number | null;
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
  calculationMethod: string; // p.ej. "mediana movil 7d ... base 100"
  
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
