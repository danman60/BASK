import type { ReactNode } from 'react';
import './design.css';

/**
 * Dev harness scope. ThemeProvider + ThemeScript moved to the ROOT layout when the
 * M0 lanes merged — themes are app-wide, and a provider mounted only under
 * /dev/design left every other route unthemed (and broke persistence across a
 * reload, because the pre-paint script never ran for the shell).
 */
export default function DesignHarnessLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
