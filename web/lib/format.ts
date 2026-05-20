const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatCop(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return cop.format(value);
}

export function matchPercent(score: number): number {
  return Math.round((1 - score) * 100);
}

export function truncate(text: string | null | undefined, max: number): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export function parseOptionalCop(input: string): number | undefined {
  const trimmed = input.replace(/\D/g, '');
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function daysUntil(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const end = new Date(iso);
  if (Number.isNaN(end.getTime())) return null;
  const diffMs = end.getTime() - Date.now();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return 'plazo vencido';
  if (days === 0) return 'vence hoy';
  if (days === 1) return 'vence mañana';
  return `vence en ${days} días`;
}

export function formatRelativeAge(seconds: number | null | undefined): string {
  if (seconds == null) return 'desconocido';
  if (seconds < 60) return 'hace menos de 1 min';
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
  return `hace ${Math.floor(seconds / 86400)} días`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
