# TASK — the average member tenure sweep

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/insights/sweeps/tenure.ts`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT-SWEEPS.md` first.**

## Why this one matters

Average member tenure is **the headline metric of this whole product and it is computed nowhere
today**. The client's equipment pitch rests on it: members stay about two and a half months, adding
modalities pushes that toward three and a half, and *"that's worth more than another customer."*

## The file

Doc comment:

```ts
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
```

Exported input type:

```ts
export interface MemberTenureRow {
  membershipId: string;
  /** ISO date, e.g. '2026-04-02'. */
  startedAt: string;
  /** ISO date, or null when the membership is still running. */
  cancelledAt: string | null;
  /** How many distinct modalities this member's tier includes. */
  modalityCount: number;
}
```

Exported constants:

```ts
export const MIN_COHORT = 12;
/** Below this many members the average is noise, not a finding. */
export const MIN_MEMBERS = 25;
/** Months of tenure below the cohort median before it is worth saying. */
export const TENURE_GAP_MONTHS = 0.3;
export const DAYS_PER_MONTH = 30.44;
```

Exported helpers:

```ts
/** Whole days between two ISO dates. Never negative. */
export function daysBetween(fromIso: string, toIso: string): number
/** Mean tenure in months, one decimal. Returns 0 for an empty list. */
export function averageTenureMonths(rows: readonly MemberTenureRow[], todayIso: string): number
```

`daysBetween` parses with `Date.parse` on the ISO strings and divides by 86_400_000, flooring the
result, clamped at 0. It must not use `new Date()` with no argument.

Main function:

```ts
export function sweepTenure(
  rows: readonly MemberTenureRow[],
  cohortMedianMonths: number,
  cohortSize: number,
  ctx: DetectorContext,
): InsightDraft[]
```

Behaviour, in order:

1. Return `[]` if `rows.length < MIN_MEMBERS` or `cohortSize < MIN_COHORT`.
2. Compute `ours = averageTenureMonths(rows, ctx.today)`.
3. Compute `gap = round(cohortMedianMonths - ours, 1)`. Return `[]` if `gap < TENURE_GAP_MONTHS` —
   being at or above the cohort is not a finding.
4. Split rows into those with `modalityCount >= 3` and those below, and compute each group's average
   tenure. Call them `richMonths` and `leanMonths`.
5. Emit exactly one `InsightDraft`:
   - `dedupeKey`: `` `member_tenure_gap:${ctx.salonId}` ``
   - `type`: `'member_tenure_gap'`
   - `severity`: `'high'` when `gap >= 0.6`, otherwise `'medium'`
   - `title`: `` `Your members leave sooner than the group` ``
   - `summary`: `` `Members stay ${ours} months here against ${cohortMedianMonths} for salons your size. Members on three or more modalities stay ${richMonths} months.` ``
   - `impactEstimate`: `0` and `impactCurrency`: `ctx.currency` — **this sweep is not money-denominated**, so it is exempt from the `minImpact` floor.
   - `linkedActionType`: `'review_membership'`
   - `linkedActionRef`: `{ salonId: ctx.salonId, richMonths, leanMonths }`
   - `primaryActionLabel`: `'See what longer-staying salons added'`
   - `forDate`: `ctx.today`
   - `evidence`: built with `buildMetric`, `buildWindow` and `buildComparison`, version
     `EVIDENCE_VERSION`, comparing ours against the cohort median in months.

Use `round(x, 1)` for every month figure that reaches a string.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/insights/sweeps/tenure.ts`
- Do NOT create or modify any other file. Do NOT edit `types.ts`, `detectors.ts` or `index.ts`.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/core`
  reports zero errors naming this file; the file exports `MemberTenureRow`, `MIN_COHORT`,
  `MIN_MEMBERS`, `TENURE_GAP_MONTHS`, `DAYS_PER_MONTH`, `daysBetween`, `averageTenureMonths` and
  `sweepTenure`; and it contains a `return []` early exit.
- No `any`. No `new Date()` without an argument. No `Date.now()`. No `Math.random()`. No I/O.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
