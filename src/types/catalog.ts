/**
 * Types for PriceScope - Catálogo y Comparación de Productos
 */

export interface Store {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  websiteUrl: string;
  isActive: boolean;
  totalListings?: number;
}

export interface CanonicalProduct {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  ean?: string;
  netWeightQuantity: number;
  netWeightUnit: 'g' | 'kg' | 'ml' | 'l' | 'u';
  description?: string;
  imageUrl?: string;
  listingsCount: number;
  minPriceArs?: number;
  maxPriceArs?: number;
  minPriceUsd?: number;
  maxPriceUsd?: number;
  createdAt: string;
  updatedAt: string;
  // Indicator if there are pending match suggestions or shrinkflation alerts
  hasPendingMatches?: boolean;
  hasShrinkflationAlert?: boolean;
}

export interface ProductListing {
  id: string;
  canonicalProductId?: string | null;
  storeId: string;
  storeName: string;
  externalId: string;
  originalName: string;
  productUrl: string;
  imageUrl?: string;
  currentPriceArs: number;
  currentPriceUsd?: number;
  previousPriceArs?: number | null;
  previousPriceUsd?: number | null;
  isAvailable: boolean;
  lastScrapedAt: string;
  observedWeightQuantity?: number;
  observedWeightUnit?: string;
  isPromotional: boolean;
  promotionMechanic?: string;
  matchConfidence?: number; // 0 to 1, if system suggested
}

export interface MatchSuggestion {
  id: string;
  listingId: string;
  canonicalProductId: string;
  canonicalProductName: string;
  canonicalProductBrand: string;
  canonicalNetWeight: string;
  listingStore: string;
  listingOriginalName: string;
  listingUrl: string;
  listingPriceArs: number;
  confidenceScore: number; // e.g. 0.92 for 92%
  similarityFactors: {
    nameSimilarity: number;
    brandMatch: boolean;
    weightSimilarity: number;
    eanMatch: boolean;
  };
  detectedAt: string;
  status: 'pending' | 'confirmed' | 'rejected';
}

export interface CatalogFilterParams {
  query?: string;
  category?: string;
  brand?: string;
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  hasPromotion?: boolean;
  hasAlert?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'minPrice' | 'listingsCount' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
}
