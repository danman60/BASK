/**
 * Insight vocabulary shared by the rules engine, the pipeline, and Daybreak.
 *
 * `Insight.type` and `Insight.linked_action_type` are plain strings in Postgres
 * (deliberately — new detectors ship without a migration). These unions are the
 * code-level contract for what those strings may be.
 */

import type { Evidence } from '../evidence';
import type { SalonFacts } from './facts';

/**
 * One per detector in `detectors.ts`, plus the sweeps in `sweeps/`.
 *
 * The second group came out of the 2026-08-19 client meeting and the metric
 * definitions given on stage at the expo. They answer the question the first six
 * do not: not "what happened in the salon today" but "how does this salon compare,
 * and how long do its members stay" — which is the part the client said nobody is
 * doing ("it's not tracking minutes and putting butts in beds, it's what to do
 * with that data"). See `docs/SIGNAL_SWEEPS.md`.
 */
export const INSIGHT_TYPES = [
  'retail_attachment_slip',
  'failed_payments',
  'soft_capacity',
  'low_stock',
  'overstock',
  'anomaly_band',
  // sweeps/ — benchmarking and membership economics
  'member_tenure_gap',
  'seasonal_pause',
  'bottle_depletion',
  'category_gap',
  'first_visit_lapse',
  'upgrade_headroom',
] as const;
export type InsightType = (typeof INSIGHT_TYPES)[number];

/** What the card's primary button does (DESIGN_SPEC §3.1 action column). */
export const LINKED_ACTION_TYPES = [
  'create_campaign',
  'recover_payment',
  'open_heatmap',
  'draft_order',
  'review_product',
  'open_report',
  // sweeps/
  'open_cohort',
  'draft_reachout',
  'review_membership',
] as const;
export type LinkedActionType = (typeof LINKED_ACTION_TYPES)[number];

export const INSIGHT_SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'] as const;
export type InsightSeverity = (typeof INSIGHT_SEVERITIES)[number];

export const INSIGHT_STATES = ['new', 'seen', 'actioned', 'dismissed'] as const;
export type InsightState = (typeof INSIGHT_STATES)[number];

/**
 * What a detector emits. Not yet a DB row — the pipeline decides whether this
 * is a new insight or an update to a standing one (`dedupeKey`).
 */
export interface InsightDraft {
  /**
   * Stable identity for "the same finding". Re-running the sweep on a later day
   * must update the standing insight rather than pile up duplicates, and a
   * dismissal must stick. Detector type + subject, never the date.
   */
  dedupeKey: string;
  type: InsightType;
  severity: InsightSeverity;
  /** Card title, 16px semibold — states the finding, not the feature. */
  title: string;
  /** One-line summary for lists and push notifications. */
  summary: string;
  evidence: Evidence;
  /** Signed money at stake; drives ranking. Mirrors `evidence.impact.amount`. */
  impactEstimate: number;
  impactCurrency: string;
  linkedActionType: LinkedActionType;
  /** Deep-link payload for the primary action, e.g. `{ segmentKey, productId }`. */
  linkedActionRef: Record<string, unknown>;
  /** Button copy — states the outcome, never "Submit" (DESIGN_SPEC §5). */
  primaryActionLabel: string;
  /** The day the sweep attributed this finding to. */
  forDate: string;
}

/** Context every detector receives. */
export interface DetectorContext {
  salonId: string;
  /** Virtual today from the demo clock. */
  today: string;
  currency: string;
  /** Money below this is not worth an owner's attention. */
  minImpact: number;
}

export interface Detector {
  readonly type: InsightType;
  run(facts: SalonFacts, ctx: DetectorContext): InsightDraft[];
}

/** Ranking weight — severity breaks ties when impact is close. */
export const SEVERITY_RANK: Record<InsightSeverity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};
