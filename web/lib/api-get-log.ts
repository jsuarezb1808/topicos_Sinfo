export type GetLogEntry = {
  path: string;
  url: string;
  status: number;
  ok: boolean;
  at: string;
  body: unknown;
  error?: string;
};

const MAX_ENTRIES = 30;
const entries: GetLogEntry[] = [];
const listeners = new Set<() => void>();

export function isGetDebugEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_API_DEBUG === 'true'
  );
}

export function getGetRequestLog(): readonly GetLogEntry[] {
  return entries;
}

export function subscribeGetLog(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function pushGetLog(entry: GetLogEntry): void {
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;

  if (isGetDebugEnabled()) {
    const label = entry.ok ? 'OK' : 'FAIL';
    console.group(`[SECOP API GET] ${label} ${entry.path} → ${entry.status}`);
    console.log('URL:', entry.url);
    console.log('Time:', entry.at);
    if (entry.error) console.log('Error:', entry.error);
    console.log('Body:', entry.body);
    console.groupEnd();
  }

  listeners.forEach((fn) => fn());
}

export function clearGetLog(): void {
  entries.length = 0;
  listeners.forEach((fn) => fn());
}
