# TASK — the tenure and membership metrics module

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/metrics/membership.ts`

You will need to create the `metrics` directory.

## What this is

The metric definitions the client's own coaching already uses, computed. These were given on stage
at the 2026 Expo by their data coach, and using **his** definitions rather than ours is what makes
the output read as UVALUX's coaching instead of a vendor's invention.

- **RPS — revenue per session.** Revenue divided by sessions.
- **Distinct customers.** People, not visits: *"if there's two of us and we each come ten times,
  that's twenty sessions but two distinct customers."*
- **Sessions per unique customer.** Sessions divided by distinct customers.
- **Distinct customer annual revenue.** Annual revenue divided by distinct customers. His worked
  example on stage was $108 at one store.
- **Average member tenure.** The headline metric of this product, and the one nothing in the codebase
  computes today.

## Pure functions only

No database, no clock reads, no I/O. Every function takes rows and returns numbers. Same input,
same output.

## The file

Doc comment:

```ts
/**
 * Membership and revenue metrics, using the definitions UVALUX's own coaching
 * teaches rather than ones we invented — that is what makes the output theirs.
 *
 * Average member tenure is the load-bearing one: the equipment case rests on
 * "add a modality, hold members a month longer, and the machine pays for
 * itself." Nothing in the product computed it before this file.
 */
```

Types:

```ts
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
```

Constants:

```ts
export const DAYS_PER_MONTH = 30.44;
export const MS_PER_DAY = 86_400_000;
```

Helpers, each exported:

```ts
/** Whole days between two ISO dates. Never negative. */
export function daysBetween(fromIso: string, toIso: string): number

/**
 * Tenure of one membership in days, as of `todayIso`.
 * A membership that has NOT been cancelled counts up to today — it is still
 * accruing, and excluding it understates a healthy salon badly.
 */
export function tenureDays(span: MembershipSpan, todayIso: string): number

/** Mean tenure in months, one decimal. Zero for an empty list. */
export function averageTenureMonths(spans: readonly MembershipSpan[], todayIso: string): number

/** Safe division: returns 0 when the denominator is 0. */
export function ratio(numerator: number, denominator: number): number
```

`daysBetween` uses `Date.parse` on the two ISO strings, subtracts, divides by `MS_PER_DAY`, floors,
and clamps at 0. **It must not call `new Date()` with no argument** — the demo clock is virtual and
a real clock read breaks reproducibility.

`ratio` rounds to two decimals.

Main function:

```ts
export function membershipMetrics(
  totals: SalonPeriodTotals,
  spans: readonly MembershipSpan[],
  todayIso: string,
): MembershipMetrics
```

It returns:
- `revenuePerSession`: `ratio(totals.revenue, totals.sessions)`
- `sessionsPerCustomer`: `ratio(totals.sessions, totals.distinctCustomers)`
- `revenuePerCustomer`: `ratio(totals.revenue, totals.distinctCustomers)`
- `averageTenureMonths`: `averageTenureMonths(spans, todayIso)`
- `activeMembers`: the count of spans whose `cancelledAt` is null

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/metrics/membership.ts`
- Do NOT create or modify any other file. Do NOT edit `index.ts`.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/core`
  reports zero errors naming this file; the file exports `MembershipSpan`, `SalonPeriodTotals`,
  `MembershipMetrics`, `DAYS_PER_MONTH`, `MS_PER_DAY`, `daysBetween`, `tenureDays`,
  `averageTenureMonths`, `ratio` and `membershipMetrics`.
- No `any`. No `new Date()` without an argument. No `Date.now()`. No `Math.random()`. No I/O.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
