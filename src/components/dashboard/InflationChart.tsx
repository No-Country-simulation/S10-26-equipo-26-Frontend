import React, { useState } from 'react';
import { InflationMetricPoint } from '../../types/analytics';
import { useCurrency } from '../../context/CurrencyContext';
import { TrendingUp } from 'lucide-react';

interface CategoryTab {
  id: number | 'all';
  nombre: string;
}

interface InflationChartProps {
  series: InflationMetricPoint[];
  isLoading?: boolean;
  categories: CategoryTab[];
  selectedCategoryId: number | 'all';
  onSelectCategory: (id: number | 'all') => void;
}

export const InflationChart: React.FC<InflationChartProps> = ({
  series,
  isLoading = false,
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const { formatMoney } = useCurrency();

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const width = 640;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const getMetricValue = (item: InflationMetricPoint) => item.headlineInflationMoM;

  const values = series.map(getMetricValue);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const yMin = Math.max(0, Math.floor(minVal - 0.5));
  const yMax = Math.ceil(maxVal + 0.5);

  const getX = (index: number) => {
    if (series.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (series.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    if (yMax === yMin) return paddingTop + innerHeight / 2;
    return paddingTop + (1 - (val - yMin) / (yMax - yMin)) * innerHeight;
  };

  const pathPoints = series.map((item, idx) => `${getX(idx)},${getY(getMetricValue(item))}`);
  const pathD = `M ${pathPoints.join(' L ')}`;
  const areaD = `${pathD} L ${getX(series.length - 1)},${height - paddingBottom} L ${getX(0)},${height - paddingBottom} Z`;

  const yTicks = [yMin, yMin + (yMax - yMin) / 2, yMax];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-red-400" />
            Evolución de la Inflación Real Mensual (MoM)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Índice experimental (base 100, mediana móvil 7 días, sin promociones)
          </p>
        </div>

        {/* Category Segmented Buttons (compartidos con el filtro del dashboard) */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`px-2 py-1 rounded font-medium transition-colors ${
              selectedCategoryId === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            General
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                selectedCategoryId === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / Empty states */}
      {isLoading && (
        <div className="relative w-full aspect-[21/9] min-h-[220px] bg-slate-950/80 border border-slate-800 rounded p-2 animate-pulse" />
      )}
      {!isLoading && series.length === 0 && (
        <div className="relative w-full aspect-[21/9] min-h-[220px] bg-slate-950/80 border border-slate-800 rounded p-2 flex items-center justify-center text-xs text-slate-500">
          Sin datos de inflación para el período / categoría seleccionados.
        </div>
      )}
      {!isLoading && series.length > 0 && (
      <div className="relative w-full aspect-[21/9] min-h-[220px] bg-slate-950/80 border border-slate-800 rounded p-2 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="inflationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => {
            const y = getY(tick);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeWidth="0.8"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  +{tick.toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {series.map((item, idx) => {
            const x = getX(idx);
            const dateObj = new Date(item.date);
            const label = dateObj.toLocaleDateString('es-AR', { month: 'short' });
            return (
              <text
                key={item.date}
                x={x}
                y={height - paddingBottom + 16}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {label}
              </text>
            );
          })}

          {/* Area under curve */}
          <path d={areaD} fill="url(#inflationGradient)" />

          {/* Line curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {series.map((item, idx) => {
            const val = getMetricValue(item);
            const cx = getX(idx);
            const cy = getY(val);
            const isHovered = hoverIndex === idx;
            return (
              <g key={idx}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip on Hover */}
        {hoverIndex !== null && (
          <div
            className="absolute z-20 pointer-events-none p-2.5 bg-slate-900 border border-slate-700 rounded-md shadow-xl text-xs space-y-1 transform -translate-x-1/2 -translate-y-full mb-2"
            style={{
              left: `${(getX(hoverIndex) / width) * 100}%`,
              top: `${(getY(getMetricValue(series[hoverIndex])) / height) * 100}%`,
            }}
          >
            <div className="font-semibold text-white">
              {new Date(series[hoverIndex].date).toLocaleDateString('es-AR', {
                month: 'long',
                year: 'numeric',
              })}
            </div>
            <div className="text-red-400 font-mono font-bold text-sm">
              +{getMetricValue(series[hoverIndex]).toFixed(2)}% MoM
            </div>
            <div className="text-[11px] text-slate-300">
              Costo canasta:{' '}
              <strong className="text-slate-100 font-mono">
                {formatMoney(series[hoverIndex].basketCostArs, series[hoverIndex].basketCostUsd)}
              </strong>
            </div>
            <div className="text-[10px] text-slate-400">
              Basado en {series[hoverIndex].sampleObservationsCount.toLocaleString('es-AR')} observaciones
            </div>
          </div>
        )}
      </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
        <span>Fuente: Indicadores de inflación calculados por el Backend (TimescaleDB).</span>
        <span>Muestra representativa de la canasta de consumo masivo</span>
      </div>
    </div>
  );
};
