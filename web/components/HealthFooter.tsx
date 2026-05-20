'use client';

import { useEffect, useState } from 'react';
import { getHealth } from '@/lib/api';
import { formatRelativeAge } from '@/lib/format';

export function HealthFooter() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    getHealth()
      .then((h) => {
        const age = h.checks.last_ingest_age_s;
        setLabel(`Datos actualizados ${formatRelativeAge(age)}`);
      })
      .catch(() => setLabel(null));
  }, []);

  if (!label) return null;

  return (
    <p className="mt-8 text-center text-xs text-[var(--color-text-muted)]">{label}</p>
  );
}
