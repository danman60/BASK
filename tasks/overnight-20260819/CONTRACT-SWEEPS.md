# CONTRACT — signal sweeps

**Supervisor-written. Task zero. NOT dispatched.** Read with `CONTRACT.md`.
Applies to every task whose target is under `packages/core/src/insights/sweeps/`.

---

## What a sweep is

A **pure function** that takes rows and returns findings. No database, no clock reads, no
randomness, no I/O, no `Date.now()`. Same input, same output, every time — that is what makes
`demo:reset && demo:advance` reproducible and what makes each sweep testable on its own.

Each sweep answers one question from `docs/SIGNAL_SWEEPS.md`, and every finding it emits carries an
**action a salon owner can take on Monday**. A sweep that only reports a number is not finished.
The client's own framing: *"It's not tracking minutes and putting butts in beds. It's what to do
with that data."*

## The shared types are already extended — do not touch them

The supervisor has already added the six new members to `INSIGHT_TYPES` and the three new members
to `LINKED_ACTION_TYPES` in `packages/core/src/insights/types.ts`. **No task edits that file.**
Each task's `type` and `linkedActionType` values are given in the task and are already legal.

New insight types now available: `member_tenure_gap` · `seasonal_pause` · `bottle_depletion` ·
`category_gap` · `first_visit_lapse` · `upgrade_headroom`.
New linked actions: `open_cohort` · `draft_reachout` · `review_membership`.

## Imports — every sweep file starts like this

```ts
import {
  buildComparison,
  buildMetric,
  buildWindow,
  formatCurrency,
  round,
  EVIDENCE_VERSION,
  type Evidence,
} from '../../evidence';
import type { DetectorContext, InsightDraft } from '../types';
```

Import only what the task actually uses — an unused import fails the gate.

**`Evidence` has exactly one schema and it lives in `evidence.ts`. Never declare a second shape.**

## The input type is declared IN THE SWEEP'S OWN FILE

Sweeps are leaf tasks: nothing imports another sweep, and nothing adds fields to `SalonFacts`.
Each task declares the row shape it needs in its own file and exports it. The supervisor wires
those to real queries afterwards.

## The function shape

```ts
export function sweepThing(rows: readonly ThingRow[], ctx: DetectorContext): InsightDraft[]
```

- Returns `[]` when there is nothing to say. **An empty array is a correct answer** — never invent a
  finding to have something to return.
- Never returns a finding whose `impactEstimate` is below `ctx.minImpact`, unless the task says the
  sweep is not money-denominated (tenure and seasonal pause are not).
- `forDate` is always `ctx.today`. Never derive a date any other way.
- `dedupeKey` is `<type>:<subject>` and **never contains a date** — re-running tomorrow must update
  the standing insight, not pile up a duplicate, and a dismissal has to stick.

## Guardrails that apply to every sweep

- **Cohort minimum.** Any comparison against other salons is suppressed when the cohort has fewer
  than **12** salons. A benchmark built from a handful of salons identifies them. Export the
  constant as `MIN_COHORT = 12` in the file that needs it.
- **No customer names in `summary` or `title`.** Counts and segments only. Names belong in the
  worklist UI, behind the consent layer, never in an insight headline.
- **Estimates must say they are estimates** in their `summary` wording where the task says so.

## Reuse — checked before these tasks were written

- **`estimateBottle` already exists** in `packages/core/src/health/customer-health.ts` and owns the
  half-ounce-per-tan arithmetic. The bottle sweep **imports and calls it**. Reimplementing that
  math is the failure this line exists to prevent.
- `buildMetric` / `buildWindow` / `buildComparison` / `formatCurrency` / `round` already exist in
  `evidence.ts`. Use them; do not hand-roll a metric object.
- The six detectors in `detectors.ts` cover attachment, payments, capacity, stock and anomalies.
  **No sweep re-detects any of those.**

## Severity

`'info' | 'low' | 'medium' | 'high' | 'critical'`. Each task states which to use. When a task gives
a rule (e.g. "high when the gap exceeds X"), follow it exactly.

## Voice for `title` and `summary`

Grade-7 plain English. The `title` states the finding, not the feature. The `summary` is one line
that would make sense read aloud. No jargon, no percentages without the base they are of.
