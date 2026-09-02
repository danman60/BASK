# curation: graph.ts (pure)

## What to build

A pure module. Import every type and helper you need from the sibling module ./types using a relative import - that file is the contract and sits next to this one. Do not import anything else. Export one function taking a readonly array of Claim plus an optional maximum node count, returning a CurationGraph. Build nodes: one corpus node per distinct corpus, one topic node per distinct category with id topic colon category, one moment node per distinct moment other than none with id moment colon moment, one speaker node per distinct non-null speaker in provenance, one session node per distinct non-null sessionTitle, one claim node per claim using the claim id. Edges: each claim to its topic with kind about_topic, to its moment with about_moment when the moment is not none, to its session with came_from when it has one; each session to its speaker with spoken_by. A claim node weight is its distinctEvents; a grouping node weight is how many claims sit under it. A claim node confidence comes from calling claimConfidence; a grouping node confidence is the mean of its children. Level of detail: if total nodes would exceed the maximum, leave individual claim nodes out, set collapsedCount on each topic node to how many claims it absorbed, and set collapsed true. Emit no similar_to edges - semantic similarity needs embeddings this module lacks; say so in a comment.

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/packages/core/src/knowledge/curation/graph.ts`

## The API surface you may use

Everything below is REAL and already exists. Import from `./types`.
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
 * Curation vocabulary — the shared contract for `/compass/knowledge`.
 *
 * Spec: `docs/superpowers/specs/2026-08-22-compass-knowledge-curation-design.md`.
 *
 * This file is the API surface every curation component builds against. It is
 * TYPES AND PURE HELPERS ONLY — no data access, no React, no side effects — so it
 * can be injected as a contract into a build without dragging the app in with it.
 *
 * Two invariants the whole surface rests on, stated here because this is the file
 * everything imports:
 *
 *  1. A claim without a verbatim quote is not a claim. `quote` is non-optional and
 *     the loader refuses empty ones. Nothing downstream may render a claim's text
 *     without its quote available.
 *  2. Attribution confidence is never laundered. `titleConfidence: 'interpolated'`
 *     means the speaker was inferred from an agenda, not heard on the recording,
 *     and any UI showing the speaker MUST show that too.
 */

/** Matches OPPORTUNITY_CATEGORIES in `../../opportunities/types`. */
export const CLAIM_CATEGORIES = [
  'marketing',
  'membership',
  'retail',
  'operations',
  'customer',
  'coaching',
] as const;
export type ClaimCategory = (typeof CLAIM_CATEGORIES)[number];

/** Matches MOMENT_KEYS in `../../monitor/types`, plus `none`. */
export const CLAIM_MOMENTS = [
  'greeting',
  'needs',
  'product',
  'membership',
  'close',
  'none',
] as const;
export type ClaimMoment = (typeof CLAIM_MOMENTS)[number];

/** Shapes the recall lens looks for. `null` when the primary advice lens found it. */
export const CLAIM_SHAPES = [
  'war_story',
  'mistake',
  'benchmark',
  'floor_question',
  'objection',
  'context',
] as const;
export type ClaimShape = (typeof CLAIM_SHAPES)[number];

export const REVIEW_STATES = ['unreviewed', 'verified', 'rejected', 'needs_edit'] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

export const REVIEW_STATE_LABEL: Record<ReviewState, string> = {
  unreviewed: 'Not reviewed',
  verified: 'Verified',
  rejected: 'Rejected',
  needs_edit: 'Needs an edit',
};

/** Where a claim came from. Every field here is required to trust the claim. */
export interface ClaimProvenance {
  /** Original media path, e.g. `J:\Uvalux26\RoomBLocked\P1060686.MOV`. */
  sourceFile: string;
  /** Extracted stream key, e.g. `uvalux26_P1060686`. */
  sourceStream: string;
  audioStreamIndex: number;
  tStart: number;
  tEnd: number;
  /** `Room B 2026 · P1060686 · 12:34` — the shape MonitorInsight.knowledgeRef documents. */
  knowledgeRef: string;
  /** Human event label, e.g. `UVALUX 2026 · Room B`. */
  event: string;
  /** Null when the claim could not be tied to a session — drives the `orphan` alert. */
  sessionTitle: string | null;
  /** Null when nobody is named. Never invent one. */
  speaker: string | null;
  /** `interpolated` = inferred from the agenda, NOT heard. Must be surfaced. */
  titleConfidence: 'anchored' | 'interpolated';
  /** False when the quote no longer matches its transcript — drives `provenance_drift`. */
  quoteVerified: boolean;
}

export interface Claim {
  id: string;
  corpus: string;
  /** The transferable lesson, one sentence. */
  claim: string;
  /** VERBATIM from the transcript. Never paraphrased, never empty. */
  quote: string;
  category: ClaimCategory;
  moment: ClaimMoment;
  shape: ClaimShape | null;
  specificity: 'concrete' | 'general';
  isScript: boolean;
  /** How many times it was said across the corpus. */
  timesSaid: number;
  /** How many SEPARATE events said it. >1 is corroboration; 1 drives `single_source`. */
  distinctEvents: number;
  extractedBy: string;
  lens: 'advice' | 'recall';
  reviewState: ReviewState;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  provenance: ClaimProvenance[];
}

// ---------------------------------------------------------------------- alerts

export const ALERT_KINDS = [
  'thin_topic',
  'single_source',
  'unanchored_attribution',
  'contradiction',
  'stale',
  'orphan',
  'provenance_drift',
] as const;
export type AlertKind = (typeof ALERT_KINDS)[number];

export const ALERT_LABEL: Record<AlertKind, string> = {
  thin_topic: 'Thin topic',
  single_source: 'Said once, by one person',
  unanchored_attribution: 'Speaker inferred, not heard',
  contradiction: 'Two verified claims disagree',
  stale: 'Verified a long time ago',
  orphan: 'No session found',
  provenance_drift: 'Quote no longer matches the transcript',
};

export type AlertSeverity = 'info' | 'attention' | 'blocking';

export interface CurationAlert {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  /** Graph node this attaches to. */
  nodeId: string;
  /** Plain sentence, grade-7. */
  message: string;
  claimIds: string[];
}

// ----------------------------------------------------------------------- graph

export const GRAPH_NODE_KINDS = [
  'corpus',
  'session',
  'claim',
  'topic',
  'moment',
  'speaker',
] as const;
export type GraphNodeKind = (typeof GRAPH_NODE_KINDS)[number];

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  /** Only claim nodes carry review state; others are null. */
  reviewState: ReviewState | null;
  /** Drives node SIZE. Corroboration count, or child count for grouping nodes. */
  weight: number;
  /** Drives node BRIGHTNESS. 0–1. Low = shaky provenance. */
  confidence: number;
  alertCount: number;
  /** Set when LOD has collapsed children into this node. */
  collapsedCount?: number;
}

export const GRAPH_EDGE_KINDS = [
  'came_from',
  'about_topic',
  'about_moment',
  'spoken_by',
  'similar_to',
] as const;
export type GraphEdgeKind = (typeof GRAPH_EDGE_KINDS)[number];

export interface GraphEdge {
  source: string;
  target: string;
  kind: GraphEdgeKind;
  /** 0–1. Only meaningful for `similar_to`. */
  strength: number;
}

export interface CurationGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** True when LOD collapsed claim nodes; the UI must say so rather than imply completeness. */
  collapsed: boolean;
}

// ------------------------------------------------------------------- filtering

export interface ClaimFilters {
  corpus?: string;
  reviewState?: ReviewState[];
  category?: ClaimCategory[];
  moment?: ClaimMoment[];
  shape?: ClaimShape[];
  specificity?: 'concrete' | 'general';
  isScript?: boolean;
  alertKind?: AlertKind[];
  /** Free text over claim + quote. */
  q?: string;
}

export interface ClaimPage {
  rows: Claim[];
  total: number;
  cursor: string | null;
}

// ------------------------------------------------------- palette (type-to-complete)

export type PaletteItemKind = GraphNodeKind | 'command';

export interface PaletteItem {
  id: string;
  kind: PaletteItemKind;
  label: string;
  /** Secondary line, e.g. the event and timecode. */
  hint: string | null;
  /** Graph node to frame when chosen. Null for pure commands. */
  focusNodeId: string | null;
}

// -------------------------------------------------------------- audit / history

export const CLAIM_ACTIONS = [
  'verified',
  'rejected',
  'edited',
  'merged',
  'split',
  'tagged',
  'unreviewed',
] as const;
export type ClaimAction = (typeof CLAIM_ACTIONS)[number];

export interface ClaimEvent {
  id: string;
  claimId: string;
  action: ClaimAction;
  actor: string;
  note: string | null;
  createdAt: string;
}

// -------------------------------------------------------------- pure helpers

/** `754.2` → `12:34`. Hours only appear when there are hours. */
export function formatTimecode(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return h > 0
    ? `${h}:${mm}:${String(sec).padStart(2, '0')}`
    : `${mm}:${String(sec).padStart(2, '0')}`;
}

/**
 * Confidence for a claim, 0–1. Drives node brightness.
 *
 * Deliberately pessimistic: anything with a drifted quote floors at 0, because a
 * quote that no longer matches its transcript cannot be trusted at any strength.
 */
export function claimConfidence(claim: Pick<Claim, 'distinctEvents' | 'provenance'>): number {
  if (claim.provenance.some((p) => !p.quoteVerified)) return 0;
  const anchored = claim.provenance.filter((p) => p.titleConfidence === 'anchored').length;
  const anchorRatio = claim.provenance.length > 0 ? anchored / claim.provenance.length : 0;
  const corroboration = Math.min(claim.distinctEvents, 3) / 3;
  return Math.min(1, 0.35 + 0.4 * corroboration + 0.25 * anchorRatio);
}

/** Review progress across a set. `verified + rejected` both count as decided. */
export function reviewProgress(claims: readonly Pick<Claim, 'reviewState'>[]): {
  decided: number;
  total: number;
  pct: number;
} {
  const total = claims.length;
  const decided = claims.filter(
    (c) => c.reviewState === 'verified' || c.reviewState === 'rejected',
  ).length;
  return { decided, total, pct: total === 0 ? 0 : Math.round((decided / total) * 100) };
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

1. `/home/danman60/projects/uvalux-platform/packages/core/src/knowledge/curation/graph.ts` exists and is complete.
2. It imports what it uses from `./types`.
3. `npx tsc --noEmit && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/packages/core/src/knowledge/curation/types.ts /home/danman60/projects/uvalux-platform/packages/core/src/knowledge/curation/graph.ts --contract /home/danman60/projects/uvalux-platform/packages/core/src/knowledge/curation/types.ts` passes with exit code 0.
4. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
