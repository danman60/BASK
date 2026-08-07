import type { ReactNode } from 'react';
import { ThemeProvider, ThemeScript } from '@bask/ui';
import './design.css';

/**
 * Dev harness scope. The provider lives here rather than in the root layout so lane A
 * owns the app shell uninterrupted; the root layout carries only the global tokens
 * stylesheet import.
 */
export default function DesignHarnessLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ThemeScript />
      <ThemeProvider>{children}</ThemeProvider>
    </>
  );
}
