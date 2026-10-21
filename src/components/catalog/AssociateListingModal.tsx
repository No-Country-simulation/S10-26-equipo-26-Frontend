import React, { useState, useEffect } from 'react';
import { CanonicalProduct, ProductListing } from '../../types/catalog';
import { getUnmatchedListings, associateListing } from '../../services/catalogService';
import { useCurrency } from '../../context/CurrencyContext';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { X, Search, Link as LinkIcon, AlertCircle, ExternalLink, Check } from 'lucide-react';

interface AssociateListingModalProps {
  isOpen: boolean;
  product: CanonicalProduct | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssociateListingModal: React.FC<AssociateListingModalProps> = ({
  isOpen,
  product,
  onClose,
  onSuccess,
}) => {
  const { formatMoney } = useCurrency();
  const [unmatched, setUnmatched] = useState<ProductListing[]>([]);
  const [search, setSearch] = useState('');
  const [selectedListing, setSelectedListing] = useState<ProductListing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      loadUnmatched();
      setSearch(product.brand);
    }
  }, [isOpen, product]);

  const loadUnmatched = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await getUnmatchedListings();
      setUnmatched(items);
    } catch (err: any) {
      setError('Error al cargar publicaciones pendientes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectToAssociate = (listing: ProductListing) => {
    setSelectedListing(listing);
    setShowConfirm(true);
  };

  const handleConfirmAssociation = async () => {
    if (!product || !selectedListing) return;
    setIsSubmitting(true);
    try {
      await associateListing(product.id, selectedListing.id);
      setShowConfirm(false);
      setSelectedListing(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al asociar la publicación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  const filtered = unmatched.filter(item => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.originalName.toLowerCase().includes(q) ||
      item.storeName.toLowerCase().includes(q) ||
      item.externalId.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-400" />
                Asociar Publicación de Tienda a Producto Canónico
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Canónico: <strong className="text-slate-200">{product.name}</strong> ({product.brand} · {product.netWeightQuantity}{product.netWeightUnit})
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3 bg-slate-900/80 border-b border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por título original de la tienda, SKU o tienda..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto space-y-3 flex-1">
            {error && (
              <div className="p-3 bg-red-950/70 border border-red-800 rounded text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Cargando publicaciones disponibles de scrapers...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No se encontraron publicaciones sin asociar coincidentes.
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(listing => (
                  <div
                    key={listing.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-md hover:border-slate-700 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-300">{listing.storeName}</span>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono text-slate-400 text-[11px]">{listing.externalId}</span>
                        {listing.matchConfidence && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-blue-400 font-mono text-[11px]">
                              Sugerencia IA: {Math.round(listing.matchConfidence * 100)}%
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 font-medium truncate">
                        {listing.originalName}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>
                          Precio:{' '}
                          <strong className="text-slate-100 font-mono tabular-nums">
                            {formatMoney(listing.currentPriceArs, listing.currentPriceUsd)}
                          </strong>
                        </span>
                        {listing.observedWeightQuantity && (
                          <span>
                            Contenido detectado: {listing.observedWeightQuantity}{listing.observedWeightUnit}
                          </span>
                        )}
                        <a
                          href={listing.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline flex items-center gap-1"
                        >
                          Ver tienda <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectToAssociate(listing)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Asociar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>El matching manual es prioritario en el MVP para evitar emparejamientos erróneos.</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationModal
        isOpen={showConfirm}
        title="Confirmar asociación manual"
        message={`¿Deseas asociar la publicación "${selectedListing?.originalName}" de ${selectedListing?.storeName} al producto canónico "${product.name}"? Esta acción integrará sus precios al cálculo histórico.`}
        confirmLabel="Confirmar Asociación"
        cancelLabel="Cancelar"
        isLoading={isSubmitting}
        onConfirm={handleConfirmAssociation}
        onCancel={() => {
          setShowConfirm(false);
          setSelectedListing(null);
        }}
      />
    </>
  );
};
