/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CurrencyProvider } from './context/CurrencyContext';
import { TopNav, ActiveTab } from './components/layout/TopNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductCatalog } from './components/catalog/ProductCatalog';
import { PricingOverview } from './components/pricing/PricingOverview';
import { ShrinkflationMonitor } from './components/shrinkflation/ShrinkflationMonitor';
import { ApiContractsView } from './components/api-docs/ApiContractsView';
import { CanonicalProduct } from './types/catalog';
import {
  getIsMockMode,
  setForceMockMode,
  subscribeMockMode,
} from './services/apiClient';
import {
  ChevronRight,
  Database,
  Layers,
  TrendingUp,
  ShieldAlert,
  Server,
  Info,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMockMode, setIsMockMode] = useState<boolean>(getIsMockMode());
  const [selectedProductForPricing, setSelectedProductForPricing] = useState<string | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = subscribeMockMode(active => {
      setIsMockMode(active);
    });
    return unsubscribe;
  }, []);

  const handleToggleMock = () => {
    setForceMockMode(!isMockMode);
  };

  const handleViewPriceHistory = (product: CanonicalProduct) => {
    setSelectedProductForPricing(product.id);
    setActiveTab('pricing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <CurrencyProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        {/* Universal Top Nav conforming to 3-zone contract */}
        <TopNav
          activeTab={activeTab}
          onSelectTab={tab => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isMockMode={isMockMode}
          onToggleMockMode={handleToggleMock}
        />

        {/* Sub-header Workspace Breadcrumb Bar */}
        <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="font-semibold text-slate-300">PriceScope</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-300 capitalize">
              {activeTab === 'dashboard' && 'Dashboard de Analítica B2B'}
              {activeTab === 'catalog' && 'Catálogo Canónico & Comparador entre Tiendas'}
              {activeTab === 'pricing' && 'Evolución Histórica & Promociones'}
              {activeTab === 'shrinkflation' && 'Detección y Auditoría de Reduflación'}
              {activeTab === 'api-contracts' && 'Especificación de Contratos API REST (FastAPI)'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            {isMockMode && (
              <span className="text-[11px] text-amber-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                <span>Dataset demo cargado · Simulación offline</span>
              </span>
            )}
            <span className="text-[11px] font-mono text-slate-500">
              TimescaleDB v2.16 · FastAPI REST
            </span>
          </div>
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={tab => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {activeTab === 'catalog' && (
            <ProductCatalog onViewPriceHistory={handleViewPriceHistory} />
          )}

          {activeTab === 'pricing' && (
            <PricingOverview initialProductId={selectedProductForPricing} />
          )}

          {activeTab === 'shrinkflation' && <ShrinkflationMonitor />}

          {activeTab === 'api-contracts' && <ApiContractsView />}
        </main>

        {/* Footer conforming to anti-slop guidelines */}
        <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-5 px-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">PriceScope B2B Analytics</span>
              <span>·</span>
              <span>Monitor de Inflación Real Multimoneda</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <button
                type="button"
                onClick={() => setActiveTab('api-contracts')}
                className="hover:text-slate-200 transition-colors"
              >
                Contratos API
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className="hover:text-slate-200 transition-colors"
              >
                Catálogo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('shrinkflation')}
                className="hover:text-slate-200 transition-colors"
              >
                Reduflación
              </button>
            </div>
          </div>
        </footer>
      </div>
    </CurrencyProvider>
  );
}
