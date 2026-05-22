'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ApiClientError,
  createAlert,
  validationFieldErrors,
} from '@/lib/api';
import type { AlertFormState, Sector } from '@/lib/types';
import { parseOptionalCop } from '@/lib/format';
import { segmentOptionLabel } from '@/lib/unspsc';

type FacetLists = {
  modalidad: { value: string; count: number }[];
  departamento: { value: string; count: number }[];
};

export function AlertModal({
  open,
  onClose,
  initial,
  sectors,
  facets,
}: {
  open: boolean;
  onClose: () => void;
  initial: AlertFormState;
  sectors: Sector[];
  facets: FacetLists;
}) {
  const [form, setForm] = useState<AlertFormState>(initial);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setForm(initial);
    setFieldErrors({});
    setSent(false);
    setError(null);
    setLoading(false);
  }, [initial]);

  useEffect(() => {
    if (open) {
      setForm(initial);
      setSent(false);
      setError(null);
      setFieldErrors({});
    }
  }, [open, initial]);

  if (!open) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleSegment = (seg: string) => {
    setForm((f) => ({
      ...f,
      unspsc_segments: f.unspsc_segments.includes(seg)
        ? f.unspsc_segments.filter((s) => s !== seg)
        : [...f.unspsc_segments, seg],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      await createAlert({
        email: form.email,
        query: form.query,
        unspsc_segments:
          form.unspsc_segments.length > 0 ? form.unspsc_segments : undefined,
        min_value: parseOptionalCop(form.min_value),
        max_value: parseOptionalCop(form.max_value),
        modalidad: form.modalidad || undefined,
        departamento: form.departamento || undefined,
        min_score: form.min_score,
      });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === 'VALIDATION_ERROR') {
          setFieldErrors(validationFieldErrors(err.details));
        } else if (err.code === 'RATE_LIMITED') {
          setError('Demasiadas solicitudes. Intenta de nuevo en un momento.');
        } else {
          setError(err.message);
        }
      } else {
        setError('No se pudo crear la alerta. Verifica la conexión con la API.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_oklab,var(--c-niebla-900)_55%,transparent)] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-raised)] p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 id="alert-modal-title" className="text-lg font-semibold">
            Alerta por correo
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {sent ? (
          <div className="space-y-4 text-sm">
            <p className="rounded-lg bg-[var(--color-accent-muted)] p-4 text-[var(--color-accent)]">
              Revisa tu bandeja de entrada. Te enviamos un enlace para confirmar la alerta
              (válido 24 horas).
            </p>
            <p className="text-[var(--color-text-muted)]">
              No hay sesión: cada alerta se gestiona con el enlace del correo o desde esta
              aplicación tras confirmar.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-lg bg-[var(--color-accent)] py-2 text-sm font-medium text-[var(--c-primary-fg)] hover:bg-[var(--c-primary-hover)]"
            >
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <Field label="Correo" error={fieldErrors.email}>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="input"
                placeholder="tu@empresa.com"
              />
            </Field>

            <Field label="Consulta de búsqueda" error={fieldErrors.query}>
              <textarea
                required
                rows={3}
                value={form.query}
                onChange={(e) => setForm((f) => ({ ...f, query: e.target.value }))}
                className="input"
              />
            </Field>

            <Field label="Sectores (UNSPSC)">
              <div className="max-h-32 space-y-1 overflow-y-auto rounded border border-[var(--color-surface-border)] p-2">
                {sectors.map((s) => (
                  <label key={s.segment} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.unspsc_segments.includes(s.segment)}
                      onChange={() => toggleSegment(s.segment)}
                    />
                    <span className="text-xs">{segmentOptionLabel(s.segment, s.tender_count)}</span>
                  </label>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor mínimo (COP)" error={fieldErrors.min_value}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.min_value}
                  onChange={(e) => setForm((f) => ({ ...f, min_value: e.target.value }))}
                  className="input"
                  placeholder="10000000"
                />
              </Field>
              <Field label="Valor máximo (COP)" error={fieldErrors.max_value}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.max_value}
                  onChange={(e) => setForm((f) => ({ ...f, max_value: e.target.value }))}
                  className="input"
                  placeholder="200000000"
                />
              </Field>
            </div>

            <Field label="Modalidad">
              <select
                value={form.modalidad}
                onChange={(e) => setForm((f) => ({ ...f, modalidad: e.target.value }))}
                className="input"
              >
                <option value="">Todas</option>
                {facets.modalidad.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.value} ({m.count})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Departamento">
              <select
                value={form.departamento}
                onChange={(e) => setForm((f) => ({ ...f, departamento: e.target.value }))}
                className="input"
              >
                <option value="">Todos</option>
                {facets.departamento.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.value} ({d.count})
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label={`Umbral de coincidencia: ${Math.round(form.min_score * 100)}%`}
              hint="Más bajo = más resultados en el correo"
            >
              <input
                type="range"
                min={0.4}
                max={0.7}
                step={0.05}
                value={form.min_score}
                onChange={(e) =>
                  setForm((f) => ({ ...f, min_score: Number(e.target.value) }))
                }
                className="w-full"
              />
              <div className="mt-1 flex justify-between text-xs text-[var(--color-text-muted)]">
                <span>40% más resultados</span>
                <span>70% más estricto</span>
              </div>
            </Field>

            {error && (
              <p className="rounded bg-[var(--c-danger-soft)] px-3 py-2 text-[var(--c-danger)]">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--color-success)] py-2.5 font-medium text-[var(--c-fg-on-primary)] disabled:opacity-50"
            >
              {loading ? 'Enviando…' : 'Crear alerta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
        {label}
      </span>
      {children}
      {hint && <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">{hint}</span>}
      {error && <span className="mt-0.5 block text-xs text-[var(--c-danger)]">{error}</span>}
    </label>
  );
}
