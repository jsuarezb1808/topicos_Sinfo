import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'SECOP — Búsqueda semántica para PYMES',
  description:
    'Buscador semántico de licitaciones SECOP II con resúmenes automáticos y alertas por correo.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">
        <header className="border-b border-[var(--color-surface-border)] bg-[var(--color-surface-raised)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="group flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)] text-sm font-bold text-white">
                S
              </span>
              <span>
                <span className="block text-sm font-semibold tracking-tight group-hover:text-[var(--color-accent)]">
                  SECOP PYMES
                </span>
                <span className="block text-xs text-[var(--color-text-muted)]">
                  Búsqueda semántica de licitaciones
                </span>
              </span>
            </Link>
            <p className="hidden text-sm text-[var(--color-text-muted)] sm:block">
              Colombia · SECOP II activas
            </p>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mt-12 border-t border-[var(--color-surface-border)] py-6 text-center text-xs text-[var(--color-text-muted)]">
          Datos de SECOP II · Resúmenes generados con IA · No es un portal oficial del Estado
        </footer>
      </body>
    </html>
  );
}
