export type Summary = {
  resumen: string;
  requisitos_clave: string[];
  perfil_proveedor: string;
};

export type Tender = {
  id: string;
  entidad: string | null;
  nit_entidad: string | null;
  departamento: string | null;
  ciudad: string | null;
  objeto: string | null;
  nombre: string | null;
  unspsc: string | null;
  unspsc_segment: string | null;
  modalidad: string | null;
  tipo_contrato: string | null;
  subtipo_contrato: string | null;
  precio_base: number | null;
  estado: string | null;
  fase: string | null;
  fecha_publicacion: string | null;
  fecha_ultima: string | null;
  fecha_recepcion: string | null;
  url: string | null;
  summary: Summary | null;
};

export type SearchHit = Tender & { score: number };

export type SearchRequest = {
  query: string;
  unspsc_segments?: string[];
  min_value?: number;
  max_value?: number;
  modalidad?: string;
  top_k?: number;
};

export type SearchResponse = {
  items: SearchHit[];
  next_cursor: string | null;
};

export type Sector = {
  segment: string;
  tender_count: number;
};

export type FacetsResponse = {
  modalidad: { value: string; count: number }[];
  estado: { value: string; count: number }[];
  departamento: { value: string; count: number }[];
};

export type HealthResponse = {
  status: 'ok' | 'degraded';
  phase: string;
  started_at: string;
  checks: {
    turso: { status: string; latency_ms: number | null };
    workers_ai: { status: string; latency_ms: number | null };
    last_ingest_age_s: number | null;
    last_enrich_age_s: number | null;
  };
};

export type Alert = {
  id: string;
  email: string;
  query: string;
  unspsc_segments: string[] | null;
  min_value: number | null;
  max_value: number | null;
  modalidad: string | null;
  departamento: string | null;
  min_score: number;
  verified: boolean;
  last_sent_at: string | null;
  created_at: string;
};

export type AlertCreateRequest = {
  email: string;
  query: string;
  unspsc_segments?: string[];
  min_value?: number;
  max_value?: number;
  modalidad?: string;
  departamento?: string;
  min_score?: number;
};

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'INTERNAL';

export type ApiError = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: {
      issues?: { path: (string | number)[]; message: string }[];
    };
  };
};

export type SearchFilters = {
  query: string;
  unspsc_segments: string[];
  min_value: string;
  max_value: string;
  modalidad: string;
  departamento: string;
  top_k: number;
};

export type AlertFormState = {
  email: string;
  query: string;
  unspsc_segments: string[];
  min_value: string;
  max_value: string;
  modalidad: string;
  departamento: string;
  min_score: number;
};
