import React, { useState, useEffect, useCallback } from 'react';
import { DashboardSummary, InflationMetricPoint, StoreDispersionItem } from '../../types/analytics';
import {
  getDashboardSummary,
  getInflationTimeSeries,
  getStoreDispersion,
} from '../../services/analyticsService';
import { getCategories, getStores, CategoryOption } from '../../services/catalogService';
import type { Store } from '../../types/catalog';
import { MetricsGrid } from './MetricsGrid';
import { InflationChart } from './InflationChart';
import { StoreComparisonWidget } from './StoreComparisonWidget';
import { RecentAlertsWidget } from './RecentAlertsWidget';
import { CardSkeleton, TableSkeleton } from '../common/LoadingSkeleton';
import { ArrowRight, ShoppingCart, Tag, ShieldAlert, Sparkles, Filter } from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: 'catalog' | 'pricing' | 'shrinkflation') => void;
}

const PERIOD_OPTIONS = [30, 90, 180] as const;

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [inflationSeries, setInflationSeries] = useState<InflationMetricPoint[]>([]);
  const [storeDispersion, setStoreDispersion] = useState<StoreDispersionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  // Filtros del tablero ejecutivo (HU 3.6): período / categoría / tienda.
  // La moneda es global (TopNav CurrencySelector).
  const [periodDays, setPeriodDays] = useState<number>(90);
  const [categoryId, setCategoryId] = useState<number | 'all'>('all');
  const [storeId, setStoreId] = useState<string | 'all'>('all');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  const loadFilterOptions = useCallback(() => {
    void (async () => {
      try {
        const [cats, sts] = await Promise.all([getCategories(), getStores()]);
        setCategories(cats);
        setStores(sts);
      } catch (err) {
        console.error('Error loading filter options', err);
      }
    })();
  }, []);

  useEffect(() => {
    void loadFilterOptions();
  }, [loadFilterOptions]);

  const loadSummary = useCallback(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const sum = await getDashboardSummary({ periodDays, categoryId, storeId });
        setSummary(sum);
      } catch (err) {
        console.error('Error loading dashboard analytics', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [periodDays, categoryId, storeId]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const loadChart = useCallback(() => {
    void (async () => {
      setChartLoading(true);
      try {
        const series = await getInflationTimeSeries(periodDays, categoryId);
        setInflationSeries(series);
      } catch (err) {
        console.error('Error loading inflation series', err);
      } finally {
        setChartLoading(false);
      }
    })();
  }, [periodDays, categoryId]);

  useEffect(() => {
    void loadChart();
  }, [loadChart]);

  const loadDispersion = useCallback(() => {
    void (async () => {
      try {
        const dispersion = await getStoreDispersion(periodDays, storeId);
        setStoreDispersion(dispersion);
      } catch (err) {
        console.error('Error loading store dispersion', err);
      }
    })();
  }, [periodDays, storeId]);

  useEffect(() => {
    void loadDispersion();
  }, [loadDispersion]);

  if (isLoading && !summary) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={4} />
        <TableSkeleton rows={4} columns={4} />
      </div>
    );
  }
  if (!summary) return null;

  const selectClass =
    'text-xs bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500';

  return (
    <div className="space-y-6">
      {/* Filter toolbar — coherente en todos los widgets (HU 3.6) */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg flex flex-wrap items-center justify-end gap-2.5">
        <span className="text-xs text-slate-400 mr-auto flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" />
          Filtros del tablero:
        </span>
        <select
          value={periodDays}
          onChange={e => setPeriodDays(Number(e.target.value))}
          className={selectClass}
          aria-label="Período"
        >
          {PERIOD_OPTIONS.map(d => (
            <option key={d} value={d}>
              Últimos {d} días
            </option>
          ))}
        </select>
        <select
          value={categoryId}
          onChange={e =>
            setCategoryId(e.target.value === 'all' ? 'all' : Number(e.target.value))
          }
          className={selectClass}
          aria-label="Categoría"
        >
          <option value="all">Todas las categorías</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select
          value={storeId}
          onChange={e => setStoreId(e.target.value)}
          className={selectClass}
          aria-label="Tienda"
        >
          <option value="all">Todas las tiendas</option>
          {stores.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Metrics */}
      <MetricsGrid summary={summary} periodDays={periodDays} />

      {/* Main Analysis Grid: Inflation Time-series & Store Dispersion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InflationChart
            series={inflationSeries}
            isLoading={chartLoading}
            categories={categories}
            selectedCategoryId={categoryId}
            onSelectCategory={setCategoryId}
          />
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
