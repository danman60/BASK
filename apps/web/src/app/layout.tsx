import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';

import { PresenterPanel } from '@/components/presenter/PresenterPanel';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Bask',
  description: 'Bask — salon operating system. Compass — dealer intelligence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
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
      </body>
    </html>
  );
}
