import type {
  Alert,
  AlertCreateRequest,
  ApiError,
  FacetsResponse,
  HealthResponse,
  SearchRequest,
  SearchResponse,
  Sector,
  Tender,
} from './types';

function baseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE;
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_BASE no está configurada');
  }
  return url.replace(/\/$/, '');
}

export class ApiClientError extends Error {
  constructor(
    public readonly code: ApiError['error']['code'],
    message: string,
    public readonly details?: ApiError['error']['details'],
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok) {
    const err = body as ApiError;
    throw new ApiClientError(
      err.error?.code ?? 'INTERNAL',
      err.error?.message ?? 'Error desconocido',
      err.error?.details,
    );
  }
  return body as T;
}

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
  });
  return parseResponse<T>(res);
}

export function getSectors() {
  return fetchApi<{ sectors: Sector[] }>('/v1/sectors');
}

export function getFacets() {
  return fetchApi<FacetsResponse>('/v1/facets');
}

export function getHealth() {
  return fetchApi<HealthResponse>('/v1/health');
}

export function search(body: SearchRequest) {
  return fetchApi<SearchResponse>('/v1/search', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getTender(id: string) {
  return fetchApi<Tender>(`/v1/tenders/${encodeURIComponent(id)}`);
}

export function createAlert(body: AlertCreateRequest) {
  return fetchApi<{ ok: true; message: string }>('/v1/alerts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function verifyAlert(token: string) {
  return fetchApi<{ ok: true; alert: Alert }>(
    `/v1/alerts/verify?token=${encodeURIComponent(token)}`,
  );
}

export function unsubscribeAlert(token: string) {
  return fetchApi<{ ok: true }>(
    `/v1/alerts/unsubscribe?token=${encodeURIComponent(token)}`,
  );
}

export function patchAlert(id: string, token: string, body: Partial<AlertCreateRequest>) {
  return fetchApi<Alert>(
    `/v1/alerts/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
}

export function deleteAlert(id: string, token: string) {
  return fetchApi<{ ok: true }>(
    `/v1/alerts/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`,
    { method: 'DELETE' },
  );
}

export function validationFieldErrors(
  details?: ApiError['error']['details'],
): Record<string, string> {
  const issues = details?.issues;
  if (!issues?.length) return {};
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0]?.toString() ?? '_form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
