/**
 * Compass component vocabulary (DESIGN_SPEC §4): `EvidenceTile`, `SuggestBlock`,
 * `StatusChip`, `StatRow`, plus the consent badge PRODUCT_SPEC §14 asks for on
 * every account.
 *
 * These live in `apps/web` rather than `@bask/ui` on purpose: the M1 merge
 * protocol gives Lane 1 ownership of `packages/ui`, and other lanes request
 * additions instead of editing it. They are written to the §4 names and prop
 * shapes so promoting them upward later is a file move, not a rewrite.
 *
 * All of them are presentational. They receive values that have already been
 * derived and consent-filtered by `@bask/core` — no component here decides what
 * a number means or whether a rep may see it.
 */

import type { CallStatus, EvidenceTile as EvidenceTileData, TrendDirection } from '@bask/core';
import type { CSSProperties, ReactNode } from 'react';

/* -------------------------------------------------------------- StatusChip */

const STATUS_CLASS: Record<CallStatus, string> = {
  needs_attention: 'cp-chip--watch',
  ready_to_grow: 'cp-chip--grow',
  order_in: 'cp-chip--order',
  steady: 'cp-chip--steady',
};

const STATUS_LABEL: Record<CallStatus, string> = {
  needs_attention: 'Needs attention',
  ready_to_grow: 'Ready to grow',
  order_in: 'Order in',
  steady: 'Steady',
};

export function StatusChip({ status }: { status: CallStatus }) {
  return <span className={`cp-chip ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}

/* ------------------------------------------------------------ EvidenceTile */

/**
 * "Reps get evidence, not adjectives" — a big tabular number coloured by
 * direction, with the caption that says what it measures. The 3-up row renders
 * whatever tiles it is given; a short row means the data was short, which is the
 * honest outcome (see `buildEvidenceTiles`).
 */
export function EvidenceTileRow({ tiles }: { tiles: EvidenceTileData[] }) {
  if (tiles.length === 0) return null;
  return (
    // The row is 3-up by design, but a short row fills the width rather than
    // leaving dead columns — a gap where a number should be reads as a bug.
    //
    // The count rides on a CUSTOM PROPERTY, never on `gridTemplateColumns`
    // directly. An inline `grid-template-columns` beats every stylesheet rule
    // including media queries, so the phone breakpoint in compass.css could not
    // collapse this row and each tile kept ~60px of content at 390px — long
    // enough to wrap "Needs attention" onto three lines and clip it. A custom
    // property is still inline, but the breakpoint overrides the real property
    // instead of the variable, so it wins.
    <div
      className="cp-ev"
      style={{ '--cp-ev-cols': Math.min(tiles.length, 3) } as CSSProperties}
    >
      {tiles.map((tile, index) => (
        <div className="cp-ev-item" key={`${tile.caption}-${index}`}>
          <div className={`n num ${tile.direction}`}>{tile.value}</div>
          <div className="k">{tile.caption}</div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- SuggestBlock */

/** Paper-2 block, 3px amber left border, bolded lead-in (DESIGN_SPEC §3.4). */
export function SuggestBlock({ lead, children }: { lead: string; children: ReactNode }) {
  return (
    <div className="cp-suggest">
      <b>{lead}</b> {children}
    </div>
  );
}

/* ----------------------------------------------------------------- StatRow */

export function StatRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="cp-statrow">
      <span className="l">{label}</span>
      <span className="v">{value}</span>
    </div>
  );
}

/* ----------------------------------------------------------- ConsentBadge */

const CONSENT_LABEL: Record<string, string> = {
  private: 'Private — name only',
  benchmarks: 'Benchmarks',
  coaching: 'Benchmarks + Coaching view',
};

/**
 * The consent tier, on screen, on the rep's side. PRODUCT_SPEC §14: "trust made
 * legible in the UVALUX-facing UI too" — a rep should be able to see why a
 * screen is thin before they wonder whether it is broken.
 */
export function ConsentBadge({ tier }: { tier: string }) {
  return (
    <span className={`cp-consent cp-consent--${tier}`} title="What this salon chose to share">
      {CONSENT_LABEL[tier] ?? tier}
    </span>
  );
}

/* --------------------------------------------------------------- TrendArrow */

const TREND_GLYPH: Record<TrendDirection, string> = {
  up: '↑',
  down: '↓',
  flat: '→',
  unknown: '·',
};

const TREND_TITLE: Record<TrendDirection, string> = {
  up: 'Trending up',
  down: 'Trending down',
  flat: 'Holding steady',
  unknown: 'Not shared',
};

export function TrendArrow({ direction }: { direction: TrendDirection | undefined }) {
  const value = direction ?? 'unknown';
  return (
    <span className={`cp-trend cp-trend--${value}`} title={TREND_TITLE[value]}>
      {TREND_GLYPH[value]}
    </span>
  );
}

/* ------------------------------------------------------------- band helpers */

export const BAND_LABEL: Record<string, string> = {
  thriving: 'Thriving',
  steady: 'Steady',
  needs_attention: 'Needs attention',
  unknown: 'Not shared',
};

export function BandDot({ band }: { band: string }) {
  return <span className={`cp-dot cp-dot--${band}`} aria-hidden="true" />;
}

/* -------------------------------------------------------------- EmptyState */

/**
 * Teaching empty state (IMPLEMENTATION_SPEC §3): says what will appear here and
 * why it is empty, never just "No data".
 */
export function CompassEmpty({ title, body }: { title: string; body: string }) {
  return (
    <div className="cp-empty">
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

/** The small trust/consequence lines — a first-class component (DESIGN_SPEC §4). */
export function Whisper({ children }: { children: ReactNode }) {
  return <p className="cp-note">{children}</p>;
}
