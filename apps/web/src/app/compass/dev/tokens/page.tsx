import Link from 'next/link';
import { ThemeToggle } from '@bask/ui';
import { TokenGallery } from '../../../dev/design/TokenGallery';

export const metadata = {
  title: 'Compass token proof — Bask dev',
};

/**
 * The Compass half of the step-8 acceptance check: the SAME gallery component as
 * /dev/design, rendering Compass tokens because the route pins the theme. Nothing in
 * TokenGallery knows which product it is in — if this page looks like Compass, the
 * token mapping is doing the work rather than component-level branching.
 */
export default function CompassTokenProofPage() {
  return (
    <main className="dh-page">
      <div className="dh-shell">
        <header className="dh-head">
          <div>
            <p className="eyebrow">UVALUX · Compass</p>
            <h1 className="dh-title">
              Compass tokens, <em>pinned</em> by route
            </h1>
            <p className="dh-sub">
              Same component tree as the Bask harness. The salon&rsquo;s Sunset or Dusk
              choice is still stored and still shown below — it just does not apply here.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="dh-banner">
          <span>Theme is fixed for every Compass surface. The switch is disabled on purpose.</span>
          <Link href="/dev/design" style={{ color: 'inherit', textDecoration: 'underline' }}>
            ← Back to the Bask harness
          </Link>
        </div>

        <TokenGallery />
      </div>
    </main>
  );
}
