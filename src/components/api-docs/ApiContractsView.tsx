import React, { useState } from 'react';
import { Database, Code, CheckCircle2, AlertCircle, Clock, Server, ArrowRight } from 'lucide-react';
import { getIsMockMode, setForceMockMode } from '../../services/apiClient';

interface ContractEndpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  status: 'implemented' | 'pending_backend_contract' | 'active_with_fallback';
  queryParams?: string[];
  requestPayload?: string;
  responsePayload: string;
  notes?: string;
}

const CONTRACTS: ContractEndpoint[] = [
  {
    method: 'GET',
    path: '/canonical-products',
    description: 'Listado paginado de productos canónicos con filtros por categoría, marca, rango de precio y ordenamiento.',
    status: 'active_with_fallback',
    queryParams: ['q', 'category', 'brand', 'store_id', 'min_price', 'max_price', 'page', 'page_size', 'sort_by', 'sort_dir'],
    responsePayload: `{\n  "items": [ {\n    "id": "prod_aceite_cocinero_900",\n    "sku": "ALIM-ACE-001",\n    "name": "Aceite de Girasol Cocinero 900 ml",\n    "brand": "Cocinero",\n    "category": "Almacén",\n    "netWeightQuantity": 900,\n    "netWeightUnit": "ml",\n    "minPriceArs": 2150,\n    "maxPriceArs": 2590,\n    "listingsCount": 4\n  } ],\n  "total": 1840,\n  "page": 1,\n  "pageSize": 10,\n  "totalPages": 184\n}`,
    notes: 'Consumido por el catálogo principal.',
  },
  {
    method: 'GET',
    path: '/canonical-products/{id}/listings',
    description: 'Devuelve todas las publicaciones activas en tiendas e-commerce asociadas al producto canónico.',
    status: 'active_with_fallback',
    responsePayload: `[\n  {\n    "id": "list_coto_aceite_01",\n    "storeName": "Coto Digital",\n    "externalId": "COTO-481923",\n    "originalName": "Aceite de Girasol COCINERO Botella 900 Ml",\n    "productUrl": "https://www.cotodigital3.com.ar/...",\n    "currentPriceArs": 2150,\n    "isPromotional": true,\n    "promotionMechanic": "12% OFF llevando 2 un."\n  }\n]`,
    notes: 'Requerido para la vista de detalle y comparación entre tiendas.',
  },
  {
    method: 'POST',
    path: '/canonical-products/{id}/listings',
    description: 'Asociación manual de una publicación scrapeada a un producto canónico.',
    status: 'active_with_fallback',
    requestPayload: `{\n  "listing_id": "list_unmatched_dia_choc_99"\n}`,
    responsePayload: `{\n  "success": true,\n  "message": "Publicación asociada exitosamente"\n}`,
    notes: 'El matching para el MVP es manual con confirmación previa.',
  },
  {
    method: 'DELETE',
    path: '/canonical-products/{id}/listings/{listing_id}',
    description: 'Desasociación de una publicación del producto canónico.',
    status: 'active_with_fallback',
    responsePayload: `{\n  "success": true,\n  "message": "Publicación desasociada exitosamente"\n}`,
    notes: 'Desvincula la publicación y la retorna al listado de pendientes.',
  },
  {
    method: 'GET',
    path: '/matching/suggestions',
    description: 'Sugerencias heurísticas de coincidencia pendientes de validación por un operador.',
    status: 'active_with_fallback',
    responsePayload: `[\n  {\n    "id": "match_sugg_01",\n    "listingId": "list_unmatched_dia_choc_99",\n    "canonicalProductId": "prod_chocolinas_250",\n    "confidenceScore": 0.94,\n    "similarityFactors": {\n      "nameSimilarity": 0.92,\n      "brandMatch": true,\n      "weightSimilarity": 1.0\n    }\n  }\n]`,
    notes: 'El sistema no fusiona automáticamente; muestra sugerencias para confirmación.',
  },
  {
    method: 'GET',
    path: '/canonical-products/{id}/price-history',
    description: 'Serie temporal de precios diarios en TimescaleDB diferenciando precios regulares observados, estimados y promociones.',
    status: 'active_with_fallback',
    queryParams: ['period: 7d | 30d | 90d | 180d | 1y | all'],
    responsePayload: `{\n  "canonicalProductId": "prod_aceite_cocinero_900",\n  "stores": [\n    {\n      "storeId": "store_coto",\n      "storeName": "Coto Digital",\n      "observations": [\n        {\n          "date": "2026-10-20",\n          "priceArs": 2150,\n          "priceUsd": 1.82,\n          "priceType": "promotional",\n          "isPromotional": true,\n          "promotionMechanic": "12% OFF llevando 2 un."\n        }\n      ]\n    }\n  ]\n}`,
    notes: 'Alimenta el gráfico interactivo de dispersión y evolución.',
  },
  {
    method: 'GET',
    path: '/shrinkflation-alerts',
    description: 'Listado de discrepancias en peso/volumen detectadas por scrapers con cálculo de inflación encubierta por unidad.',
    status: 'active_with_fallback',
    queryParams: ['status: confirmed | suspected | unknown', 'category', 'min_inflation'],
    responsePayload: `[\n  {\n    "id": "shrink_alert_colgate_01",\n    "canonicalProductName": "Crema Dental Colgate Total 12",\n    "status": "confirmed",\n    "originalWeightQuantity": 90,\n    "newWeightQuantity": 70,\n    "weightChangePercentage": -22.2,\n    "effectiveUnitInflationPercentage": 40.22,\n    "evidenceBaseline": { "weightDeclaredQuantity": 90, "observedPriceArs": 2650 },\n    "evidenceCurrent": { "weightDeclaredQuantity": 70, "observedPriceArs": 2890 }\n  }\n]`,
    notes: 'No afirma reduflación sin respaldo; categoriza en desconocido, estimado y confirmado.',
  },
  {
    method: 'GET',
    path: '/exchange-rates/active',
    description: 'Cotización oficial vigente de USD provista por el Backend.',
    status: 'active_with_fallback',
    responsePayload: `{\n  "baseCurrency": "USD",\n  "targetCurrency": "ARS",\n  "rate": 1180.50,\n  "rateType": "official",\n  "source": "BCRA / Backend TimescaleDB API",\n  "timestamp": "2026-10-20T12:00:00Z"\n}`,
    notes: 'El Frontend no inventa cotizaciones ni consulta fuentes 3P no aprobadas.',
  },
  {
    method: 'GET',
    path: '/analytics/dashboard-summary',
    description: 'Métricas macro agregadas: inflación calculada por Backend (Laspeyres), total de productos y tiendas.',
    status: 'active_with_fallback',
    responsePayload: `{\n  "periodInflationMoM": 3.42,\n  "periodInflationYoY": 52.80,\n  "calculationMethod": "Laspeyres Chain-weighted Index",\n  "monitoredProductsCount": 1840,\n  "trackedListingsCount": 6940,\n  "promotionsRatePercentage": 20.46\n}`,
    notes: 'La lógica de cálculo de inflación y exclusiones pertenece al Backend.',
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
            Especificación de Contratos API REST (FastAPI & TimescaleDB)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            PriceScope Frontend se integra de manera desacoplada con el Backend en FastAPI. Todos los endpoints cuentan con fallback transparente y validación estricta de esquemas TypeScript.
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
              <CheckCircle2 className="w-3.5 h-3.5" /> Frontend Compatible
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
