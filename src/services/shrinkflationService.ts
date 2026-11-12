/**
 * Shrinkflation Service — contrato §2.2 Backend.
 * Rutas: GET /alerts?type=shrinkflation, PATCH /alerts/{id}.
 * Mock solo via runWithMock (SPEC §2.3).
 */

import { request } from './apiClient';
import { runWithMock } from './mockGate';
import {
  ShrinkflationAlert,
  ShrinkflationFilterParams,
  ShrinkflationStatus,
} from '../types/shrinkflation';
import type { Store } from '../types/catalog';
import {
  mapAlertToShrinkflation,
  mapAlertStatusToApi,
  mapStore,
  type ApiAnomalyAlert,
  type ApiCategoria,
  type ApiProducto,
  type ApiProductoList,
  type ApiTienda,
} from './adapters';
import { MOCK_SHRINKFLATION_ALERTS } from './mockData';

const localAlerts = [...MOCK_SHRINKFLATION_ALERTS];

async function fetchShrinkContext(): Promise<{
  productos: Map<number, ApiProducto>;
  categorias: Map<number, string>;
  tiendas: Map<number, Store>;
}> {
  const [productosRes, categoriasRes, tiendasRes] = await Promise.all([
    request<ApiProductoList>('/products?page_size=100'),
    request<ApiCategoria[]>('/products/categories'),
    request<ApiTienda[]>('/stores'),
  ]);
  return {
    productos: new Map(productosRes.items.map(p => [p.id, p])),
    categorias: new Map(categoriasRes.map(c => [c.id, c.nombre])),
    tiendas: new Map(tiendasRes.map(t => [t.id, mapStore(t)])),
  };
}

function applyClientFilters(
  alerts: ShrinkflationAlert[],
  params: ShrinkflationFilterParams
): ShrinkflationAlert[] {
  let filtered = alerts;
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
    filtered = filtered.filter(
      a => a.effectiveUnitInflationPercentage >= (params.minHiddenInflation || 0)
    );
  }
  return filtered;
}

export async function getShrinkflationAlerts(
  params: ShrinkflationFilterParams = {}
): Promise<ShrinkflationAlert[]> {
  return runWithMock(
    async () => {
      const qs = new URLSearchParams();
      qs.set('type', 'shrinkflation');
      if (params.status && params.status !== 'all') {
        qs.set('status', params.status === 'confirmed' ? 'reviewed' : 'open');
      }
      const [raw, ctx] = await Promise.all([
        request<ApiAnomalyAlert[]>(`/alerts?${qs.toString()}`),
        fetchShrinkContext(),
      ]);
      const mapped = raw.map(a => mapAlertToShrinkflation(a, ctx));
      return applyClientFilters(mapped, params);
    },
    () => {
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
        filtered = filtered.filter(
          a => a.effectiveUnitInflationPercentage >= (params.minHiddenInflation || 0)
        );
      }
      return filtered;
    }
  );
}

export async function getShrinkflationAlertById(
  alertId: string
): Promise<ShrinkflationAlert> {
  return runWithMock(
    async () => {
      const [raw, ctx] = await Promise.all([
        request<ApiAnomalyAlert[]>('/alerts?type=shrinkflation'),
        fetchShrinkContext(),
      ]);
      const found = raw.find(a => String(a.id) === alertId);
      if (!found) {
        throw new Error(`Alerta de reduflación no encontrada con ID: ${alertId}`);
      }
      return mapAlertToShrinkflation(found, ctx);
    },
    () => {
      const alert = localAlerts.find(a => a.id === alertId);
      if (!alert) {
        throw new Error(`Alerta de reduflación no encontrada con ID: ${alertId}`);
      }
      return alert;
    }
  );
}

/**
 * Actualiza dictamen de auditoría (HU 3.5 front).
 * Backend solo distingue open/reviewed: confirmed → reviewed, resto → open.
 * `notes` se guarda solo en mock (Backend no expone campo de notas).
 */
export async function updateAlertStatus(
  alertId: string,
  newStatus: ShrinkflationStatus,
  notes?: string
): Promise<ShrinkflationAlert> {
  return runWithMock(
    async () => {
      const updated = await request<ApiAnomalyAlert>(`/alerts/${alertId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: mapAlertStatusToApi(newStatus) }),
      });
      const ctx = await fetchShrinkContext();
      const mapped = mapAlertToShrinkflation(updated, ctx);
      if (notes) mapped.notes = notes;
      return mapped;
    },
    () => {
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
  );
}
