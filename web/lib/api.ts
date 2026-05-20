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
import { isGetDebugEnabled, pushGetLog } from './api-get-log';

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

function throwApiError(body: unknown, status: number): never {
  const err = body as ApiError;
  throw new ApiClientError(
    err.error?.code ?? 'INTERNAL',
    err.error?.message ?? `HTTP ${status}`,
    err.error?.details,
  );
}

/** GET requests with optional debug logging (console + in-app panel). */
async function fetchApiGet<T>(path: string): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const at = new Date().toISOString();

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (isGetDebugEnabled()) {
      pushGetLog({
        path,
        url,
        status: 0,
        ok: false,
        at,
        body: null,
        error: message,
      });
    }
    throw e;
  }

  const body = await readJsonBody(res);

  if (isGetDebugEnabled()) {
    pushGetLog({
      path,
      url,
      status: res.status,
      ok: res.ok,
      at,
      body,
    });
  }

  if (!res.ok) throwApiError(body, res.status);
  return body as T;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const body = await readJsonBody(res);
  if (!res.ok) throwApiError(body, res.status);
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
  return fetchApiGet<{ sectors: Sector[] }>('/v1/sectors');
}

export function getFacets() {
  return fetchApiGet<FacetsResponse>('/v1/facets');
}

export function getHealth() {
  return fetchApiGet<HealthResponse>('/v1/health');
}

export function search(body: SearchRequest) {
  return fetchApi<SearchResponse>('/v1/search', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getTender(id: string) {
  return fetchApiGet<Tender>(`/v1/tenders/${encodeURIComponent(id)}`);
}

export function createAlert(body: AlertCreateRequest) {
  return fetchApi<{ ok: true; message: string }>('/v1/alerts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function verifyAlert(token: string) {
  return fetchApiGet<{ ok: true; alert: Alert }>(
    `/v1/alerts/verify?token=${encodeURIComponent(token)}`,
  );
}

export function unsubscribeAlert(token: string) {
  return fetchApiGet<{ ok: true }>(
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
