import React, { useState, useEffect } from 'react';
import { ShrinkflationAlert, ShrinkflationStatus } from '../../types/shrinkflation';
import { getShrinkflationAlerts } from '../../services/shrinkflationService';
import { useCurrency } from '../../context/CurrencyContext';
import { ShrinkflationBadge } from '../common/StatusIndicator';
import { ShrinkflationDetailModal } from './ShrinkflationDetailModal';
import { TableSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import {
  ShieldAlert,
  Filter,
  ArrowRight,
  TrendingUp,
  Scale,
  Eye,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

export const ShrinkflationMonitor: React.FC = () => {
  const { formatMoney, formatUnitRate } = useCurrency();
  const [alerts, setAlerts] = useState<ShrinkflationAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<ShrinkflationStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minInflation, setMinInflation] = useState<number>(0);

  // Selected alert for evidence modal
  const [selectedAlert, setSelectedAlert] = useState<ShrinkflationAlert | null>(null);

  const loadAlerts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getShrinkflationAlerts({
        status: statusFilter,
        category: categoryFilter,
        minHiddenInflation: minInflation || undefined,
      });
      setAlerts(data);
    } catch (err: any) {
      setError('Error al cargar alertas de reduflación.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [statusFilter, categoryFilter, minInflation]);

  const confirmedCount = alerts.filter(a => a.status === 'confirmed').length;
  const suspectedCount = alerts.filter(a => a.status === 'suspected').length;
  const avgInflation = alerts.length
    ? (alerts.reduce((acc, curr) => acc + curr.effectiveUnitInflationPercentage, 0) / alerts.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-5">
      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Alertas Totales</span>
            <ShieldAlert className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-100">
            {alerts.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Registros con discrepancia de peso</div>
        </div>

        <div className="p-4 bg-slate-900 border border-red-900/40 rounded-lg">
          <div className="flex items-center justify-between text-xs text-red-400 mb-1">
            <span>Reduflación Confirmada</span>
            <CheckCircle2 className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-400">
            {confirmedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Con evidencia auditada y lote verificado</div>
        </div>

        <div className="p-4 bg-slate-900 border border-amber-900/40 rounded-lg">
          <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
            <span>Sospechas / En Análisis</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">
            {suspectedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Detección heurística de crawler</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Inflación Unitaria Promedio</span>
            <TrendingUp className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-400">
            +{avgInflation}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Sobre costo unitario por kg o litro</div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="text-xs bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="confirmed">Confirmada</option>
            <option value="suspected">Sospecha / En revisión</option>
            <option value="unknown">Desconocida</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas las categorías</option>
            <option value="Cuidado Personal">Cuidado Personal</option>
            <option value="Limpieza">Limpieza</option>
            <option value="Almacén">Almacén</option>
            <option value="Snacks y Golosinas">Snacks y Golosinas</option>
          </select>

          <select
            value={minInflation}
            onChange={e => setMinInflation(Number(e.target.value))}
            className="text-xs bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="0">Cualquier impacto</option>
            <option value="10">Mayor a +10% en precio unitario</option>
            <option value="20">Mayor a +20% en precio unitario</option>
            <option value="30">Mayor a +30% en precio unitario</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-400">
          Auditoría rigurosa para análisis B2B de precios
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={4} columns={6} />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-red-400">{error}</div>
        ) : alerts.length === 0 ? (
          <EmptyState
            title="No se encontraron alertas de reduflación"
            description="No hay discrepancias registradas con los criterios de búsqueda actuales."
            actionLabel="Limpiar filtros"
            onAction={() => {
              setStatusFilter('all');
              setCategoryFilter('all');
              setMinInflation(0);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">Producto & Marca</th>
                  <th className="py-3 px-4">Cambio de Contenido</th>
                  <th className="py-3 px-4 text-right">Variación Facial</th>
                  <th className="py-3 px-4 text-right">Inflación Real ($/Unidad)</th>
                  <th className="py-3 px-4 text-center">Estado Auditoría</th>
                  <th className="py-3 px-4 text-right">Evidencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {alerts.map(item => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => setSelectedAlert(item)}
                  >
                    <td className="py-3.5 px-4 font-medium text-slate-100 max-w-xs">
                      <div className="font-semibold group-hover:text-blue-400 transition-colors">
                        {item.canonicalProductName}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.brand} · {item.category}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <span>{item.originalWeightQuantity}{item.originalWeightUnit}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="font-semibold text-red-400">
                          {item.newWeightQuantity}{item.newWeightUnit}
                        </span>
                        <span className="font-bold text-red-400 ml-1">
                          ({item.weightChangePercentage.toFixed(1)}%)
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <div className="text-slate-200 font-medium">
                        +{item.nominalPriceChangePercentage.toFixed(1)}%
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatMoney(item.nominalPriceBeforeArs)} → {formatMoney(item.nominalPriceAfterArs)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <div className="font-bold text-red-400 text-sm">
                        +{item.effectiveUnitInflationPercentage.toFixed(1)}%
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatUnitRate(item.unitPriceAfterArs, item.unitPriceAfterUsd, item.newWeightUnit === 'ml' ? 'L' : 'kg')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <ShrinkflationBadge status={item.status} confidenceScore={item.confidenceScore} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedAlert(item);
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Auditar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Evidence Modal */}
      <ShrinkflationDetailModal
        alert={selectedAlert}
        isOpen={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
        onUpdated={() => {
          loadAlerts();
        }}
      />
    </div>
  );
};
