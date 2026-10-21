/**
 * Pricing Service
 * Handles historical price series, promotional observations,
 * price types (regular observed, estimated, promotional), and TimescaleDB aggregates.
 */

import { request } from './apiClient';
import { ProductPriceHistory, PromotionSummaryItem } from '../types/pricing';
import { generateMockPriceHistory, MOCK_PROMOTIONS } from './mockData';

export async function getProductPriceHistory(
  canonicalProductId: string,
  period: '7d' | '30d' | '90d' | '180d' | '1y' | 'all' = '30d'
): Promise<ProductPriceHistory> {
  try {
    return await request<ProductPriceHistory>(
      `/canonical-products/${canonicalProductId}/price-history?period=${period}`
    );
  } catch {
    const history = generateMockPriceHistory(canonicalProductId);
    history.period = period;
    return history;
  }
}

export async function getActivePromotions(
  storeId?: string,
  minDiscount?: number
): Promise<PromotionSummaryItem[]> {
  const queryParams = new URLSearchParams();
  if (storeId) queryParams.set('store_id', storeId);
  if (minDiscount) queryParams.set('min_discount', minDiscount.toString());

  try {
    return await request<PromotionSummaryItem[]>(`/promotions?${queryParams.toString()}`);
  } catch {
    let promos = [...MOCK_PROMOTIONS];
    if (storeId && storeId !== 'all') {
      promos = promos.filter(p => p.storeName.toLowerCase().includes(storeId.toLowerCase()));
    }
    if (minDiscount) {
      promos = promos.filter(p => p.discountPercentage >= minDiscount);
    }
    return promos;
  }
}
