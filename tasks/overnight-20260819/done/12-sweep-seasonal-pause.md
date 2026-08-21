# TASK — the seasonal pause sweep

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/insights/sweeps/seasonal-pause.ts`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT-SWEEPS.md` first.**

## Why this one matters

Tanning is seasonal. The client, in his own words: *"if you're just doing tanning and summertime
comes, somebody will pause or cancel their membership."*

A naive recency model flags half the book every July, the owner opens the tool in the month they
**expect** to be quiet, sees a wall of red, and stops trusting it. **This is the single most likely
way the health monitor gets abandoned in a pilot.** This sweep is the thing that prevents it: it
separates *paused, expected, still a member* from *lapsed, unexpected, worth a call*.

## The file

Doc comment:

```ts
/**
 * Seasonal pause versus real lapse.
 *
 * Tanning has a summer trough. Treating an expected seasonal pause as churn
 * turns the board red every July and teaches the owner to ignore it, which is
 * worse than showing nothing. So a quiet member in a quiet month is reported as
 * PAUSED and is not counted as at-risk.
 *
 * The month profile is the salon's own history, never a constant — a salon with
 * a winter trough must not be judged against a summer one.
 */
```

Exported input types:

```ts
export interface MonthActivity {
  /** 1–12. */
  month: number;
  /** Visits in that month across all customers, from the salon's own history. */
  visits: number;
}

export interface PausedMemberRow {
  membershipId: string;
  /** ISO date of the last visit, or null if never. */
  lastVisitAt: string | null;
  /** True when the membership is frozen/on hold rather than cancelled. */
  frozen: boolean;
  /** True when the membership has been cancelled outright. */
  cancelled: boolean;
}
```

Exported constants and helpers:

```ts
export const MIN_MEMBERS = 20;
/** A month at or under this share of the salon's best month is a trough. */
export const TROUGH_RATIO = 0.75;

/**
 * True when `month` is a seasonal trough for this salon, judged against its own
 * busiest month rather than an assumption about the industry.
 */
export function isTroughMonth(profile: readonly MonthActivity[], month: number): boolean
```

`isTroughMonth` returns `false` when the profile is empty or the peak is 0. Otherwise it finds the
maximum `visits` in the profile and returns `true` when the named month's visits divided by that
peak is at or below `TROUGH_RATIO`.

Main function:

```ts
export function sweepSeasonalPause(
  rows: readonly PausedMemberRow[],
  profile: readonly MonthActivity[],
  ctx: DetectorContext,
): InsightDraft[]
```

Behaviour, in order:

1. Return `[]` if `rows.length < MIN_MEMBERS`.
2. Read the current month as an integer from `ctx.today` by taking characters 5 and 6 of the ISO
   string and calling `Number` on them. **Do not construct a Date to do this.**
3. Count `frozenCount` (rows where `frozen` is true and `cancelled` is false) and `cancelledCount`
   (rows where `cancelled` is true).
4. Return `[]` when `frozenCount === 0`.
5. Emit exactly one `InsightDraft`:
   - `dedupeKey`: `` `seasonal_pause:${ctx.salonId}` ``
   - `type`: `'seasonal_pause'`
   - `severity`: `'info'` when the current month is a trough, `'medium'` when it is not — a wave of
     pauses **outside** the quiet season is the real signal.
   - `title`: when it is a trough month, `` `${frozenCount} members are paused, which is normal for this month` ``; when it is not,
     `` `${frozenCount} members are paused outside your quiet season` ``
   - `summary`: when it is a trough month,
     `` `Your quiet season explains most of this. These members have not left — they are on hold, and ${cancelledCount} have actually cancelled.` ``;
     otherwise
     `` `This is not your quiet season, so these pauses are worth a look. ${cancelledCount} members have cancelled outright.` ``
   - `impactEstimate`: `0`, `impactCurrency`: `ctx.currency` — not money-denominated, exempt from
     the `minImpact` floor.
   - `linkedActionType`: `'review_membership'`
   - `linkedActionRef`: `{ salonId: ctx.salonId, frozenCount, cancelledCount, troughMonth: <the boolean> }`
   - `primaryActionLabel`: `'See who is on hold'`
   - `forDate`: `ctx.today`
   - `evidence`: `buildMetric` for the paused count and the cancelled count, `buildWindow` for the
     month, version `EVIDENCE_VERSION`.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/insights/sweeps/seasonal-pause.ts`
- Do NOT create or modify any other file. Do NOT edit `types.ts`, `detectors.ts` or `index.ts`.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/core`
  reports zero errors naming this file; the file exports `MonthActivity`, `PausedMemberRow`,
  `MIN_MEMBERS`, `TROUGH_RATIO`, `isTroughMonth` and `sweepSeasonalPause`; and it contains a
  `return []` early exit.
- No `any`. No `new Date()` without an argument. No `Date.now()`. No `Math.random()`. No I/O.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
