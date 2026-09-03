# Live opportunity feed behind a flag — 2026-09-02

**Purpose line:** This exists so that the "6 ways to grow your business today" block on Today is
derivable from real data instead of hardcoded fixtures, behind an env flag that defaults OFF.

**Overriding constraint:** a demo runs in hours. Default build must be byte-identical in behaviour.

## Prior work reviewed
- `packages/core/src/opportunities/derive.ts\n` (newline IN the filename, nothing imports it):
  assigns `OPPORTUNITY_CATEGORY_LABEL.retail` ('Retail') into `category`, typed `OpportunityCategory`
  ('retail'); same bug for confidence + urgency. Never typechecked. `impactLabel` renders `+4260/USD`.
  **Signals-object shape is reusable; body is discarded.**
- `attribution.ts.rejected`: campaign→coaching outcome attribution. Different concern. Not used.

## Steps
1. `packages/core/src/opportunities/derive.ts` (new file, correct name) — PURE. Takes an
   `OpportunitySignals` struct, returns `Opportunity[]` ranked by `impactMonthly` desc. No db import.
   Acceptance: `npx tsc --noEmit` clean; every field satisfies `Opportunity`.
2. `packages/core/src/index.ts` — export `deriveOpportunities` + `OpportunitySignals`.
   Acceptance: importable from `@bask/core`.
3. `apps/web/src/lib/opportunity-data.ts` (new) — `loadOpportunities(salon, today)`. Reads rows via
   `import { db } from '@bask/db'`, mirroring `today-data.ts`. Computes signals, calls the pure fn.
   Acceptance: returns `Opportunity[]` against the live demo salon.
4. `apps/web/src/app/(bask)/page.tsx` — one gated expression:
   `process.env.BASK_LIVE_OPPORTUNITIES === '1' ? await loadOpportunities(...) : DEMO_OPPORTUNITIES`.
   Acceptance: flag unset → identical render (6 fixture cards); flag=1 → derived cards, no error.

## Rules held
- Impact formulas must survive a data specialist reading them; each is a stated arithmetic
  identity, not a magic constant.
- Counts and names in actions come from real rows. Draft copy is authored (it is a draft for
  approval); numbers are never authored.
- `methodSource` only where the technique exists in `sources/experts.ts`. Off-peak capacity and
  stock cover stay bare — the fixtures set that precedent deliberately.
- Derived ids are `opp-live-*`, so `networkProofFor` returns null and no peer proof is faked.
- No `demo:reset`. No deploy. Flag never written to a committed env file.
