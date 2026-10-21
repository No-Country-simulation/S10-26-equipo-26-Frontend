import React, { useState, useEffect } from 'react';
import { CanonicalProduct, CatalogFilterParams } from '../../types/catalog';
import { getProducts } from '../../services/catalogService';
import { useCurrency } from '../../context/CurrencyContext';
import { TableSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { ProductDetailModal } from './ProductDetailModal';
import {
  Search,
  Filter,
  Eye,
  AlertTriangle,
  Sparkles,
  ArrowUpDown,
  ShoppingBag,
  Store,
  Layers,
} from 'lucide-react';

interface ProductCatalogProps {
  onViewPriceHistory?: (product: CanonicalProduct) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ onViewPriceHistory }) => {
  const { formatMoney } = useCurrency();
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [onlyAlerts, setOnlyAlerts] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<CatalogFilterParams['sortBy']>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Selected product for detail modal
  const [selectedProduct, setSelectedProduct] = useState<CanonicalProduct | null>(null);

  const pageSize = 8;

  const loadCatalog = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getProducts({
        query: searchQuery,
        category: selectedCategory,
        brand: selectedBrand,
        hasAlert: onlyAlerts || undefined,
        page: currentPage,
        pageSize,
        sortBy,
        sortDirection,
      });
      setProducts(response.items);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(err.message || 'Error al cargar productos del catálogo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [currentPage, selectedCategory, selectedBrand, onlyAlerts, sortBy, sortDirection]);

  // Debounced search trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadCatalog();
  };

  const handleToggleSort = (field: CatalogFilterParams['sortBy']) => {
    if (sortBy === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top filter toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, marca, EAN o SKU..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todas las categorías</option>
              <option value="Almacén">Almacén</option>
              <option value="Limpieza">Limpieza</option>
              <option value="Lácteos y Frescos">Lácteos y Frescos</option>
              <option value="Cuidado Personal">Cuidado Personal</option>
              <option value="Snacks y Golosinas">Snacks y Golosinas</option>
            </select>

            <select
              value={selectedBrand}
              onChange={e => {
                setSelectedBrand(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todas las marcas</option>
              <option value="Cocinero">Cocinero</option>
              <option value="Skip">Skip</option>
              <option value="Bagley">Bagley</option>
              <option value="La Serenísima">La Serenísima</option>
              <option value="Colgate">Colgate</option>
              <option value="Gallo Oro">Gallo Oro</option>
              <option value="La Virginia">La Virginia</option>
              <option value="Lay's">Lay's</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setOnlyAlerts(!onlyAlerts);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors flex items-center gap-1.5 ${
                onlyAlerts
                  ? 'bg-amber-950/70 border-amber-700 text-amber-300'
                  : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Solo con Alerta de Reduflación
            </button>
          </div>
        </div>
      </div>

      {/* Main Catalog Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={6} columns={6} />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-400">
            {error}
            <button
              type="button"
              onClick={loadCatalog}
              className="mt-3 block mx-auto px-3 py-1 bg-slate-800 text-slate-200 rounded hover:bg-slate-700"
            >
              Reintentar
            </button>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No se encontraron productos"
            description="Intenta modificar los términos de búsqueda o filtros seleccionados."
            actionLabel="Limpiar filtros"
            onAction={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedBrand('all');
              setOnlyAlerts(false);
              setCurrentPage(1);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleSort('name')}
                      className="flex items-center gap-1 hover:text-slate-100"
                    >
                      Producto Canónico
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4">Marca & Categoría</th>
                  <th className="py-3 px-4">Contenido Estándar</th>
                  <th className="py-3 px-4 font-mono">EAN / SKU</th>
                  <th className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSort('listingsCount')}
                      className="inline-flex items-center gap-1 hover:text-slate-100"
                    >
                      Tiendas
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleSort('minPrice')}
                      className="inline-flex items-center gap-1 hover:text-slate-100"
                    >
                      Rango de Precios
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-center">Avisos</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {products.map(item => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => setSelectedProduct(item)}
                  >
                    <td className="py-3.5 px-4 font-medium text-slate-100 max-w-xs">
                      <div className="font-semibold group-hover:text-blue-400 transition-colors">
                        {item.name}
                      </div>
                      {item.description && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">{item.brand}</div>
                      <div className="text-[11px] text-slate-400">{item.category}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-300">
                      {item.netWeightQuantity} {item.netWeightUnit}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      <div>{item.sku}</div>
                      {item.ean && <div className="text-slate-500 text-[10px]">{item.ean}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800 text-slate-300"
                        title={`${item.listingsCount} publicaciones asociadas en distintas tiendas`}
                      >
                        <Store className="w-3 h-3 text-slate-400" />
                        {item.listingsCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <div className="font-semibold text-emerald-400">
                        {formatMoney(item.minPriceArs, item.minPriceUsd)}
                      </div>
                      {item.maxPriceArs && item.maxPriceArs !== item.minPriceArs && (
                        <div className="text-[11px] text-slate-500">
                          hasta {formatMoney(item.maxPriceArs, item.maxPriceUsd)}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.hasShrinkflationAlert && (
                          <span
                            title="Posible reduflación detectada en gramaje o volumen"
                            className="p-1 rounded bg-red-950/80 text-red-400 border border-red-800"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {item.hasPendingMatches && (
                          <span
                            title="Tiene sugerencias de coincidencia pendientes de confirmar"
                            className="p-1 rounded bg-blue-950/80 text-blue-400 border border-blue-800"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {!item.hasShrinkflationAlert && !item.hasPendingMatches && (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedProduct(item);
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={page => setCurrentPage(page)}
        />
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onUpdate={loadCatalog}
        onViewPriceHistory={onViewPriceHistory}
      />
    </div>
  );
};
