import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { ApiDebugPanel } from '@/components/ApiDebugPanel';
import { ConvocaLogo } from '@/components/ConvocaLogo';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Convoca — Licitaciones SECOP II para PYMES',
  description:
    'Convoca: búsqueda semántica de licitaciones SECOP II, resúmenes automáticos y alertas por correo para PYMES en Colombia.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="antialiased">
        <header className="border-b border-[var(--c-border)] bg-[var(--c-bg-elevated)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="group flex items-center gap-3" aria-label="Convoca — inicio">
              <ConvocaLogo height={36} />
              <span className="hidden border-l border-[var(--c-border)] pl-3 text-xs text-[var(--c-fg-muted)] sm:block">
                Búsqueda semántica
                <br />
                Licitaciones SECOP II
              </span>
            </Link>
            <p className="hidden text-sm text-[var(--c-fg-muted)] sm:block">
              Colombia · SECOP II activas
            </p>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mt-12 border-t border-[var(--c-border)] py-6 text-center text-xs text-[var(--c-fg-muted)]">
          Convoca · Datos de SECOP II · Resúmenes generados con IA · No es un portal oficial del
          Estado
        </footer>
        <ApiDebugPanel />
      </body>
    </html>
  );
}
