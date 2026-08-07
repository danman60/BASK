import {
  THRESHOLDS,
  round,
  type CategoryTrendFacts,
  type ProductStockFacts,
} from '@bask/core';

/**
 * The reorder rules — pure, so they can be tested without a database.
 *
 * Split out of `inventory.ts` (which is `server-only` and holds the Prisma
 * reads) for exactly that reason: the part of this screen worth testing is the
 * *because* on each line, and that is arithmetic over `SalonFacts.stock`.
 *
 * Sell-through is computed upstream and never stored (IMPLEMENTATION_SPEC §2):
 *   dailyVelocity = (units sold in the trailing 30 days + back-bar use) / 30
 *   daysRemaining = onHand / dailyVelocity
 */

/** Days between UVALUX deliveries the recommendations plan around. */
export const REORDER_CYCLE_DAYS = 21;

/** Case size UVALUX ships in — quantities round up to it. */
export const CASE_SIZE = 6;

export type StockFlag = 'critical' | 'reorder' | 'watch' | 'healthy' | 'overstock';

export type ReorderReasonKind = 'below_threshold' | 'sell_through_pace' | 'seasonal_lift';

export interface StockRow extends ProductStockFacts {
  brand: string | null;
  size: string | null;
  flag: StockFlag;
  /** The arithmetic, spelled out — shown under "how we worked this out". */
  workings: string;
  /** Plain-language cover sentence: "about 8 days left at the current pace". */
  coverSentence: string;
  /** Retail value sitting on the shelf. */
  shelfValue: number;
}

export interface RisingCategory {
  key: string;
  label: string;
  changePercent: number;
}

export interface Recommendation {
  productId: string;
  sku: string;
  name: string;
  brand: string | null;
  size: string | null;
  category: string | null;
  quantity: number;
  unitPrice: number;
  retailPrice: number;
  reasonKind: ReorderReasonKind;
  /** The line's "because" — persisted onto `draft_order_line.reason`. */
  reason: string;
  daysRemaining: number | null;
  onHand: number;
}

/** Retail categories map onto the service category whose demand drives them. */
export const PRODUCT_TO_SERVICE_CATEGORY: Record<string, string> = {
  spray_solution: 'spray',
  wellness: 'wellness',
  bronzer: 'uv',
  accelerator: 'uv',
  aftercare: 'uv',
  face: 'uv',
  kit: 'uv',
  accessory: 'uv',
};

export function trendPercent(trend: CategoryTrendFacts): number {
  if (trend.baselineCount === 0) return 0;
  return round(((trend.currentCount - trend.baselineCount) / trend.baselineCount) * 100, 1);
}

export function risingCategoriesFrom(trends: CategoryTrendFacts[]): RisingCategory[] {
  return trends
    .map((trend) => ({ key: trend.key, label: trend.label, changePercent: trendPercent(trend) }))
    .filter((t) => t.changePercent >= THRESHOLDS.anomalyPercent)
    .sort((a, b) => b.changePercent - a.changePercent);
}

export function flagFor(stock: ProductStockFacts): StockFlag {
  if (stock.onHand === 0) return 'critical';
  if (stock.daysRemaining !== null && stock.daysRemaining <= 7) return 'critical';
  if (stock.onHand <= stock.reorderPoint) return 'reorder';
  if (stock.daysRemaining !== null && stock.daysRemaining <= THRESHOLDS.lowStockDays) return 'reorder';
  if (
    stock.onHand > 0 &&
    (stock.daysRemaining === null || stock.daysRemaining >= THRESHOLDS.overstockDays)
  ) {
    return 'overstock';
  }
  if (stock.daysRemaining !== null && stock.daysRemaining <= REORDER_CYCLE_DAYS) return 'watch';
  return 'healthy';
}

export function coverSentence(stock: ProductStockFacts): string {
  if (stock.onHand === 0) return 'Out of stock.';
  if (stock.daysRemaining === null) {
    return stock.daysSinceLastSale === null
      ? 'Has never sold — no pace to measure.'
      : `Nothing sold in the last 30 days; last one went ${stock.daysSinceLastSale} days ago.`;
  }
  const days = Math.round(stock.daysRemaining);
  return `About ${days} ${days === 1 ? 'day' : 'days'} left at the current pace.`;
}

export function workingsFor(stock: ProductStockFacts): string {
  if (stock.dailyVelocity === 0) {
    return `${stock.onHand} on the shelf · 0 sold in the last 30 days, so there is no pace to divide by.`;
  }
  return `${stock.unitsSoldInWindow} sold in 30 days = ${stock.dailyVelocity.toFixed(
    2,
  )} a day. ${stock.onHand} on the shelf ÷ ${stock.dailyVelocity.toFixed(2)} = ${
    stock.daysRemaining === null ? '—' : stock.daysRemaining.toFixed(1)
  } days.`;
}

/**
 * How many to order: top the shelf back up to its par level, rounded up to a
 * full case. Par is 45 days of cover at the product's baseline pace, which is
 * why "one case" is usually the answer and the owner is not asked to do maths.
 */
export function suggestQuantity(stock: ProductStockFacts): number {
  const target = stock.parLevel ?? Math.max(stock.reorderPoint * 3, CASE_SIZE);
  const shortfall = Math.max(target - stock.onHand, CASE_SIZE);
  return Math.ceil(shortfall / CASE_SIZE) * CASE_SIZE;
}

/**
 * The reorder engine. Every line carries the computation that put it there —
 * the "because" is the product, not a decoration on it (PRODUCT_SPEC §12).
 */
export function buildRecommendations(
  rows: StockRow[],
  risingCategories: RisingCategory[],
): Recommendation[] {
  const risingByServiceCategory = new Map(risingCategories.map((c) => [c.key, c]));
  const out: Recommendation[] = [];

  for (const row of rows) {
    if (row.wholesaleCost === null) continue;

    const base = {
      productId: row.productId,
      sku: row.sku,
      name: row.name,
      brand: row.brand,
      size: row.size,
      category: row.category,
      quantity: suggestQuantity(row),
      unitPrice: row.wholesaleCost,
      retailPrice: row.retailPrice,
      daysRemaining: row.daysRemaining,
      onHand: row.onHand,
    };

    // 1. Below the shelf threshold — the shelf itself says top me up.
    if (row.onHand <= row.reorderPoint) {
      out.push({
        ...base,
        reasonKind: 'below_threshold',
        reason: `Below its reorder point — ${row.onHand} on the shelf against a threshold of ${row.reorderPoint}.`,
      });
      continue;
    }

    // 2. Sell-through pace — it will not survive to the next delivery.
    if (row.daysRemaining !== null && row.daysRemaining <= REORDER_CYCLE_DAYS) {
      out.push({
        ...base,
        reasonKind: 'sell_through_pace',
        reason: `Selling ${row.dailyVelocity.toFixed(2)} a day — about ${Math.round(
          row.daysRemaining,
        )} days of cover, short of the ${REORDER_CYCLE_DAYS}-day gap between orders.`,
      });
      continue;
    }

    // 3. Seasonal lift — demand for the service that drives this product is up,
    //    and the current shelf does not cover the lifted pace.
    const serviceCategory = row.category ? PRODUCT_TO_SERVICE_CATEGORY[row.category] : undefined;
    const rising = serviceCategory ? risingByServiceCategory.get(serviceCategory) : undefined;
    if (rising && row.dailyVelocity > 0) {
      const liftedVelocity = row.dailyVelocity * (1 + rising.changePercent / 100);
      const daysAtLiftedPace = row.onHand / liftedVelocity;
      if (daysAtLiftedPace <= REORDER_CYCLE_DAYS * 2) {
        out.push({
          ...base,
          reasonKind: 'seasonal_lift',
          reason: `${rising.label} are up ${rising.changePercent}% — at that pace this shelf covers about ${Math.round(
            daysAtLiftedPace,
          )} days, not ${Math.round(row.daysRemaining ?? 0)}.`,
        });
      }
    }
  }

  const priority: Record<ReorderReasonKind, number> = {
    below_threshold: 0,
    sell_through_pace: 1,
    seasonal_lift: 2,
  };
  return out.sort(
    (a, b) =>
      priority[a.reasonKind] - priority[b.reasonKind] ||
      (a.daysRemaining ?? Number.MAX_SAFE_INTEGER) - (b.daysRemaining ?? Number.MAX_SAFE_INTEGER),
  );
}

/** Decorate a raw stock rollup row with everything the screen needs. */
export function toStockRow(
  stock: ProductStockFacts,
  extra: { brand: string | null; size: string | null },
): StockRow {
  return {
    ...stock,
    brand: extra.brand,
    size: extra.size,
    flag: flagFor(stock),
    workings: workingsFor(stock),
    coverSentence: coverSentence(stock),
    shelfValue: round(stock.onHand * stock.retailPrice, 2),
  };
}
