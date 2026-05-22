'use client';

import { useEffect, useState } from 'react';
import {
  clearGetLog,
  getGetRequestLog,
  isGetDebugEnabled,
  subscribeGetLog,
  type GetLogEntry,
} from '@/lib/api-get-log';

export function ApiDebugPanel() {
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<readonly GetLogEntry[]>([]);

  useEffect(() => {
    if (!isGetDebugEnabled()) return;
    setLog(getGetRequestLog());
    return subscribeGetLog(() => setLog(getGetRequestLog()));
  }, []);

  if (!isGetDebugEnabled()) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-md text-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-raised)] px-3 py-2 font-medium shadow-lg hover:border-[var(--color-accent)]"
      >
        API GET {open ? '▾' : '▸'} ({log.length})
      </button>

      {open && (
        <div className="mt-2 max-h-[min(50vh,400px)] overflow-hidden rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-raised)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--color-surface-border)] px-3 py-2">
            <span className="font-semibold text-[var(--color-accent)]">Respuestas GET</span>
            <button
              type="button"
              onClick={() => clearGetLog()}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Limpiar
            </button>
          </div>
          <ul className="max-h-[360px] overflow-y-auto">
            {log.length === 0 && (
              <li className="px-3 py-4 text-[var(--color-text-muted)]">
                Aún no hay peticiones GET. Recarga la página o navega.
              </li>
            )}
            {log.map((entry, i) => (
              <li
                key={`${entry.at}-${entry.path}-${i}`}
                className="border-b border-[var(--color-surface-border)] px-3 py-2 last:border-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      entry.ok
                        ? 'rounded bg-[var(--c-success-soft)] px-1.5 py-0.5 text-[var(--c-success)]'
                        : 'rounded bg-[var(--c-danger-soft)] px-1.5 py-0.5 text-[var(--c-danger)]'
                    }
                  >
                    {entry.status || 'NET'}
                  </span>
                  <code className="text-[var(--color-text)]">{entry.path}</code>
                </div>
                {entry.error && (
                  <p className="mt-1 text-[var(--c-danger)]">{entry.error}</p>
                )}
                <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-all rounded bg-[var(--color-surface)] p-2 text-[10px] text-[var(--color-text-muted)]">
                  {JSON.stringify(entry.body, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
