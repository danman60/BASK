import type { Metadata } from 'next';
import './globals.css';
import '@bask/tokens/index.css';

export const metadata: Metadata = {
  title: 'Bask',
  description: 'Bask — salon operating system. Compass — dealer intelligence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
