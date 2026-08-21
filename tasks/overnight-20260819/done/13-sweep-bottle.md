# TASK — the bottle depletion sweep

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/insights/sweeps/bottle.ts`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT-SWEEPS.md` first.**

## Why this one matters

The client's own idea, in the room: nobody weighs a customer's bottle, but the salon tracks tans
used and the last purchase date, and it is *"about half an ounce per tan"* — so who is nearly empty
is computable from data that already exists. It prompts the reorder before the customer runs out and
buys somewhere else.

## The arithmetic already exists — CALL IT, DO NOT REWRITE IT

`estimateBottle` in `packages/core/src/health/customer-health.ts` already owns the half-ounce math,
the clamping and the `runningLow` / `likelyEmpty` flags. **Import it and call it.** A second copy of
that arithmetic in this file is exactly the duplication this instruction exists to prevent.

```ts
import { estimateBottle, type BottleEstimate } from '../../health/customer-health';
```

Its signature, for reference — do not redeclare it:

```ts
estimateBottle(params: { bottleSizeOz: number; tansSincePurchase: number; ouncesPerTan?: number }): BottleEstimate
```

`BottleEstimate` has `remainingOz`, `fractionLeft`, `runningLow`, `likelyEmpty`, `tansSincePurchase`.

## The file

Doc comment:

```ts
/**
 * Who is nearly out of product.
 *
 * An ESTIMATE built on an average, and the summary must say so — it is a prompt
 * for a human conversation, never a claim about a bottle nobody has looked at.
 *
 * The arithmetic belongs to `estimateBottle` in the health module. This sweep
 * only decides who is worth mentioning and what that is worth.
 */
```

Exported input type:

```ts
export interface BottleRow {
  customerId: string;
  /** Size of the bottle they last bought, in ounces. */
  bottleSizeOz: number;
  /** Tans taken since that purchase. */
  tansSincePurchase: number;
  /** What a replacement sells for, in ctx.currency. */
  replacementPrice: number;
}
```

Exported constant:

```ts
/** Fewer customers than this and it is not worth an insight card. */
export const MIN_CUSTOMERS = 5;
```

Main function:

```ts
export function sweepBottle(rows: readonly BottleRow[], ctx: DetectorContext): InsightDraft[]
```

Behaviour, in order:

1. For each row, call `estimateBottle({ bottleSizeOz, tansSincePurchase })`.
2. Keep the rows whose estimate has `runningLow === true` **or** `likelyEmpty === true`.
3. Return `[]` if fewer than `MIN_CUSTOMERS` survive.
4. `impact` is the sum of `replacementPrice` over the surviving rows, passed through `round(x, 2)`.
5. Return `[]` if `impact < ctx.minImpact`.
6. Emit exactly one `InsightDraft`:
   - `dedupeKey`: `` `bottle_depletion:${ctx.salonId}` ``
   - `type`: `'bottle_depletion'`
   - `severity`: `'medium'`
   - `title`: `` `${count} customers are close to empty` ``
   - `summary`: `` `Going by tans taken since their last bottle, about ${count} customers are nearly out — roughly ${formatCurrency(impact, ctx.currency)} of repeat business. This is an estimate, so ask rather than assume.` ``
   - `impactEstimate`: `impact`, `impactCurrency`: `ctx.currency`
   - `linkedActionType`: `'draft_reachout'`
   - `linkedActionRef`: `{ salonId: ctx.salonId, customerIds: <the surviving customerIds> }`
   - `primaryActionLabel`: `'See who to mention it to'`
   - `forDate`: `ctx.today`
   - `evidence`: `buildMetric` for the customer count and the money at stake, `buildWindow` for the
     period, version `EVIDENCE_VERSION`.

**The words "This is an estimate, so ask rather than assume." must appear in the summary verbatim.**

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/insights/sweeps/bottle.ts`
- Do NOT create or modify any other file. Do NOT edit `customer-health.ts`, `types.ts` or `index.ts`.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/core`
  reports zero errors naming this file; the file exports `BottleRow`, `MIN_CUSTOMERS` and
  `sweepBottle`; it imports and calls `estimateBottle`; and it contains a `return []` early exit.
- **The file must NOT contain the number 0.5 or the string `ouncesPerTan`** — that arithmetic lives
  in `estimateBottle` and duplicating it here is a gate failure.
- No `any`. No `new Date()` without an argument. No `Date.now()`. No `Math.random()`. No I/O.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
