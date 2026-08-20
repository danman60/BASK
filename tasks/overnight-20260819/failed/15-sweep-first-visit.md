# TASK — the first-visit-never-returned sweep

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/insights/sweeps/first-visit.ts`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT-SWEEPS.md` first.**

## Why this one matters

The cheapest retention win in any subscription business: people who came exactly once and never came
back. It needs only visit counts, so it works on the thinnest data any salon can give us.

## The file

Doc comment:

```ts
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
```

Exported input type:

```ts
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
```

Exported constants and helper:

```ts
export const MIN_CUSTOMERS = 8;
/** Days after a first visit before never-returned means anything. */
export const GRACE_DAYS = 21;
/** Beyond this, they are cold rather than winnable, and a different sweep's problem. */
export const STALE_DAYS = 180;

/** Whole days between two ISO dates. Never negative. */
export function daysBetween(fromIso: string, toIso: string): number
```

`daysBetween` parses with `Date.parse` and divides by 86_400_000, flooring, clamped at 0. It must
not call `new Date()` with no argument.

Main function:

```ts
export function sweepFirstVisit(rows: readonly FirstVisitRow[], ctx: DetectorContext): InsightDraft[]
```

Behaviour, in order:

1. Keep rows where `visitCount === 1`, `hasMembership === false`, and the days between
   `firstVisitAt` and `ctx.today` are **greater than `GRACE_DAYS` and at most `STALE_DAYS`**.
2. Return `[]` if fewer than `MIN_CUSTOMERS` survive.
3. `impact` is the sum of `secondVisitValue` across survivors, through `round(x, 2)`.
4. Return `[]` if `impact < ctx.minImpact`.
5. Emit exactly one `InsightDraft`:
   - `dedupeKey`: `` `first_visit_lapse:${ctx.salonId}` ``
   - `type`: `'first_visit_lapse'`
   - `severity`: `'medium'`
   - `title`: `` `${count} people came once and never came back` ``
   - `summary`: `` `They tried you in the last six months and have not returned. A second visit is what makes a first one pay for itself — about ${formatCurrency(impact, ctx.currency)} sitting in this list.` ``
   - `impactEstimate`: `impact`, `impactCurrency`: `ctx.currency`
   - `linkedActionType`: `'draft_reachout'`
   - `linkedActionRef`: `{ salonId: ctx.salonId, customerIds: <the surviving customerIds> }`
   - `primaryActionLabel`: `'Write them a first-visit note'`
   - `forDate`: `ctx.today`
   - `evidence`: `buildMetric` for the count and the money, `buildWindow` for the period, version
     `EVIDENCE_VERSION`.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/insights/sweeps/first-visit.ts`
- Do NOT create or modify any other file. Do NOT edit `types.ts`, `detectors.ts` or `index.ts`.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/core`
  reports zero errors naming this file; the file exports `FirstVisitRow`, `MIN_CUSTOMERS`,
  `GRACE_DAYS`, `STALE_DAYS`, `daysBetween` and `sweepFirstVisit`; and it contains a `return []`
  early exit.
- No `any`. No `new Date()` without an argument. No `Date.now()`. No `Math.random()`. No I/O.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
