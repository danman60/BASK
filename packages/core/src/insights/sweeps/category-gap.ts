/**
 * Where this salon sits against the cohort, category by category.
 *
 * Units per 100 customers, not dollars: the comparison has to survive two salons
 * charging different prices for the same bottle.
 *
 * A category the salon sells NONE of is the strongest version of this signal and
 * is reported ahead of a merely-low one — an absent category is a conversation
 * nobody has had, not a preference.
 */
export interface CategoryRow {
  category: string;
  /** This salon's units per 100 customers. */
  units: number;
  /** The cohort median, same measure. */
  cohortMedian: number;
  /** What one more unit is worth, in ctx.currency. */
  unitValue: number;
}

import { buildMetric, buildWindow, formatCurrency } from '../../evidence';
import type { DetectorContext, InsightDraft } from '../types';
import { buildSweepEvidence } from './evidence';

export const MIN_COHORT = 12;
/** Below this share of the cohort median, a category is a gap. */
export const GAP_RATIO = 0.6;
/** How much of the gap we claim is realistically closable. */
export const CLOSABLE_SHARE = 0.5;

/** Money at stake in closing half of one category's gap. Never negative. */
export function gapValue(row: CategoryRow): number {
  return Math.round(Math.max(0, row.cohortMedian - row.units) * CLOSABLE_SHARE * row.unitValue * 100) / 100;
}

export function sweepCategoryGap(
  rows: readonly CategoryRow[],
  cohortSize: number,
  ctx: DetectorContext,
): InsightDraft[] {
  if (cohortSize < MIN_COHORT) {
    return [];
  }

  // Filter rows where cohortMedian > 0 and units / cohortMedian <= GAP_RATIO
  const filteredRows = rows.filter(row => row.cohortMedian > 0 && row.units / row.cohortMedian <= GAP_RATIO);

  // Sort: rows with units === 0 first, then by gapValue descending
  const sortedRows = filteredRows.sort((a, b) => {
    if (a.units === 0 && b.units !== 0) return -1;
    if (b.units === 0 && a.units !== 0) return 1;
    return gapValue(b) - gapValue(a);
  });

  // Take at most the top 3
  const topRows = sortedRows.slice(0, 3);

  // Drop any whose gapValue is below ctx.minImpact
  const impactfulRows = topRows.filter(row => gapValue(row) >= ctx.minImpact);

  // Return [] if nothing survives
  if (impactfulRows.length === 0) {
    return [];
  }

  // Emit one InsightDraft per surviving row
  return impactfulRows.map(row => {
    const isMissingCategory = row.units === 0;
    const severity = isMissingCategory ? 'high' : 'medium';
    const title = isMissingCategory 
      ? `You sell no ${row.category}`
      : `${row.category} is behind salons your size`;
    
    const summary = `You sell ${row.units} per 100 customers where similar salons sell ${row.cohortMedian}. Closing half that gap is about ${formatCurrency(gapValue(row), ctx.currency)}.`;

    return {
      dedupeKey: `category_gap:${ctx.salonId}:${row.category}`,
      type: 'category_gap',
      severity,
      title,
      summary,
      impactEstimate: gapValue(row),
      impactCurrency: ctx.currency,
      linkedActionType: 'open_cohort',
      linkedActionRef: { salonId: ctx.salonId, category: row.category },
      primaryActionLabel: 'See the products',
      forDate: ctx.today,
      evidence: buildSweepEvidence({
        metric: buildMetric('category_units', row.category, 'count', row.units),
        window: buildWindow('Current category run rate', ctx.today, ctx.today, 1),
        impact: gapValue(row),
        currency: ctx.currency,
        basis: `Half of the gap to the cohort median multiplied by the supplied unit value (${formatCurrency(row.unitValue, ctx.currency)}).`,
        sentence: `You sell ${row.units} ${row.category} units per 100 customers where similar salons sell ${row.cohortMedian}.`,
      }),
    };
  });
}
