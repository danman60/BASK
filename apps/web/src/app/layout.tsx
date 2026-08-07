import type { Metadata } from 'next';
import './globals.css';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Bask',
  description: 'Bask — salon operating system. Compass — dealer intelligence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
