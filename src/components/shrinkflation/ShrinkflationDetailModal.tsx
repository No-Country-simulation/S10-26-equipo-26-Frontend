import React, { useState } from 'react';
import { ShrinkflationAlert, ShrinkflationStatus } from '../../types/shrinkflation';
import { updateAlertStatus } from '../../services/shrinkflationService';
import { useCurrency } from '../../context/CurrencyContext';
import { ShrinkflationBadge } from '../common/StatusIndicator';
import {
  X,
  AlertTriangle,
  Scale,
  DollarSign,
  TrendingUp,
  FileSearch,
  ExternalLink,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface ShrinkflationDetailModalProps {
  alert: ShrinkflationAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const ShrinkflationDetailModal: React.FC<ShrinkflationDetailModalProps> = ({
  alert,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { formatMoney, formatUnitRate } = useCurrency();
  const [selectedStatus, setSelectedStatus] = useState<ShrinkflationStatus>(
    alert?.status || 'suspected'
  );
  const [auditNotes, setAuditNotes] = useState(alert?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen || !alert) return null;

  const handleSaveStatus = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateAlertStatus(alert.id, selectedStatus, auditNotes);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      onUpdated();
    } catch (err) {
      console.error('Error updating shrinkflation status', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShrinkflationBadge status={alert.status} confidenceScore={alert.confidenceScore} />
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400">{alert.category}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400 font-medium">{alert.brand}</span>
            </div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Auditoría de Evidencia: {alert.canonicalProductName}
            </h2>
            <p className="text-xs text-slate-400">
              Detectado:{' '}
              {new Date(alert.detectedAt).toLocaleString('es-AR', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
              {alert.confirmedAt && (
                <>
                  {' '}· Confirmado:{' '}
                  {new Date(alert.confirmedAt).toLocaleDateString('es-AR')}
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Executive Impact Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Reducción de Contenido</span>
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-red-400">
                {alert.weightChangePercentage > 0 ? `+${alert.weightChangePercentage}%` : `${alert.weightChangePercentage}%`}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <span>{alert.originalWeightQuantity}{alert.originalWeightUnit}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="font-semibold text-slate-200">{alert.newWeightQuantity}{alert.newWeightUnit}</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <span>Variación Precio Facial</span>
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-200">
                +{alert.nominalPriceChangePercentage.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {formatMoney(alert.nominalPriceBeforeArs)} →{' '}
                <span className="font-semibold text-slate-200">{formatMoney(alert.nominalPriceAfterArs)}</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-red-900/60 rounded-lg">
              <div className="flex items-center gap-1.5 text-red-400 mb-1 font-semibold">
                <TrendingUp className="w-4 h-4 text-red-400" />
                <span>Inflación Real Encubierta</span>
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-red-400">
                +{alert.effectiveUnitInflationPercentage.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Calculado sobre precio unitario estándar ($/kg o $/L)
              </div>
            </div>
          </div>

          {/* Unit Price Impact Analysis */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wide text-[11px]">
              Impacto en Precio Unitario Estándar
            </h4>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-slate-500 block text-[11px]">Precio base por unidad:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-300 text-sm">
                  {formatUnitRate(alert.unitPriceBeforeArs, alert.unitPriceBeforeUsd, alert.originalWeightUnit === 'ml' ? 'L' : 'kg')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Nuevo precio por unidad:</span>
                <span className="font-mono tabular-nums font-bold text-red-400 text-sm">
                  {formatUnitRate(alert.unitPriceAfterArs, alert.unitPriceAfterUsd, alert.newWeightUnit === 'ml' ? 'L' : 'kg')}
                </span>
              </div>
            </div>
          </div>

          {/* Evidence Comparison Table */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
              <FileSearch className="w-4 h-4 text-blue-400" />
              Evidencia Registrada por Scrapers
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Baseline Evidence */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="font-semibold text-slate-300">1. Registro de Línea Base</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(alert.evidenceBaseline.timestamp).toLocaleDateString('es-AR')}
                  </span>
                </div>
                <div className="text-slate-400 space-y-1">
                  <div>Tienda: <strong className="text-slate-200">{alert.evidenceBaseline.sourceStore}</strong></div>
                  <div>Peso informado: <strong className="text-slate-200">{alert.evidenceBaseline.weightDeclaredQuantity}{alert.evidenceBaseline.weightDeclaredUnit}</strong></div>
                  <div>Precio observado: <strong className="text-slate-200 font-mono">{formatMoney(alert.evidenceBaseline.observedPriceArs)}</strong></div>
                </div>
                {alert.evidenceBaseline.extractedTextSnippet && (
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-400 font-mono italic">
                    "{alert.evidenceBaseline.extractedTextSnippet}"
                  </div>
                )}
                <a
                  href={alert.evidenceBaseline.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline inline-flex items-center gap-1 text-[11px] pt-1"
                >
                  Ver URL original de línea base <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Current Evidence */}
              <div className="p-3.5 bg-slate-950 border border-amber-900/60 rounded-lg space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="font-semibold text-amber-300">2. Registro Actual con Reducción</span>
                  <span className="text-[11px] text-amber-500 font-mono">
                    {new Date(alert.evidenceCurrent.timestamp).toLocaleDateString('es-AR')}
                  </span>
                </div>
                <div className="text-slate-400 space-y-1">
                  <div>Tienda: <strong className="text-slate-200">{alert.evidenceCurrent.sourceStore}</strong></div>
                  <div>Peso informado: <strong className="text-red-400 font-semibold">{alert.evidenceCurrent.weightDeclaredQuantity}{alert.evidenceCurrent.weightDeclaredUnit}</strong></div>
                  <div>Precio observado: <strong className="text-slate-200 font-mono">{formatMoney(alert.evidenceCurrent.observedPriceArs)}</strong></div>
                </div>
                {alert.evidenceCurrent.extractedTextSnippet && (
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-400 font-mono italic">
                    "{alert.evidenceCurrent.extractedTextSnippet}"
                  </div>
                )}
                <a
                  href={alert.evidenceCurrent.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline inline-flex items-center gap-1 text-[11px] pt-1"
                >
                  Ver URL actual de tienda <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Verification Audit Controls */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wide text-[11px]">
              Dictamen y Clasificación de Auditoría
            </h4>
            <p className="text-slate-400 text-[11px]">
              La reduflación no debe afirmarse sin respaldo verificable. Distingue datos confirmados de sospechas o inconsistencias de datos.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedStatus('confirmed')}
                className={`px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5 ${
                  selectedStatus === 'confirmed'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Confirmada con Evidencia
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('suspected')}
                className={`px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5 ${
                  selectedStatus === 'suspected'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Sospecha / En Revisión
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('unknown')}
                className={`px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5 ${
                  selectedStatus === 'unknown'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Desconocida / Sin Confirmar
              </button>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-[11px] text-slate-400 block">Notas de auditoría y respaldo:</label>
              <textarea
                rows={2}
                value={auditNotes}
                onChange={e => setAuditNotes(e.target.value)}
                placeholder="Detalla observaciones sobre el empaque, lote, o confirmación del fabricante..."
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                {saveSuccess ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Dictamen guardado correctamente
                  </span>
                ) : (
                  'Los cambios impactan el reporte B2B del Backend.'
                )}
              </span>

              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={isSaving}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar Dictamen'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
