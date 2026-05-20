import type { Summary } from '@/lib/types';

export function SummaryBlock({ summary }: { summary: Summary | null }) {
  if (!summary) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--color-surface-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
        Resumen no disponible aún. Las licitaciones nuevas se procesan en las próximas horas.
      </p>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-raised)] p-4">
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
          Resumen
        </h3>
        <p className="text-sm leading-relaxed">{summary.resumen}</p>
      </div>
      {summary.requisitos_clave.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Requisitos clave
          </h3>
          <ul className="list-inside list-disc space-y-1 text-sm">
            {summary.requisitos_clave.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      {summary.perfil_proveedor && (
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Perfil del proveedor
          </h3>
          <p className="text-sm">{summary.perfil_proveedor}</p>
        </div>
      )}
    </div>
  );
}
