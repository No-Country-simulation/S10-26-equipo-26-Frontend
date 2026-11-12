/**
 * Adapters Backend §2.2 → tipos Frontend.
 * FastAPI serializa Decimal como string en JSON; acá se normaliza a number.
 */

import type { CanonicalProduct, ProductListing, Store, MatchSuggestion } from '../types/catalog';
import type { ProductPriceHistory, PromotionSummaryItem, StorePricePoint } from '../types/pricing';
import type { ExchangeRate } from '../types/currency';
import type { DashboardSummary, InflationMetricPoint, StoreDispersionItem } from '../types/analytics';
import type { ShrinkflationAlert, ShrinkflationStatus } from '../types/shrinkflation';

// ---- DTOs Backend (contrato §2.2) ----

export interface ApiCategoria {
  id: number;
  nombre: string;
}

export interface ApiTienda {
  id: number;
  nombre: string;
  url_base: string | null;
}

export interface ApiProducto {
  id: number;
  nombre_universal: string;
  categoria_id: number | null;
  unidad_medida: string | null;
  marca: string | null;
}

export interface ApiProductoList {
  items: ApiProducto[];
  total: number;
}

export interface ApiStoreProduct {
  id: number;
  producto_id: number | null;
  tienda_id: number;
  external_id: string;
  source_url: string | null;
  nombre_crudo: string;
  marca_cruda: string | null;
  raw_presentation: string | null;
  created_at: string;
}

export interface ApiPricePoint {
  id: number;
  timestamp: string;
  producto_id: number | null;
  tienda_id: number | null;
  precio_local: string | number;
  precio_tachado: string | number | null;
  en_oferta: boolean | null;
  tipo_cambio_usado: string | number;
  precio_usd: string | number;
  raw_presentation?: string | null;
  is_promotion: boolean;
  price_regular: string | number;
  discount_pct: string | number;
}

export interface ApiPriceHistoryList {
  items: ApiPricePoint[];
  total: number;
}

export interface ApiHistorialDivisa {
  timestamp: string;
  tipo_cambio_oficial: string | number;
  tipo_cambio_paralelo: string | number;
}

export interface ApiInflationPoint {
  date: string;
  index: string | number;
}

export interface ApiInflationSeries {
  series: ApiInflationPoint[];
  base: string | number;
  method: string;
  excluded_promos: number;
  products_count: number;
}

export interface ApiDevaluationGap {
  start: string;
  end: string;
  price_variation: string | number;
  fx_variation: string | number;
  gap: string | number;
  fx_start: string | number;
  fx_end: string | number;
}

export interface ApiAnomalyAlert {
  id: number;
  alert_type: 'shrinkflation' | 'outpace_devaluation';
  producto_id: number | null;
  store_product_id: number | null;
  tienda_id: number | null;
  score: string | number | null;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'reviewed';
  details: Record<string, unknown>;
  created_at: string;
  reviewed_at: string | null;
}

export interface ApiMatchSuggestion {
  store_product: ApiStoreProduct;
  product: ApiProducto;
  score: number;
  band: 'auto' | 'review';
}

export interface ApiMatchSuggestionList {
  items: ApiMatchSuggestion[];
  total: number;
  auto_count: number;
  review_count: number;
}

// ---- Helpers ----

export function num(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function optionalNum(
  value: string | number | null | undefined
): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Parsea `unidad_medida` ("1 kg", "500 G", "unidad") → cantidad + unidad. */
export function parseUnidad(
  unidad: string | null | undefined
): { quantity: number; unit: 'g' | 'kg' | 'ml' | 'l' | 'u' } {
  if (!unidad) return { quantity: 1, unit: 'u' };
  const match = unidad.trim().match(/^([\d.,]+)\s*(kg|g|gr|ml|l|lt|lts|unidad|un|uds|par|rollos?)?/i);
  if (!match) return { quantity: 1, unit: 'u' };
  const quantity = num(match[1].replace(',', '.'));
  const rawUnit = (match[2] || 'u').toLowerCase();
  const unitMap: Record<string, 'g' | 'kg' | 'ml' | 'l' | 'u'> = {
    kg: 'kg',
    g: 'g',
    gr: 'g',
    ml: 'ml',
    l: 'l',
    lt: 'l',
    lts: 'l',
    unidad: 'u',
    un: 'u',
    uds: 'u',
    par: 'u',
    rollo: 'u',
    rollos: 'u',
  };
  return { quantity: quantity || 1, unit: unitMap[rawUnit] || 'u' };
}

// ---- Mappers ----

export function mapStore(api: ApiTienda): Store {
  const slug = api.nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-');
  return {
    id: String(api.id),
    name: api.nombre,
    slug,
    websiteUrl: api.url_base || '',
    isActive: true,
  };
}

export function mapProduct(
  api: ApiProducto,
  categorias: Map<number, string>,
  extras?: {
    listingsCount?: number;
    minPriceArs?: number;
    maxPriceArs?: number;
    minPriceUsd?: number;
    maxPriceUsd?: number;
    hasShrinkflationAlert?: boolean;
    hasPendingMatches?: boolean;
  }
): CanonicalProduct {
  const { quantity, unit } = parseUnidad(api.unidad_medida);
  return {
    id: String(api.id),
    sku: `PS-${String(api.id).padStart(4, '0')}`,
    name: api.nombre_universal.trim(),
    brand: (api.marca || '').trim() || 'Sin marca',
    category: api.categoria_id != null ? categorias.get(api.categoria_id) || 'Sin categoría' : 'Sin categoría',
    netWeightQuantity: quantity,
    netWeightUnit: unit,
    listingsCount: extras?.listingsCount ?? 0,
    minPriceArs: extras?.minPriceArs,
    maxPriceArs: extras?.maxPriceArs,
    minPriceUsd: extras?.minPriceUsd,
    maxPriceUsd: extras?.maxPriceUsd,
    hasShrinkflationAlert: extras?.hasShrinkflationAlert,
    hasPendingMatches: extras?.hasPendingMatches,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function mapStoreProductToListing(
  api: ApiStoreProduct,
  tiendas: Map<number, Store>,
  precio?: ApiPricePoint
): ProductListing {
  const store = tiendas.get(api.tienda_id);
  return {
    id: String(api.id),
    canonicalProductId: api.producto_id != null ? String(api.producto_id) : null,
    storeId: String(api.tienda_id),
    storeName: store?.name || `Tienda ${api.tienda_id}`,
    externalId: api.external_id,
    originalName: api.nombre_crudo,
    productUrl: api.source_url || '',
    currentPriceArs: precio ? num(precio.precio_local) : 0,
    currentPriceUsd: precio ? num(precio.precio_usd) : undefined,
    isAvailable: true,
    lastScrapedAt: api.created_at,
    isPromotional: precio?.is_promotion ?? false,
    promotionMechanic: precio?.is_promotion
      ? precio.en_oferta
        ? 'Oferta del sitio'
        : 'Descuento publicado'
      : undefined,
    matchConfidence: undefined,
  };
}

export function mapPricePointToObservation(p: ApiPricePoint): StorePricePoint {
  return {
    date: p.timestamp.slice(0, 10),
    priceArs: num(p.precio_local),
    priceUsd: num(p.precio_usd),
    priceType: p.is_promotion ? 'promotional' : 'regular_observed',
    isPromotional: p.is_promotion,
    promotionMechanic: p.is_promotion
      ? p.en_oferta
        ? 'Oferta del sitio'
        : 'Descuento publicado'
      : undefined,
    discountPercentage: p.is_promotion ? num(p.discount_pct) * 100 : undefined,
  };
}

export function mapPriceHistory(
  productoId: string,
  period: ProductPriceHistory['period'],
  items: ApiPricePoint[],
  tiendas: Map<number, Store>
): ProductPriceHistory {
  const byStore = new Map<number, StorePricePoint[]>();
  for (const p of items) {
    if (p.tienda_id == null) continue;
    const arr = byStore.get(p.tienda_id) || [];
    arr.push(mapPricePointToObservation(p));
    byStore.set(p.tienda_id, arr);
  }

  const stores = Array.from(byStore.entries()).map(([tiendaId, observations]) => ({
    storeId: String(tiendaId),
    storeName: tiendas.get(tiendaId)?.name || `Tienda ${tiendaId}`,
    observations: observations.sort((a, b) => a.date.localeCompare(b.date)),
  }));

  const allArs = items.map(p => num(p.precio_local)).filter(v => v > 0);
  const currentMin = allArs.length ? Math.min(...allArs) : 0;
  const currentMax = allArs.length ? Math.max(...allArs) : 0;
  const spread = currentMin > 0 ? ((currentMax - currentMin) / currentMin) * 100 : 0;

  const sorted = [...items].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const first = sorted[0] ? num(sorted[0].precio_local) : 0;
  const last = sorted.length ? num(sorted[sorted.length - 1].precio_local) : 0;
  const variation = first > 0 ? ((last - first) / first) * 100 : 0;
  const promoCount = items.filter(p => p.is_promotion).length;
  const promoFreq = items.length > 0 ? (promoCount / items.length) * 100 : 0;

  return {
    canonicalProductId: productoId,
    period,
    stores,
    summary: {
      currentMinPriceArs: currentMin,
      currentMaxPriceArs: currentMax,
      priceSpreadPercentage: Number(spread.toFixed(1)),
      variation30dPercentage: Number(variation.toFixed(1)),
      promoFrequencyPercentage: Number(promoFreq.toFixed(1)),
    },
  };
}

export function mapExchangeRate(api: ApiHistorialDivisa): ExchangeRate {
  const quoteTime = new Date(api.timestamp).getTime();
  return {
    baseCurrency: 'USD',
    targetCurrency: 'ARS',
    rate: num(api.tipo_cambio_oficial),
    rateType: 'official',
    source: 'Backend FastAPI /exchange-rates/as-of',
    timestamp: api.timestamp,
    fetchedAt: new Date().toISOString(),
    isStale: Date.now() - quoteTime > 24 * 3600 * 1000,
  };
}

/**
 * Índice base 100 → variación MoM % entre puntos consecutivos.
 * El primer punto se reporta como 0 (sin periodo anterior).
 */
export function mapInflationSeries(api: ApiInflationSeries): InflationMetricPoint[] {
  return api.series.map((point, idx) => {
    const index = num(point.index);
    const prev = idx > 0 ? num(api.series[idx - 1].index) : null;
    const mom = prev !== null && prev > 0 ? ((index - prev) / prev) * 100 : 0;
    return {
      date: point.date,
      headlineInflationMoM: Number(mom.toFixed(2)),
      foodAndBeverageMoM: Number(mom.toFixed(2)),
      personalCareMoM: Number(mom.toFixed(2)),
      householdCleaningMoM: Number(mom.toFixed(2)),
      basketCostArs: index * 1000,
      sampleObservationsCount: api.products_count,
    };
  });
}

/** Estado de auditoría Backend (open/reved) → estado Frontend. */
export function mapAlertStatus(status: 'open' | 'reviewed'): ShrinkflationStatus {
  return status === 'reviewed' ? 'confirmed' : 'suspected';
}

/** Estado Frontend → estado Backend para PATCH /alerts/{id}. */
export function mapAlertStatusToApi(
  status: ShrinkflationStatus
): 'open' | 'reviewed' {
  return status === 'confirmed' ? 'reviewed' : 'open';
}

interface ShrinkflationContext {
  productos: Map<number, ApiProducto>;
  categorias: Map<number, string>;
  tiendas: Map<number, Store>;
}

function detailsStr(details: Record<string, unknown>, key: string): string {
  const v = details[key];
  return v == null ? '' : String(v);
}

export function mapAlertToShrinkflation(
  api: ApiAnomalyAlert,
  ctx: ShrinkflationContext
): ShrinkflationAlert {
  const producto = api.producto_id != null ? ctx.productos.get(api.producto_id) : undefined;
  const tienda = api.tienda_id != null ? ctx.tiendas.get(api.tienda_id) : undefined;
  const d = api.details || {};

  const prevQty = num(detailsStr(d, 'prev_qty'));
  const currQty = num(detailsStr(d, 'curr_qty'));
  const prevUnit = detailsStr(d, 'prev_unit') || 'g';
  const currUnit = detailsStr(d, 'curr_unit') || 'g';
  const reductionPct = detailsStr(d, 'reduction_pct');
  const weightChange = reductionPct
    ? -num(reductionPct)
    : prevQty > 0
      ? ((currQty - prevQty) / prevQty) * 100
      : 0;

  const score = optionalNum(api.score);
  // score = reducción/100 en shrinkflation → inflación unitaria efectiva ≈ score*100
  const effectiveUnitInflation =
    score != null && api.alert_type === 'shrinkflation'
      ? score * 100
      : Math.abs(weightChange) > 0
        ? (Math.abs(weightChange) / (100 - Math.abs(weightChange))) * 100
        : 0;

  const observedAt = detailsStr(d, 'observed_at') || api.created_at;
  const productName = producto?.nombre_universal || `Producto ${api.producto_id ?? '?'}`;
  const brand = (producto?.marca || '').trim() || 'Sin marca';
  const category =
    producto?.categoria_id != null
      ? ctx.categorias.get(producto.categoria_id) || 'Sin categoría'
      : 'Sin categoría';

  return {
    id: String(api.id),
    canonicalProductId: api.producto_id != null ? String(api.producto_id) : '',
    canonicalProductName: productName,
    brand,
    category,
    storeId: api.tienda_id != null ? String(api.tienda_id) : undefined,
    storeName: tienda?.name,
    status: mapAlertStatus(api.status),
    detectedAt: observedAt,
    confirmedAt: api.reviewed_at || undefined,
    confidenceScore: score != null && api.alert_type === 'shrinkflation' ? Math.min(1, score) : undefined,
    originalWeightQuantity: prevQty,
    originalWeightUnit: prevUnit,
    newWeightQuantity: currQty,
    newWeightUnit: currUnit,
    weightChangePercentage: Number(weightChange.toFixed(1)),
    nominalPriceBeforeArs: 0,
    nominalPriceAfterArs: 0,
    nominalPriceChangePercentage: 0,
    unitPriceBeforeArs: 0,
    unitPriceAfterArs: 0,
    effectiveUnitInflationPercentage: Number(effectiveUnitInflation.toFixed(1)),
    evidenceBaseline: {
      timestamp: observedAt,
      sourceStore: tienda?.name || 'Tienda',
      sourceUrl: '',
      extractedTextSnippet: detailsStr(d, 'prev_presentation') || undefined,
      weightDeclaredQuantity: prevQty,
      weightDeclaredUnit: prevUnit,
      observedPriceArs: 0,
      calculatedPricePerUnitArs: 0,
    },
    evidenceCurrent: {
      timestamp: observedAt,
      sourceStore: tienda?.name || 'Tienda',
      sourceUrl: '',
      extractedTextSnippet: detailsStr(d, 'curr_presentation') || undefined,
      weightDeclaredQuantity: currQty,
      weightDeclaredUnit: currUnit,
      observedPriceArs: 0,
      calculatedPricePerUnitArs: 0,
    },
    notes: typeof d.notes === 'string' ? d.notes : undefined,
  };
}

export function mapMatchSuggestion(
  api: ApiMatchSuggestion,
  tiendas: Map<number, Store>
): MatchSuggestion {
  const store = tiendas.get(api.store_product.tienda_id);
  const unidad = api.product.unidad_medida || '';
  return {
    id: `${api.store_product.id}:${api.product.id}`,
    listingId: String(api.store_product.id),
    canonicalProductId: String(api.product.id),
    canonicalProductName: api.product.nombre_universal,
    canonicalProductBrand: (api.product.marca || '').trim() || 'Sin marca',
    canonicalNetWeight: unidad,
    listingStore: store?.name || `Tienda ${api.store_product.tienda_id}`,
    listingOriginalName: api.store_product.nombre_crudo,
    listingUrl: api.store_product.source_url || '',
    listingPriceArs: 0,
    confidenceScore: api.score,
    similarityFactors: {
      nameSimilarity: api.score,
      brandMatch: api.score >= 0.9,
      weightSimilarity: api.score,
      eanMatch: false,
    },
    detectedAt: new Date().toISOString(),
    status: 'pending',
  };
}

export function mapPromotions(
  items: ApiPricePoint[],
  productos: Map<number, ApiProducto>,
  tiendas: Map<number, Store>,
  storeProductsByPair: Map<string, ApiStoreProduct>
): PromotionSummaryItem[] {
  return items
    .filter(p => p.is_promotion && p.producto_id != null && p.tienda_id != null)
    .map(p => {
      const producto = productos.get(p.producto_id as number);
      const tienda = tiendas.get(p.tienda_id as number);
      const sp = storeProductsByPair.get(`${p.producto_id}:${p.tienda_id}`);
      const promoPrice = num(p.precio_local);
      const regular = num(p.price_regular);
      const discount = num(p.discount_pct) * 100;
      return {
        id: String(p.id),
        listingId: sp ? String(sp.id) : String(p.id),
        canonicalProductId: String(p.producto_id),
        canonicalProductName: producto?.nombre_universal || `Producto ${p.producto_id}`,
        storeName: tienda?.name || `Tienda ${p.tienda_id}`,
        originalPriceArs: regular || promoPrice,
        promoPriceArs: promoPrice,
        discountPercentage: discount,
        mechanic: p.en_oferta ? 'Oferta del sitio' : 'Descuento publicado',
        lastVerifiedAt: p.timestamp,
        productUrl: sp?.source_url || '',
      };
    })
    .filter(promo => promo.discountPercentage > 0 || promo.originalPriceArs > promo.promoPriceArs);
}

export interface DashboardCounts {
  productosTotal: number;
  tiendasCount: number;
  shrinkAlerts: ApiAnomalyAlert[];
  inflation?: ApiInflationSeries;
  devaluation?: ApiDevaluationGap;
  prices: ApiPricePoint[];
  productos: Map<number, ApiProducto>;
  categorias: Map<number, string>;
}

/** Última observación por par (producto, tienda). */
function latestByPair(items: ApiPricePoint[]): Map<string, ApiPricePoint> {
  const latest = new Map<string, ApiPricePoint>();
  for (const p of items) {
    if (p.producto_id == null || p.tienda_id == null) continue;
    const key = `${p.producto_id}:${p.tienda_id}`;
    const existing = latest.get(key);
    if (!existing || p.timestamp > existing.timestamp) latest.set(key, p);
  }
  return latest;
}

/** Variación % de precio regular (no promo) primera vs última observación por producto. */
function regularPriceVariations(
  items: ApiPricePoint[]
): Map<number, { variation: number; current: ApiPricePoint }> {
  const byProduct = new Map<number, ApiPricePoint[]>();
  for (const p of items) {
    if (p.producto_id == null || p.is_promotion) continue;
    const arr = byProduct.get(p.producto_id) || [];
    arr.push(p);
    byProduct.set(p.producto_id, arr);
  }
  const result = new Map<number, { variation: number; current: ApiPricePoint }>();
  for (const [pid, rows] of byProduct) {
    rows.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const first = num(rows[0].precio_local);
    const lastRow = rows[rows.length - 1];
    const last = num(lastRow.precio_local);
    if (first <= 0) continue;
    result.set(pid, {
      variation: ((last - first) / first) * 100,
      current: lastRow,
    });
  }
  return result;
}

export function mapDashboardSummary(counts: DashboardCounts): DashboardSummary {
  const shrink = counts.shrinkAlerts.filter(a => a.alert_type === 'shrinkflation');
  const confirmed = shrink.filter(a => a.status === 'reviewed').length;

  // Listings = pares producto×tienda con precio observado (no de store_products,
  // que puede estar vacío aunque haya precios).
  const latest = latestByPair(counts.prices);
  const listingsTotal = latest.size;
  const latestPromos = [...latest.values()].filter(p => p.is_promotion);
  const promosActivas = latestPromos.length;

  let periodInflationMoM = 0;
  if (counts.inflation && counts.inflation.series.length >= 2) {
    const series = counts.inflation.series;
    const first = num(series[0].index);
    const last = num(series[series.length - 1].index);
    if (first > 0) periodInflationMoM = ((last - first) / first) * 100;
  }

  const priceVar = counts.devaluation ? num(counts.devaluation.price_variation) * 100 : 0;

  // Top movers: subas de precio regular + mayores descuentos vigentes.
  const variations = regularPriceVariations(counts.prices);
  const topInflation = [...variations.entries()]
    .filter(([, v]) => v.variation > 0)
    .sort((a, b) => b[1].variation - a[1].variation)
    .slice(0, 4)
    .map(([pid, v]) => {
      const producto = counts.productos.get(pid);
      return {
        productId: String(pid),
        productName: producto?.nombre_universal || `Producto ${pid}`,
        brand: (producto?.marca || '').trim() || 'Sin marca',
        category:
          producto?.categoria_id != null
            ? counts.categorias.get(producto.categoria_id) || 'Sin categoría'
            : 'Sin categoría',
        increasePercentage: Number(v.variation.toFixed(1)),
        currentPriceArs: num(v.current.precio_local),
        currentPriceUsd: num(v.current.precio_usd) || undefined,
      };
    });

  const topPromos = latestPromos
    .map(p => ({
      p,
      discount: num(p.discount_pct) * 100,
      producto: p.producto_id != null ? counts.productos.get(p.producto_id) : undefined,
    }))
    .filter(x => x.discount > 0)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 4)
    .map(({ p, discount, producto }) => ({
      productId: String(p.producto_id),
      productName: producto?.nombre_universal || `Producto ${p.producto_id}`,
      brand: (producto?.marca || '').trim() || 'Sin marca',
      category:
        producto?.categoria_id != null
          ? counts.categorias.get(producto.categoria_id) || 'Sin categoría'
          : 'Sin categoría',
      decreasePercentage: Number(discount.toFixed(1)),
      currentPriceArs: num(p.precio_local),
      currentPriceUsd: num(p.precio_usd) || undefined,
    }));

  return {
    monitoredProductsCount: counts.productosTotal,
    monitoredStoresCount: counts.tiendasCount,
    trackedListingsCount: listingsTotal,
    activePromotionsCount: promosActivas,
    promotionsRatePercentage:
      listingsTotal > 0 ? (promosActivas / listingsTotal) * 100 : 0,
    detectedShrinkflationAlertsCount: shrink.length,
    confirmedShrinkflationAlertsCount: confirmed,
    periodInflationMoM: Number(periodInflationMoM.toFixed(2)),
    periodInflationYoY: Number(priceVar.toFixed(2)),
    calculatedAt: new Date().toISOString(),
    calculationMethod: counts.inflation?.method || 'mediana móvil 7d, base 100',
    topInflationProducts: topInflation,
    topDeflationOrPromoProducts: topPromos,
  };
}

/** Dispersion por tienda desde la última observación por par (índice base 100). */
export function mapStoreDispersion(
  items: ApiPricePoint[],
  tiendas: Map<number, Store>
): StoreDispersionItem[] {
  const latest = latestByPair(items);
  if (latest.size === 0) return [];

  // Precio más bajo actual por producto (para "más económica en % de items").
  const minByProduct = new Map<number, { storeId: number; price: number }>();
  for (const p of latest.values()) {
    if (p.producto_id == null || p.tienda_id == null) continue;
    const price = num(p.precio_local);
    const current = minByProduct.get(p.producto_id as number);
    if (!current || price < current.price) {
      minByProduct.set(p.producto_id as number, { storeId: p.tienda_id, price });
    }
  }

  const byStore = new Map<
    number,
    { prices: number[]; promoDiscounts: number[]; cheapest: number }
  >();
  for (const p of latest.values()) {
    if (p.tienda_id == null) continue;
    const entry = byStore.get(p.tienda_id) || { prices: [], promoDiscounts: [], cheapest: 0 };
    entry.prices.push(num(p.precio_local));
    if (p.is_promotion && num(p.discount_pct) > 0) {
      entry.promoDiscounts.push(num(p.discount_pct) * 100);
    }
    if (p.producto_id != null) {
      const min = minByProduct.get(p.producto_id);
      if (min && min.storeId === p.tienda_id) entry.cheapest += 1;
    }
    byStore.set(p.tienda_id, entry);
  }

  const stats = Array.from(byStore.entries()).map(([id, s]) => ({
    id,
    avg: s.prices.reduce((a, b) => a + b, 0) / s.prices.length,
    count: s.prices.length,
    promoDiscounts: s.promoDiscounts,
    cheapest: s.cheapest,
  }));
  const marketAvg = stats.reduce((a, b) => a + b.avg, 0) / stats.length;

  return stats.map(s => {
    const store = tiendas.get(s.id);
    const avgDiscount =
      s.promoDiscounts.length > 0
        ? s.promoDiscounts.reduce((a, b) => a + b, 0) / s.promoDiscounts.length
        : 0;
    return {
      storeId: String(s.id),
      storeName: store?.name || `Tienda ${s.id}`,
      averagePriceIndex: marketAvg > 0 ? Number(((s.avg / marketAvg) * 100).toFixed(1)) : 100,
      cheapestProductsPercentage:
        s.count > 0 ? Number(((s.cheapest / s.count) * 100).toFixed(0)) : 0,
      averageDiscountPercentage: Number(avgDiscount.toFixed(1)),
      totalMonitoredListings: s.count,
      stockAvailabilityPercentage: 100,
    };
  });
}
