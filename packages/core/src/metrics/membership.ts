/**
 * Membership and revenue metrics, using the definitions UVALUX's own coaching
 * teaches rather than ones we invented — that is what makes the output theirs.
 *
 * Average member tenure is the load-bearing one: the equipment case rests on
 * "add a modality, hold members a month longer, and the machine pays for
 * itself." Nothing in the product computed it before this file.
 */

export interface MembershipSpan {
  /** ISO date the membership started. */
  startedAt: string;
  /** ISO date it ended, or null while it is still running. */
  cancelledAt: string | null;
}

export interface SalonPeriodTotals {
  revenue: number;
  sessions: number;
  distinctCustomers: number;
}

export interface MembershipMetrics {
  revenuePerSession: number;
  sessionsPerCustomer: number;
  revenuePerCustomer: number;
  averageTenureMonths: number;
  activeMembers: number;
}

export const DAYS_PER_MONTH = 30.44;
export const MS_PER_DAY = 86_400_000;

/** Whole days between two ISO dates. Never negative. */
export function daysBetween(fromIso: string, toIso: string): number {
  const diff = Date.parse(toIso) - Date.parse(fromIso);
  const days = Math.floor(diff / MS_PER_DAY);
  return Math.max(0, days);
}

/**
 * Tenure of one membership in days, as of `todayIso`.
 * A membership that has NOT been cancelled counts up to today — it is still
 * accruing, and excluding it understates a healthy salon badly.
 */
export function tenureDays(span: MembershipSpan, todayIso: string): number {
  const endIso = span.cancelledAt ?? todayIso;
  return daysBetween(span.startedAt, endIso);
}

/** Mean tenure in months, one decimal. Zero for an empty list. */
export function averageTenureMonths(spans: readonly MembershipSpan[], todayIso: string): number {
  if (spans.length === 0) {
    return 0;
  }
  
  const totalDays = spans.reduce((sum, span) => sum + tenureDays(span, todayIso), 0);
  const averageDays = totalDays / spans.length;
  return Number((averageDays / DAYS_PER_MONTH).toFixed(1));
}

/** Safe division: returns 0 when the denominator is 0. */
export function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }
  return Number((numerator / denominator).toFixed(2));
}

export function membershipMetrics(
  totals: SalonPeriodTotals,
  spans: readonly MembershipSpan[],
  todayIso: string,
): MembershipMetrics {
  return {
    revenuePerSession: ratio(totals.revenue, totals.sessions),
    sessionsPerCustomer: ratio(totals.sessions, totals.distinctCustomers),
    revenuePerCustomer: ratio(totals.revenue, totals.distinctCustomers),
    averageTenureMonths: averageTenureMonths(spans, todayIso),
    activeMembers: spans.filter(span => span.cancelledAt === null).length,
  };
}