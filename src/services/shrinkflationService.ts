/**
 * Shrinkflation (Reduflación) Service
 * Manages packaging variation alerts, evidence trails, status confirmation
 * ('confirmed' | 'suspected' | 'unknown'), and effective unit inflation calculations.
 */

import { request } from './apiClient';
import {
  ShrinkflationAlert,
  ShrinkflationFilterParams,
  ShrinkflationStatus,
} from '../types/shrinkflation';
import { MOCK_SHRINKFLATION_ALERTS } from './mockData';

let localAlerts = [...MOCK_SHRINKFLATION_ALERTS];

export async function getShrinkflationAlerts(
  params: ShrinkflationFilterParams = {}
): Promise<ShrinkflationAlert[]> {
  const queryParams = new URLSearchParams();
  if (params.status && params.status !== 'all') queryParams.set('status', params.status);
  if (params.category && params.category !== 'all') queryParams.set('category', params.category);
  if (params.brand && params.brand !== 'all') queryParams.set('brand', params.brand);
  if (params.storeId && params.storeId !== 'all') queryParams.set('store_id', params.storeId);
  if (params.minHiddenInflation) queryParams.set('min_inflation', params.minHiddenInflation.toString());

  try {
    return await request<ShrinkflationAlert[]>(`/shrinkflation-alerts?${queryParams.toString()}`);
  } catch {
    let filtered = [...localAlerts];

    if (params.status && params.status !== 'all') {
      filtered = filtered.filter(a => a.status === params.status);
    }
    if (params.category && params.category !== 'all') {
      filtered = filtered.filter(a => a.category === params.category);
    }
    if (params.brand && params.brand !== 'all') {
      filtered = filtered.filter(a => a.brand === params.brand);
    }
    if (params.storeId && params.storeId !== 'all') {
      filtered = filtered.filter(a => a.storeId === params.storeId);
    }
    if (params.minHiddenInflation) {
      filtered = filtered.filter(a => a.effectiveUnitInflationPercentage >= (params.minHiddenInflation || 0));
    }

    return filtered;
  }
}

export async function getShrinkflationAlertById(alertId: string): Promise<ShrinkflationAlert> {
  try {
    return await request<ShrinkflationAlert>(`/shrinkflation-alerts/${alertId}`);
  } catch {
    const alert = localAlerts.find(a => a.id === alertId);
    if (!alert) {
      throw new Error(`Alerta de reduflación no encontrada con ID: ${alertId}`);
    }
    return alert;
  }
}

export async function updateAlertStatus(
  alertId: string,
  newStatus: ShrinkflationStatus,
  notes?: string
): Promise<ShrinkflationAlert> {
  try {
    return await request<ShrinkflationAlert>(`/shrinkflation-alerts/${alertId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus, notes }),
    });
  } catch {
    const alert = localAlerts.find(a => a.id === alertId);
    if (!alert) {
      throw new Error(`Alerta de reduflación no encontrada con ID: ${alertId}`);
    }
    alert.status = newStatus;
    if (newStatus === 'confirmed') {
      alert.confirmedAt = new Date().toISOString();
      alert.confidenceScore = 1.0;
    }
    if (notes) {
      alert.notes = notes;
    }
    return alert;
  }
}
