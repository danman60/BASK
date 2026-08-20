/**
 * Customers who came once and never returned.
 *
 * The cheapest win available, and the one most salons never look at: a first
 * visit is the most expensive customer a salon ever buys, and a second visit is
 * the only thing that makes it pay back.
 *
 * A customer who came once LAST WEEK has not lapsed yet — they simply have not
 * come back yet. The grace window is what keeps this from crying wolf on
 * everybody who walked in on Saturday.
 */

import {
  buildMetric,
  buildWindow,
  formatCurrency,
  round,
} from '../../evidence';
import type { DetectorContext, InsightDraft } from '../types';
import { buildSweepEvidence } from './evidence';

export interface FirstVisitRow {
  customerId: string;
  /** ISO date of their only visit. */
  firstVisitAt: string;
  /** Total visits on record. Only rows equal to 1 are of interest. */
  visitCount: number;
  /** True when they hold a membership — those are a different conversation. */
  hasMembership: boolean;
  /** Average revenue of a returning customer's second visit, in ctx.currency. */
  secondVisitValue: number;
}

export const MIN_CUSTOMERS = 8;
/** Days after a first visit before never-returned means anything. */
export const GRACE_DAYS = 21;
/** Beyond this, they are cold rather than winnable, and a different sweep's problem. */
export const STALE_DAYS = 180;

/** Whole days between two ISO dates. Never negative. */
export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  const diff = (to - from) / 86_400_000;
  return Math.max(0, Math.floor(diff));
}

export function sweepFirstVisit(rows: readonly FirstVisitRow[], ctx: DetectorContext): InsightDraft[] {
  const candidates = rows.filter(
    (row) =>
      row.visitCount === 1 &&
      row.hasMembership === false &&
      daysBetween(row.firstVisitAt, ctx.today) > GRACE_DAYS &&
      daysBetween(row.firstVisitAt, ctx.today) <= STALE_DAYS
  );

  if (candidates.length < MIN_CUSTOMERS) {
    return [];
  }

  const impact = round(
    candidates.reduce((sum, row) => sum + row.secondVisitValue, 0),
    2
  );

  if (impact < ctx.minImpact) {
    return [];
  }

  return [
    {
      dedupeKey: `first_visit_lapse:${ctx.salonId}`,
      type: 'first_visit_lapse',
      severity: 'medium',
      title: `${candidates.length} people came once and never came back`,
      summary: `They tried you in the last six months and have not returned. A second visit is what makes a first one pay for itself — about ${formatCurrency(impact, ctx.currency)} sitting in this list.`,
      impactEstimate: impact,
      impactCurrency: ctx.currency,
      linkedActionType: 'draft_reachout',
      linkedActionRef: {
        salonId: ctx.salonId,
        customerIds: candidates.map((c) => c.customerId),
      },
      primaryActionLabel: 'Write them a first-visit note',
      forDate: ctx.today,
      evidence: buildSweepEvidence({
        metric: buildMetric('first_visit_lapse_count', 'People who came once', 'count', candidates.length),
        window: buildWindow('Last six months', ctx.today, ctx.today, STALE_DAYS),
        impact,
        currency: ctx.currency,
        basis: `Expected second-visit value across ${candidates.length} eligible customers.`,
        sentence: `${candidates.length} people came once and have not returned.`,
      }),
    },
  ];
}
