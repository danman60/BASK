# usage: MetricTile (restyle to exemplar vocabulary)

## What to build

This component already exists and its LOGIC IS CORRECT — do not change what it renders or computes. It fails the design-system lint because it invented its own class names. Rewrite ONLY the className strings so it uses the project's real vocabulary and nothing else. The complete list of allowed tokens is: cp-statrow (with inner 'l' and 'v' spans), cp-chip plus exactly four modifiers cp-chip--steady cp-chip--watch cp-chip--grow cp-chip--order, cp-dot, cp-note, cp-empty, cp-ev, cp-ev-item, cp-suggest, cp-trend, cp-consent. Keep the same DOM structure where you can; where an invented class has no equivalent, drop the class rather than substituting a made-up one — an unstyled div is correct, an invented token is not. Change no imports, no props, no logic.

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/apps/web/src/components/compass/usage/MetricTile.tsx`

## The API surface you may use

Everything below is REAL and already exists. Import from `@bask/core`.
Do NOT invent names, keys or props that are not in this list — inventing a key
on the shared style object is the single most common way this task fails.

```ts
CONTRACT API SURFACE — `@/lib/contract` exports EXACTLY these. Nothing else exists.
Do NOT reference any symbol or object key that is not on this list.

functions:
  formatTimecode(seconds: number): string
  claimConfidence(claim: Pick<Claim, 'distinctEvents' | 'provenance'>): number
  reviewProgress(claims: readonly Pick<Claim, 'reviewState'>[])

consts: CLAIM_CATEGORIES, CLAIM_MOMENTS, CLAIM_SHAPES, REVIEW_STATES, REVIEW_STATE_LABEL, ALERT_KINDS, ALERT_LABEL, GRAPH_NODE_KINDS, GRAPH_EDGE_KINDS, CLAIM_ACTIONS
types: ClaimCategory, ClaimMoment, ClaimShape, ReviewState, AlertKind, AlertSeverity, GraphNodeKind, GraphEdgeKind, PaletteItemKind, ClaimAction
interfaces: ClaimProvenance, Claim, CurationAlert, GraphNode, GraphEdge, CurationGraph, ClaimFilters, ClaimPage, PaletteItem, ClaimEvent

REVIEW_STATE_LABEL has EXACTLY these 4 keys: unreviewed, verified, rejected, needs_edit

ALERT_LABEL has EXACTLY these 7 keys: thin_topic, single_source, unanchored_attribution, contradiction, stale, orphan, provenance_drift
```
## Follow this exemplar exactly

This file is the approved reference for how this kind of component is written
and styled in this project. Match its structure, its class vocabulary and its
conventions. Deviating from its visual vocabulary is a failure even if the code
compiles.

```tsx
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
import type { ReactNode } from 'react';

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
    <div
      className="cp-ev"
      style={{ gridTemplateColumns: `repeat(${Math.min(tiles.length, 3)}, minmax(0, 1fr))` }}
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

```

## Rules

- Write the target file. Do not create other files.
- Do not modify anything outside the target path.
- Import every symbol you use. Do not reference a symbol you have not imported.
- Use ONLY class names and style keys that appear in the surface or the exemplar.
- Do not leave TODOs, stubs, or placeholder values.
- Do not fix unrelated bugs you notice. Build only what is described above.

## Acceptance gate — you are DONE only when all of these are true

1. `/home/danman60/projects/uvalux-platform/apps/web/src/components/compass/usage/MetricTile.tsx` exists and is complete.
2. It imports what it uses from `@bask/core`.
3. `python3 -m broker.tscgate /home/danman60/projects/uvalux-platform/apps/web/src/components/compass/usage/MetricTile.tsx --repo /home/danman60/projects/uvalux-platform/apps/web && python3 -m broker.vocab /home/danman60/projects/uvalux-platform/apps/web/src/components/compass/primitives.tsx /home/danman60/projects/uvalux-platform/apps/web/src/components/compass/usage/MetricTile.tsx --contract /home/danman60/projects/uvalux-platform/packages/core/src/knowledge/curation/types.ts` passes with exit code 0.
4. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
