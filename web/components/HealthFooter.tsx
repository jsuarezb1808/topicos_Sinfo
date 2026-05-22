'use client';

import { useEffect, useState } from 'react';
import { getHealth } from '@/lib/api';
import type { HealthResponse } from '@/lib/types';
import { formatDate, formatRelativeAge } from '@/lib/format';

type ProbeStatus = string;

function statusColor(status: ProbeStatus | undefined): string {
  if (status === 'ok') return 'var(--c-success)';
  if (status === 'timeout') return 'var(--c-warning)';
  return 'var(--c-danger)';
}

function StatusDot({ status }: { status: ProbeStatus | undefined }) {
  return (
    <span
      aria-hidden
      className="inline-block h-2 w-2 rounded-full align-middle"
      style={{ background: statusColor(status) }}
    />
  );
}

function ProbeRow({
  label,
  status,
  latency,
}: {
  label: string;
  status: ProbeStatus | undefined;
  latency: number | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="flex items-center gap-2">
        <StatusDot status={status} />
        <span>{label}</span>
      </span>
      <span className="text-[var(--color-text-muted)]">
        {status ?? '—'}
        {latency != null && ` · ${latency} ms`}
      </span>
    </div>
  );
}

export function HealthFooter() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  if (!health) return null;

  const ingestLabel = formatRelativeAge(health.checks.last_ingest_age_s);
  const enrichLabel = formatRelativeAge(health.checks.last_enrich_age_s);

  return (
    <details className="mt-8 mx-auto max-w-md text-xs text-[var(--color-text-muted)]">
      <summary className="cursor-pointer list-none text-center hover:text-[var(--color-text)]">
        <StatusDot status={health.status === 'ok' ? 'ok' : 'fail'} />
        <span className="ml-2">
          Datos actualizados {ingestLabel} · estado {health.status} ({health.phase})
        </span>
      </summary>
      <div className="mt-3 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-raised)] p-3">
        <ProbeRow
          label="Turso"
          status={health.checks.turso.status}
          latency={health.checks.turso.latency_ms}
        />
        <ProbeRow
          label="Workers AI"
          status={health.checks.workers_ai.status}
          latency={health.checks.workers_ai.latency_ms}
        />
        <div className="mt-2 border-t border-[var(--color-surface-border)] pt-2 text-[11px]">
          <div className="flex justify-between gap-3 py-0.5">
            <span>Última ingesta</span>
            <span>{ingestLabel}</span>
          </div>
          <div className="flex justify-between gap-3 py-0.5">
            <span>Último resumen (enrich)</span>
            <span>{enrichLabel}</span>
          </div>
          <div className="flex justify-between gap-3 py-0.5">
            <span>Worker iniciado</span>
            <span>{formatDate(health.started_at)}</span>
          </div>
          <div className="flex justify-between gap-3 py-0.5">
            <span>Fase del despliegue</span>
            <span>{health.phase}</span>
          </div>
        </div>
      </div>
    </details>
  );
}
