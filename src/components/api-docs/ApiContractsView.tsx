import React, { useState } from 'react';
import { CheckCircle2, Server } from 'lucide-react';
import { getIsMockMode, setForceMockMode } from '../../services/apiClient';

interface ContractEndpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  status: 'implemented';
  queryParams?: string[];
  requestPayload?: string;
  responsePayload: string;
  notes?: string;
}

const CONTRACTS: ContractEndpoint[] = [
  {
    method: 'GET',
    path: '/products',
    description:
      'Productos canónicos paginados; búsqueda y filtro por categoría se aplican en el servidor (HU 1.1).',
    status: 'implemented',
    queryParams: ['category_id', 'search', 'page', 'page_size'],
    responsePayload:
      '{\n  "items": [\n    {\n      "id": 2,\n      "nombre_universal": "Aceite de Girasol",\n      "categoria_id": 1,\n      "unidad_medida": "1,5 L",\n      "marca": "Natura"\n    }\n  ],\n  "total": 15\n}',
    notes: 'Alimenta el catálogo y el dashboard.',
  },
  {
    method: 'GET',
    path: '/products/categories',
    description: 'Lookup de categorías reales para los filtros del catálogo y del tablero.',
    status: 'implemented',
    responsePayload:
      '[\n  { "id": 1, "nombre": "Alimentos y Bebidas" },\n  { "id": 2, "nombre": "Cuidado e Higiene Personal" },\n  { "id": 4, "nombre": "Hogar y Limpieza" }\n]',
  },
  {
    method: 'POST',
    path: '/products',
    description: 'Alta de producto canónico (HU 1.1).',
    status: 'implemented',
    requestPayload:
      '{\n  "nombre_universal": "Aceite de Girasol",\n  "categoria_id": 1,\n  "unidad_medida": "1,5 L",\n  "marca": "Natura"\n}',
    responsePayload:
      '{\n  "id": 16,\n  "nombre_universal": "Aceite de Girasol",\n  "categoria_id": 1,\n  "unidad_medida": "1,5 L",\n  "marca": "Natura"\n}',
    notes: '201 en éxito; 422 en payload inválido.',
  },
  {
    method: 'PATCH',
    path: '/products/{id}',
    description: 'Actualización parcial de un producto canónico.',
    status: 'implemented',
    requestPayload: '{\n  "marca": "Natura"\n}',
    responsePayload:
      '{\n  "id": 2,\n  "nombre_universal": "Aceite de Girasol",\n  "marca": "Natura"\n}',
    notes: '404 si el producto no existe.',
  },
  {
    method: 'POST',
    path: '/store-products',
    description:
      'Publicación de tienda asociada a un producto canónico, con identidad external_id (HU 1.2).',
    status: 'implemented',
    requestPayload:
      '{\n  "producto_id": 8,\n  "tienda_id": 2,\n  "external_id": "8324",\n  "source_url": "https://www.cetrogar.com.ar/tv-led-50--.../p",\n  "nombre_crudo": "Smart Tv Led Samsung UN50M60HAGXZB 50\\" Mini Led T"\n}',
    responsePayload:
      '{\n  "id": 1,\n  "producto_id": 8,\n  "tienda_id": 2,\n  "external_id": "8324",\n  "created_at": "2026-11-12T04:59:58.932434Z"\n}',
    notes: '409 si (tienda_id, external_id) ya existe.',
  },
  {
    method: 'GET',
    path: '/store-products',
    description: 'Listado de publicaciones por tienda/producto; unmatched_only devuelve las pendientes de asociar.',
    status: 'implemented',
    queryParams: ['tienda_id', 'producto_id', 'unmatched_only'],
    responsePayload:
      '[\n  {\n    "id": 1,\n    "producto_id": 8,\n    "tienda_id": 2,\n    "external_id": "8324",\n    "nombre_crudo": "Smart Tv Led Samsung UN50M60HAGXZB 50\\" Mini Led T",\n    "marca_cruda": "Samsung"\n  }\n]',
  },
  {
    method: 'POST',
    path: '/match/suggestions',
    description:
      'Sugerencias de matching producto↔publicación con rapidfuzz (HU 1.4).',
    status: 'implemented',
    requestPayload: '{\n  "tienda_id": 3,\n  "threshold": 0.75\n}',
    responsePayload:
      '{\n  "items": [\n    {\n      "store_product": { "id": 5, "nombre_crudo": "Arroz Parboil Gallo Oro 1kg" },\n      "product": { "id": 1, "nombre_universal": "Arroz Parboil" },\n      "score": 0.93,\n      "band": "auto"\n    }\n  ],\n  "total": 1,\n  "auto_count": 1,\n  "review_count": 0\n}',
    notes: 'score ≥ 0.90 → auto; 0.75–0.90 → revisión manual en el Frontend.',
  },
  {
    method: 'GET',
    path: '/prices/history',
    description:
      'Serie temporal de precios por producto/tienda con precio USD persistido y clasificación promo derivada (HU 3.3).',
    status: 'implemented',
    queryParams: ['producto_id', 'tienda_id', 'start', 'end', 'page', 'page_size'],
    responsePayload:
      '{\n  "items": [\n    {\n      "id": 1,\n      "timestamp": "2026-10-27T18:03:02.966403Z",\n      "producto_id": 1,\n      "tienda_id": 3,\n      "precio_local": "2980.00",\n      "precio_tachado": null,\n      "en_oferta": false,\n      "tipo_cambio_usado": "1560.0000",\n      "precio_usd": "1.91",\n      "disponible": null,\n      "is_promotion": false,\n      "price_regular": "2980.00",\n      "discount_pct": "0"\n    }\n  ],\n  "total": 768\n}',
    notes: 'disponible: null = desconocido (HU 2.1).',
  },
  {
    method: 'GET',
    path: '/exchange-rates/as-of',
    description:
      'Cotización al momento indicado: fila más cercana anterior a ts; sin previo, la más antigua (HU 3.2).',
    status: 'implemented',
    queryParams: ['ts'],
    responsePayload:
      '{\n  "timestamp": "2026-11-12T11:00:52.551185Z",\n  "tipo_cambio_oficial": "1573.0000",\n  "tipo_cambio_paralelo": "1568.0000"\n}',
    notes: 'Fuente: Bluelytics vía ingesta horaria del Backend.',
  },
  {
    method: 'GET',
    path: '/indicators/inflation',
    description:
      'Índice de inflación base 100 (HU 2.3): mediana móvil 7d de precios regulares, excluye promos.',
    status: 'implemented',
    queryParams: ['start_date', 'end_date', 'category_id', 'currency'],
    responsePayload:
      '{\n  "series": [\n    { "date": "2026-11-11", "index": "100.00" },\n    { "date": "2026-11-12", "index": "100.17" }\n  ],\n  "base": "100",\n  "method": "mediana movil 7d de precios regulares por producto (excluye en_oferta y descuentos >= 10%), media de ratios por categoria, base 100",\n  "excluded_promos": 200,\n  "products_count": 9\n}',
    notes: 'Índice experimental, no oficial: el método está documentado en el README del Backend.',
  },
  {
    method: 'GET',
    path: '/indicators/devaluation-gap',
    description:
      'Brecha entre variación de precios y variación del tipo de cambio en el período (HU 3.4).',
    status: 'implemented',
    queryParams: ['start_date', 'end_date'],
    responsePayload:
      '{\n  "start": "2026-10-13",\n  "end": "2026-11-12",\n  "price_variation": "0.0000",\n  "fx_variation": "0.0142",\n  "gap": "-0.0142",\n  "fx_start": "1550.0000",\n  "fx_end": "1572.0000"\n}',
  },
  {
    method: 'GET',
    path: '/alerts',
    description:
      'Alertas de anomalía: reduflación y precios que superan la devaluación (HU 3.5).',
    status: 'implemented',
    queryParams: ['status', 'severity', 'type'],
    responsePayload:
      '[\n  {\n    "id": 12,\n    "alert_type": "shrinkflation",\n    "producto_id": 5,\n    "store_product_id": 9,\n    "tienda_id": 3,\n    "score": "0.8500",\n    "severity": "medium",\n    "status": "open",\n    "details": { "weight_change_pct": -20 },\n    "created_at": "2026-11-13T03:15:00Z",\n    "reviewed_at": null\n  }\n]',
    notes: 'Devuelve [] cuando no hay alertas abiertas.',
  },
  {
    method: 'PATCH',
    path: '/alerts/{id}',
    description: 'Marca una alerta como revisada por un operador.',
    status: 'implemented',
    requestPayload: '{\n  "status": "reviewed"\n}',
    responsePayload:
      '{\n  "id": 12,\n  "status": "reviewed",\n  "reviewed_at": "2026-11-13T12:00:00Z"\n}',
  },
  {
    method: 'GET',
    path: '/health',
    description: 'Sonda de salud del Backend (badge ApiStatus del Frontend).',
    status: 'implemented',
    responsePayload: '{\n  "status": "ok",\n  "app": "PriceScope API",\n  "version": "0.1.0"\n}',
  },
];

export const ApiContractsView: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ContractEndpoint>(CONTRACTS[0]);
  const isMock = getIsMockMode();

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            Especificación de Contratos API REST (FastAPI & PostgreSQL)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Frontend consume la API v1 bajo SPEC §2.2. Sin fallback silencioso: con{' '}
            <code className="font-mono">VITE_ENABLE_MOCK=false</code> los errores se propagan; el
            mock solo se activa por env o por toggle explícito.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-300">
            Estado de conexión:{' '}
            <strong className={isMock ? 'text-amber-400' : 'text-emerald-400'}>
              {isMock ? 'Modo Demo Activo' : 'FastAPI Live'}
            </strong>
          </div>
          <button
            type="button"
            onClick={() => setForceMockMode(!isMock)}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {isMock ? 'Probar FastAPI Live' : 'Forzar Modo Mock'}
          </button>
        </div>
      </div>

      {/* Contract Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoint List */}
        <div className="lg:col-span-5 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Endpoints del Backend ({CONTRACTS.length})
          </h3>
          <div className="space-y-1.5">
            {CONTRACTS.map(ep => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
              return (
                <button
                  key={`${ep.method}-${ep.path}`}
                  type="button"
                  onClick={() => setSelectedEndpoint(ep)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors flex items-start gap-3 ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-600 text-white shadow-xs'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                      ep.method === 'GET'
                        ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                        : ep.method === 'POST'
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                        : ep.method === 'DELETE'
                        ? 'bg-red-900/60 text-red-300 border border-red-700'
                        : 'bg-amber-900/60 text-amber-300 border border-amber-700'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs font-semibold truncate">{ep.path}</div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{ep.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Endpoint Contract Detail */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-600 text-white">
                {selectedEndpoint.method}
              </span>
              <span className="font-mono text-sm font-semibold text-slate-100">
                {selectedEndpoint.path}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Implementado
            </span>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Propósito y Alcance
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {selectedEndpoint.description}
            </p>
            {selectedEndpoint.notes && (
              <div className="mt-2 p-2.5 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-400">
                Nota de integración: {selectedEndpoint.notes}
              </div>
            )}
          </div>

          {selectedEndpoint.queryParams && (
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
                Parámetros Query Soportados
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedEndpoint.queryParams.map(param => (
                  <span
                    key={param}
                    className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-950 text-blue-300 border border-slate-800"
                  >
                    {param}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedEndpoint.requestPayload && (
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
                Payload de Solicitud (Request Body JSON)
              </h4>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded text-[11px] font-mono text-slate-200 overflow-x-auto">
                {selectedEndpoint.requestPayload}
              </pre>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
              Estructura de Respuesta Esperada (Response JSON)
            </h4>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-60 overflow-y-auto">
              {selectedEndpoint.responsePayload}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
