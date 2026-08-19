# Plan — Insights (Scoreboard) + Monitoring (Customer Health)
**Date:** 2026-08-19 · **Driver:** the Nick meeting (`docs/meetings/2026-08-19-nick-debrief.md`)
**Order:** this ships BEFORE the film re-cut. The film can't show the hero beats until they exist.

## Why these two, in Nick's words
- Scoreboard: *"You sell 35 tanning lotion while the industry average is 22 — are you above or
  below? Scoreboard it."* His four-year idea, already validated with owners in California.
- Monitoring: *"the customer health dashboard, the staff health — that's really interesting."*
  Plus the front-desk beat: *"it's been 85 days since Daniel last spent, this is what he
  generally likes."*

## What already exists — extend, do not rebuild
| Exists | Where | Gap |
|---|---|---|
| Percentile, cohort median, top quartile | `apps/web/src/server/peers.ts` (`percentileOf`, `loadPeers`) | Computed but barely surfaced — one line, "Ahead of X% of them" |
| Cohort definitions + consent gate | `server/peers.ts`, `MIN_COHORT_SIZE = 8` | Reusable as-is |
| Gap → campaign / coaching deep links | `insights/peers/page.tsx` (`CAMPAIGN_GOALS`, `COACHING_TOPICS`) | Reusable as-is |
| Customer segments, at-risk + reason, stats, timeline | `customers/CustomersSurface.tsx`, `trpc.customers.list` | No health *score*, no board view, no bulk action |
| Failed-payment recovery flow | `customers?view=recovery` | Reusable as the action pattern |

## A. Insights → Scoreboard
Promote rank from a footnote to the surface.

1. **Rank header per metric** — "You are in the top 18% of Ontario salons on retail attachment",
   with the cohort named and its size shown. Data already returned by `loadPeers`.
2. **Movement** — this month's percentile vs last month's, with direction. *Requires a stored
   monthly snapshot; see risk 1.*
3. **Scoreboard view** — all four metrics in one band chart, each showing you / cohort median /
   top quartile, so the whole standing reads in one glance.
4. **Consent honesty preserved** — the existing "switched off while sharing is private" state and
   the min-cohort-8 rule stay exactly as they are. No metric appears from a cohort too small to
   anonymize.

**Acceptance:** on the demo salon, `/insights/peers` states a rank sentence for each of the four
metrics, names the cohort and its size, and still renders the switched-off state when the salon's
tier is Private.

## B. Monitoring → Customer Health
1. **Health score** — per customer, from recency, frequency, spend trend and membership state.
   Banded: healthy / slipping / lapsed. Derived in `packages/core` so it is testable and the
   bands are one definition, not four.
2. **The board** — every customer on one grid, coloured by band, sortable, the way the Sims
   analogy Nick responded to actually looks.
3. **Slipping list with a ready action** — each one carries its reason ("been 85 days, usually
   buys X") and a drafted reach-out. Reuses the recovery-flow action pattern.
4. **Bottle depletion** — tans since purchase × ~0.5 oz vs bottle size = estimated remaining, and
   a prompt when it runs low. Nick supplied the constant; it is an ESTIMATE and the UI must say so.

**Acceptance:** the board renders every demo customer in a band; the slipping list is non-empty on
demo data and each row states its reason in words; bottle estimates are labelled as estimates.

## Risks / decisions
1. **Percentile movement needs history.** Nothing stores a monthly percentile snapshot today.
   Either add a small `peer_snapshot` table (migration, bask-scoped) or compute from existing
   rollups if they carry enough history. Decide before starting A2.
2. **`pnpm db:migration:new` is broken** under Prisma 7.9 — if a migration is needed, use the
   documented `migrate diff` workaround.
3. **Health scoring is business logic.** The weights are a judgement call about what "healthy"
   means for a tanning salon. Daniel or Nick sets them; I will not invent thresholds and present
   them as the industry's.
4. **Shared DB** — one owner per `demo:reset`, never during a demo.

## Out of scope, deliberately
Staff conversation recording (legal exposure, left out per Daniel 2026-08-19). Sun Link
integration. Anything touching the Floor, POS or booking.
