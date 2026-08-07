/**
 * Insight sweep — runs every detector over one salon's facts and ranks the
 * results by what the money says (DESIGN_SPEC §3.1: "ranked by impact").
 *
 * Pure. Given the same facts it returns the same drafts in the same order, so
 * the sweep can be asserted against directly in tests without a database.
 */

import { parseEvidence } from '../evidence';
import { ALL_DETECTORS, THRESHOLDS } from './detectors';
import type { SalonFacts } from './facts';
import { SEVERITY_RANK, type Detector, type DetectorContext, type InsightDraft } from './types';

export interface SweepOptions {
  /** Override the detector set — used by tests to isolate one arc. */
  detectors?: Detector[];
  /** Money floor below which nothing reaches the owner. */
  minImpact?: number;
  /**
   * How many insights the attention queue may hold. DESIGN_SPEC §3.1 caps the
   * queue at five; the rest stay queryable on the Insights surface.
   */
  maxInsights?: number;
}

export interface SweepResult {
  salonId: string;
  forDate: string;
  drafts: InsightDraft[];
  /** Everything the detectors produced, before the queue cap. */
  allDrafts: InsightDraft[];
  /** Per-detector counts — useful in the pipeline log and in tests. */
  countsByType: Record<string, number>;
}

/**
 * Normalise money to a common cadence so a per-week opportunity and a
 * per-month cost can be ranked against each other honestly.
 */
export function monthlyValueOf(draft: InsightDraft): number {
  const { cadence } = draft.evidence.impact;
  const amount = Math.abs(draft.impactEstimate);
  switch (cadence) {
    case 'per_week':
      return amount * 4.33;
    case 'per_year':
      return amount / 12;
    case 'per_month':
    case 'one_time':
    default:
      return amount;
  }
}

export function runInsightSweep(facts: SalonFacts, options: SweepOptions = {}): SweepResult {
  const detectors = options.detectors ?? ALL_DETECTORS;
  const minImpact = options.minImpact ?? THRESHOLDS.minImpact;
  const maxInsights = options.maxInsights ?? 5;

  const ctx: DetectorContext = {
    salonId: facts.salonId,
    today: facts.today,
    currency: facts.currency,
    minImpact,
  };

  const allDrafts: InsightDraft[] = [];
  const countsByType: Record<string, number> = {};

  for (const detector of detectors) {
    let produced: InsightDraft[];
    try {
      produced = detector.run(facts, ctx);
    } catch (error) {
      // A detector that throws must not take the whole morning brief with it.
      // Loudly logged, quietly skipped.
      console.error(`[insight-engine] detector ${detector.type} failed:`, error);
      produced = [];
    }

    for (const draft of produced) {
      // The Evidence schema is the contract for a Json column that cannot
      // enforce it. Parse on the way out so a malformed detector fails here,
      // in the sweep, rather than in the UI three surfaces downstream.
      draft.evidence = parseEvidence(draft.evidence);
      allDrafts.push(draft);
    }
    countsByType[detector.type] = produced.length;
  }

  const ranked = [...allDrafts].sort(compareDrafts);

  return {
    salonId: facts.salonId,
    forDate: facts.today,
    drafts: ranked.slice(0, maxInsights),
    allDrafts: ranked,
    countsByType,
  };
}

/** Money first, severity as the tie-break, dedupeKey for total stability. */
function compareDrafts(a: InsightDraft, b: InsightDraft): number {
  const byMoney = monthlyValueOf(b) - monthlyValueOf(a);
  if (Math.abs(byMoney) > 0.5) return byMoney;
  const bySeverity = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
  if (bySeverity !== 0) return bySeverity;
  return a.dedupeKey.localeCompare(b.dedupeKey);
}
