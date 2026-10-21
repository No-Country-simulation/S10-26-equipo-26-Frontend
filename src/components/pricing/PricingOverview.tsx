import React, { useState, useEffect } from 'react';
import { CanonicalProduct } from '../../types/catalog';
import { ProductPriceHistory } from '../../types/pricing';
import { getProducts } from '../../services/catalogService';
import { getProductPriceHistory } from '../../services/pricingService';
import { PriceHistoryChart } from './PriceHistoryChart';
import { PromotionsTable } from './PromotionsTable';
import { TableSkeleton } from '../common/LoadingSkeleton';
import { Layers, ChevronDown } from 'lucide-react';

interface PricingOverviewProps {
  initialProductId?: string;
}

export const PricingOverview: React.FC<PricingOverviewProps> = ({ initialProductId }) => {
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || 'prod_aceite_cocinero_900'
  );
  const [history, setHistory] = useState<ProductPriceHistory | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<
    '7d' | '30d' | '90d' | '180d' | '1y' | 'all'
  >('30d');
  const [isLoading, setIsLoading] = useState(true);

  // Load products list for dropdown
  useEffect(() => {
    async function loadCatalog() {
      try {
        const resp = await getProducts({ pageSize: 50 });
        setProducts(resp.items);
        if (!initialProductId && resp.items.length > 0) {
          setSelectedProductId(resp.items[0].id);
        }
      } catch (err) {
        console.error('Error loading products for pricing selector', err);
      }
    }
    loadCatalog();
  }, [initialProductId]);

  // Load history for selected product
  useEffect(() => {
    async function loadHistory() {
      if (!selectedProductId) return;
      setIsLoading(true);
      try {
        const hist = await getProductPriceHistory(selectedProductId, selectedPeriod);
        setHistory(hist);
      } catch (err) {
        console.error('Error loading price history', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, [selectedProductId, selectedPeriod]);

  const currentProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="space-y-6">
      {/* Product Selection Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-blue-400" />
          <div>
            <span className="text-xs text-slate-400 block">Producto Canónico en Análisis:</span>
            <div className="relative mt-0.5">
              <select
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="text-sm font-semibold bg-slate-950 border border-slate-700 text-white rounded-md px-3 py-1.5 pr-8 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.brand} · {p.netWeightQuantity}{p.netWeightUnit})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {currentProduct && (
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>
              Categoría: <strong className="text-slate-200">{currentProduct.category}</strong>
            </span>
            <span>·</span>
            <span>
              Tiendas monitoreadas:{' '}
              <strong className="text-slate-200">{currentProduct.listingsCount}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Historical Price Chart */}
      {isLoading || !history ? (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-lg">
          <TableSkeleton rows={4} columns={4} />
        </div>
      ) : (
        <PriceHistoryChart
          history={history}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      )}

      {/* Active Promotions Feed */}
      <PromotionsTable
        onSelectProduct={prodId => {
          setSelectedProductId(prodId);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};
