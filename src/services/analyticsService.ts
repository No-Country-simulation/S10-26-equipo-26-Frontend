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

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return runWithMock(
    async () => {
      const [productos, categorias, tiendas, prices, shrinkAlerts, inflation, devaluation] =
        await Promise.all([
          request<ApiProductoList>('/products?page_size=100'),
          request<ApiCategoria[]>('/products/categories'),
          request<ApiTienda[]>('/stores'),
          request<ApiPriceHistoryList>('/prices/history?page_size=500'),
          request<ApiAnomalyAlert[]>('/alerts?type=shrinkflation'),
          request<ApiInflationSeries>(
            `/indicators/inflation?start_date=${daysAgo(90)}&end_date=${daysAgo(0)}`
          ).catch(() => undefined),
          request<ApiDevaluationGap>(
            `/indicators/devaluation-gap?start_date=${daysAgo(30)}&end_date=${daysAgo(0)}`
          ).catch(() => undefined),
        ]);

      const counts: DashboardCounts = {
        productosTotal: productos.total,
        tiendasCount: tiendas.length,
        shrinkAlerts,
        inflation,
        devaluation,
        prices: prices.items,
        productos: new Map(productos.items.map(p => [p.id, p])),
        categorias: new Map(categorias.map(c => [c.id, c.nombre])),
      };
      return mapDashboardSummary(counts);
    },
    () => MOCK_DASHBOARD_SUMMARY
  );
}

export async function getInflationTimeSeries(
  months: number = 6
): Promise<InflationMetricPoint[]> {
  return runWithMock(
    async () => {
      const start = daysAgo(months * 30);
      const series = await request<ApiInflationSeries>(
        `/indicators/inflation?start_date=${start}&end_date=${daysAgo(0)}`
      );
      return mapInflationSeries(series);
    },
    () => MOCK_INFLATION_SERIES
  );
}

export async function getStoreDispersion(): Promise<StoreDispersionItem[]> {
  return runWithMock(
    async () => {
      const [pricesRaw, tiendasRaw] = await Promise.all([
        request<ApiPriceHistoryList>('/prices/history?page_size=500'),
        request<ApiTienda[]>('/stores'),
      ]);
      const tiendas = new Map(tiendasRaw.map(t => [t.id, mapStore(t)]));
      return mapStoreDispersion(pricesRaw.items, tiendas);
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
