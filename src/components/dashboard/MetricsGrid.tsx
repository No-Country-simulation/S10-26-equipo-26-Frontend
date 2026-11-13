import React from 'react';
import { DashboardSummary } from '../../types/analytics';
import {
  Package,
  Tag,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';

interface MetricsGridProps {
  summary: DashboardSummary;
  periodDays: number;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ summary, periodDays }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: variación índice inflación (período) + variación precios (mismo período) */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Inflación {periodDays} Días</span>
          <TrendingUp className="w-4 h-4 text-red-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-red-400">
            +{summary.periodInflationMoM.toFixed(2)}%
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {periodDays} días: +{summary.periodInflationYoY.toFixed(1)}%
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1 truncate" title={summary.calculationMethod}>
          Índice experimental: mediana móvil 7 días, sin promos
        </div>
      </div>

      {/* Metric 2: Monitored Products & Listings */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Productos Canónicos</span>
          <Package className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-100">
            {summary.monitoredProductsCount.toLocaleString('es-AR')}
          </span>
          <span className="text-xs text-slate-400">
            en {summary.monitoredStoresCount} tiendas
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          {summary.trackedListingsCount.toLocaleString('es-AR')} publicaciones rastreadas
        </div>
      </div>

      {/* Metric 3: Active Promotions Rate */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Tasa de Promociones</span>
          <Tag className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            {summary.promotionsRatePercentage.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400">del catálogo</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          {summary.activePromotionsCount.toLocaleString('es-AR')} ofertas vigentes en góndolas
        </div>
      </div>

      {/* Metric 4: Shrinkflation Alerts */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Casos de Reduflación</span>
          <ShieldAlert className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-amber-400">
            {summary.detectedShrinkflationAlertsCount}
          </span>
          <span className="text-xs text-red-400 font-medium">
            ({summary.confirmedShrinkflationAlertsCount} confirmados)
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Reducción encubierta de gramaje/volumen
        </div>
      </div>
    </div>
  );
};
