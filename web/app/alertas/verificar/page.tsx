'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ApiClientError, verifyAlert } from '@/lib/api';
import { stashAlertToken } from '@/lib/alert-token';
import type { Alert } from '@/lib/types';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [alert, setAlert] = useState<Alert | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!token) {
    return (
      <p className="text-[var(--color-text-muted)]">
        Falta el token en la URL. Abre el enlace completo desde tu correo.
      </p>
    );
  }

  const handleConfirm = async () => {
    setStatus('loading');
    setMessage(null);
    try {
      const res = await verifyAlert(token);
      stashAlertToken(res.alert.id, token);
      sessionStorage.setItem(`alert-preview:${res.alert.id}`, JSON.stringify(res.alert));
      setAlert(res.alert);
      setStatus('ok');
    } catch (err) {
      setStatus('error');
      if (err instanceof ApiClientError) {
        if (err.code === 'TOKEN_EXPIRED') {
          setMessage('Este enlace expiró (válido 24 horas). Crea una nueva alerta desde la búsqueda.');
        } else if (err.code === 'TOKEN_INVALID') {
          setMessage('El enlace no es válido. Solicita uno nuevo desde la búsqueda.');
        } else if (err.code === 'NOT_FOUND') {
          setMessage('No encontramos esta alerta. Quizá ya fue eliminada.');
        } else {
          setMessage(err.message);
        }
      } else {
        setMessage('No se pudo verificar la alerta.');
      }
    }
  };

  if (status === 'ok' && alert) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-green-950/40 p-4 text-green-300">
          Alerta confirmada para <strong>{alert.email}</strong>.
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">
          Consulta: «{alert.query}»
        </p>
        <button
          type="button"
          onClick={() => router.push(`/alertas/${encodeURIComponent(alert.id)}`)}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
        >
          Gestionar alerta
        </button>
        <Link href="/" className="block text-sm text-[var(--color-accent)] hover:underline">
          Ir a la búsqueda
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-muted)]">
        Confirma tu alerta por correo. El enlace es válido 24 horas.
      </p>
      {status === 'error' && message && (
        <p className="rounded-lg bg-red-950/40 p-4 text-sm text-red-300">{message}</p>
      )}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={status === 'loading'}
        className="rounded-lg bg-[var(--color-success)] px-6 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {status === 'loading' ? 'Confirmando…' : 'Confirmar mi alerta'}
      </button>
      <Link href="/" className="block text-sm text-[var(--color-accent)] hover:underline">
        Volver a la búsqueda
      </Link>
    </div>
  );
}

export default function VerifyAlertPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-xl font-bold">Confirmar alerta</h1>
      <Suspense fallback={<p className="text-[var(--color-text-muted)]">Cargando…</p>}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
