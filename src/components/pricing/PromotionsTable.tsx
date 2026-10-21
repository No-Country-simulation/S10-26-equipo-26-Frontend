import React, { useState, useEffect } from 'react';
import { PromotionSummaryItem } from '../../types/pricing';
import { getActivePromotions } from '../../services/pricingService';
import { useCurrency } from '../../context/CurrencyContext';
import { TableSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { Tag, ExternalLink, Filter, Building2, Calendar } from 'lucide-react';

interface PromotionsTableProps {
  onSelectProduct?: (productId: string) => void;
}

export const PromotionsTable: React.FC<PromotionsTableProps> = ({ onSelectProduct }) => {
  const { formatMoney } = useCurrency();
  const [promos, setPromos] = useState<PromotionSummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState('all');
  const [minDiscount, setMinDiscount] = useState<number>(0);

  const loadPromos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getActivePromotions(selectedStore, minDiscount);
      setPromos(data);
    } catch (err: any) {
      setError('Error al consultar promociones vigentes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPromos();
  }, [selectedStore, minDiscount]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
      {/* Table Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            Promociones Vigentes Detectadas ({promos.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Detección de ofertas informadas por e-commerce, descuentos cruzados y mecánicas de volumen
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStore}
            onChange={e => setSelectedStore(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas las tiendas</option>
            <option value="Coto">Coto Digital</option>
            <option value="Carrefour">Carrefour</option>
            <option value="DIA">Supermercados DIA</option>
            <option value="Jumbo">Jumbo</option>
          </select>

          <select
            value={minDiscount}
            onChange={e => setMinDiscount(Number(e.target.value))}
            className="text-xs bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="0">Cualquier descuento</option>
            <option value="10">Mínimo 10% OFF</option>
            <option value="15">Mínimo 15% OFF</option>
            <option value="20">Mínimo 20% OFF</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} columns={6} />
      ) : error ? (
        <div className="p-6 text-center text-xs text-red-400">{error}</div>
      ) : promos.length === 0 ? (
        <EmptyState
          title="Sin promociones activas"
          description="No se detectaron promociones para los filtros seleccionados."
        />
      ) : (
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              <tr>
                <th className="py-2.5 px-3">Producto Canónico</th>
                <th className="py-2.5 px-3">Tienda</th>
                <th className="py-2.5 px-3 text-right">Precio Regular</th>
                <th className="py-2.5 px-3 text-right">Precio Promocional</th>
                <th className="py-2.5 px-3 text-center">Descuento</th>
                <th className="py-2.5 px-3">Mecánica de Promoción</th>
                <th className="py-2.5 px-3 text-right">Enlace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {promos.map(item => (
                <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => onSelectProduct && onSelectProduct(item.canonicalProductId)}
                      className="font-semibold text-slate-100 hover:text-blue-400 transition-colors text-left"
                    >
                      {item.canonicalProductName}
                    </button>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Verificado:{' '}
                      {new Date(item.lastVerifiedAt).toLocaleString('es-AR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-200 flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    {item.storeName}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500 line-through">
                    {formatMoney(item.originalPriceArs, item.originalPriceUsd)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-emerald-400 text-sm">
                    {formatMoney(item.promoPriceArs, item.promoPriceUsd)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                      -{item.discountPercentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-slate-200 bg-slate-900 px-2 py-1 rounded border border-slate-800 font-medium text-[11px]">
                      <Tag className="w-3 h-3 text-amber-400" />
                      {item.mechanic}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <a
                      href={item.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-blue-400 rounded hover:bg-slate-800 inline-flex items-center gap-1 text-xs transition-colors"
                      title="Ver publicación original en e-commerce"
                    >
                      <span>Ir a tienda</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
