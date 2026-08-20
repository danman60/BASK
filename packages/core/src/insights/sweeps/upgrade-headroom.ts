/**
 * Members who already use more than their tier.
 *
 * The honest upsell: these people are getting more value than they pay for, so
 * the next tier is a fair conversation rather than a squeeze. Members who are
 * NOT using what they already pay for are deliberately excluded — upgrading them
 * is how a salon earns a cancellation.
 */
import {
  buildMetric,
  buildWindow,
  formatCurrency,
  round,
} from '../../evidence';
import type { DetectorContext, InsightDraft } from '../types';
import { buildSweepEvidence } from './evidence';

export interface UpgradeRow {
  membershipId: string;
  /** What they pay now, per month. */
  currentPrice: number;
  /** What the next tier up costs, or null when they are already on the top tier. */
  nextTierPrice: number | null;
  /** Sessions they used last month. */
  sessionsLastMonth: number;
  /** Sessions the current tier is designed around. */
  tierSessionAllowance: number;
}

export const MIN_MEMBERS = 5;
/** Usage at or above this share of the tier's allowance is headroom. */
export const USAGE_RATIO = 0.9;

/** Monthly uplift if this member moved up a tier. Zero when there is nowhere to go. */
export function upliftFor(row: UpgradeRow): number {
  if (row.nextTierPrice === null) {
    return 0;
  }
  return Number(round(Math.max(0, row.nextTierPrice - row.currentPrice), 2));
}

export function sweepUpgradeHeadroom(rows: readonly UpgradeRow[], ctx: DetectorContext): InsightDraft[] {
  const survivors = rows.filter(
    (row) =>
      row.nextTierPrice !== null &&
      row.tierSessionAllowance > 0 &&
      row.sessionsLastMonth / row.tierSessionAllowance >= USAGE_RATIO,
  );

  if (survivors.length < MIN_MEMBERS) {
    return [];
  }

  let monthlyUplift = 0;
  for (const row of survivors) {
    monthlyUplift += upliftFor(row);
  }
  monthlyUplift = Number(round(monthlyUplift, 2));

  if (monthlyUplift < ctx.minImpact) {
    return [];
  }

  const annualUplift = Number(round(monthlyUplift * 12, 2));

  return [
    {
      dedupeKey: `upgrade_headroom:${ctx.salonId}`,
      type: 'upgrade_headroom',
      severity: 'medium',
      title: `${survivors.length} members are using more than they pay for`,
      summary: `They are at or past what their tier is built around. Moving them up is worth about ${formatCurrency(monthlyUplift, ctx.currency)} a month, or ${formatCurrency(annualUplift, ctx.currency)} a year — and it is a fair conversation, because they are already getting the value.`,
      impactEstimate: monthlyUplift,
      impactCurrency: ctx.currency,
      linkedActionType: 'review_membership',
      linkedActionRef: {
        salonId: ctx.salonId,
        membershipIds: survivors.map((s) => s.membershipId),
        monthlyUplift,
        annualUplift,
      },
      primaryActionLabel: 'See who to talk to',
      forDate: ctx.today,
      evidence: buildSweepEvidence({
        metric: buildMetric('upgrade_headroom_count', 'Members with upgrade headroom', 'count', survivors.length),
        window: buildWindow('Last month', ctx.today, ctx.today, 30),
        impact: monthlyUplift,
        currency: ctx.currency,
        basis: `${survivors.length} members at or above 90% of their tier allowance, multiplied by the next-tier monthly uplift.`,
        sentence: `${survivors.length} members are using more than their current tier covers, worth about ${formatCurrency(monthlyUplift, ctx.currency)} a month.`,
      }),
    },
  ];
}
