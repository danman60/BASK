# Recommendation: refactor this repo, or a new one?

**Date:** 2026-08-27.

## Recommendation in one line

**Same monorepo, strangler-style: generalize `packages/core` in place behind the pack
interface, salon becomes `packages/verticals/salon`, and the second vertical is built here as
`packages/verticals/<x>` — no greenfield rewrite, and no structural work at all until the Nick
proof-of-concept engagement settles.** A separate repo happens later, if and only if the
commercial structure demands it (brand/licensing separation), by extracting the then-proven core
packages — not by starting one now.

## Reasoning

### Against a new repo now (greenfield)

1. **The generic core is not a design — it is working, tested code in this repo.** Evidence
   schema, detector engine, consent filter (196 lines of tests including
   disclosure-equals-filter), peer standing, AI client + guardrail walker, claim-provenance
   spine, ETL contract, demo harness. A new repo either copies all of it (instant fork drift
   against an actively developed original) or depends on it (which requires the extraction work
   anyway — so the new repo buys nothing except a second CI).
2. **A platform with zero live verticals keeps itself honest against nothing.** The salon
   product is the only thing that can prove a pack interface is real: if salon does not run
   *through* the interface, the interface is speculation. That forces colocation — the
   reference vertical and the core must move in the same commits while the seam is being cut.
3. **The known failure mode of "clean rewrite" here is concrete:** the 1,435-line schema, the
   fail-closed consent lesson (5 call sites read missing rows wrong before the single
   interpretation point — `consent/index.ts:41-48`), the pgbouncer/Migrate trap, the
   35+ file:line couplings in `02-inventory.md` — that accumulated knowledge is the expensive
   part, and a rewrite re-derives it.

### Against refactoring now (this month)

1. **A stakeholder demo rides on this repo** and another session is actively working in it.
   Cutting the deepest seam (`SalonFacts`, the schema enums, the settle path) is exactly the
   work that destabilizes the demo.
2. **The commercial sequence points the same way.** Nick's own sequence
   (`2026-08-19-nick-debrief.md:121-128`): paid Canadian-salon proof of concept → prove the
   number → *then* build the sellable product together. The agnostic platform is step 3. Doing
   step 3's surgery during step 1 risks step 1.
3. Rights to the Sun Link–hosted data are unresolved ("nor do we have rights yet",
   debrief:68-69) — the biggest multi-vertical data prize is gated on business development, not
   architecture.

### Why in-repo strangler wins

- The monorepo already has the right skeleton: `packages/core` is Prisma-free behind ports
  (`pipeline/ports.ts:1-9`); prisma multi-file schema support allows pack-owned schema
  fragments; pnpm/Turborepo make `packages/verticals/*` cheap.
- Compass's Account cluster already *is* the generic B2B supplier-side model
  (`schema.prisma:1094-1190`), coupled by one line (`Account.salonId @unique`). The unweld is a
  migration, not a rewrite.
- Salon stays the living reference pack, exercising every seam on every commit. When a second
  vertical lands (Angie's wellness/spa/gym book is the commercially obvious candidate — nearest
  to salon, a real salesperson already banned from tanning accounts, and it tests the interface
  with minimal new primitives before manufacturing/medical stress it), the interface gets its
  first real proof.

## Sequence (each phase independently shippable, demo never at risk)

**Phase 0 — now (done):** this design. No code.

**Phase 1 — low-risk in-repo prep that is *also* salon product work:**
- Wire `MaterialityRule` (`scaling.ts:56-110`) into `detectors.ts` — this is simultaneously the
  fix for detectors firing nothing on real data (5.28% attachment) and the first pack-interface
  migration. Same work, two payoffs.
- Extract frozen threshold constants (7 files) into per-detector config objects.
- Decide the fate of the six orphaned sweeps (wire or delete) and fix the
  `seasonal-pause.ts` `substring(4,6)` month bug.
- Rename-only migrations deferred (salonId→tenantId is churn with no behavior change — do it
  when the seam is actually being cut, not before).

**Phase 2 — cut the seam (post-POC, when the Nick engagement's shape is known):**
- `packages/verticals/salon/`: facts schema + rollups, detectors + thresholds, prompts +
  guardrail tables + templates, segments, settle definition, claim taxonomy, network manifest +
  signal taxonomy + benchmark definitions, guidance content, fixtures — the 13-artifact
  manifest from `01-architecture.md` §5, moved not rewritten.
- Core gains the 5 primitives (open entity, expected-event schedule, flow edges, agent
  dimension, window semantics) and the `task`/`direct` action types.
- Build the corpus→action consumer once, in core (retrieval grounding generation with
  citations) — it does not exist for any vertical yet.
- Exit gate: **salon runs entirely through the pack interface; `demo:verify` passes unchanged.**

**Phase 3 — second vertical proves the interface:** `packages/verticals/wellness-spa` (or
whichever vertical the commercial side picks first). Acceptance: zero core edits, or every core
edit is a named new primitive with a design note.

**Phase 4 — separate only if commerce demands:** if Bask-the-platform needs brand/ownership
separation from the UVALUX engagement (debrief open question #4), extract `packages/core` +
`packages/verticals/*` to a platform repo then — moving proven code with a proven interface.

## The decision rule, stated once

New repo when (a) a paying second-vertical customer exists, or (b) the ownership/licensing
structure requires the platform to live outside the UVALUX engagement. Until either is true,
generalizing in place against the living salon product is strictly cheaper and strictly more
honest.
