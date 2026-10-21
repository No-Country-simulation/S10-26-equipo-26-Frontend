import React, { useState, useMemo } from 'react';
import { ProductPriceHistory, StorePricePoint } from '../../types/pricing';
import { useCurrency } from '../../context/CurrencyContext';
import { Tag, TrendingUp, Calendar, Info, Layers } from 'lucide-react';

interface PriceHistoryChartProps {
  history: ProductPriceHistory;
  selectedPeriod: '7d' | '30d' | '90d' | '180d' | '1y' | 'all';
  onPeriodChange: (period: '7d' | '30d' | '90d' | '180d' | '1y' | 'all') => void;
}

const STORE_COLORS: Record<string, { stroke: string; fill: string; border: string }> = {
  store_coto: { stroke: '#3b82f6', fill: '#1d4ed8', border: 'border-blue-500' }, // Blue
  store_carrefour: { stroke: '#06b6d4', fill: '#0891b2', border: 'border-cyan-500' }, // Cyan
  store_dia: { stroke: '#ef4444', fill: '#b91c1c', border: 'border-red-500' }, // Red
  store_jumbo: { stroke: '#10b981', fill: '#047857', border: 'border-emerald-500' }, // Emerald
};

const DEFAULT_COLOR = { stroke: '#a855f7', fill: '#7e22ce', border: 'border-purple-500' };

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  history,
  selectedPeriod,
  onPeriodChange,
}) => {
  const { currency, formatMoney } = useCurrency();
  const [activeStores, setActiveStores] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    history.stores.forEach(s => {
      initial[s.storeId] = true;
    });
    return initial;
  });

  const [hoveredPoint, setHoveredPoint] = useState<{
    storeName: string;
    point: StorePricePoint;
    x: number;
    y: number;
  } | null>(null);

  const toggleStore = (storeId: string) => {
    setActiveStores(prev => ({
      ...prev,
      [storeId]: !prev[storeId],
    }));
  };

  // Extract all distinct dates and price bounds
  const chartData = useMemo(() => {
    let allPrices: number[] = [];
    const datesSet = new Set<string>();

    history.stores.forEach(store => {
      if (!activeStores[store.storeId]) return;
      store.observations.forEach(obs => {
        datesSet.add(obs.date);
        const p = currency === 'USD' && obs.priceUsd ? obs.priceUsd : obs.priceArs;
        allPrices.push(p);
      });
    });

    if (allPrices.length === 0) {
      allPrices = [1000];
    }

    const sortedDates = Array.from(datesSet).sort();
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const padding = (maxP - minP) * 0.15 || minP * 0.1 || 10;
    const yMin = Math.max(0, minP - padding);
    const yMax = maxP + padding;

    return {
      sortedDates,
      yMin,
      yMax,
    };
  }, [history, activeStores, currency]);

  // Chart dimensions
  const width = 800;
  const height = 320;
  const paddingLeft = 65;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const getX = (date: string) => {
    const idx = chartData.sortedDates.indexOf(date);
    if (idx === -1 || chartData.sortedDates.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (idx / (chartData.sortedDates.length - 1)) * innerWidth;
  };

  const getY = (price: number) => {
    if (chartData.yMax === chartData.yMin) return paddingTop + innerHeight / 2;
    const norm = (price - chartData.yMin) / (chartData.yMax - chartData.yMin);
    return paddingTop + (1 - norm) * innerHeight;
  };

  // Y-axis ticks (4 ticks)
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 4;
    for (let i = 0; i <= count; i++) {
      ticks.push(chartData.yMin + (i / count) * (chartData.yMax - chartData.yMin));
    }
    return ticks;
  }, [chartData.yMin, chartData.yMax]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
      {/* Chart Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Evolución Histórica de Precios por Tienda
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Series temporales TimescaleDB · Distinción de precio regular vs promocional
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg self-start sm:self-auto">
          {(['7d', '30d', '90d', '180d', '1y', 'all'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors uppercase ${
                selectedPeriod === p
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Store Toggles Legend */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
        <span className="text-xs text-slate-400 mr-1">Tiendas visibles:</span>
        {history.stores.map(store => {
          const color = STORE_COLORS[store.storeId] || DEFAULT_COLOR;
          const isSelected = activeStores[store.storeId];
          return (
            <button
              key={store.storeId}
              type="button"
              onClick={() => toggleStore(store.storeId)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
                isSelected
                  ? 'bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-slate-950/40 text-slate-500 border-slate-900 opacity-60'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: isSelected ? color.stroke : '#475569' }}
              />
              <span className="font-medium">{store.storeName}</span>
            </button>
          );
        })}

        {/* Legend notes */}
        <div className="ml-auto hidden lg:flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" /> Regular
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rotate-45 bg-emerald-400 inline-block" /> Promoción
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full border border-purple-400 bg-transparent inline-block" /> Estimado
          </span>
        </div>
      </div>

      {/* Interactive SVG Chart Container */}
      <div className="relative w-full aspect-[21/9] min-h-[280px] bg-slate-950/80 border border-slate-800/80 rounded-md p-2 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible select-none"
        >
          {/* Horizontal Grid lines */}
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
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {currency === 'USD'
                    ? `US$ ${tick.toFixed(2)}`
                    : `$ ${Math.round(tick).toLocaleString('es-AR')}`}
                </text>
              </g>
            );
          })}

          {/* Date Axis X Labels */}
          {chartData.sortedDates.map((d, i) => {
            // Show every second or third label if too many dates
            if (chartData.sortedDates.length > 8 && i % 2 !== 0 && i !== chartData.sortedDates.length - 1) {
              return null;
            }
            const x = getX(d);
            const dateObj = new Date(d);
            const formatted = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
            return (
              <g key={d}>
                <line
                  x1={x}
                  y1={height - paddingBottom}
                  x2={x}
                  y2={height - paddingBottom + 5}
                  stroke="#475569"
                />
                <text
                  x={x}
                  y={height - paddingBottom + 18}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {formatted}
                </text>
              </g>
            );
          })}

          {/* Store Lines and Observation Points */}
          {history.stores.map(store => {
            if (!activeStores[store.storeId]) return null;
            const color = STORE_COLORS[store.storeId] || DEFAULT_COLOR;

            // Sort observations by date
            const sortedObs = [...store.observations].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            // Construct SVG path
            const pathPoints = sortedObs.map(obs => {
              const price = currency === 'USD' && obs.priceUsd ? obs.priceUsd : obs.priceArs;
              return `${getX(obs.date)},${getY(price)}`;
            });

            const pathD = pathPoints.length > 0 ? `M ${pathPoints.join(' L ')}` : '';

            return (
              <g key={store.storeId}>
                {/* Continuous trend line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={color.stroke}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Individual Observation points */}
                {sortedObs.map((obs, idx) => {
                  const price = currency === 'USD' && obs.priceUsd ? obs.priceUsd : obs.priceArs;
                  const cx = getX(obs.date);
                  const cy = getY(price);

                  if (obs.isPromotional) {
                    // Promotional marker: Diamond
                    return (
                      <polygon
                        key={idx}
                        points={`${cx},${cy - 5.5} ${cx + 5.5},${cy} ${cx},${cy + 5.5} ${cx - 5.5},${cy}`}
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="cursor-pointer transition-transform hover:scale-125"
                        onMouseEnter={() =>
                          setHoveredPoint({ storeName: store.storeName, point: obs, x: cx, y: cy })
                        }
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    );
                  }

                  if (obs.priceType === 'regular_estimated') {
                    // Estimated marker: Outlined circle
                    return (
                      <circle
                        key={idx}
                        cx={cx}
                        cy={cy}
                        r="4"
                        fill="#0b0f19"
                        stroke="#c084fc"
                        strokeWidth="2"
                        className="cursor-pointer transition-transform hover:scale-125"
                        onMouseEnter={() =>
                          setHoveredPoint({ storeName: store.storeName, point: obs, x: cx, y: cy })
                        }
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    );
                  }

                  // Default Regular observed marker: Solid circle
                  return (
                    <circle
                      key={idx}
                      cx={cx}
                      cy={cy}
                      r="4"
                      fill={color.stroke}
                      stroke="#0f172a"
                      strokeWidth="1"
                      className="cursor-pointer transition-transform hover:scale-125"
                      onMouseEnter={() =>
                        setHoveredPoint({ storeName: store.storeName, point: obs, x: cx, y: cy })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none p-2.5 bg-slate-900/95 border border-slate-700 rounded-md shadow-xl text-xs space-y-1 transform -translate-x-1/2 -translate-y-full mb-2"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`,
            }}
          >
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span>{hoveredPoint.storeName}</span>
              <span className="text-slate-500">·</span>
              <span className="font-mono text-slate-300 font-normal">
                {new Date(hoveredPoint.point.date).toLocaleDateString('es-AR')}
              </span>
            </div>

            <div className="font-mono tabular-nums text-sm font-bold text-emerald-400">
              {formatMoney(hoveredPoint.point.priceArs, hoveredPoint.point.priceUsd)}
            </div>

            <div className="text-[11px] text-slate-300">
              Clasificación:{' '}
              {hoveredPoint.point.priceType === 'promotional' ? (
                <span className="text-emerald-400 font-semibold">Promoción</span>
              ) : hoveredPoint.point.priceType === 'regular_estimated' ? (
                <span className="text-purple-400 font-semibold">Regular Estimado</span>
              ) : (
                <span className="text-slate-300">Regular Observado</span>
              )}
            </div>

            {hoveredPoint.point.promotionMechanic && (
              <div className="text-[11px] text-amber-300 flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-400" />
                <span>{hoveredPoint.point.promotionMechanic}</span>
                {hoveredPoint.point.discountPercentage && (
                  <span className="font-bold">(-{hoveredPoint.point.discountPercentage}%)</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
          <span className="text-slate-400 block text-[11px]">Precio mínimo actual</span>
          <span className="font-mono tabular-nums font-bold text-emerald-400 text-sm">
            {formatMoney(history.summary.currentMinPriceArs)}
          </span>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
          <span className="text-slate-400 block text-[11px]">Precio máximo actual</span>
          <span className="font-mono tabular-nums font-bold text-slate-200 text-sm">
            {formatMoney(history.summary.currentMaxPriceArs)}
          </span>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
          <span className="text-slate-400 block text-[11px]">Dispersión entre tiendas</span>
          <span className="font-mono tabular-nums font-bold text-blue-400 text-sm">
            +{history.summary.priceSpreadPercentage}%
          </span>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
          <span className="text-slate-400 block text-[11px]">Variación acumulada 30D</span>
          <span className="font-mono tabular-nums font-bold text-amber-400 text-sm">
            +{history.summary.variation30dPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
};
