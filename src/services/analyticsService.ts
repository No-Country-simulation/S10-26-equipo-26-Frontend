/**
 * Analytics Service
 * Provides macro indicators, consumer basket evolution,
 * store price dispersion benchmarks, and B2B dashboard rollups.
 */

import { request } from './apiClient';
import {
  DashboardSummary,
  InflationMetricPoint,
  StoreDispersionItem,
} from '../types/analytics';
import {
  MOCK_DASHBOARD_SUMMARY,
  MOCK_INFLATION_SERIES,
  MOCK_STORE_DISPERSION,
} from './mockData';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    return await request<DashboardSummary>('/analytics/dashboard-summary');
  } catch {
    return MOCK_DASHBOARD_SUMMARY;
  }
}

export async function getInflationTimeSeries(
  months: number = 6
): Promise<InflationMetricPoint[]> {
  try {
    return await request<InflationMetricPoint[]>(`/analytics/inflation-series?months=${months}`);
  } catch {
    return MOCK_INFLATION_SERIES;
  }
}

export async function getStoreDispersion(): Promise<StoreDispersionItem[]> {
  try {
    return await request<StoreDispersionItem[]>('/analytics/store-dispersion');
  } catch {
    return MOCK_STORE_DISPERSION;
  }
}
