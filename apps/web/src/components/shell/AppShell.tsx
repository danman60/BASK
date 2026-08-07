import { Suspense, type ReactNode } from 'react';

import { SHELL_UI } from '@bask/ui';

import { AppNav } from './AppNav';
import { SalonChip, type SalonIdentity } from './SalonChip';

/**
 * The Bask app shell (DESIGN_SPEC §3.1.1): sticky glass topbar carrying the
 * italic wordmark, the pill nav, the salon name and an avatar. **No sidebar** —
 * the nav is the whole app's chrome, and every Bask surface hangs off it.
 *
 * Server component: it renders once per route with the salon already resolved.
 * Only the nav is client-side, and it is behind Suspense because `useSearchParams`
 * would otherwise opt every page in this group into client rendering.
 */
export function AppShell({
  roster,
  fallback,
  children,
}: {
  roster: readonly SalonIdentity[];
  fallback: SalonIdentity;
  children: ReactNode;
}) {
  return (
    <>
      <a className="b-skip" href="#main">
        {SHELL_UI.skipToContent}
      </a>

      <header className="b-topbar glass">
        <span className="b-wordmark">{SHELL_UI.wordmark}</span>
        <Suspense fallback={<div className="b-nav" aria-hidden />}>
          <AppNav variant="pills" />
        </Suspense>
        <Suspense fallback={<div className="b-topbar-right" />}>
          <SalonChip roster={roster} fallback={fallback} />
        </Suspense>
      </header>

      <div id="main">{children}</div>

      {/* Outside the header on purpose — see the note in AppNav. */}
      <Suspense fallback={null}>
        <AppNav variant="tabs" />
      </Suspense>
    </>
  );
}
