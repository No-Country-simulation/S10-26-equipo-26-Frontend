import React from 'react';
import { DashboardSummary } from '../../types/analytics';
import { useCurrency } from '../../context/CurrencyContext';
import { TrendingUp, TrendingDown, ArrowRight, ShieldAlert } from 'lucide-react';

interface RecentAlertsWidgetProps {
  summary: DashboardSummary;
  onNavigateToReduflacion: () => void;
  onNavigateToCatalog: () => void;
}

export const RecentAlertsWidget: React.FC<RecentAlertsWidgetProps> = ({
  summary,
  onNavigateToReduflacion,
  onNavigateToCatalog,
}) => {
  const { formatMoney } = useCurrency();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top Inflation Movers */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-red-400" />
            Mayores Variaciones de Precio / Reduflación
          </h3>
          <button
            type="button"
            onClick={onNavigateToReduflacion}
            className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
          >
            Ver alertas <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {summary.topInflationProducts.map(item => (
            <div
              key={item.productId}
              className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded flex items-center justify-between gap-3 text-xs"
            >
              <div className="truncate">
                <div className="font-medium text-slate-200 truncate">{item.productName}</div>
                <div className="text-[11px] text-slate-500">{item.brand} · {item.category}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono font-bold text-red-400">
                  +{item.increasePercentage.toFixed(1)}%
                </div>
                <div className="font-mono text-[11px] text-slate-400">
                  {formatMoney(item.currentPriceArs, item.currentPriceUsd)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Deflation / Promo Opportunities */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            Mayores Descuentos & Promociones Vigentes
          </h3>
          <button
            type="button"
            onClick={onNavigateToCatalog}
            className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
          >
            Ir al catálogo <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {summary.topDeflationOrPromoProducts.map(item => (
            <div
              key={item.productId}
              className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded flex items-center justify-between gap-3 text-xs"
            >
              <div className="truncate">
                <div className="font-medium text-slate-200 truncate">{item.productName}</div>
                <div className="text-[11px] text-slate-500">{item.brand} · {item.category}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono font-bold text-emerald-400">
                  {item.decreasePercentage.toFixed(1)}%
                </div>
                <div className="font-mono text-[11px] text-slate-400">
                  {formatMoney(item.currentPriceArs, item.currentPriceUsd)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
