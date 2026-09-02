# docs/agnostic — the industry-agnostic version of this pipeline

Design and analysis, 2026-08-27. **No code was changed and no database was touched** producing
this; it is a design job, and the salon product has a demo riding on the repo.

**Directive (owner, verbatim):** "build a version of this app that is agnostic to any industry so
imagine the simple pipeline of data to opportunity to training corpus to marketing sales action
automated in its creation to measured result but it could be applied to car sales manufacturing
sales medical office sales etc"

## Read in this order

| Doc | What it answers |
|---|---|
| `01-architecture.md` | The generalized pipeline: invariant core, the 5 missing core primitives, the 13-artifact vertical-pack manifest, stage-by-stage mechanism/contract/content split, stress test against car sales / manufacturing / medical |
| `02-inventory.md` | What in the repo is already generic vs. salon-coupled, per stage, with `file:line` for every claim |
| `03-worked-example-manufacturing.md` | One vertical taken end to end on paper, so the abstraction is tested rather than asserted |
| `04-recommendation.md` | Refactor this repo or start a new one, with the sequence and the decision rule |

## The four findings that shaped the design

1. **The seam is the facts shape, not the vocabulary.** `SalonFacts`
   (`packages/core/src/insights/facts.ts:160-172`) is the deep coupling — every detector,
   benchmark, dollar-izer, segment, and settle rule is a function of it. Thresholds, prompts and
   copy are shallow couplings sitting on top.
2. **The repo already contains both target shapes.** Bask is the consumer/visit model; Compass's
   `Account`/`ContactLog`/`SignalSnapshot`/`CoachingRequest` cluster
   (`packages/db/prisma/schema.prisma:1094-1190`) is already an account-based B2B model, welded
   to the vertical by one line (`Account.salonId @unique`, `schema.prisma:1096`).
3. **Two of the five pipeline stages are aspirational for salon too.** The training corpus has
   1,007 claims and zero consumers (`retrieve()` is uncalled, `knowledge_chunk` has 0 rows), and
   "measured result" is generative simulation, not observation
   (`packages/db/src/ports.ts:196`). Generalizing means *building* those, not porting them.
4. **The live threshold bug is the design's cautionary tale.** Detectors use absolute percentage
   points tuned to ~21% fixture attachment; real attachment is 5.28%, so the flagship detector
   fires nothing — and the fix (`packages/core/src/insights/scaling.ts`, abs-OR-relative
   `MaterialityRule`) is written and calibrated against the real 12-year dataset (measurements cited in its doc-comment), but has no unit tests and is wired to nothing.
   The pack interface therefore accepts only relative-capable thresholds, and wiring it is
   Phase 1 of the recommendation — the same work fixes the salon product.

## Commercial grounding

Not speculative generalization. Nick asked for it: API-pluggable into other platforms, and his
new salesperson Angie sells wellness/spa/sauna/gym, explicitly not tanning — "sector-agnostic
architecture matters to him commercially" (`docs/meetings/2026-08-19-nick-debrief.md:133-135`).
