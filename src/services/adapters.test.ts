import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  num,
  optionalNum,
  parseUnidad,
  mapStore,
  mapProduct,
  mapExchangeRate,
  mapInflationSeries,
  mapAlertStatus,
  mapAlertStatusToApi,
  mapPriceHistory,
  mapMatchSuggestion,
  mapDashboardSummary,
  mapStoreDispersion,
  type ApiCategoria,
  type ApiHistorialDivisa,
  type ApiInflationSeries,
  type ApiProducto,
  type ApiTienda,
  type ApiPricePoint,
  type ApiMatchSuggestion,
} from './adapters';

describe('num / optionalNum', () => {
  it('convierte strings Decimal de FastAPI', () => {
    expect(num('1180.50')).toBe(1180.5);
    expect(num(42)).toBe(42);
    expect(num(null)).toBe(0);
    expect(num(undefined)).toBe(0);
    expect(num('')).toBe(0);
    expect(num('abc')).toBe(0);
  });

  it('optionalNum preserva null como undefined', () => {
    expect(optionalNum(null)).toBeUndefined();
    expect(optionalNum('10.5')).toBe(10.5);
  });
});

describe('parseUnidad', () => {
  it('parsea "1 kg"', () => {
    expect(parseUnidad('1 kg')).toEqual({ quantity: 1, unit: 'kg' });
  });
  it('parsea "500 G" case-insensitive', () => {
    expect(parseUnidad('500 G')).toEqual({ quantity: 500, unit: 'g' });
  });
  it('parsea "1,5 L"', () => {
    expect(parseUnidad('1,5 L')).toEqual({ quantity: 1.5, unit: 'l' });
  });
  it('unidad genérica → u', () => {
    expect(parseUnidad('unidad')).toEqual({ quantity: 1, unit: 'u' });
  });
  it('null → default', () => {
    expect(parseUnidad(null)).toEqual({ quantity: 1, unit: 'u' });
  });
});

describe('mapStore / mapProduct', () => {
  const categorias = new Map<number, string>([[1, 'Alimentos y Bebidas']]);

  it('mapea tienda con slug', () => {
    const store = mapStore({ id: 3, nombre: 'Coto', url_base: 'https://coto.com' });
    expect(store.id).toBe('3');
    expect(store.name).toBe('Coto');
    expect(store.slug).toBe('coto');
    expect(store.websiteUrl).toBe('https://coto.com');
  });

  it('mapea producto a CanonicalProduct', () => {
    const api: ApiProducto = {
      id: 7,
      nombre_universal: '  Arroz Blanco ',
      categoria_id: 1,
      unidad_medida: '1 kg',
      marca: 'Gallo',
    };
    const p = mapProduct(api, categorias);
    expect(p.id).toBe('7');
    expect(p.name).toBe('Arroz Blanco');
    expect(p.brand).toBe('Gallo');
    expect(p.category).toBe('Alimentos y Bebidas');
    expect(p.netWeightQuantity).toBe(1);
    expect(p.netWeightUnit).toBe('kg');
    expect(p.sku).toBe('PS-0007');
  });

  it('marca vacía → "Sin marca"', () => {
    const p = mapProduct(
      { id: 1, nombre_universal: 'X', categoria_id: null, unidad_medida: null, marca: null },
      categorias
    );
    expect(p.brand).toBe('Sin marca');
    expect(p.category).toBe('Sin categoría');
  });
});

describe('mapExchangeRate', () => {
  it('mapea HistorialDivisaRead a ExchangeRate con stale calc', () => {
    const fresh: ApiHistorialDivisa = {
      timestamp: new Date().toISOString(),
      tipo_cambio_oficial: '1050.25',
      tipo_cambio_paralelo: '1080',
    };
    const rate = mapExchangeRate(fresh);
    expect(rate.rate).toBe(1050.25);
    expect(rate.baseCurrency).toBe('USD');
    expect(rate.targetCurrency).toBe('ARS');
    expect(rate.isStale).toBe(false);
  });

  it('cotización vieja → isStale true', () => {
    const old: ApiHistorialDivisa = {
      timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      tipo_cambio_oficial: 1000,
      tipo_cambio_paralelo: 1010,
    };
    expect(mapExchangeRate(old).isStale).toBe(true);
  });
});

describe('mapInflationSeries', () => {
  it('índice base 100 → MoM % entre puntos', () => {
    const api: ApiInflationSeries = {
      series: [
        { date: '2026-01-01', index: 100 },
        { date: '2026-01-02', index: 102 },
        { date: '2026-01-03', index: 101 },
      ],
      base: 100,
      method: 'mediana móvil 7d',
      excluded_promos: 5,
      products_count: 12,
    };
    const points = mapInflationSeries(api);
    expect(points).toHaveLength(3);
    expect(points[0].headlineInflationMoM).toBe(0);
    expect(points[1].headlineInflationMoM).toBe(2);
    expect(points[2].headlineInflationMoM).toBeCloseTo(-0.98, 1);
    expect(points[0].sampleObservationsCount).toBe(12);
  });
});

describe('mapAlertStatus (doble vía)', () => {
  it('open↔suspected, reviewed↔confirmed', () => {
    expect(mapAlertStatus('open')).toBe('suspected');
    expect(mapAlertStatus('reviewed')).toBe('confirmed');
    expect(mapAlertStatusToApi('confirmed')).toBe('reviewed');
    expect(mapAlertStatusToApi('suspected')).toBe('open');
    expect(mapAlertStatusToApi('unknown')).toBe('open');
  });
});

describe('mapPriceHistory', () => {
  const tiendas = new Map([
    [1, mapStore({ id: 1, nombre: 'Coto', url_base: null })],
  ]);

  const point = (over: Partial<ApiPricePoint>): ApiPricePoint => ({
    id: 1,
    timestamp: '2026-11-01T10:00:00Z',
    producto_id: 5,
    tienda_id: 1,
    precio_local: 1000,
    precio_tachado: null,
    en_oferta: false,
    tipo_cambio_usado: 1000,
    precio_usd: 1,
    is_promotion: false,
    price_regular: 1000,
    discount_pct: 0,
    ...over,
  });

  it('agrupa por tienda y calcula summary', () => {
    const items = [
      point({ id: 1, timestamp: '2026-11-01T10:00:00Z', precio_local: 1000 }),
      point({ id: 2, timestamp: '2026-11-05T10:00:00Z', precio_local: 1100 }),
      point({
        id: 3,
        timestamp: '2026-11-06T10:00:00Z',
        tienda_id: 1,
        precio_local: 900,
        is_promotion: true,
        discount_pct: 0.1818,
      }),
    ];
    const h = mapPriceHistory('5', '30d', items, tiendas);
    expect(h.stores).toHaveLength(1);
    expect(h.stores[0].storeName).toBe('Coto');
    expect(h.summary.currentMinPriceArs).toBe(900);
    expect(h.summary.currentMaxPriceArs).toBe(1100);
    expect(h.stores[0].observations[2].isPromotional).toBe(true);
    expect(h.stores[0].observations[2].discountPercentage).toBeCloseTo(18.18, 1);
  });

  it('lista vacía → summary en ceros', () => {
    const h = mapPriceHistory('5', '7d', [], tiendas);
    expect(h.stores).toHaveLength(0);
    expect(h.summary.currentMinPriceArs).toBe(0);
  });
});

describe('mapMatchSuggestion', () => {
  it('mapea par store_product+product con score', () => {
    const tiendas = new Map([[2, mapStore({ id: 2, nombre: 'Carrefour', url_base: null })]]);
    const api: ApiMatchSuggestion = {
      store_product: {
        id: 99,
        producto_id: null,
        tienda_id: 2,
        external_id: 'EXT-1',
        source_url: 'https://carrefour.example/p/1',
        nombre_crudo: 'ARROZ GALLO 1KG',
        marca_cruda: 'Gallo',
        raw_presentation: '1 kg',
        created_at: '2026-11-01T00:00:00Z',
      },
      product: {
        id: 5,
        nombre_universal: 'Arroz Blanco',
        categoria_id: 1,
        unidad_medida: '1 kg',
        marca: 'Gallo',
      },
      score: 0.93,
      band: 'auto',
    };
    const s = mapMatchSuggestion(api, tiendas);
    expect(s.id).toBe('99:5');
    expect(s.listingId).toBe('99');
    expect(s.canonicalProductId).toBe('5');
    expect(s.confidenceScore).toBe(0.93);
    expect(s.listingStore).toBe('Carrefour');
    expect(s.status).toBe('pending');
  });
});

describe('mapProduct categorias lookup', () => {
  it('categoria_id desconocida → "Sin categoría"', () => {
    const cats: ApiCategoria[] = [];
    const map = new Map(cats.map(c => [c.id, c.nombre]));
    const p = mapProduct(
      { id: 1, nombre_universal: 'X', categoria_id: 99, unidad_medida: null, marca: null },
      map
    );
    expect(p.category).toBe('Sin categoría');
  });
});

describe('mapStore Tienda', () => {
  it('url_base null → websiteUrl vacío', () => {
    const api: ApiTienda = { id: 1, nombre: 'DIA', url_base: null };
    expect(mapStore(api).websiteUrl).toBe('');
  });
});

// Limpieza por si algún test tocó globals
beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('mapDashboardSummary (contratos con datos reales)', () => {
  const producto = (id: number, name: string, marca = 'Marca'): ApiProducto => ({
    id,
    nombre_universal: name,
    categoria_id: 1,
    unidad_medida: '1 kg',
    marca,
  });

  const price = (over: Partial<ApiPricePoint>): ApiPricePoint => ({
    id: 1,
    timestamp: '2026-11-01T10:00:00Z',
    producto_id: 1,
    tienda_id: 3,
    precio_local: 1000,
    precio_tachado: null,
    en_oferta: false,
    tipo_cambio_usado: 1500,
    precio_usd: 0.67,
    is_promotion: false,
    price_regular: 1000,
    discount_pct: 0,
    ...over,
  });

  it('lista = pares producto-tienda con precio (no store_products)', () => {
    const summary = mapDashboardSummary({
      productosTotal: 15,
      tiendasCount: 3,
      shrinkAlerts: [],
      prices: [
        price({ id: 1, producto_id: 1 }),
        price({ id: 2, producto_id: 1, timestamp: '2026-11-02T10:00:00Z' }),
        price({ id: 3, producto_id: 2 }),
      ],
      productos: new Map([[1, producto(1, 'Arroz')], [2, producto(2, 'Aceite')]]),
      categorias: new Map([[1, 'Alimentos']]),
    });
    expect(summary.trackedListingsCount).toBe(2);
    expect(summary.activePromotionsCount).toBe(0);
    expect(summary.promotionsRatePercentage).toBe(0);
  });

  it('promos = �ltima observaci�n por par, no todas las hist�ricas', () => {
    const summary = mapDashboardSummary({
      productosTotal: 2,
      tiendasCount: 1,
      shrinkAlerts: [],
      prices: [
        price({ id: 1, producto_id: 1, is_promotion: true, discount_pct: 0.2 }),
        price({ id: 2, producto_id: 1, timestamp: '2026-11-05T10:00:00Z' }),
        price({ id: 3, producto_id: 2, timestamp: '2026-11-05T10:00:00Z', is_promotion: true, discount_pct: 0.15 }),
      ],
      productos: new Map([[1, producto(1, 'Arroz')], [2, producto(2, 'Aceite')]]),
      categorias: new Map([[1, 'Alimentos']]),
    });
    // p1 termina sin promo; p2 termina con promo
    expect(summary.activePromotionsCount).toBe(1);
    expect(summary.trackedListingsCount).toBe(2);
    expect(summary.promotionsRatePercentage).toBe(50);
    expect(summary.topDeflationOrPromoProducts).toHaveLength(1);
    expect(summary.topDeflationOrPromoProducts[0].decreasePercentage).toBe(15);
  });

  it('topInflation: subida de precio regular primera vs �ltima', () => {
    const summary = mapDashboardSummary({
      productosTotal: 1,
      tiendasCount: 1,
      shrinkAlerts: [],
      prices: [
        price({ id: 1, producto_id: 1, precio_local: 1000, timestamp: '2026-11-01T10:00:00Z' }),
        price({ id: 2, producto_id: 1, precio_local: 1200, timestamp: '2026-11-10T10:00:00Z' }),
      ],
      productos: new Map([[1, producto(1, 'Arroz')]]),
      categorias: new Map([[1, 'Alimentos']]),
    });
    expect(summary.topInflationProducts).toHaveLength(1);
    expect(summary.topInflationProducts[0].increasePercentage).toBe(20);
    expect(summary.topInflationProducts[0].productName).toBe('Arroz');
    expect(summary.topInflationProducts[0].category).toBe('Alimentos');
  });
});

describe('mapStoreDispersion', () => {
  it('usa �ltima obs por par; cheapest% y descuento real', () => {
    const tiendas = new Map([
      [1, mapStore({ id: 1, nombre: 'Coto', url_base: null })],
      [2, mapStore({ id: 2, nombre: 'Carrefour', url_base: null })],
    ]);
    const p = (over: Partial<ApiPricePoint>): ApiPricePoint => ({
      id: 1,
      timestamp: '2026-11-01T10:00:00Z',
      producto_id: 1,
      tienda_id: 1,
      precio_local: 1000,
      precio_tachado: null,
      en_oferta: false,
      tipo_cambio_usado: 1500,
      precio_usd: 0.67,
      is_promotion: false,
      price_regular: 1000,
      discount_pct: 0,
      ...over,
    });
    const items = [
      p({ id: 1, tienda_id: 1, producto_id: 1, precio_local: 900 }),
      p({ id: 2, tienda_id: 2, producto_id: 1, precio_local: 1100, timestamp: '2026-11-02T10:00:00Z' }),
      p({ id: 3, tienda_id: 2, producto_id: 2, precio_local: 500, is_promotion: true, discount_pct: 0.25, timestamp: '2026-11-02T10:00:00Z' }),
    ];
    const result = mapStoreDispersion(items, tiendas);
    expect(result).toHaveLength(2);
    const coto = result.find(s => s.storeName === 'Coto')!;
    const carrefour = result.find(s => s.storeName === 'Carrefour')!;
    // Coto m�s barata en producto 1; Carrefour �nica en producto 2
    // Coto: 1 de 1 mas barata (100%); Carrefour: 1 de 2 (50%)
    expect(coto.cheapestProductsPercentage).toBe(100);
    expect(carrefour.cheapestProductsPercentage).toBe(50);
    expect(carrefour.averageDiscountPercentage).toBe(25);
    expect(coto.averageDiscountPercentage).toBe(0);
    expect(coto.totalMonitoredListings).toBe(1);
  });
});
