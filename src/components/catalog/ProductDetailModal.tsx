import React, { useState, useEffect } from 'react';
import { CanonicalProduct, ProductListing, MatchSuggestion } from '../../types/catalog';
import {
  getProductListings,
  disassociateListing,
  getMatchSuggestions,
  confirmMatchSuggestion,
  rejectMatchSuggestion,
} from '../../services/catalogService';
import { useCurrency } from '../../context/CurrencyContext';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { AssociateListingModal } from './AssociateListingModal';
import { PriceTypeBadge } from '../common/StatusIndicator';
import {
  X,
  ExternalLink,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  CheckCircle,
  Tag,
  Building2,
  Calendar,
  Layers,
  FileText,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: CanonicalProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onViewPriceHistory?: (product: CanonicalProduct) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onUpdate,
  onViewPriceHistory,
}) => {
  const { formatMoney } = useCurrency();
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals for sub-actions
  const [listingToDisassociate, setListingToDisassociate] = useState<ProductListing | null>(null);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [suggestionToConfirm, setSuggestionToConfirm] = useState<MatchSuggestion | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      loadDetails();
    }
  }, [isOpen, product]);

  const loadDetails = async () => {
    if (!product) return;
    setIsLoading(true);
    setError(null);
    try {
      const [listingsData, allSuggestions] = await Promise.all([
        getProductListings(product.id),
        getMatchSuggestions(),
      ]);
      setListings(listingsData);
      setSuggestions(allSuggestions.filter(s => s.canonicalProductId === product.id));
    } catch (err: any) {
      setError('Error al cargar publicaciones asociadas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDisassociate = async () => {
    if (!product || !listingToDisassociate) return;
    setIsProcessing(true);
    try {
      await disassociateListing(product.id, listingToDisassociate.id);
      setListingToDisassociate(null);
      await loadDetails();
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Error al desasociar la publicación.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmSuggestion = async () => {
    if (!suggestionToConfirm) return;
    setIsProcessing(true);
    try {
      await confirmMatchSuggestion(suggestionToConfirm.id);
      setSuggestionToConfirm(null);
      await loadDetails();
      onUpdate();
    } catch (err: any) {
      setError('Error al confirmar sugerencia.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    setIsProcessing(true);
    try {
      await rejectMatchSuggestion(suggestionId, 'Rechazado manualmente por el usuario');
      await loadDetails();
      onUpdate();
    } catch (err: any) {
      setError('Error al rechazar sugerencia.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-slate-800 bg-slate-950/70">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-200">{product.brand}</span>
                <span>·</span>
                <span>{product.category}</span>
                {product.subcategory && (
                  <>
                    <span>/</span>
                    <span>{product.subcategory}</span>
                  </>
                )}
                <span>·</span>
                <span className="font-mono text-slate-300">SKU: {product.sku}</span>
                {product.ean && (
                  <>
                    <span>·</span>
                    <span className="font-mono text-slate-300">EAN: {product.ean}</span>
                  </>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-100">{product.name}</h2>
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <span>
                  Contenido neto estándar:{' '}
                  <strong className="text-slate-200 font-mono">
                    {product.netWeightQuantity} {product.netWeightUnit}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Rango de precios hoy:{' '}
                  <strong className="text-emerald-400 font-mono tabular-nums">
                    {formatMoney(product.minPriceArs, product.minPriceUsd)}
                  </strong>
                  {' - '}
                  <strong className="text-slate-200 font-mono tabular-nums">
                    {formatMoney(product.maxPriceArs, product.maxPriceUsd)}
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onViewPriceHistory && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewPriceHistory(product);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-white bg-blue-950/60 hover:bg-blue-900 border border-blue-800 rounded transition-colors"
                >
                  Ver Historial & Gráfico
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-6 flex-1">
            {error && (
              <div className="p-3 bg-red-950/70 border border-red-800 rounded text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Pending Match Suggestions Banner (MVP Manual confirmation requirement) */}
            {suggestions.length > 0 && (
              <div className="p-4 bg-blue-950/40 border border-blue-800/80 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-semibold text-blue-200 uppercase tracking-wide">
                      Sugerencias de Coincidencia Pendientes de Confirmación ({suggestions.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-blue-300">
                    Requiere validación manual para evitar falsos positivos
                  </span>
                </div>

                <div className="space-y-2">
                  {suggestions.map(sugg => (
                    <div
                      key={sugg.id}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 text-slate-300">
                          <span className="font-semibold text-white">{sugg.listingStore}</span>
                          <span>·</span>
                          <span className="text-blue-400 font-mono font-semibold">
                            Similitud: {Math.round(sugg.confidenceScore * 100)}%
                          </span>
                        </div>
                        <p className="text-slate-200 font-medium">{sugg.listingOriginalName}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>
                            Precio:{' '}
                            <strong className="text-slate-100 font-mono">
                              {formatMoney(sugg.listingPriceArs)}
                            </strong>
                          </span>
                          <span>Peso reportado: {sugg.canonicalNetWeight}</span>
                          <a
                            href={sugg.listingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline inline-flex items-center gap-1"
                          >
                            Ver en tienda <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRejectSuggestion(sugg.id)}
                          disabled={isProcessing}
                          className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                        >
                          Rechazar
                        </button>
                        <button
                          type="button"
                          onClick={() => setSuggestionToConfirm(sugg)}
                          disabled={isProcessing}
                          className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Confirmar Coincidencia
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Associated Store Listings Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                    Publicaciones Activas por Tienda ({listings.length})
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Precios e identificadores monitoreados en cada e-commerce
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssociateModal(true)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  Asociar otra publicación
                </button>
              </div>

              {isLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Cargando publicaciones asociadas...
                </div>
              ) : listings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-950/50 border border-slate-800 rounded-lg">
                  Este producto canónico no tiene publicaciones asociadas actualmente.
                </div>
              ) : (
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                      <tr>
                        <th className="py-2.5 px-3">Tienda</th>
                        <th className="py-2.5 px-3">Título Publicado en Tienda</th>
                        <th className="py-2.5 px-3 font-mono">SKU / ID Ext.</th>
                        <th className="py-2.5 px-3 text-right">Precio Actual</th>
                        <th className="py-2.5 px-3 text-right">Precio Anterior</th>
                        <th className="py-2.5 px-3 text-center">Tipo / Promo</th>
                        <th className="py-2.5 px-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {listings.map(item => (
                        <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-3 font-medium text-slate-100 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            {item.storeName}
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            <div className="truncate font-medium text-slate-200" title={item.originalName}>
                              {item.originalName}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Último scrapeo:{' '}
                              {new Date(item.lastScrapedAt).toLocaleString('es-AR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                            {item.externalId}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-100">
                            {formatMoney(item.currentPriceArs, item.currentPriceUsd)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500">
                            {item.previousPriceArs ? (
                              <span className="line-through">
                                {formatMoney(item.previousPriceArs, item.previousPriceUsd)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <PriceTypeBadge
                              type={item.isPromotional ? 'promotional' : 'regular_observed'}
                              mechanic={item.promotionMechanic}
                            />
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={item.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-slate-400 hover:text-blue-400 rounded hover:bg-slate-800 transition-colors"
                                title="Abrir publicación en el e-commerce oficial"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => setListingToDisassociate(item)}
                                className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition-colors"
                                title="Desasociar publicación de este producto canónico"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Base de datos TimescaleDB gestionada por FastAPI. Cambios de asociación registrados para trazabilidad.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation modal for Disassociation */}
      <ConfirmationModal
        isOpen={Boolean(listingToDisassociate)}
        title="Confirmar desasociación de publicación"
        message={`¿Estás seguro de desasociar "${listingToDisassociate?.originalName}" (${listingToDisassociate?.storeName}) de este producto canónico? La publicación volverá al listado de elementos no mapeados.`}
        confirmLabel="Desasociar"
        isDestructive={true}
        isLoading={isProcessing}
        onConfirm={handleConfirmDisassociate}
        onCancel={() => setListingToDisassociate(null)}
      />

      {/* Confirmation modal for Suggestion Approval */}
      <ConfirmationModal
        isOpen={Boolean(suggestionToConfirm)}
        title="Confirmar sugerencia de coincidencia"
        message={`¿Confirmas que la publicación "${suggestionToConfirm?.listingOriginalName}" (${suggestionToConfirm?.listingStore}) corresponde a "${product?.name}"?`}
        confirmLabel="Confirmar y Asociar"
        isLoading={isProcessing}
        onConfirm={handleConfirmSuggestion}
        onCancel={() => setSuggestionToConfirm(null)}
      />

      {/* Modal to pick an unmatched listing to associate */}
      <AssociateListingModal
        isOpen={showAssociateModal}
        product={product}
        onClose={() => setShowAssociateModal(false)}
        onSuccess={async () => {
          await loadDetails();
          onUpdate();
        }}
      />
    </>
  );
};
