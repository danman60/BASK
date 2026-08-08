import { describe, expect, it } from 'vitest';
import { THRESHOLDS, type CategoryTrendFacts, type ProductStockFacts } from '@bask/core';

import {
  REORDER_CYCLE_DAYS,
  buildRecommendations,
  coverSentence,
  flagFor,
  risingCategoriesFrom,
  suggestQuantity,
  toStockRow,
  workingsFor,
} from '../src/server/inventory-rules';

/**
 * The reorder engine's contract: every recommended line carries a *because*,
 * and that because is arithmetic the owner can check on the same screen
 * (PRODUCT_SPEC §12 explainability rule).
 *
 * Days-remaining itself is not re-tested here — it is produced by
 * `packages/db`'s `buildFacts` and covered by that package's suite. What is
 * tested is that Lane 4 never invents a number the rollup did not give it.
 */

function stock(overrides: Partial<ProductStockFacts> = {}): ProductStockFacts {
  return {
    productId: 'p1',
    sku: 'BSK-10007',
    name: 'Botanical Sunshine Revitalizing Bronzer',
    category: 'bronzer',
    onHand: 30,
    reorderPoint: 10,
    parLevel: 60,
    retailPrice: 53,
    wholesaleCost: 35,
    dailyVelocity: 1,
    daysRemaining: 30,
    unitsSoldInWindow: 30,
    daysSinceLastSale: 1,
    ...overrides,
  };
}

const row = (overrides: Partial<ProductStockFacts> = {}) =>
  toStockRow(stock(overrides), { brand: 'Hempz', size: '9oz' });

describe('flagFor', () => {
  it('calls an empty shelf critical', () => {
    expect(flagFor(stock({ onHand: 0, daysRemaining: 0 }))).toBe('critical');
  });

  it('calls a week or less of cover critical', () => {
    expect(flagFor(stock({ onHand: 6, daysRemaining: 6 }))).toBe('critical');
  });

  it('calls a shelf at or under its reorder point a reorder', () => {
    expect(flagFor(stock({ onHand: 10, reorderPoint: 10, daysRemaining: 25 }))).toBe('reorder');
  });

  it('calls cover under the detector threshold a reorder even above the point', () => {
    expect(
      flagFor(stock({ onHand: 12, reorderPoint: 5, daysRemaining: THRESHOLDS.lowStockDays - 1 })),
    ).toBe('reorder');
  });

  it('calls four months or more of cover overstock', () => {
    expect(flagFor(stock({ onHand: 40, daysRemaining: THRESHOLDS.overstockDays + 1 }))).toBe(
      'overstock',
    );
  });

  it('calls a product that never moves overstock, not healthy', () => {
    expect(flagFor(stock({ onHand: 16, dailyVelocity: 0, daysRemaining: null }))).toBe('overstock');
  });
});

describe('the arithmetic shown to the owner', () => {
  it('spells out units, pace and the division', () => {
    expect(workingsFor(stock({ onHand: 13, dailyVelocity: 1.567, daysRemaining: 8.3, unitsSoldInWindow: 47 })))
      .toBe('47 sold in 30 days = 1.57 a day. 13 on the shelf ÷ 1.57 = 8.3 days.');
  });

  it('refuses to divide by a pace of zero', () => {
    expect(workingsFor(stock({ dailyVelocity: 0, daysRemaining: null }))).toContain(
      'no pace to divide by',
    );
  });

  it('states cover in days, singular when it is one', () => {
    expect(coverSentence(stock({ daysRemaining: 1 }))).toBe('About 1 day left at the current pace.');
    expect(coverSentence(stock({ daysRemaining: 8.3 }))).toBe(
      'About 8 days left at the current pace.',
    );
  });
});

describe('suggestQuantity', () => {
  it('tops the shelf up to par, rounded to a full case', () => {
    // par 60 − 13 on hand = 47 → two cases short of 48.
    expect(suggestQuantity(stock({ onHand: 13, parLevel: 60 }))).toBe(48);
  });

  it('never suggests less than one case', () => {
    expect(suggestQuantity(stock({ onHand: 59, parLevel: 60 }))).toBe(6);
  });
});

describe('buildRecommendations — every line says why', () => {
  it('gives every line a non-empty reason', () => {
    const rows = [
      row({ productId: 'a', onHand: 4, reorderPoint: 4, daysRemaining: 13.3, dailyVelocity: 0.3 }),
      row({ productId: 'b', onHand: 6, reorderPoint: 2, daysRemaining: 20, dailyVelocity: 0.3 }),
    ];
    const recommendations = buildRecommendations(rows, []);
    expect(recommendations).toHaveLength(2);
    for (const line of recommendations) expect(line.reason.length).toBeGreaterThan(0);
  });

  it('attributes a shelf at its threshold to the threshold, and quotes both numbers', () => {
    const [line] = buildRecommendations([row({ onHand: 4, reorderPoint: 4 })], []);
    expect(line!.reasonKind).toBe('below_threshold');
    expect(line!.reason).toContain('4 on the shelf against a threshold of 4');
  });

  it('attributes a shelf that will not reach the next delivery to sell-through pace', () => {
    const [line] = buildRecommendations(
      [row({ onHand: 6, reorderPoint: 2, dailyVelocity: 0.3, daysRemaining: 20 })],
      [],
    );
    expect(line!.reasonKind).toBe('sell_through_pace');
    expect(line!.reason).toContain(`${REORDER_CYCLE_DAYS}-day gap`);
    expect(line!.reason).toContain('0.30 a day');
  });

  it('attributes a well-stocked product in a rising category to the lift', () => {
    const [line] = buildRecommendations(
      [
        row({
          category: 'spray_solution',
          onHand: 24,
          reorderPoint: 4,
          dailyVelocity: 0.8,
          daysRemaining: 30,
        }),
      ],
      [{ key: 'spray', label: 'Spray tans', changePercent: 37.6 }],
    );
    expect(line!.reasonKind).toBe('seasonal_lift');
    expect(line!.reason).toContain('Spray tans are up 37.6%');
  });

  it('leaves a healthy product out of the order entirely', () => {
    expect(
      buildRecommendations([row({ onHand: 60, reorderPoint: 4, daysRemaining: 60 })], []),
    ).toHaveLength(0);
  });

  it('puts threshold breaches before pace before seasonal lift', () => {
    const rows = [
      row({
        productId: 'lift',
        category: 'spray_solution',
        onHand: 24,
        reorderPoint: 4,
        dailyVelocity: 0.8,
        daysRemaining: 30,
      }),
      row({ productId: 'pace', onHand: 6, reorderPoint: 2, dailyVelocity: 0.3, daysRemaining: 20 }),
      row({ productId: 'threshold', onHand: 4, reorderPoint: 4, daysRemaining: 13 }),
    ];
    expect(
      buildRecommendations(rows, [{ key: 'spray', label: 'Spray tans', changePercent: 37.6 }]).map(
        (l) => l.reasonKind,
      ),
    ).toEqual(['below_threshold', 'sell_through_pace', 'seasonal_lift']);
  });

  it('skips products with no wholesale cost — they cannot be ordered', () => {
    expect(buildRecommendations([row({ onHand: 1, wholesaleCost: null })], [])).toHaveLength(0);
  });
});

describe('risingCategoriesFrom', () => {
  const trend = (overrides: Partial<CategoryTrendFacts>): CategoryTrendFacts => ({
    key: 'spray',
    label: 'Spray tans',
    currentCount: 194,
    baselineCount: 141,
    currentRevenue: 2115,
    baselineRevenue: 1305,
    ...overrides,
  });

  it('only counts movement past the anomaly threshold', () => {
    const rising = risingCategoriesFrom([
      trend({}),
      trend({ key: 'uv', label: 'UV sessions', currentCount: 897, baselineCount: 904 }),
    ]);
    expect(rising.map((r) => r.key)).toEqual(['spray']);
    expect(rising[0]!.changePercent).toBeCloseTo(37.6, 1);
  });

  it('does not divide by a zero baseline', () => {
    expect(risingCategoriesFrom([trend({ baselineCount: 0 })])).toHaveLength(0);
  });
});
