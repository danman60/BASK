import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { Suspense } from 'react';
import '@bask/tokens/index.css';
import './globals.css';

/* DESIGN_SPEC §2.2: Fraunces (display — Daybreak narrative, screen titles) +
 * Inter (body/UI). Self-hosted via next/font so the demo survives a dead network
 * — a pitch that falls back to Georgia mid-sentence is a pitch that looks broken. */
// Both load as variable fonts (weight: 'variable') — next/font rejects `axes`
// alongside a fixed weight list, and the design uses a range of weights anyway.
const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
  weight: 'variable',
  variable: '--font-fraunces',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-inter',
  display: 'swap',
});

import { ThemeProvider, ThemeScript } from '@bask/ui';
import '@bask/ui/guidance.css';

import { PresenterPanel } from '@/components/presenter/PresenterPanel';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Bask',
  description: 'Bask — salon operating system. Compass — dealer intelligence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* suppressHydrationWarning: ThemeScript stamps data-theme on <html> before
       React hydrates, so the server markup deliberately differs by that one
       attribute. Standard fix, scoped to this element — it hides nothing inside
       the tree. */
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Must run before first paint so a Dusk salon never sees a white flash.
            Lives at the root, not in a route layout: themes are an app-wide
            concern and a nested script only runs after the shell has painted. */}
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>
          <Providers>
            {children}
            {/*
            Presenter Panel lives at the root so every route — including ones other
            lanes add — gets the hotkey. Suspense because it reads the URL's demo
            scope via useSearchParams, which would otherwise opt every prerendered
            page into client-side rendering.
          */}
            <Suspense fallback={null}>
              <PresenterPanel />
            </Suspense>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
