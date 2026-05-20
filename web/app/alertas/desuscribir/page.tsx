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
        <p className="rounded-lg bg-green-950/40 p-4 text-green-300">
          Te desuscribimos de esta alerta. Ya no recibirás correos para esta búsqueda.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
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
        <p className="rounded-lg bg-red-950/40 p-4 text-sm text-red-300">{message}</p>
      )}
      <button
        type="button"
        onClick={handleUnsubscribe}
        disabled={status === 'loading'}
        className="rounded-lg bg-red-700 px-6 py-2.5 font-medium text-white disabled:opacity-50"
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
