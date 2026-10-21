import React, { useState, useEffect } from 'react';
import { DashboardSummary, InflationMetricPoint, StoreDispersionItem } from '../../types/analytics';
import {
  getDashboardSummary,
  getInflationTimeSeries,
  getStoreDispersion,
} from '../../services/analyticsService';
import { MetricsGrid } from './MetricsGrid';
import { InflationChart } from './InflationChart';
import { StoreComparisonWidget } from './StoreComparisonWidget';
import { RecentAlertsWidget } from './RecentAlertsWidget';
import { CardSkeleton, TableSkeleton } from '../common/LoadingSkeleton';
import { ArrowRight, ShoppingCart, Tag, ShieldAlert, Sparkles } from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: 'catalog' | 'pricing' | 'shrinkflation') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [inflationSeries, setInflationSeries] = useState<InflationMetricPoint[]>([]);
  const [storeDispersion, setStoreDispersion] = useState<StoreDispersionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [sum, series, dispersion] = await Promise.all([
          getDashboardSummary(),
          getInflationTimeSeries(6),
          getStoreDispersion(),
        ]);
        setSummary(sum);
        setInflationSeries(series);
        setStoreDispersion(dispersion);
      } catch (err) {
        console.error('Error loading dashboard analytics', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={4} />
        <TableSkeleton rows={4} columns={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Metrics */}
      <MetricsGrid summary={summary} />

      {/* Main Analysis Grid: Inflation Time-series & Store Dispersion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InflationChart series={inflationSeries} />
        </div>

        {/* Quick Actions & Navigation Callout */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Módulos de Análisis B2B
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Explora en profundidad los productos canónicos, el histórico TimescaleDB y las alertas de reduflación.
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onNavigateTab('catalog')}
              className="w-full p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-md text-left transition-colors flex items-center justify-between text-xs group"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-blue-400">
                    Catálogo de Productos
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {summary.monitoredProductsCount} productos canónicos
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('pricing')}
              className="w-full p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-md text-left transition-colors flex items-center justify-between text-xs group"
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-emerald-400">
                    Historial de Precios & Promos
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {summary.activePromotionsCount} ofertas activas
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('shrinkflation')}
              className="w-full p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-md text-left transition-colors flex items-center justify-between text-xs group"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-amber-400">
                    Monitor de Reduflación
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {summary.confirmedShrinkflationAlertsCount} casos confirmados
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
            </button>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            Última sincronización: {new Date(summary.calculatedAt).toLocaleTimeString('es-AR')}
          </div>
        </div>
      </div>

      {/* Store Price Dispersion Benchmark */}
      <StoreComparisonWidget stores={storeDispersion} />

      {/* Recent Alerts & Top Movers */}
      <RecentAlertsWidget
        summary={summary}
        onNavigateToReduflacion={() => onNavigateTab('shrinkflation')}
        onNavigateToCatalog={() => onNavigateTab('catalog')}
      />
    </div>
  );
};
