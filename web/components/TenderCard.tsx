import Link from 'next/link';
import type { SearchHit } from '@/lib/types';
import { daysUntil, formatCop, matchPercent, truncate } from '@/lib/format';
import { segmentLabel } from '@/lib/unspsc';
import { SummaryBlock } from './SummaryBlock';

export function TenderCard({
  hit,
  onCreateAlert,
}: {
  hit: SearchHit;
  onCreateAlert: () => void;
}) {
  const pct = matchPercent(hit.score);
  const deadline = daysUntil(hit.fecha_recepcion);

  return (
    <article className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-raised)] p-5 shadow-sm transition hover:border-[var(--color-accent)]/40">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--color-text-muted)]">
            {hit.entidad ?? 'Entidad no informada'}
            {hit.departamento && ` · ${hit.departamento}`}
            {hit.ciudad && `, ${hit.ciudad}`}
          </p>
          <h2 className="mt-1 text-base font-semibold leading-snug">
            {hit.nombre ?? hit.id}
          </h2>
        </div>
        <span
          className="shrink-0 rounded-full bg-[var(--color-accent-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-accent)]"
          title="Coincidencia semántica"
        >
          {pct}% coincidencia
        </span>
      </div>

      <p className="mb-3 text-sm text-[var(--color-text-muted)]">
        {truncate(hit.objeto, 220) || 'Sin objeto definido'}
      </p>

      <div className="mb-4 flex flex-wrap gap-3 text-xs">
        <span className="rounded bg-[var(--color-surface)] px-2 py-1">
          {formatCop(hit.precio_base)}
        </span>
        {hit.modalidad && (
          <span className="rounded bg-[var(--color-surface)] px-2 py-1">{hit.modalidad}</span>
        )}
        {hit.unspsc_segment && (
          <span className="rounded bg-[var(--color-surface)] px-2 py-1" title={hit.unspsc ?? ''}>
            {segmentLabel(hit.unspsc_segment)}
          </span>
        )}
        {deadline && (
          <span
            className={`rounded px-2 py-1 ${
              deadline.includes('vencido')
                ? 'bg-red-950 text-red-300'
                : 'bg-[var(--color-surface)] text-[var(--color-warning)]'
            }`}
          >
            {deadline}
          </span>
        )}
      </div>

      {hit.summary && (
        <div className="mb-4">
          <SummaryBlock summary={hit.summary} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/licitaciones/${encodeURIComponent(hit.id)}`}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Ver detalle
        </Link>
        <button
          type="button"
          onClick={onCreateAlert}
          className="rounded-lg border border-[var(--color-surface-border)] px-4 py-2 text-sm hover:bg-[var(--color-surface)]"
        >
          Crear alerta
        </button>
        {hit.url && (
          <a
            href={hit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
          >
            SECOP ↗
          </a>
        )}
      </div>
    </article>
  );
}
