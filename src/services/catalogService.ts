/**
 * Catalog Service
 * Handles canonical products, store listings, manual associations,
 * and matching suggestion confirmations.
 */

import { request } from './apiClient';
import {
  CanonicalProduct,
  ProductListing,
  Store,
  CatalogFilterParams,
  MatchSuggestion,
} from '../types/catalog';
import { PaginatedResponse } from '../types/api';
import {
  MOCK_PRODUCTS,
  MOCK_LISTINGS,
  MOCK_STORES,
  MOCK_UNMATCHED_LISTINGS,
  MOCK_MATCH_SUGGESTIONS,
} from './mockData';

// Mutable in-memory mock state so manual association/disassociation works dynamically
let localProducts = [...MOCK_PRODUCTS];
let localListings = { ...MOCK_LISTINGS };
let localUnmatchedListings = [...MOCK_UNMATCHED_LISTINGS];
let localSuggestions = [...MOCK_MATCH_SUGGESTIONS];

export async function getStores(): Promise<Store[]> {
  try {
    return await request<Store[]>('/stores');
  } catch {
    return MOCK_STORES;
  }
}

export async function getProducts(
  params: CatalogFilterParams = {}
): Promise<PaginatedResponse<CanonicalProduct>> {
  const queryParams = new URLSearchParams();
  if (params.query) queryParams.set('q', params.query);
  if (params.category) queryParams.set('category', params.category);
  if (params.brand) queryParams.set('brand', params.brand);
  if (params.storeId) queryParams.set('store_id', params.storeId);
  if (params.minPrice) queryParams.set('min_price', params.minPrice.toString());
  if (params.maxPrice) queryParams.set('max_price', params.maxPrice.toString());
  if (params.hasPromotion !== undefined) queryParams.set('has_promotion', String(params.hasPromotion));
  if (params.hasAlert !== undefined) queryParams.set('has_alert', String(params.hasAlert));
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.pageSize) queryParams.set('page_size', params.pageSize.toString());
  if (params.sortBy) queryParams.set('sort_by', params.sortBy);
  if (params.sortDirection) queryParams.set('sort_dir', params.sortDirection);

  try {
    return await request<PaginatedResponse<CanonicalProduct>>(
      `/canonical-products?${queryParams.toString()}`
    );
  } catch {
    // Mock filtering logic
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
      filtered.sort((a, b) => {
        let valA: any = a[params.sortBy as keyof CanonicalProduct];
        let valB: any = b[params.sortBy as keyof CanonicalProduct];
        if (params.sortBy === 'minPrice') {
          valA = a.minPriceArs ?? 0;
          valB = b.minPriceArs ?? 0;
        }
        if (params.sortDirection === 'desc') {
          return valA < valB ? 1 : -1;
        }
        return valA > valB ? 1 : -1;
      });
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }
}

export async function getProductById(id: string): Promise<CanonicalProduct> {
  try {
    return await request<CanonicalProduct>(`/canonical-products/${id}`);
  } catch {
    const prod = localProducts.find(p => p.id === id);
    if (!prod) {
      throw new Error(`Producto canónico no encontrado con ID: ${id}`);
    }
    return prod;
  }
}

export async function getProductListings(canonicalProductId: string): Promise<ProductListing[]> {
  try {
    return await request<ProductListing[]>(`/canonical-products/${canonicalProductId}/listings`);
  } catch {
    return localListings[canonicalProductId] || [];
  }
}

export async function getUnmatchedListings(): Promise<ProductListing[]> {
  try {
    return await request<ProductListing[]>('/listings/unmatched');
  } catch {
    return localUnmatchedListings;
  }
}

export async function associateListing(
  canonicalProductId: string,
  listingId: string
): Promise<{ success: boolean; message: string }> {
  try {
    return await request<{ success: boolean; message: string }>(
      `/canonical-products/${canonicalProductId}/listings`,
      {
        method: 'POST',
        body: JSON.stringify({ listing_id: listingId }),
      }
    );
  } catch {
    // In-memory update
    const unIdx = localUnmatchedListings.findIndex(l => l.id === listingId);
    let listingToAttach: ProductListing | undefined;

    if (unIdx !== -1) {
      listingToAttach = { ...localUnmatchedListings[unIdx], canonicalProductId };
      localUnmatchedListings.splice(unIdx, 1);
    } else {
      // Find across other products to reassign
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

    // Update product listing count
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
}

export async function disassociateListing(
  canonicalProductId: string,
  listingId: string
): Promise<{ success: boolean; message: string }> {
  try {
    return await request<{ success: boolean; message: string }>(
      `/canonical-products/${canonicalProductId}/listings/${listingId}`,
      {
        method: 'DELETE',
      }
    );
  } catch {
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
}

export async function getMatchSuggestions(): Promise<MatchSuggestion[]> {
  try {
    return await request<MatchSuggestion[]>('/matching/suggestions');
  } catch {
    return localSuggestions.filter(s => s.status === 'pending');
  }
}

export async function confirmMatchSuggestion(suggestionId: string): Promise<boolean> {
  try {
    await request(`/matching/suggestions/${suggestionId}/confirm`, {
      method: 'POST',
    });
    return true;
  } catch {
    const sugg = localSuggestions.find(s => s.id === suggestionId);
    if (sugg) {
      sugg.status = 'confirmed';
      await associateListing(sugg.canonicalProductId, sugg.listingId);
      return true;
    }
    return false;
  }
}

export async function rejectMatchSuggestion(
  suggestionId: string,
  reason?: string
): Promise<boolean> {
  try {
    await request(`/matching/suggestions/${suggestionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return true;
  } catch {
    const sugg = localSuggestions.find(s => s.id === suggestionId);
    if (sugg) {
      sugg.status = 'rejected';
      return true;
    }
    return false;
  }
}
