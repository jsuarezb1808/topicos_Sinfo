'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ApiClientError, unsubscribeAlert } from '@/lib/api';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  if (!token) {
    return (
      <p className="text-[var(--color-text-muted)]">
        Falta el token en la URL. Usa el enlace del correo de resumen.
      </p>
    );
  }

  const handleUnsubscribe = async () => {
    setStatus('loading');
    try {
      await unsubscribeAlert(token);
      setStatus('ok');
    } catch (err) {
      setStatus('error');
      if (err instanceof ApiClientError) {
        setMessage(
          err.code === 'TOKEN_EXPIRED' || err.code === 'TOKEN_INVALID'
            ? 'El enlace ya no es válido.'
            : err.message,
        );
      } else {
        setMessage('No se pudo completar la desuscripción.');
      }
    }
  };

  if (status === 'ok') {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-[var(--c-success-soft)] p-4 text-[var(--c-success)]">
          Te desuscribimos de esta alerta. Ya no recibirás correos para esta búsqueda.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--c-primary-fg)] hover:bg-[var(--c-primary-hover)]"
        >
          Agregar otra alerta
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-muted)]">
        Dejarás de recibir correos cuando aparezcan licitaciones que coincidan con esta alerta.
      </p>
      {status === 'error' && message && (
        <p className="rounded-lg bg-[var(--c-danger-soft)] p-4 text-sm text-[var(--c-danger)]">{message}</p>
      )}
      <button
        type="button"
        onClick={handleUnsubscribe}
        disabled={status === 'loading'}
        className="rounded-lg bg-[var(--c-danger)] px-6 py-2.5 font-medium text-[var(--c-on-danger)] hover:opacity-90 disabled:opacity-50"
      >
        {status === 'loading' ? 'Procesando…' : 'Confirmar desuscripción'}
      </button>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-xl font-bold">Desuscribir alerta</h1>
      <Suspense fallback={<p className="text-[var(--color-text-muted)]">Cargando…</p>}>
        <UnsubscribeContent />
      </Suspense>
    </div>
  );
}
