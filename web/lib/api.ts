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
import { pushApiRequestLog } from './api-request-log';

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

async function readJsonBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { _parseError: true, _raw: text.slice(0, 2000) };
  }
}

function parseRequestBody(body: BodyInit | null | undefined): unknown | null {
  if (body == null) return null;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as unknown;
    } catch {
      return body;
    }
  }
  return { _note: 'non-JSON body' };
}

function throwApiError(body: unknown, status: number): never {
  const err = body as ApiError;
  throw new ApiClientError(
    err.error?.code ?? 'INTERNAL',
    err.error?.message ?? `HTTP ${status}`,
    err.error?.details,
  );
}

/** Todas las peticiones al backend: registra request, fecha y response. */
async function fetchLogged<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const url = `${baseUrl()}${path}`;
  const at = new Date().toISOString();
  const request = parseRequestBody(init?.body ?? null);

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      method,
      headers: {
        'content-type': 'application/json',
        ...init?.headers,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    pushApiRequestLog({
      method,
      path,
      url,
      request,
      response: null,
      status: 0,
      ok: false,
      at,
      error: message,
    });
    throw e;
  }

  const response = await readJsonBody(res);

  pushApiRequestLog({
    method,
    path,
    url,
    request,
    response,
    status: res.status,
    ok: res.ok,
    at,
  });

  if (!res.ok) throwApiError(response, res.status);
  return response as T;
}

export function getSectors() {
  return fetchLogged<{ sectors: Sector[] }>('/v1/sectors');
}

export function getFacets() {
  return fetchLogged<FacetsResponse>('/v1/facets');
}

export function getHealth() {
  return fetchLogged<HealthResponse>('/v1/health');
}

export function search(body: SearchRequest) {
  return fetchLogged<SearchResponse>('/v1/search', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getTender(id: string) {
  return fetchLogged<Tender>(`/v1/tenders/${encodeURIComponent(id)}`);
}

export function createAlert(body: AlertCreateRequest) {
  return fetchLogged<{ ok: true; message: string }>('/v1/alerts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function verifyAlert(token: string) {
  return fetchLogged<{ ok: true; alert: Alert }>(
    `/v1/alerts/verify?token=${encodeURIComponent(token)}`,
  );
}

export function unsubscribeAlert(token: string) {
  return fetchLogged<{ ok: true }>(
    `/v1/alerts/unsubscribe?token=${encodeURIComponent(token)}`,
  );
}

export function patchAlert(id: string, token: string, body: Partial<AlertCreateRequest>) {
  return fetchLogged<Alert>(
    `/v1/alerts/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
}

export function deleteAlert(id: string, token: string) {
  return fetchLogged<{ ok: true }>(
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
