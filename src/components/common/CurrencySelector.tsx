import React, { useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { DollarSign, RefreshCw, AlertTriangle, Info, Check } from 'lucide-react';

export const CurrencySelector: React.FC = () => {
  const {
    currency,
    setCurrency,
    exchangeRate,
    isLoadingRate,
    rateError,
    refreshRate,
  } = useCurrency();

  const [showDetails, setShowDetails] = useState(false);

  const formattedTimestamp = exchangeRate?.timestamp
    ? new Date(exchangeRate.timestamp).toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="relative inline-flex items-center text-xs">
      {/* Currency Switcher Buttons */}
      <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-md p-0.5">
        <button
          type="button"
          onClick={() => setCurrency('ARS')}
          className={`px-2.5 py-1 font-medium rounded transition-colors ${
            currency === 'ARS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Ver valores en Pesos Argentinos (Moneda Local)"
        >
          ARS ($)
        </button>
        <button
          type="button"
          onClick={() => setCurrency('USD')}
          className={`px-2.5 py-1 font-medium rounded transition-colors ${
            currency === 'USD'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Ver valores en Dólares Estadounidenses (USD)"
        >
          USD (US$)
        </button>
      </div>

      {/* Reference Rate Badge & Details Trigger */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="ml-2 flex items-center gap-1.5 px-2 py-1 text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800 rounded hover:border-slate-700 transition-colors"
        title="Ver detalles de cotización y tipo de cambio"
      >
        <DollarSign className="w-3.5 h-3.5 text-blue-400" />
        <span className="font-mono tabular-nums text-slate-300">
          {exchangeRate ? `1 USD = $${exchangeRate.rate.toLocaleString('es-AR')}` : 'Sin cotización'}
        </span>
        {exchangeRate?.isStale && (
          <span title="Cotización con más de 24hs de antigüedad">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
          </span>
        )}
        {rateError && (
          <span title={rateError}>
            <AlertTriangle className="w-3 h-3 text-red-400" />
          </span>
        )}
        <Info className="w-3 h-3 text-slate-500" />
      </button>

      {/* Popover Details Modal/Dropdown */}
      {showDetails && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 text-slate-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-semibold text-slate-100">Cotización de Referencia</span>
              <button
                type="button"
                onClick={refreshRate}
                disabled={isLoadingRate}
                className="p-1 hover:text-white rounded hover:bg-slate-800 text-slate-400 transition-colors disabled:opacity-50"
                title="Actualizar cotización"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRate ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="py-2.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tipo de cambio:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-100">
                  {exchangeRate ? `$ ${exchangeRate.rate.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS` : 'N/D'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Régimen / Tipo:</span>
                <span className="text-slate-200">
                  {exchangeRate?.rateType === 'official' ? 'Oficial Minorista' : 'Mercado'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Fuente:</span>
                <span className="text-slate-200">{exchangeRate?.source || 'Backend API'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Fecha de cotización:</span>
                <span className="font-mono tabular-nums text-slate-300">
                  {formattedTimestamp || 'Pendiente'}
                </span>
              </div>

              {exchangeRate?.isStale && (
                <div className="mt-2 p-2 bg-amber-950/60 border border-amber-800/80 rounded text-amber-300 text-[11px] leading-tight flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Atención: la cotización tiene más de 24 horas. Los cálculos en USD podrían diferir de la cotización intradía.
                  </span>
                </div>
              )}

              {rateError && (
                <div className="mt-2 p-2 bg-red-950/60 border border-red-800/80 rounded text-red-300 text-[11px] leading-tight flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <span>{rateError}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              Cotización consumida del Backend. PriceScope no calcula tipos de cambio propios.
            </div>
          </div>
        </>
      )}
    </div>
  );
};
