import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, Tag, TrendingUp } from 'lucide-react';
import { ShrinkflationStatus } from '../../types/shrinkflation';
import { PriceType } from '../../types/pricing';

interface ShrinkflationBadgeProps {
  status: ShrinkflationStatus;
  confidenceScore?: number;
}

export const ShrinkflationBadge: React.FC<ShrinkflationBadgeProps> = ({
  status,
  confidenceScore,
}) => {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-red-950/70 text-red-300 border border-red-800/80">
        <AlertTriangle className="w-3 h-3 text-red-400" />
        <span>Reduflación Confirmada</span>
      </span>
    );
  }

  if (status === 'suspected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-950/70 text-amber-300 border border-amber-800/80">
        <AlertTriangle className="w-3 h-3 text-amber-400" />
        <span>
          Sospecha ({confidenceScore ? `${Math.round(confidenceScore * 100)}%` : 'Estimada'})
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
      <HelpCircle className="w-3 h-3 text-slate-400" />
      <span>Sin Confirmar / Desconocido</span>
    </span>
  );
};

interface PriceTypeBadgeProps {
  type: PriceType;
  mechanic?: string;
}

export const PriceTypeBadge: React.FC<PriceTypeBadgeProps> = ({ type, mechanic }) => {
  if (type === 'promotional') {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800"
        title={mechanic ? `Promoción: ${mechanic}` : 'Precio promocional'}
      >
        <Tag className="w-3 h-3 text-emerald-400" />
        <span>{mechanic || 'Promoción'}</span>
      </span>
    );
  }

  if (type === 'regular_estimated') {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-purple-950/70 text-purple-300 border border-purple-800"
        title="Precio regular imputado o estimado por modelo de backend"
      >
        <span>Regular Estimado</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
      <span>Regular Observado</span>
    </span>
  );
};
