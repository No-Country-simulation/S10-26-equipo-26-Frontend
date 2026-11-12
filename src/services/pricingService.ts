/**
 * Pricing Service — contrato §2.2 Backend.
 * Rutas: /prices/history (derivación de promos desde is_promotion).
 * Mock solo via runWithMock (SPEC §2.3).
 */

import { request } from './apiClient';
import { runWithMock } from './mockGate';
import type { ProductPriceHistory, PromotionSummaryItem } from '../types/pricing';
import type { Store } from '../types/catalog';
import {
  mapPriceHistory,
  mapPromotions,
  mapStore,
  type ApiPriceHistoryList,
  type ApiPricePoint,
  type ApiProducto,
  type ApiProductoList,
  type ApiStoreProduct,
  type ApiTienda,
} from './adapters';
import { generateMockPriceHistory, MOCK_PROMOTIONS } from './mockData';

const PERIOD_DAYS: Record<string, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '180d': 180,
  '1y': 365,
};

function startForPeriod(period: string): string | null {
  const days = PERIOD_DAYS[period];
  if (!days) return null;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

async function fetchStoresMap(): Promise<Map<number, Store>> {
  const raw = await request<ApiTienda[]>('/stores');
  return new Map(raw.map(t => [t.id, mapStore(t)]));
}

async function fetchProductsMap(): Promise<Map<number, ApiProducto>> {
  const raw = await request<ApiProductoList>('/products?page_size=100');
  return new Map(raw.items.map(p => [p.id, p]));
}

export async function getProductPriceHistory(
  canonicalProductId: string,
  period: '7d' | '30d' | '90d' | '180d' | '1y' | 'all' = '30d'
): Promise<ProductPriceHistory> {
  return runWithMock(
    async () => {
      const productoId = Number(canonicalProductId);
      const qs = new URLSearchParams();
      qs.set('producto_id', String(productoId));
      qs.set('page_size', '500');
      const start = startForPeriod(period);
      if (start) qs.set('start', start);

      const [history, tiendas] = await Promise.all([
        request<ApiPriceHistoryList>(`/prices/history?${qs.toString()}`),
        fetchStoresMap(),
      ]);
      return mapPriceHistory(canonicalProductId, period, history.items, tiendas);
    },
    () => {
      const history = generateMockPriceHistory(canonicalProductId);
      history.period = period;
      return history;
    }
  );
}

/**
 * Promociones: derivadas de `/prices/history` con `is_promotion=true`
 * (el Backend no expone `/promotions`; spec §2.2).
 */
export async function getActivePromotions(
  storeId?: string,
  minDiscount?: number
): Promise<PromotionSummaryItem[]> {
  return runWithMock(
    async () => {
      const [history, productos, tiendas, sps] = await Promise.all([
        request<ApiPriceHistoryList>('/prices/history?page_size=500'),
        fetchProductsMap(),
        fetchStoresMap(),
        request<ApiStoreProduct[]>('/store-products'),
      ]);

      const spByPair = new Map<string, ApiStoreProduct>();
      for (const sp of sps) {
        if (sp.producto_id != null) spByPair.set(`${sp.producto_id}:${sp.tienda_id}`, sp);
      }

      let promos = mapPromotions(history.items, productos, tiendas, spByPair);

      if (storeId && storeId !== 'all') {
        // El filtro del UI envía nombre de tienda ("Coto") o id numérico
        const byId = tiendas.get(Number(storeId));
        const name = byId?.name || storeId;
        promos = promos.filter(
          p =>
            p.storeName.toLowerCase().includes(name.toLowerCase()) ||
            String(storeId) === storeId && p.storeName === name
        );
      }
      if (minDiscount) {
        promos = promos.filter(p => p.discountPercentage >= minDiscount);
      }
      return promos;
    },
    () => {
      let promos = [...MOCK_PROMOTIONS];
      if (storeId && storeId !== 'all') {
        promos = promos.filter(p => p.storeName.toLowerCase().includes(storeId.toLowerCase()));
      }
      if (minDiscount) {
        promos = promos.filter(p => p.discountPercentage >= minDiscount);
      }
      return promos;
    }
  );
}

/** Puntos de precio crudos (uso interno / tests). */
export async function getPricePoints(
  productoId?: number
): Promise<ApiPricePoint[]> {
  const qs = new URLSearchParams();
  if (productoId != null) qs.set('producto_id', String(productoId));
  qs.set('page_size', '500');
  const res = await request<ApiPriceHistoryList>(`/prices/history?${qs.toString()}`);
  return res.items;
}
