import Link from 'next/link';
import { ThemeToggle } from '@bask/ui';
import { GuidanceDemo } from './GuidanceDemo';
import { TokenGallery } from './TokenGallery';

export const metadata = {
  title: 'Design harness — Bask dev',
};

/**
 * M0 dev harness (plan steps 8–9). Not product UI: it exists to prove the token set,
 * the theme runtime and the guidance primitives are real and wired.
 */
export default function DesignHarnessPage() {
  return (
    <main className="dh-page">
      <div className="dh-shell">
        <header className="dh-head">
          <div>
            <p className="eyebrow">M0 · dev harness</p>
            <h1 className="dh-title">
              Design <em>system</em> harness
            </h1>
            <p className="dh-sub">
              Tokens, themes and the guidance layer. Every colour on this page is a CSS
              variable from <code className="dh-code">@bask/tokens</code>; switching the
              theme changes one attribute and the whole page follows.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="dh-links">
          <Link href="/compass/dev/tokens">Compass token proof →</Link>
        </div>

        <GuidanceDemo />
        <TokenGallery />
      </div>
    </main>
  );
}
