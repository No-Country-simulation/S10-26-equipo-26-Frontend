/**
 * Types for PriceScope - Precios, Promociones y Series de Tiempo
 */

export type PriceType = 'regular_observed' | 'regular_estimated' | 'promotional';

export interface PriceObservation {
  id: string;
  listingId: string;
  storeId: string;
  storeName: string;
  timestamp: string; // ISO 8601
  observedPriceArs: number;
  observedPriceUsd?: number;
  previousPriceArs?: number | null;
  previousPriceUsd?: number | null;
  priceType: PriceType;
  isPromotional: boolean;
  promotionMechanic?: string; // e.g. "2da al 70%", "3x2", "Descuento 25%", "Precio Club"
  discountPercentage?: number;
  observedWeightQuantity?: number;
  observedWeightUnit?: string;
  unitPriceStandardArs?: number; // e.g. price per 1kg or 1L
  unitPriceStandardUsd?: number;
  isExcludedFromInflationIndex?: boolean; // Managed by backend index rules
  exclusionReason?: string;
}

export interface StorePricePoint {
  date: string;
  priceArs: number;
  priceUsd?: number;
  priceType: PriceType;
  isPromotional: boolean;
  promotionMechanic?: string;
  discountPercentage?: number;
}

export interface ProductPriceHistory {
  canonicalProductId: string;
  period: '7d' | '30d' | '90d' | '180d' | '1y' | 'all';
  stores: {
    storeId: string;
    storeName: string;
    observations: StorePricePoint[];
  }[];
  summary: {
    currentMinPriceArs: number;
    currentMaxPriceArs: number;
    priceSpreadPercentage: number;
    variation30dPercentage: number;
    promoFrequencyPercentage: number;
  };
}

export interface PromotionSummaryItem {
  id: string;
  listingId: string;
  canonicalProductId: string;
  canonicalProductName: string;
  storeName: string;
  originalPriceArs: number;
  promoPriceArs: number;
  originalPriceUsd?: number;
  promoPriceUsd?: number;
  discountPercentage: number;
  mechanic: string;
  validUntil?: string;
  lastVerifiedAt: string;
  productUrl: string;
}
