# TASK — the category gap sweep

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/insights/sweeps/category-gap.ts`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT-SWEEPS.md` first.**

## Why this one matters

This is the client's four-year-old idea, in his words: *"You sell 35 tanning lotion while the
industry average is 22 — are you above or below? Scoreboard it."* He raised moisturizers
specifically as the category salons underplay.

It runs on **purchase data he already owns**, for roughly 300 Canadian salons, needing nobody's
permission — which is why it is the sweep the pilot can start with on day one.

## Units, not dollars

He asked the question in units, and units survive price differences between salons. This sweep
compares **units per 100 customers**.

## The file

Doc comment:

```ts
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
```

Exported input type:

```ts
export interface CategoryRow {
  category: string;
  /** This salon's units per 100 customers. */
  units: number;
  /** The cohort median, same measure. */
  cohortMedian: number;
  /** What one more unit is worth, in ctx.currency. */
  unitValue: number;
}
```

Exported constants:

```ts
export const MIN_COHORT = 12;
/** Below this share of the cohort median, a category is a gap. */
export const GAP_RATIO = 0.6;
/** How much of the gap we claim is realistically closable. */
export const CLOSABLE_SHARE = 0.5;
```

Exported helper:

```ts
/** Money at stake in closing half of one category's gap. Never negative. */
export function gapValue(row: CategoryRow): number
```

`gapValue` returns `round(Math.max(0, row.cohortMedian - row.units) * CLOSABLE_SHARE * row.unitValue, 2)`.

Main function:

```ts
export function sweepCategoryGap(
  rows: readonly CategoryRow[],
  cohortSize: number,
  ctx: DetectorContext,
): InsightDraft[]
```

Behaviour, in order:

1. Return `[]` if `cohortSize < MIN_COHORT`.
2. Keep rows where `cohortMedian > 0` and `units / cohortMedian <= GAP_RATIO`.
3. Sort the survivors: **rows with `units === 0` first**, then by `gapValue` descending.
4. Take at most the top **3**.
5. Drop any whose `gapValue` is below `ctx.minImpact`.
6. Return `[]` if nothing survives.
7. Emit one `InsightDraft` per surviving row:
   - `dedupeKey`: `` `category_gap:${ctx.salonId}:${row.category}` `` — note it carries the category
     and never a date, so tomorrow's run updates rather than duplicates.
   - `type`: `'category_gap'`
   - `severity`: `'high'` when `row.units === 0`, otherwise `'medium'`
   - `title`: when `units === 0`, `` `You sell no ${row.category}` ``; otherwise
     `` `${row.category} is behind salons your size` ``
   - `summary`: `` `You sell ${row.units} per 100 customers where similar salons sell ${row.cohortMedian}. Closing half that gap is about ${formatCurrency(gapValue(row), ctx.currency)}.` ``
   - `impactEstimate`: `gapValue(row)`, `impactCurrency`: `ctx.currency`
   - `linkedActionType`: `'open_cohort'`
   - `linkedActionRef`: `{ salonId: ctx.salonId, category: row.category }`
   - `primaryActionLabel`: `'See the products'`
   - `forDate`: `ctx.today`
   - `evidence`: `buildComparison` for us against the cohort, `buildMetric` for the units, version
     `EVIDENCE_VERSION`.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/insights/sweeps/category-gap.ts`
- Do NOT create or modify any other file. Do NOT edit `types.ts`, `detectors.ts` or `index.ts`.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/core`
  reports zero errors naming this file; the file exports `CategoryRow`, `MIN_COHORT`, `GAP_RATIO`,
  `CLOSABLE_SHARE`, `gapValue` and `sweepCategoryGap`; and it contains a `return []` early exit.
- No `any`. No `new Date()` without an argument. No `Date.now()`. No `Math.random()`. No I/O.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
