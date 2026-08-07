import { Suspense, type ReactNode } from 'react';

import { CompassShell } from '@/components/compass/CompassShell';
import '../compass.css';

/**
 * Compass route-group layout.
 *
 * A ROUTE GROUP, not the `/compass` segment itself: `/compass/dev/tokens` is M0's
 * theme-pinning harness and owns its own layout. Putting the product shell in
 * `(app)` means it wraps the real surfaces and leaves the harness alone, without
 * changing a single URL.
 *
 * Stays a SERVER component so it can supply the Suspense boundary. `CompassShell`
 * and every Compass page read the demo role from `useSearchParams()`, which
 * without a boundary above them fails the build with a CSR-bailout error rather
 * than degrading quietly. One boundary here covers the shell and its children.
 */
export default function CompassLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <CompassShell>{children}</CompassShell>
    </Suspense>
  );
}
