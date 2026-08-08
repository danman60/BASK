'use client';

import { useTheme } from '@bask/ui';

/**
 * Renders the live token set through the same class names the mockups use, so the
 * page IS the contrast check's visual counterpart: the audit proves the ratios, this
 * proves the tokens are actually wired and swap as one.
 */

const SURFACES = [
  { token: '--paper', label: 'Paper', note: 'page canvas' },
  { token: '--paper-2', label: 'Paper 2', note: 'inset / hover' },
  { token: '--card', label: 'Card', note: 'raised surface' },
  { token: '--line', label: 'Line', note: 'hairline' },
];

const INKS = [
  { token: '--ink', label: 'Ink', note: 'titles, values' },
  { token: '--ink-soft', label: 'Ink soft', note: 'prose, labels' },
  { token: '--ink-faint', label: 'Ink faint', note: 'ambient meta' },
];

const ACCENTS = [
  { token: '--primary', label: 'Primary', note: 'one accent' },
  { token: '--primary-deep', label: 'Primary deep', note: 'hover' },
  { token: '--gold', label: 'Gold', note: 'eyebrows only' },
  { token: '--success', label: 'Success', note: 'semantic' },
  { token: '--warn', label: 'Warn', note: 'semantic' },
  { token: '--risk', label: 'Risk', note: 'semantic' },
];

function Swatch({ token, label, note }: { token: string; label: string; note: string }) {
  return (
    <div className="dh-card dh-swatch">
      <div
        aria-hidden
        style={{
          height: 46,
          borderRadius: 'var(--radius-sm)',
          background: `var(${token})`,
          border: '1px solid var(--line)',
        }}
      />
      <div>
        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{label}</div>
        <div className="dh-meta">{note}</div>
        <div className="dh-code">{token}</div>
      </div>
    </div>
  );
}

export function TokenGallery() {
  const { theme, preference, isForced } = useTheme();

  return (
    <>
      <section className="dh-section">
        <header>
          <h2>Live state</h2>
          <p>
            What the cascade is painting right now versus what the salon chose. On a
            Compass route these two disagree — that is the proof the route wins.
          </p>
        </header>
        <div className="dh-card">
          <dl style={{ margin: 0 }}>
            <div className="dh-row">
              <dt>Painted theme (data-theme)</dt>
              <dd data-testid="active-theme">{theme}</dd>
            </div>
            <div className="dh-row">
              <dt>Salon preference (persisted)</dt>
              <dd data-testid="theme-preference">{preference}</dd>
            </div>
            <div className="dh-row">
              <dt>Pinned by route</dt>
              <dd data-testid="theme-forced">{isForced ? 'yes' : 'no'}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="dh-section">
        <header>
          <h2>Surfaces</h2>
          <p>Never pure white or black — warm paper and warm ink at every lightness.</p>
        </header>
        <div className="dh-grid">
          {SURFACES.map((s) => (
            <Swatch key={s.token} {...s} />
          ))}
        </div>
      </section>

      <section className="dh-section">
        <header>
          <h2>Ink</h2>
        </header>
        <div className="dh-grid">
          {INKS.map((s) => (
            <Swatch key={s.token} {...s} />
          ))}
        </div>
      </section>

      <section className="dh-section">
        <header>
          <h2>Accents</h2>
          <p>One accent per product. Gold is for eyebrows and membership, never buttons.</p>
        </header>
        <div className="dh-grid">
          {ACCENTS.map((s) => (
            <Swatch key={s.token} {...s} />
          ))}
        </div>
      </section>

      <section className="dh-section">
        <header>
          <h2>Chips and buttons</h2>
          <p>
            Chip labels use the <code className="dh-code">--*-on-wash</code> foregrounds so
            they clear AA on their own wash; the raw semantic colour stays for dots and
            rules.
          </p>
        </header>
        <div className="dh-card">
          <div className="dh-chipbar" style={{ marginBottom: 'var(--space-5)' }}>
            <span className="dh-status ready">Ready</span>
            <span className="dh-status clean">Cleaning</span>
            <span className="dh-status maint">Maintenance</span>
            <span className="dh-status impact num">+$1,240 / month</span>
          </div>
          <div className="dh-chipbar">
            <button type="button" className="btn btn-primary">
              Start session — KBL 6800 Alpha Pearl · 12 min
            </button>
            <button type="button" className="btn btn-quiet">
              Not now
            </button>
            <button type="button" className="btn btn-ghost">
              Skip
            </button>
          </div>
        </div>
      </section>

      <section className="dh-section">
        <header>
          <h2>Type scale and the signature ring</h2>
          <p>
            Fraunces display with exactly one italic emphasis word; Inter everywhere else.
            The session ring is the only perpetual animation in the product.
          </p>
        </header>
        <div className="dh-card">
          <p className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>
            Yesterday
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 'var(--text-xl)',
              letterSpacing: '-0.014em',
              marginBottom: 'var(--space-3)',
            }}
          >
            Yesterday finished{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--primary)' }}>8% above</em> your usual
            Thursday
          </p>
          <p style={{ color: 'var(--ink-soft)', fontSize: 'var(--text-sm)' }}>
            <strong>21% to 15%</strong> over three weeks — mostly on Tuesday and Thursday
            evening shifts.
          </p>
          <div className="dh-ring-demo" style={{ marginTop: 'var(--space-5)' }}>
            <div className="in-session-ring">
              <div
                style={{
                  background: 'var(--card)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-5) var(--space-8)',
                }}
              >
                <div style={{ fontWeight: 600 }}>KBL 6800 Alpha Pearl</div>
                <div className="dh-meta num">in session · 4:12 left</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
