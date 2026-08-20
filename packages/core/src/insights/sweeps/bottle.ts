/**
 * Who is nearly out of product.
 *
 * An ESTIMATE built on an average, and the summary must say so — it is a prompt
 * for a human conversation, never a claim about a bottle nobody has looked at.
 *
 * The arithmetic belongs to `estimateBottle` in the health module. This sweep
 * only decides who is worth mentioning and what that is worth.
 */

import {
  buildMetric,
  buildWindow,
  formatCurrency,
  round,
} from '../../evidence';
import type { DetectorContext, InsightDraft } from '../types';
import { estimateBottle } from '../../health/customer-health';
import { buildSweepEvidence } from './evidence';

/**
 * Size of the bottle they last bought, in ounces.
 */
export interface BottleRow {
  customerId: string;
  /** Size of the bottle they last bought, in ounces. */
  bottleSizeOz: number;
  /** Tans taken since that purchase. */
  tansSincePurchase: number;
  /** What a replacement sells for, in ctx.currency. */
  replacementPrice: number;
}

/** Fewer customers than this and it is not worth an insight card. */
export const MIN_CUSTOMERS = 5;

export function sweepBottle(rows: readonly BottleRow[], ctx: DetectorContext): InsightDraft[] {
  const eligibleRows = rows.filter((row) => {
    const estimate = estimateBottle({
      bottleSizeOz: row.bottleSizeOz,
      tansSincePurchase: row.tansSincePurchase,
    });
    return estimate.runningLow || estimate.likelyEmpty;
  });

  if (eligibleRows.length < MIN_CUSTOMERS) {
    return [];
  }

  const impact = round(
    eligibleRows.reduce((sum, row) => sum + row.replacementPrice, 0),
    2,
  );

  if (impact < ctx.minImpact) {
    return [];
  }

  const count = eligibleRows.length;
  const customerIds = eligibleRows.map((row) => row.customerId);

  return [
    {
      dedupeKey: `bottle_depletion:${ctx.salonId}`,
      type: 'bottle_depletion',
      severity: 'medium',
      title: `${count} customers are close to empty`,
      summary: `Going by tans taken since their last bottle, about ${count} customers are nearly out — roughly ${formatCurrency(impact, ctx.currency)} of repeat business. This is an estimate, so ask rather than assume.`,
      impactEstimate: impact,
      impactCurrency: ctx.currency,
      linkedActionType: 'draft_reachout',
      linkedActionRef: {
        salonId: ctx.salonId,
        customerIds: customerIds,
      },
      primaryActionLabel: 'See who to mention it to',
      forDate: ctx.today,
      evidence: buildSweepEvidence({
        metric: buildMetric('customer_count', 'Customers near empty', 'count', count),
        window: buildWindow('Current book', ctx.today, ctx.today, 1),
        impact,
        currency: ctx.currency,
        basis: `Estimated replacement value for ${count} customers using ${formatCurrency(impact, ctx.currency)} of product.`,
        sentence: `About ${count} customers are nearly out of product. This is an estimate based on tans since purchase.`,
      }),
    },
  ];
}
