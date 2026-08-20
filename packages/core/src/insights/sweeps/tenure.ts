/**
 * Average member tenure, against the cohort.
 *
 * The number the equipment case rests on: a member who stays a month longer is
 * worth more than a new member, because they are already walking through the
 * door. Nothing in the product computed this before.
 *
 * Tenure is measured in DAYS and reported in months at one decimal. A member who
 * has not cancelled counts from `startedAt` to `ctx.today` — they are still
 * accruing tenure, and dropping them understates the number badly for a healthy
 * salon.
 */
export interface MemberTenureRow {
  membershipId: string;
  /** ISO date, e.g. '2026-04-02'. */
  startedAt: string;
  /** ISO date, or null when the membership is still running. */
  cancelledAt: string | null;
  /** How many distinct modalities this member's tier includes. */
  modalityCount: number;
}

import { buildComparison, buildMetric, buildWindow } from '../../evidence';
import type { DetectorContext, InsightDraft } from '../types';
import { buildSweepEvidence } from './evidence';

export const MIN_COHORT = 12;
/** Below this many members the average is noise, not a finding. */
export const MIN_MEMBERS = 25;
/** Months of tenure below the cohort median before it is worth saying. */
export const TENURE_GAP_MONTHS = 0.3;
export const DAYS_PER_MONTH = 30.44;

/** Whole days between two ISO dates. Never negative. */
export function daysBetween(fromIso: string, toIso: string): number {
  const fromDate = Date.parse(fromIso);
  const toDate = Date.parse(toIso);
  const diffMs = Math.max(0, toDate - fromDate);
  return Math.floor(diffMs / 86400000);
}

/** Mean tenure in months, one decimal. Returns 0 for an empty list. */
export function averageTenureMonths(rows: readonly MemberTenureRow[], todayIso: string): number {
  if (rows.length === 0) return 0;
  
  let totalDays = 0;
  for (const row of rows) {
    const endDate = row.cancelledAt ?? todayIso;
    totalDays += daysBetween(row.startedAt, endDate);
  }
  
  const avgDays = totalDays / rows.length;
  return Math.round((avgDays / DAYS_PER_MONTH) * 10) / 10;
}

export function sweepTenure(
  rows: readonly MemberTenureRow[],
  cohortMedianMonths: number,
  cohortSize: number,
  ctx: DetectorContext,
): InsightDraft[] {
  if (rows.length < MIN_MEMBERS || cohortSize < MIN_COHORT) {
    return [];
  }
  
  const ours = averageTenureMonths(rows, ctx.today);
  const gap = Math.round((cohortMedianMonths - ours) * 10) / 10;
  
  if (gap < TENURE_GAP_MONTHS) {
    return [];
  }
  
  // Split rows into rich and lean groups
  const richRows = rows.filter(row => row.modalityCount >= 3);
  const leanRows = rows.filter(row => row.modalityCount < 3);
  
  const richMonths = averageTenureMonths(richRows, ctx.today);
  const leanMonths = averageTenureMonths(leanRows, ctx.today);
  
  // Determine severity
  const severity = gap >= 0.6 ? 'high' : 'medium';
  
  return [{
    dedupeKey: `member_tenure_gap:${ctx.salonId}`,
    type: 'member_tenure_gap',
    severity,
    title: 'Your members leave sooner than the group',
    summary: `Members stay ${ours} months here against ${cohortMedianMonths} for salons your size. Members on three or more modalities stay ${richMonths} months.`,
    impactEstimate: 0,
    impactCurrency: ctx.currency,
    linkedActionType: 'review_membership',
    linkedActionRef: { salonId: ctx.salonId, richMonths, leanMonths },
    primaryActionLabel: 'See what longer-staying salons added',
    forDate: ctx.today,
    evidence: buildSweepEvidence({
      metric: buildMetric('member_tenure', 'Average member tenure', 'ratio', ours),
      window: buildWindow('Current membership book', ctx.today, ctx.today, 1),
      impact: 0,
      currency: ctx.currency,
      basis: 'Benchmark gap only; no dollar value claimed until the salon supplies its baseline.',
      sentence: `Members stay ${ours} months here against ${cohortMedianMonths} months for salons your size.`,
    }),
  }];
}
