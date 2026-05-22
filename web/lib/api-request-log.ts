export type ApiRequestLogEntry = {
  id: string;
  method: string;
  path: string;
  url: string;
  request: unknown | null;
  response: unknown | null;
  status: number;
  ok: boolean;
  at: string;
  error?: string;
};

const MAX_ENTRIES = 50;
const entries: ApiRequestLogEntry[] = [];
const listeners = new Set<() => void>();

export function isApiLogEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_API_DEBUG === 'true'
  );
}

export function getApiRequestLog(): readonly ApiRequestLogEntry[] {
  return entries;
}

export function subscribeApiRequestLog(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  listeners.forEach((fn) => fn());
}

export function pushApiRequestLog(
  entry: Omit<ApiRequestLogEntry, 'id'>,
): ApiRequestLogEntry {
  const full: ApiRequestLogEntry = {
    ...entry,
    id: crypto.randomUUID(),
  };
  entries.unshift(full);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;

  if (isApiLogEnabled()) {
    const label = full.ok ? 'OK' : 'FAIL';
    console.group(`[SECOP API] ${label} ${full.method} ${full.path} → ${full.status}`);
    console.log('Fecha:', full.at);
    console.log('URL:', full.url);
    if (full.request != null) console.log('Request:', full.request);
    if (full.error) console.log('Error:', full.error);
    console.log('Response:', full.response);
    console.groupEnd();
  }

  notify();
  return full;
}

/** Limpia el historial (p. ej. al iniciar una nueva búsqueda). */
export function clearApiRequestLog(): void {
  entries.length = 0;
  notify();
}

export function formatLogDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'medium',
    });
  } catch {
    return iso;
  }
}
