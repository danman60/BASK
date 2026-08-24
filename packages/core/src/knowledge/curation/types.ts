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
  /** Which extraction pass produced this. `marketing` is voice-of-customer. */
  lens: 'advice' | 'recall' | 'marketing';
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
  /**
   * Share of the claims under this node that a human has VERIFIED, 0–1.
   *
   * This is the map's primary colour channel. It is knowable on day one, unlike
   * per-claim review state, which is uniform until curation has already
   * happened — a map whose signal only appears after the work is done cannot
   * tell you where to start the work.
   *
   * For a claim node it is 1 or 0. For a grouping node it is the real ratio
   * across its children, never a placeholder.
   */
  verifiedRatio: number;
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
  /**
   * Which extraction lens. The corpus holds four passes over the same audio and
   * they answer different questions, so the curation queue defaults to the
   * advice lenses and treats `marketing` as opt-in.
   */
  lens?: string[];
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

// ------------------------------------------------------- corpus overview (management)

/**
 * One corpus as the management surface sees it — a training corpus is a named
 * group of claims (one extraction pass over one body of audio), not its own
 * table. This row is what `CorpusList`/`CorpusCard` render: the identity, the
 * review progress, and whether the UVALUX operator has archived it.
 *
 * `archived` is a SOFT state — an archived corpus is hidden from the curation
 * queue and the graph but its rows stay in the shared `bask` schema, so the
 * action is always reversible. There is no hard delete on this surface.
 */
export interface CorpusOverviewRow {
  /** Stable key, e.g. `salon-advice` — matches `Claim.corpus`. */
  corpus: string;
  /** Human label, e.g. "Salon advice (gemma pass)". Falls back to `corpus`. */
  label: string;
  /** Total claims in this corpus. */
  total: number;
  /** Verified + rejected. */
  decided: number;
  /** Verified only. */
  verified: number;
  /** Whether the operator has archived (soft-hidden) this corpus. */
  archived: boolean;
  /** ISO timestamp of the most recent claim/review activity, or null. */
  lastActivity: string | null;
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
