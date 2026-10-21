import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded ${
                isDestructive
                  ? 'bg-red-950/80 text-red-400 border border-red-800'
                  : 'bg-blue-950/80 text-blue-400 border border-blue-800'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
            </div>
            <h3 id="confirmation-modal-title" className="text-sm font-semibold text-slate-100">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 text-xs text-slate-300 leading-relaxed">{message}</div>

        <div className="flex items-center justify-end gap-2 p-3 bg-slate-950/50 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-3 py-1.5 text-xs font-medium text-white rounded transition-colors flex items-center gap-1.5 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-blue-600 hover:bg-blue-500'
            } disabled:opacity-50`}
          >
            {isLoading && <span className="animate-spin mr-1">⌛</span>}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
