import React, { useEffect, useState } from 'react';
import { Activity, CircleOff, Loader2 } from 'lucide-react';
import { getHealth, HealthResponse } from '../../services/healthService';
import { getIsMockMode, subscribeMockMode } from '../../services/apiClient';

type Status = 'checking' | 'online' | 'offline';

const POLL_MS = 30_000;

/**
 * Badge de estado del Backend: consulta GET /health periódicamente.
 * En modo mock muestra "Demo" sin consultar la API.
 */
export const ApiStatus: React.FC = () => {
  const [status, setStatus] = useState<Status>('checking');
  const [version, setVersion] = useState<string | null>(null);
  const [isMock, setIsMock] = useState<boolean>(getIsMockMode());

  useEffect(() => {
    const unsubscribe = subscribeMockMode(setIsMock);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isMock) return;

    let cancelado = false;

    const consultar = async () => {
      try {
        const health: HealthResponse = await getHealth();
        if (cancelado) return;
        setStatus(health.status === 'ok' ? 'online' : 'offline');
        setVersion(health.version ?? null);
      } catch {
        if (cancelado) return;
        setStatus('offline');
        setVersion(null);
      }
    };

    consultar();
    const id = setInterval(consultar, POLL_MS);
    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, [isMock]);

  if (isMock) {
    return (
      <span
        className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-xs rounded border bg-slate-900 border-slate-700 text-slate-400"
        title="Sin consulta al Backend: dataset demo local"
      >
        <CircleOff className="w-3.5 h-3.5" />
        <span>Sin API</span>
      </span>
    );
  }

  const enLinea = status === 'online';

  return (
    <span
      className={`hidden sm:flex items-center gap-1.5 px-2 py-1 text-xs rounded border ${
        status === 'checking'
          ? 'bg-slate-900 border-slate-700 text-slate-400'
          : enLinea
            ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300'
            : 'bg-red-950/60 border-red-800/80 text-red-300'
      }`}
      title={
        enLinea
          ? `Backend ${version ?? ''} respondiendo en /api/v1/health`
          : 'Backend no responde'
      }
    >
      {status === 'checking' ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Activity className="w-3.5 h-3.5" />
      )}
      <span>{status === 'checking' ? 'API…' : enLinea ? 'API OK' : 'API caída'}</span>
    </span>
  );
};
