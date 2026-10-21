import React from 'react';
import { CurrencySelector } from '../common/CurrencySelector';
import { Database, ShieldCheck, ExternalLink } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'catalog' | 'pricing' | 'shrinkflation' | 'api-contracts';

interface TopNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isMockMode: boolean;
  onToggleMockMode: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  isMockMode,
  onToggleMockMode,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950 border-b border-slate-800">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-blue-400 transition-colors flex items-center gap-2"
        >
          <span className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-xs font-black text-white">
            PS
          </span>
          PriceScope
        </button>
      </div>

      {/* Zone 2: 5 concise single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
            activeTab === 'dashboard'
              ? 'text-white border-blue-500 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Dashboard B2B
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('catalog')}
          className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
            activeTab === 'catalog'
              ? 'text-white border-blue-500 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Catálogo & Tiendas
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('pricing')}
          className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
            activeTab === 'pricing'
              ? 'text-white border-blue-500 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Precios & Promos
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('shrinkflation')}
          className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
            activeTab === 'shrinkflation'
              ? 'text-white border-blue-500 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Monitor de Reduflación
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('api-contracts')}
          className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
            activeTab === 'api-contracts'
              ? 'text-white border-blue-500 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Contratos API REST
        </button>
      </nav>

      {/* Zone 3: 1 primary action area */}
      <div className="flex items-center gap-3 shrink-0">
        <CurrencySelector />

        {/* Mock/Live Backend Mode Badge & Toggle */}
        <button
          type="button"
          onClick={onToggleMockMode}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
            isMockMode
              ? 'bg-amber-950/50 border-amber-800/80 text-amber-300 hover:bg-amber-900/50'
              : 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/50'
          }`}
          title="Alternar entre FastAPI Live y Dataset Demo Mock"
        >
          <Database className="w-3.5 h-3.5" />
          <span>{isMockMode ? 'Modo Demo (Mock)' : 'FastAPI Live'}</span>
        </button>
      </div>
    </header>
  );
};
