/**
 * Catalog Service — contrato §2.2 Backend.
 * Rutas: /stores, /products, /categories, /store-products, /match/suggestions.
 * Mock solo via runWithMock (SPEC §2.3): sin fallback silencioso en prod.
 */

import { request } from './apiClient';
import { runWithMock } from './mockGate';
import type {
  CanonicalProduct,
  ProductListing,
  Store,
  CatalogFilterParams,
  MatchSuggestion,
} from '../types/catalog';
import type { PaginatedResponse } from '../types/api';
import {
  mapStore,
  mapProduct,
  mapStoreProductToListing,
  mapMatchSuggestion,
  type ApiCategoria,
  type ApiProducto,
  type ApiProductoList,
  type ApiStoreProduct,
  type ApiTienda,
  type ApiMatchSuggestionList,
  type ApiPricePoint,
  type ApiPriceHistoryList,
} from './adapters';
import {
  MOCK_PRODUCTS,
  MOCK_LISTINGS,
  MOCK_STORES,
  MOCK_UNMATCHED_LISTINGS,
  MOCK_MATCH_SUGGESTIONS,
} from './mockData';

// Mutable in-memory mock state so manual association/disassociation works dynamically
const localProducts = [...MOCK_PRODUCTS];
const localListings = { ...MOCK_LISTINGS };
const localUnmatchedListings = [...MOCK_UNMATCHED_LISTINGS];
const localSuggestions = [...MOCK_MATCH_SUGGESTIONS];

async function fetchStoresApi(): Promise<Map<number, Store>> {
  const raw = await request<ApiTienda[]>('/stores');
  return new Map(raw.map(t => [t.id, mapStore(t)]));
}

async function fetchCategoriasApi(): Promise<Map<number, string>> {
  const raw = await request<ApiCategoria[]>('/products/categories');
  return new Map(raw.map(c => [c.id, c.nombre]));
}

async function fetchAlertProductoIds(): Promise<Set<number>> {
  const alerts = await request<Array<{ producto_id: number | null }>>(
    '/alerts?type=shrinkflation'
  );
  return new Set(
    alerts.map(a => a.producto_id).filter((id): id is number => id != null)
  );
}

async function fetchPricesApi(params: {
  producto_id?: number;
  page_size?: number;
} = {}): Promise<ApiPricePoint[]> {
  const qs = new URLSearchParams();
  if (params.producto_id != null) qs.set('producto_id', String(params.producto_id));
  qs.set('page_size', String(params.page_size ?? 500));
  const res = await request<ApiPriceHistoryList>(`/prices/history?${qs.toString()}`);
  return res.items;
}

function lastPriceByPair(
  items: ApiPricePoint[]
): Map<string, ApiPricePoint> {
  const map = new Map<string, ApiPricePoint>();
  for (const p of items) {
    if (p.producto_id == null || p.tienda_id == null) continue;
    const key = `${p.producto_id}:${p.tienda_id}`;
    const existing = map.get(key);
    if (!existing || p.timestamp > existing.timestamp) map.set(key, p);
  }
  return map;
}

function mockFilterProducts(params: CatalogFilterParams): PaginatedResponse<CanonicalProduct> {
  let filtered = [...localProducts];

  if (params.query) {
    const q = params.query.toLowerCase();
    filtered = filtered.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.ean && p.ean.includes(q)) ||
        p.sku.toLowerCase().includes(q)
    );
  }

  if (params.category && params.category !== 'all') {
    filtered = filtered.filter(p => p.category === params.category);
  }

  if (params.brand && params.brand !== 'all') {
    filtered = filtered.filter(p => p.brand === params.brand);
  }

  if (params.hasAlert) {
    filtered = filtered.filter(p => p.hasShrinkflationAlert);
  }

  if (params.sortBy) {
    const dir = params.sortDirection === 'desc' ? -1 : 1;
    filtered.sort((a, b) => {
      if (params.sortBy === 'minPrice') {
        return ((a.minPriceArs ?? 0) - (b.minPriceArs ?? 0)) * dir;
      }
      const valA = String(a[params.sortBy as keyof CanonicalProduct] ?? '');
      const valB = String(b[params.sortBy as keyof CanonicalProduct] ?? '');
      return valA.localeCompare(valB) * dir;
    });
  }

  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getStores(): Promise<Store[]> {
  return runWithMock(
    async () => {
      const raw = await request<ApiTienda[]>('/stores');
      return raw.map(mapStore);
    },
    () => MOCK_STORES
  );
}

export async function getProducts(
  params: CatalogFilterParams = {}
): Promise<PaginatedResponse<CanonicalProduct>> {
  return runWithMock(
    async () => {
      const qs = new URLSearchParams();
      if (params.query) qs.set('search', params.query);
      if (params.page) qs.set('page', String(params.page));
      if (params.pageSize) qs.set('page_size', String(params.pageSize));

      const [listRes, categorias, prices, alertIds] = await Promise.all([
        request<ApiProductoList>(`/products?${qs.toString()}`),
        fetchCategoriasApi(),
        fetchPricesApi(),
        params.hasAlert ? fetchAlertProductoIds() : Promise.resolve(new Set<number>()),
      ]);

      const listingsCount = new Map<number, number>();
      const priceRange = new Map<number, { min: number; max: number; minUsd: number; maxUsd: number }>();
      for (const p of prices) {
        if (p.producto_id == null) continue;
        const local = Number(p.precio_local) || 0;
        const usd = Number(p.precio_usd) || 0;
        listingsCount.set(p.producto_id, (listingsCount.get(p.producto_id) || 0) + 0);
        const r = priceRange.get(p.producto_id) || { min: Infinity, max: 0, minUsd: Infinity, maxUsd: 0 };
        if (local > 0) {
          r.min = Math.min(r.min, local);
          r.max = Math.max(r.max, local);
        }
        if (usd > 0) {
          r.minUsd = Math.min(r.minUsd, usd);
          r.maxUsd = Math.max(r.maxUsd, usd);
        }
        priceRange.set(p.producto_id, r);
      }

      // Contar store-products reales por producto (listings vinculados)
      try {
        const sps = await request<ApiStoreProduct[]>('/store-products');
        for (const sp of sps) {
          if (sp.producto_id != null) {
            listingsCount.set(sp.producto_id, (listingsCount.get(sp.producto_id) || 0) + 1);
          }
        }
      } catch {
        // sin store-products: counts quedan en 0
      }

      let items = listRes.items.map(p => {
        const range = priceRange.get(p.id);
        return mapProduct(p, categorias, {
          listingsCount: listingsCount.get(p.id) || 0,
          minPriceArs: range && range.min !== Infinity ? range.min : undefined,
          maxPriceArs: range && range.max > 0 ? range.max : undefined,
          minPriceUsd: range && range.minUsd !== Infinity ? range.minUsd : undefined,
          maxPriceUsd: range && range.maxUsd > 0 ? range.maxUsd : undefined,
          hasShrinkflationAlert: alertIds.has(p.id),
        });
      });

      // Filtros client-side que el Backend no expone (brand, sort, hasAlert)
      if (params.brand && params.brand !== 'all') {
        items = items.filter(p => p.brand === params.brand);
      }
      if (params.hasAlert) {
        items = items.filter(p => p.hasShrinkflationAlert);
      }
      if (params.sortBy) {
        const dir = params.sortDirection === 'desc' ? -1 : 1;
        items = [...items].sort((a, b) => {
          if (params.sortBy === 'minPrice') {
            return ((a.minPriceArs ?? 0) - (b.minPriceArs ?? 0)) * dir;
          }
          const valA = String(a[params.sortBy as keyof CanonicalProduct] ?? '');
          const valB = String(b[params.sortBy as keyof CanonicalProduct] ?? '');
          return valA.localeCompare(valB) * dir;
        });
      }

      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      return {
        items,
        total: listRes.total,
        page,
        pageSize,
        totalPages: Math.ceil(listRes.total / pageSize) || 1,
      };
    },
    () => mockFilterProducts(params)
  );
}

export async function getProductById(id: string): Promise<CanonicalProduct> {
  return runWithMock(
    async () => {
      const [producto, categorias] = await Promise.all([
        request<ApiProducto>(`/products/${id}`),
        fetchCategoriasApi(),
      ]);
      return mapProduct(producto, categorias);
    },
    () => {
      const prod = localProducts.find(p => p.id === id);
      if (!prod) {
        throw new Error(`Producto canónico no encontrado con ID: ${id}`);
      }
      return prod;
    }
  );
}

export async function getProductListings(
  canonicalProductId: string
): Promise<ProductListing[]> {
  return runWithMock(
    async () => {
      const productoId = Number(canonicalProductId);
      const [sps, tiendas, prices] = await Promise.all([
        request<ApiStoreProduct[]>(`/store-products?producto_id=${productoId}`),
        fetchStoresApi(),
        fetchPricesApi({ producto_id: productoId }),
      ]);
      const lastByStore = new Map<number, ApiPricePoint>();
      for (const p of prices) {
        if (p.tienda_id == null) continue;
        const existing = lastByStore.get(p.tienda_id);
        if (!existing || p.timestamp > existing.timestamp) lastByStore.set(p.tienda_id, p);
      }
      return sps.map(sp => mapStoreProductToListing(sp, tiendas, lastByStore.get(sp.tienda_id)));
    },
    () => localListings[canonicalProductId] || []
  );
}

export async function getUnmatchedListings(): Promise<ProductListing[]> {
  return runWithMock(
    async () => {
      const [sps, tiendas, prices] = await Promise.all([
        request<ApiStoreProduct[]>('/store-products?unmatched_only=true'),
        fetchStoresApi(),
        fetchPricesApi(),
      ]);
      const lastByPair = lastPriceByPair(prices);
      return sps.map(sp =>
        mapStoreProductToListing(sp, tiendas, lastByPair.get(`${sp.producto_id}:${sp.tienda_id}`))
      );
    },
    () => localUnmatchedListings
  );
}

export async function associateListing(
  canonicalProductId: string,
  listingId: string
): Promise<{ success: boolean; message: string }> {
  return runWithMock(
    async () => {
      await request(`/store-products/${listingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ producto_id: Number(canonicalProductId) }),
      });
      return {
        success: true,
        message: 'Publicación asociada exitosamente al producto canónico.',
      };
    },
    () => {
      const unIdx = localUnmatchedListings.findIndex(l => l.id === listingId);
      let listingToAttach: ProductListing | undefined;

      if (unIdx !== -1) {
        listingToAttach = { ...localUnmatchedListings[unIdx], canonicalProductId };
        localUnmatchedListings.splice(unIdx, 1);
      } else {
        for (const prodId of Object.keys(localListings)) {
          const idx = localListings[prodId].findIndex(l => l.id === listingId);
          if (idx !== -1) {
            listingToAttach = { ...localListings[prodId][idx], canonicalProductId };
            localListings[prodId].splice(idx, 1);
            break;
          }
        }
      }

      if (!listingToAttach) {
        throw new Error('Publicación no encontrada para asociar.');
      }

      if (!localListings[canonicalProductId]) {
        localListings[canonicalProductId] = [];
      }
      localListings[canonicalProductId].push(listingToAttach);

      const prod = localProducts.find(p => p.id === canonicalProductId);
      if (prod) {
        prod.listingsCount = localListings[canonicalProductId].length;
        prod.updatedAt = new Date().toISOString();
      }

      return {
        success: true,
        message: 'Publicación asociada exitosamente al producto canónico.',
      };
    }
  );
}

export async function disassociateListing(
  canonicalProductId: string,
  listingId: string
): Promise<{ success: boolean; message: string }> {
  return runWithMock(
    async () => {
      await request(`/store-products/${listingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ producto_id: null }),
      });
      return {
        success: true,
        message: 'Publicación desasociada exitosamente.',
      };
    },
    () => {
      const list = localListings[canonicalProductId] || [];
      const idx = list.findIndex(l => l.id === listingId);
      if (idx !== -1) {
        const removed = list.splice(idx, 1)[0];
        removed.canonicalProductId = null;
        localUnmatchedListings.push(removed);

        const prod = localProducts.find(p => p.id === canonicalProductId);
        if (prod) {
          prod.listingsCount = list.length;
          prod.updatedAt = new Date().toISOString();
        }

        return {
          success: true,
          message: 'Publicación desasociada exitosamente.',
        };
      }
      throw new Error('Publicación no encontrada en este producto canónico.');
    }
  );
}

/**
 * Sugerencias de match (HU 1.4). El Backend expone POST /match/suggestions
 * por tienda; aquí se consultan todas las tiendas y se concatenan.
 */
export async function getMatchSuggestions(): Promise<MatchSuggestion[]> {
  return runWithMock(
    async () => {
      const tiendas = await request<ApiTienda[]>('/stores');
      if (tiendas.length === 0) return [];
      const results = await Promise.all(
        tiendas.map(t =>
          request<ApiMatchSuggestionList>('/match/suggestions', {
            method: 'POST',
            body: JSON.stringify({ tienda_id: t.id, threshold: 0.75 }),
          })
        )
      );
      const tiendaMap = new Map(tiendas.map(t => [t.id, mapStore(t)]));
      return results.flatMap(r => r.items.map(s => mapMatchSuggestion(s, tiendaMap)));
    },
    () => localSuggestions.filter(s => s.status === 'pending')
  );
}

export async function confirmMatchSuggestion(suggestionId: string): Promise<boolean> {
  return runWithMock(
    async () => {
      // suggestionId = `${store_product_id}:${producto_id}`
      const [spId, productoId] = suggestionId.split(':');
      if (!spId || !productoId) return false;
      await request(`/store-products/${spId}`, {
        method: 'PATCH',
        body: JSON.stringify({ producto_id: Number(productoId) }),
      });
      return true;
    },
    () => {
      const sugg = localSuggestions.find(s => s.id === suggestionId);
      if (sugg) {
        sugg.status = 'confirmed';
        void associateListing(sugg.canonicalProductId, sugg.listingId);
        return true;
      }
      return false;
    }
  );
}

export async function rejectMatchSuggestion(
  suggestionId: string,
  _reason?: string
): Promise<boolean> {
  return runWithMock(
    async () => {
      // El Backend no persiste rechazos (sugerencias se recalculan on-demand).
      // Se marca solo en cliente para no re-mostrar en la sesión.
      const sugg = localSuggestions.find(s => s.id === suggestionId);
      if (sugg) sugg.status = 'rejected';
      return true;
    },
    () => {
      const sugg = localSuggestions.find(s => s.id === suggestionId);
      if (sugg) {
        sugg.status = 'rejected';
        return true;
      }
      return false;
    }
  );
}
