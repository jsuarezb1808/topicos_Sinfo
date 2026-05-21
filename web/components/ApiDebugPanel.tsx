'use client';

import { useEffect, useState } from 'react';
import {
  clearApiRequestLog,
  formatLogDate,
  getApiRequestLog,
  isApiLogEnabled,
  subscribeApiRequestLog,
  type ApiRequestLogEntry,
} from '@/lib/api-request-log';

/** Panel flotante opcional (dev / NEXT_PUBLIC_API_DEBUG) en rutas fuera de búsqueda. */
export function ApiDebugPanel() {
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<readonly ApiRequestLogEntry[]>([]);

  useEffect(() => {
    if (!isApiLogEnabled()) return;
    setLog(getApiRequestLog());
    return subscribeApiRequestLog(() => setLog(getApiRequestLog()));
  }, []);

  if (!isApiLogEnabled()) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-sm text-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-raised)] px-3 py-2 font-medium shadow-lg"
      >
        API log {open ? '▾' : '▸'} ({log.length})
      </button>
      {open && (
        <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-raised)] p-2 shadow-xl">
          <button type="button" onClick={() => clearApiRequestLog()} className="mb-2 text-[var(--color-text-muted)]">
            Limpiar
          </button>
          {log.map((e) => (
            <div key={e.id} className="mb-2 border-b border-[var(--color-surface-border)] pb-2">
              <div>
                {e.method} {e.path} · {e.status}
              </div>
              <div className="text-[var(--color-text-muted)]">{formatLogDate(e.at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
