const PREFIX = 'alert-token:';

export function stashAlertToken(alertId: string, token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${PREFIX}${alertId}`, token);
}

export function getAlertToken(alertId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`${PREFIX}${alertId}`);
}

export function clearAlertToken(alertId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${PREFIX}${alertId}`);
}
