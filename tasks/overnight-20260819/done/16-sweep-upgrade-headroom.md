# TASK — the upgrade headroom sweep

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/insights/sweeps/upgrade-headroom.ts`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT-SWEEPS.md` first.**

## Why this one matters

This is the client's equipment pitch, made per-customer instead of per-salon. His own words:
*"buy a cocoon — if you're on membership you can drive your membership from 89 to a hundred dollars,
120. And how many members do you think you have to upgrade in order to pay for that cocoon."*

Today that arithmetic is done by a human in a room with a spreadsheet. This finds the members who
are **already using enough to justify the next tier**, which is the honest version of the upsell:
they are getting more than they pay for, and the upgrade is a fair conversation rather than a squeeze.

## The file

Doc comment:

```ts
/**
 * Members who already use more than their tier.
 *
 * The honest upsell: these people are getting more value than they pay for, so
 * the next tier is a fair conversation rather than a squeeze. Members who are
 * NOT using what they already pay for are deliberately excluded — upgrading them
 * is how a salon earns a cancellation.
 */
```

Exported input type:

```ts
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
```

Exported constants and helper:

```ts
export const MIN_MEMBERS = 5;
/** Usage at or above this share of the tier's allowance is headroom. */
export const USAGE_RATIO = 0.9;

/** Monthly uplift if this member moved up a tier. Zero when there is nowhere to go. */
export function upliftFor(row: UpgradeRow): number
```

`upliftFor` returns `0` when `nextTierPrice` is null; otherwise
`round(Math.max(0, row.nextTierPrice - row.currentPrice), 2)`.

Main function:

```ts
export function sweepUpgradeHeadroom(rows: readonly UpgradeRow[], ctx: DetectorContext): InsightDraft[]
```

Behaviour, in order:

1. Keep rows where `nextTierPrice` is not null, `tierSessionAllowance > 0`, and
   `sessionsLastMonth / tierSessionAllowance >= USAGE_RATIO`.
2. Return `[]` if fewer than `MIN_MEMBERS` survive.
3. `monthlyUplift` is the sum of `upliftFor` across survivors, through `round(x, 2)`.
4. `annualUplift` is `round(monthlyUplift * 12, 2)`.
5. Return `[]` if `monthlyUplift < ctx.minImpact`.
6. Emit exactly one `InsightDraft`:
   - `dedupeKey`: `` `upgrade_headroom:${ctx.salonId}` ``
   - `type`: `'upgrade_headroom'`
   - `severity`: `'medium'`
   - `title`: `` `${count} members are using more than they pay for` ``
   - `summary`: `` `They are at or past what their tier is built around. Moving them up is worth about ${formatCurrency(monthlyUplift, ctx.currency)} a month, or ${formatCurrency(annualUplift, ctx.currency)} a year — and it is a fair conversation, because they are already getting the value.` ``
   - `impactEstimate`: `monthlyUplift`, `impactCurrency`: `ctx.currency`
   - `linkedActionType`: `'review_membership'`
   - `linkedActionRef`: `{ salonId: ctx.salonId, membershipIds: <the surviving membershipIds>, monthlyUplift, annualUplift }`
   - `primaryActionLabel`: `'See who to talk to'`
   - `forDate`: `ctx.today`
   - `evidence`: `buildMetric` for the member count and the monthly uplift, `buildWindow` for the
     month, version `EVIDENCE_VERSION`.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/insights/sweeps/upgrade-headroom.ts`
- Do NOT create or modify any other file. Do NOT edit `types.ts`, `detectors.ts` or `index.ts`.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/core`
  reports zero errors naming this file; the file exports `UpgradeRow`, `MIN_MEMBERS`, `USAGE_RATIO`,
  `upliftFor` and `sweepUpgradeHeadroom`; and it contains a `return []` early exit.
- No `any`. No `new Date()` without an argument. No `Date.now()`. No `Math.random()`. No I/O.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
