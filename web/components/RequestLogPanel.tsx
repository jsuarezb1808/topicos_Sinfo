'use client';

import { useEffect, useState } from 'react';
import {
  clearApiRequestLog,
  formatLogDate,
  getApiRequestLog,
  subscribeApiRequestLog,
  type ApiRequestLogEntry,
} from '@/lib/api-request-log';

function JsonBlock({ label, data }: { label: string; data: unknown }) {
  return (
    <div className="mt-2">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>
      <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-[var(--color-surface)] p-2 text-[10px] leading-relaxed text-[var(--color-text)]">
        {data == null ? '—' : JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function LogEntry({ entry }: { entry: ApiRequestLogEntry }) {
  return (
    <li className="rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-[var(--color-accent-muted)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--color-accent)]">
          {entry.method}
        </span>
        <code className="text-xs text-[var(--color-text)]">{entry.path}</code>
        <span
          className={
            entry.ok
              ? 'rounded bg-[var(--c-success-soft)] px-1.5 py-0.5 text-[10px] text-[var(--c-success)]'
              : 'rounded bg-[var(--c-danger-soft)] px-1.5 py-0.5 text-[10px] text-[var(--c-danger)]'
          }
        >
          {entry.status || 'NET'}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] text-[var(--color-text-muted)]">
        {formatLogDate(entry.at)}
      </p>
      <p className="mt-0.5 truncate font-mono text-[10px] text-[var(--color-text-muted)]" title={entry.url}>
        {entry.url}
      </p>
      {entry.error && <p className="mt-1 text-xs text-[var(--c-danger)]">{entry.error}</p>}
      <JsonBlock label="Request" data={entry.request} />
      <JsonBlock label="Response" data={entry.response} />
    </li>
  );
}

/** Historial visible de peticiones al API (búsqueda y catálogo). */
export function RequestLogPanel() {
  const [log, setLog] = useState<readonly ApiRequestLogEntry[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setLog(getApiRequestLog());
    return subscribeApiRequestLog(() => setLog(getApiRequestLog()));
  }, []);

  return (
    <section className="mt-8 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-raised)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-surface-border)] px-4 py-3">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="text-left text-sm font-semibold text-[var(--color-accent)]"
        >
          Peticiones al backend {collapsed ? '▸' : '▾'} ({log.length})
        </button>
        <button
          type="button"
          onClick={() => clearApiRequestLog()}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          Limpiar historial
        </button>
      </div>

      {!collapsed && (
        <div className="p-4">
          {log.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Aún no hay peticiones. Al buscar verás aquí el POST a{' '}
              <code className="text-xs">/v1/search</code> con el cuerpo enviado y la respuesta del
              servidor.
            </p>
          ) : (
            <ul className="space-y-3">
              {log.map((entry) => (
                <LogEntry key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
