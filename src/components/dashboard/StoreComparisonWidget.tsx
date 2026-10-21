import React from 'react';
import { StoreDispersionItem } from '../../types/analytics';
import { Building2, Percent, CheckCircle, TrendingDown } from 'lucide-react';

interface StoreComparisonWidgetProps {
  stores: StoreDispersionItem[];
}

export const StoreComparisonWidget: React.FC<StoreComparisonWidgetProps> = ({ stores }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          Benchmark de Competitividad de Precios por Tienda
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Dispersión promedio respecto a la canasta de mercado (Índice Base = 100)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stores.map(store => {
          const isCheaper = store.averagePriceIndex < 100;
          const diff = (store.averagePriceIndex - 100).toFixed(1);

          return (
            <div
              key={store.storeId}
              className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-md space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-200">{store.storeName}</span>
                <span
                  className={`text-xs font-mono font-bold ${
                    isCheaper ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {isCheaper ? `${diff}%` : `+${diff}%`}
                </span>
              </div>

              {/* Price index progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Índice Canasta:</span>
                  <span className="font-semibold text-slate-200">{store.averagePriceIndex}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isCheaper ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, (store.averagePriceIndex / 115) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Más económica en:</span>
                  <span className="font-semibold text-emerald-400 font-mono tabular-nums">
                    {store.cheapestProductsPercentage}% de items
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Descuento promedio:</span>
                  <span className="font-mono tabular-nums text-slate-300">
                    -{store.averageDiscountPercentage}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Disponibilidad stock:</span>
                  <span className="font-mono tabular-nums text-slate-300">
                    {store.stockAvailabilityPercentage}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
