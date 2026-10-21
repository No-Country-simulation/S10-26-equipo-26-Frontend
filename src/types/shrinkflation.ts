/**
 * Types for PriceScope - Detección de Reduflación (Shrinkflation)
 */

export type ShrinkflationStatus = 'confirmed' | 'suspected' | 'unknown';

export interface PackagingEvidence {
  timestamp: string;
  sourceStore: string;
  sourceUrl: string;
  extractedTextSnippet?: string;
  snapshotUrl?: string;
  weightDeclaredQuantity: number;
  weightDeclaredUnit: string;
  observedPriceArs: number;
  calculatedPricePerUnitArs: number; // e.g., price per 1kg or 1L
  calculatedPricePerUnitUsd?: number;
}

export interface ShrinkflationAlert {
  id: string;
  canonicalProductId: string;
  canonicalProductName: string;
  brand: string;
  category: string;
  storeId?: string;
  storeName?: string;
  status: ShrinkflationStatus;
  detectedAt: string;
  confirmedAt?: string;
  confidenceScore?: number; // 0.0 to 1.0 (for suspected cases)
  
  // Weight & Volume Changes
  originalWeightQuantity: number;
  originalWeightUnit: string;
  newWeightQuantity: number;
  newWeightUnit: string;
  weightChangePercentage: number; // e.g. -20%
  
  // Nominal and Unit Price Impact
  nominalPriceBeforeArs: number;
  nominalPriceAfterArs: number;
  nominalPriceChangePercentage: number;
  
  unitPriceBeforeArs: number; // $/kg or $/l
  unitPriceAfterArs: number;
  effectiveUnitInflationPercentage: number; // The hidden inflation rate: e.g. +25%
  
  // USD estimates if available from backend
  unitPriceBeforeUsd?: number;
  unitPriceAfterUsd?: number;
  
  // Evidence details
  evidenceBaseline: PackagingEvidence;
  evidenceCurrent: PackagingEvidence;
  notes?: string;
}

export interface ShrinkflationFilterParams {
  status?: ShrinkflationStatus | 'all';
  category?: string;
  brand?: string;
  storeId?: string;
  period?: '7d' | '30d' | '90d' | '1y' | 'all';
  minHiddenInflation?: number;
}
