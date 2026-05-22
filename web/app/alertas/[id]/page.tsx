'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ApiClientError,
  deleteAlert,
  getFacets,
  getSectors,
  patchAlert,
} from '@/lib/api';
import { clearAlertToken, getAlertToken } from '@/lib/alert-token';
import type { Alert, AlertFormState, FacetsResponse, Sector } from '@/lib/types';
import { formatDate, formatRelativeAge, parseOptionalCop } from '@/lib/format';
import { segmentOptionLabel } from '@/lib/unspsc';

function alertToForm(alert: Alert): AlertFormState {
  return {
    email: alert.email,
    query: alert.query,
    unspsc_segments: alert.unspsc_segments ?? [],
    min_value: alert.min_value != null ? String(alert.min_value) : '',
    max_value: alert.max_value != null ? String(alert.max_value) : '',
    modalidad: alert.modalidad ?? '',
    departamento: alert.departamento ?? '',
    min_score: alert.min_score,
  };
}

function readCachedAlert(id: string): Alert | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(`alert-preview:${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Alert;
  } catch {
    return null;
  }
}

function lastSentLabel(iso: string | null): string {
  if (!iso) return 'Sin envíos aún';
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return 'Sin envíos aún';
  const seconds = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  return formatRelativeAge(seconds);
}

export default function ManageAlertPage() {
  const params = useParams();
  const router = useRouter();
  const id = decodeURIComponent(params.id as string);
  const [token, setToken] = useState<string | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [facets, setFacets] = useState<FacetsResponse | null>(null);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [form, setForm] = useState<AlertFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = getAlertToken(id);
    setToken(t);
    if (!t) {
      setLoading(false);
      setError('No tienes acceso a esta alerta. Abre el enlace de confirmación del correo.');
      return;
    }
    const cached = readCachedAlert(id);
    if (cached) {
      setAlert(cached);
      setForm(alertToForm(cached));
    }

    Promise.all([getSectors(), getFacets()])
      .then(([s, f]) => {
        setSectors(s.sectors);
        setFacets(f);
        if (!cached) {
          setError(
            'No hay datos de la alerta en este navegador. Vuelve a abrir el enlace del correo.',
          );
        }
      })
      .catch(() => setError('No se pudo cargar el formulario.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !form) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await patchAlert(id, token, {
        query: form.query,
        unspsc_segments: form.unspsc_segments,
        min_value: parseOptionalCop(form.min_value),
        max_value: parseOptionalCop(form.max_value),
        modalidad: form.modalidad || undefined,
        departamento: form.departamento || undefined,
        min_score: form.min_score,
      });
      sessionStorage.setItem(`alert-preview:${id}`, JSON.stringify(updated));
      setAlert(updated);
      setForm(alertToForm(updated));
      setMessage('Alerta actualizada.');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(
          err.code === 'TOKEN_EXPIRED' || err.code === 'TOKEN_INVALID'
            ? 'Tu enlace expiró. Crea una nueva alerta.'
            : err.message,
        );
      } else {
        setError('No se pudo guardar.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !confirm('¿Eliminar esta alerta?')) return;
    try {
      await deleteAlert(id, token);
      clearAlertToken(id);
      sessionStorage.removeItem(`alert-preview:${id}`);
      router.push('/');
    } catch {
      setError('No se pudo eliminar la alerta.');
    }
  };

  const toggleSegment = (seg: string) => {
    setForm((f) =>
      f
        ? {
            ...f,
            unspsc_segments: f.unspsc_segments.includes(seg)
              ? f.unspsc_segments.filter((s) => s !== seg)
              : [...f.unspsc_segments, seg],
          }
        : f,
    );
  };

  if (loading) {
    return <p className="text-[var(--color-text-muted)]">Cargando…</p>;
  }

  if (!token || (error && !form)) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <p className="text-[var(--c-danger)]">{error ?? 'Acceso denegado'}</p>
        <Link href="/" className="text-[var(--color-accent)] hover:underline">
          Ir a la búsqueda
        </Link>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          Confirma la alerta desde el correo para poder editarla aquí.
        </p>
        <Link href="/" className="text-[var(--color-accent)] hover:underline">
          Ir a la búsqueda
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href="/" className="text-sm text-[var(--color-accent)] hover:underline">
        ← Búsqueda
      </Link>
      <header className="space-y-2">
        <h1 className="text-xl font-bold">Gestionar alerta</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{form.email}</p>
      </header>

      {alert && (
        <dl className="grid gap-2 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-raised)] p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--color-text-muted)]">Estado</dt>
            <dd>
              <span
                className={
                  alert.verified
                    ? 'inline-flex items-center gap-1.5 rounded-full bg-[var(--c-success-soft)] px-2 py-0.5 text-xs font-medium text-[var(--c-success)]'
                    : 'inline-flex items-center gap-1.5 rounded-full bg-[var(--c-accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--c-accent-soft-fg)]'
                }
              >
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: alert.verified ? 'var(--c-success)' : 'var(--c-warning)',
                  }}
                />
                {alert.verified ? 'Verificada' : 'Sin verificar'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--color-text-muted)]">Creada</dt>
            <dd>{formatDate(alert.created_at)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-[var(--color-text-muted)]">Último envío</dt>
            <dd>{lastSentLabel(alert.last_sent_at)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-[var(--color-text-muted)]">ID de alerta</dt>
            <dd className="break-all font-mono text-xs text-[var(--color-text-muted)]">
              {alert.id}
            </dd>
          </div>
        </dl>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-sm">
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--color-text-muted)]">Consulta</span>
          <textarea
            required
            rows={3}
            value={form.query}
            onChange={(e) => setForm((f) => (f ? { ...f, query: e.target.value } : f))}
            className="input"
          />
        </label>

        <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-[var(--color-surface-border)] p-2">
          {sectors.map((s) => (
            <label key={s.segment} className="flex gap-2 text-xs">
              <input
                type="checkbox"
                checked={form.unspsc_segments.includes(s.segment)}
                onChange={() => toggleSegment(s.segment)}
              />
              {segmentOptionLabel(s.segment)}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Valor mín. COP"
            value={form.min_value}
            onChange={(e) => setForm((f) => (f ? { ...f, min_value: e.target.value } : f))}
            className="input"
          />
          <input
            type="text"
            placeholder="Valor máx. COP"
            value={form.max_value}
            onChange={(e) => setForm((f) => (f ? { ...f, max_value: e.target.value } : f))}
            className="input"
          />
        </div>

        {facets && (
          <>
            <select
              value={form.modalidad}
              onChange={(e) => setForm((f) => (f ? { ...f, modalidad: e.target.value } : f))}
              className="input"
            >
              <option value="">Todas las modalidades</option>
              {facets.modalidad.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.value}
                </option>
              ))}
            </select>
            <select
              value={form.departamento}
              onChange={(e) => setForm((f) => (f ? { ...f, departamento: e.target.value } : f))}
              className="input"
            >
              <option value="">Todos los departamentos</option>
              {facets.departamento.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.value}
                </option>
              ))}
            </select>
          </>
        )}

        <label className="block">
          <span className="mb-1 block text-xs text-[var(--color-text-muted)]">
            Umbral {Math.round(form.min_score * 100)}%
          </span>
          <input
            type="range"
            min={0.4}
            max={0.7}
            step={0.05}
            value={form.min_score}
            onChange={(e) =>
              setForm((f) => (f ? { ...f, min_score: Number(e.target.value) } : f))
            }
            className="w-full"
          />
        </label>

        {message && <p className="text-[var(--c-success)]">{message}</p>}
        {error && <p className="text-[var(--c-danger)]">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-[var(--color-accent)] py-2 font-medium text-[var(--c-primary-fg)] hover:bg-[var(--c-primary-hover)] disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>

      <button
        type="button"
        onClick={handleDelete}
        className="text-sm text-[var(--c-danger)] hover:underline"
      >
        Eliminar alerta
      </button>
    </div>
  );
}
