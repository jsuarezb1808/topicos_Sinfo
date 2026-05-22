'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiClientError, getFacets, getSectors, search } from '@/lib/api';
import type { AlertFormState, FacetsResponse, SearchFilters, SearchHit, Sector } from '@/lib/types';
import { parseOptionalCop } from '@/lib/format';
import { segmentLabel, segmentOptionLabel } from '@/lib/unspsc';
import { AlertModal } from './AlertModal';
import { HealthFooter } from './HealthFooter';
import { TenderCard } from './TenderCard';

const DEFAULT_QUERY = 'servicios para pymes';

const emptyFilters = (): SearchFilters => ({
  query: DEFAULT_QUERY,
  unspsc_segments: [],
  min_value: '',
  max_value: '',
  modalidad: '',
  departamento: '',
  top_k: 20,
});

export function SearchView() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [facets, setFacets] = useState<FacetsResponse | null>(null);
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const [items, setItems] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertInitial, setAlertInitial] = useState<AlertFormState>(() => toAlertForm(emptyFilters()));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([getSectors(), getFacets()])
      .then(([s, f]) => {
        setSectors(s.sectors);
        setFacets(f);
      })
      .catch(() => {
        setError('No se pudo cargar el catálogo. Revisa NEXT_PUBLIC_API_BASE.');
      });
  }, []);

  const runSearch = useCallback(async (f: SearchFilters) => {
    if (!f.query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await search({
        query: f.query.trim(),
        unspsc_segments: f.unspsc_segments.length ? f.unspsc_segments : undefined,
        min_value: parseOptionalCop(f.min_value),
        max_value: parseOptionalCop(f.max_value),
        modalidad: f.modalidad || undefined,
        top_k: f.top_k,
      });
      setItems(res.items);
      setSearched(true);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'RATE_LIMITED') {
        setError('Límite de búsquedas alcanzado. Espera un momento e intenta de nuevo.');
      } else {
        setError('Error al buscar. Verifica la API y tu conexión.');
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleSearch = useCallback(
    (next: SearchFilters) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runSearch(next), 350);
    },
    [runSearch],
  );

  const updateFilters = (patch: Partial<SearchFilters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      if (patch.query === undefined && searched) scheduleSearch(next);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch(filters);
  };

  const openAlert = (prefill?: Partial<SearchFilters>) => {
    const merged = { ...filters, ...prefill };
    setAlertInitial(toAlertForm(merged));
    setAlertOpen(true);
  };

  const toggleSegment = (seg: string) => {
    const next = filters.unspsc_segments.includes(seg)
      ? filters.unspsc_segments.filter((s) => s !== seg)
      : [...filters.unspsc_segments, seg];
    const updated = { ...filters, unspsc_segments: next };
    setFilters(updated);
    if (searched) scheduleSearch(updated);
  };

  const topSectors = useMemo(() => sectors.slice(0, 12), [sectors]);

  return (
    <>
      <section className="mb-10 text-center">
        <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Encuentra licitaciones SECOP para tu sector
        </h1>
        <p className="mx-auto max-w-xl text-sm text-[var(--color-text-muted)]">
          Búsqueda semántica pensada para PYMES: describe lo que ofreces, filtra por sector
          UNSPSC y recibe alertas por correo cuando aparezca un pliego relevante.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={filters.query}
            onChange={(e) => updateFilters({ query: e.target.value })}
            placeholder="Ej. mantenimiento de equipos de cómputo para entidades públicas"
            className="input flex-1 text-base"
            aria-label="Consulta de búsqueda"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[var(--color-accent)] px-6 py-2.5 font-medium text-[var(--c-primary-fg)] hover:bg-[var(--c-primary-hover)] disabled:opacity-50 sm:shrink-0"
          >
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
      </form>

      {!searched && topSectors.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-[var(--color-text-muted)]">
            Sectores con más licitaciones abiertas
          </h2>
          <div className="flex flex-wrap gap-2">
            {topSectors.map((s) => (
              <button
                key={s.segment}
                type="button"
                onClick={() => {
                  const next = {
                    ...filters,
                    unspsc_segments: [s.segment],
                  };
                  setFilters(next);
                  runSearch(next);
                }}
                className="rounded-full border border-[var(--color-surface-border)] px-3 py-1.5 text-xs hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                {segmentLabel(s.segment)} ({s.tender_count})
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-5 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-raised)] p-4 text-sm">
          <h2 className="font-semibold">Filtros</h2>

          <div>
            <p className="mb-2 text-xs text-[var(--color-text-muted)]">Sector (UNSPSC)</p>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {sectors.map((s) => (
                <label key={s.segment} className="flex cursor-pointer items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={filters.unspsc_segments.includes(s.segment)}
                    onChange={() => toggleSegment(s.segment)}
                  />
                  <span>{segmentOptionLabel(s.segment, s.tender_count)}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-[var(--color-text-muted)]">Modalidad</span>
            <select
              value={filters.modalidad}
              onChange={(e) => updateFilters({ modalidad: e.target.value })}
              className="input"
            >
              <option value="">Todas</option>
              {facets?.modalidad.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.value}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 gap-2">
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--color-text-muted)]">
                Valor mín. (COP)
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={filters.min_value}
                onChange={(e) => updateFilters({ min_value: e.target.value })}
                className="input"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--color-text-muted)]">
                Valor máx. (COP)
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={filters.max_value}
                onChange={(e) => updateFilters({ max_value: e.target.value })}
                className="input"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-[var(--color-text-muted)]">Resultados</span>
            <select
              value={filters.top_k}
              onChange={(e) => updateFilters({ top_k: Number(e.target.value) })}
              className="input"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => openAlert()}
            className="w-full rounded-lg border border-[var(--color-success)] py-2 text-sm text-[var(--color-success)] hover:bg-[var(--c-success-soft)]"
          >
            + Alerta con estos filtros
          </button>
        </aside>

        <section>
          {error && (
            <p className="mb-4 rounded-lg bg-[var(--c-danger-soft)] px-4 py-3 text-sm text-[var(--c-danger)]">{error}</p>
          )}

          {loading && (
            <p className="text-center text-sm text-[var(--color-text-muted)]">Buscando licitaciones…</p>
          )}

          {!loading && searched && items.length === 0 && (
            <div className="rounded-xl border border-dashed border-[var(--color-surface-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
              <p className="mb-2">No hay resultados con estos criterios.</p>
              <p>Prueba ampliar sectores, relajar el rango de valor o reformular la consulta.</p>
            </div>
          )}

          <ul className="space-y-4">
            {items.map((hit) => (
              <li key={hit.id}>
                <TenderCard hit={hit} onCreateAlert={() => openAlert({ query: filters.query })} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <HealthFooter />

      {facets && (
        <AlertModal
          open={alertOpen}
          onClose={() => setAlertOpen(false)}
          initial={alertInitial}
          sectors={sectors}
          facets={{
            modalidad: facets.modalidad,
            departamento: facets.departamento,
          }}
        />
      )}
    </>
  );
}

function toAlertForm(f: SearchFilters): AlertFormState {
  return {
    email: '',
    query: f.query,
    unspsc_segments: [...f.unspsc_segments],
    min_value: f.min_value,
    max_value: f.max_value,
    modalidad: f.modalidad,
    departamento: '',
    min_score: 0.55,
  };
}
