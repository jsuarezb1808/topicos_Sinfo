'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  ApiClientError,
  getFacets,
  getSectors,
  getTender,
} from '@/lib/api';
import type { AlertFormState, FacetsResponse, Sector, Tender } from '@/lib/types';
import { daysUntil, formatCop, formatDate } from '@/lib/format';
import { segmentLabel } from '@/lib/unspsc';
import { SummaryBlock } from '@/components/SummaryBlock';
import { AlertModal } from '@/components/AlertModal';

export default function TenderDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [facets, setFacets] = useState<FacetsResponse | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getTender(id)
      .then(setTender)
      .catch((err) => {
        if (err instanceof ApiClientError && err.code === 'NOT_FOUND') {
          setError('Licitación no encontrada. Puede haber cerrado o el listado está desactualizado.');
        } else {
          setError('No se pudo cargar la licitación.');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
    getSectors().then((s) => setSectors(s.sectors));
    getFacets().then(setFacets);
  }, [load]);

  const alertInitial: AlertFormState = {
    email: '',
    query: tender?.objeto ?? tender?.nombre ?? '',
    unspsc_segments: tender?.unspsc_segment ? [tender.unspsc_segment] : [],
    min_value: '',
    max_value: '',
    modalidad: tender?.modalidad ?? '',
    departamento: tender?.departamento ?? '',
    min_score: 0.55,
  };

  if (loading) {
    return <p className="text-[var(--color-text-muted)]">Cargando licitación…</p>;
  }

  if (error || !tender) {
    return (
      <div className="space-y-4">
        <p className="text-red-300">{error ?? 'Error desconocido'}</p>
        <Link href="/" className="text-[var(--color-accent)] hover:underline">
          ← Volver a la búsqueda
        </Link>
      </div>
    );
  }

  const deadline = daysUntil(tender.fecha_recepcion);

  return (
    <article className="space-y-6">
      <Link href="/" className="text-sm text-[var(--color-accent)] hover:underline">
        ← Búsqueda
      </Link>

      <header>
        <p className="text-sm text-[var(--color-text-muted)]">
          {tender.entidad ?? 'Entidad no informada'}
          {tender.departamento && ` · ${tender.departamento}`}
          {tender.ciudad && `, ${tender.ciudad}`}
        </p>
        <h1 className="mt-2 text-2xl font-bold">{tender.nombre ?? tender.id}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-lg bg-[var(--color-surface-raised)] px-3 py-1 font-medium">
            {formatCop(tender.precio_base)}
          </span>
          {deadline && (
            <span className="rounded-lg bg-[var(--color-accent-muted)] px-3 py-1 text-[var(--color-accent)]">
              {deadline}
            </span>
          )}
          {tender.modalidad && (
            <span className="rounded-lg bg-[var(--color-surface-raised)] px-3 py-1">
              {tender.modalidad}
            </span>
          )}
          {tender.unspsc_segment && (
            <span className="rounded-lg bg-[var(--color-surface-raised)] px-3 py-1">
              {segmentLabel(tender.unspsc_segment)}
            </span>
          )}
        </div>
      </header>

      <SummaryBlock summary={tender.summary} />

      {tender.objeto && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase text-[var(--color-text-muted)]">
            Objeto del contrato
          </h2>
          <p className="text-sm leading-relaxed">{tender.objeto}</p>
        </section>
      )}

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Detail label="Estado" value={tender.estado} />
        <Detail label="Fase" value={tender.fase} />
        <Detail label="Tipo de contrato" value={tender.tipo_contrato} />
        <Detail label="Publicación" value={formatDate(tender.fecha_publicacion)} />
        <Detail label="Última actualización" value={formatDate(tender.fecha_ultima)} />
        <Detail label="Cierre recepción" value={formatDate(tender.fecha_recepcion)} />
        <Detail label="UNSPSC" value={tender.unspsc} />
        <Detail label="NIT entidad" value={tender.nit_entidad} />
      </dl>

      <div className="flex flex-wrap gap-3 pt-2">
        {tender.url && (
          <a
            href={tender.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white"
          >
            Abrir en SECOP ↗
          </a>
        )}
        <button
          type="button"
          onClick={() => setAlertOpen(true)}
          className="rounded-lg border border-[var(--color-success)] px-5 py-2.5 text-sm text-[var(--color-success)]"
        >
          Crear alerta similar
        </button>
      </div>

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
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-raised)] px-3 py-2">
      <dt className="text-xs text-[var(--color-text-muted)]">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
