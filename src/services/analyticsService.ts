/**
 * Analytics Service — contrato §2.2 Backend.
 * Rutas: /products, /stores, /store-products, /alerts,
 *        /indicators/inflation, /indicators/devaluation-gap, /prices/history.
 * Mock solo via runWithMock (SPEC §2.3).
 */

import { request } from './apiClient';
import { runWithMock } from './mockGate';
import {
  DashboardSummary,
  InflationMetricPoint,
  StoreDispersionItem,
} from '../types/analytics';
import type { Store } from '../types/catalog';
import {
  mapDashboardSummary,
  mapInflationSeries,
  mapStore,
  mapStoreDispersion,
  type ApiAnomalyAlert,
  type ApiCategoria,
  type ApiDevaluationGap,
  type ApiInflationSeries,
  type ApiPriceHistoryList,
  type ApiProductoList,
  type ApiTienda,
  type DashboardCounts,
} from './adapters';
import {
  MOCK_DASHBOARD_SUMMARY,
  MOCK_INFLATION_SERIES,
  MOCK_STORE_DISPERSION,
} from './mockData';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Filtros compartidos del dashboard ejecutivo (HU 3.6). */
export interface DashboardFilterParams {
  periodDays?: number;
  categoryId?: number | 'all';
  storeId?: string | 'all';
}

export async function getDashboardSummary(
  filters: DashboardFilterParams = {}
): Promise<DashboardSummary> {
  const periodDays = filters.periodDays ?? 90;
  const start = daysAgo(periodDays);
  const categoryId = filters.categoryId ?? 'all';
  const storeId = filters.storeId ?? 'all';
  return runWithMock(
    async () => {
      const productsQs = new URLSearchParams({ page_size: '100' });
      if (categoryId !== 'all') productsQs.set('category_id', String(categoryId));
      const pricesQs = new URLSearchParams({ page_size: '500', start });
      if (storeId !== 'all') pricesQs.set('tienda_id', storeId);

      const [productos, categorias, tiendas, prices, shrinkAlerts, inflation, devaluation] =
        await Promise.all([
          request<ApiProductoList>(`/products?${productsQs.toString()}`),
          request<ApiCategoria[]>('/products/categories'),
          request<ApiTienda[]>('/stores'),
          request<ApiPriceHistoryList>(`/prices/history?${pricesQs.toString()}`),
          request<ApiAnomalyAlert[]>('/alerts?type=shrinkflation'),
          request<ApiInflationSeries>(
            `/indicators/inflation?start_date=${start}&end_date=${daysAgo(0)}` +
              (categoryId !== 'all' ? `&category_id=${categoryId}` : '')
          ).catch(() => undefined),
          request<ApiDevaluationGap>(
            `/indicators/devaluation-gap?start_date=${start}&end_date=${daysAgo(0)}`
          ).catch(() => undefined),
        ]);

      let priceItems = prices.items;
      let alerts = shrinkAlerts;
      if (categoryId !== 'all') {
        const ids = new Set(productos.items.map(p => p.id));
        priceItems = priceItems.filter(p => p.producto_id != null && ids.has(p.producto_id));
        alerts = alerts.filter(a => a.producto_id != null && ids.has(a.producto_id));
      }
      if (storeId !== 'all') {
        const storeNum = Number(storeId);
        priceItems = priceItems.filter(p => p.tienda_id === storeNum);
        alerts = alerts.filter(a => a.tienda_id === storeNum);
      }

      const counts: DashboardCounts = {
        productosTotal: productos.total,
        tiendasCount: tiendas.length,
        shrinkAlerts: alerts,
        inflation,
        devaluation,
        prices: priceItems,
        productos: new Map(productos.items.map(p => [p.id, p])),
        categorias: new Map(categorias.map(c => [c.id, c.nombre])),
      };
      return mapDashboardSummary(counts);
    },
    () => MOCK_DASHBOARD_SUMMARY
  );
}

export async function getInflationTimeSeries(
  periodDays: number = 180,
  categoryId: number | 'all' = 'all'
): Promise<InflationMetricPoint[]> {
  return runWithMock(
    async () => {
      const start = daysAgo(periodDays);
      const series = await request<ApiInflationSeries>(
        `/indicators/inflation?start_date=${start}&end_date=${daysAgo(0)}` +
          (categoryId !== 'all' ? `&category_id=${categoryId}` : '')
      );
      return mapInflationSeries(series);
    },
    () => MOCK_INFLATION_SERIES
  );
}

export async function getStoreDispersion(
  periodDays?: number,
  storeId: string | 'all' = 'all'
): Promise<StoreDispersionItem[]> {
  return runWithMock(
    async () => {
      const qs = new URLSearchParams({ page_size: '500', start: daysAgo(periodDays ?? 180) });
      const [pricesRaw, tiendasRaw] = await Promise.all([
        request<ApiPriceHistoryList>(`/prices/history?${qs.toString()}`),
        request<ApiTienda[]>('/stores'),
      ]);
      const tiendas = new Map(tiendasRaw.map(t => [t.id, mapStore(t)]));
      const items = mapStoreDispersion(pricesRaw.items, tiendas);
      return storeId === 'all' ? items : items.filter(s => s.storeId === storeId);
    },
    () => MOCK_STORE_DISPERSION
  );
}

/** Brecha precios vs devaluación (HU 3.4) para metric cards. */
export async function getDevaluationGap(
  startDate?: string,
  endDate?: string
): Promise<ApiDevaluationGap | null> {
  const start = startDate || daysAgo(30);
  const end = endDate || daysAgo(0);
  return runWithMock(
    async () =>
      request<ApiDevaluationGap>(
        `/indicators/devaluation-gap?start_date=${start}&end_date=${end}`
      ),
    () => null
  );
}

export type { Store };
