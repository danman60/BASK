# The industry-agnostic pipeline — architecture

**Date:** 2026-08-27.
**Directive (owner, verbatim):** "build a version of this app that is agnostic to any industry so
imagine the simple pipeline of data to opportunity to training corpus to marketing sales action
automated in its creation to measured result but it could be applied to car sales manufacturing
sales medical office sales etc"

**Commercial grounding:** the buyer independently asked for this. Nick wants the product
"API-pluggable into other platforms"; his new salesperson Angie sells wellness/spa/sauna/gym and
is explicitly *not* tanning; "sector-agnostic architecture matters to him commercially"
(`docs/meetings/2026-08-19-nick-debrief.md:133-135`). This document is not speculative
generalization — it is the architecture for a stated commercial requirement.

Companion docs: `02-inventory.md` (generic vs. coupled, file:line), `03-worked-example-manufacturing.md`
(one vertical end-to-end on paper), `04-recommendation.md` (refactor vs. new repo).

---

## 1. The pipeline, restated as a loop

```
        ┌────────────────────────────────────────────────────────┐
        ▼                                                        │
  DATA ──► OPPORTUNITY ──► (corpus grounds the) ACTION ──► MEASURED RESULT
  ingest    detectors       TRAINING CORPUS       generated,      settles back
  to facts  over facts      expert claims w/      approved,       into the same
                            provenance            sent            fact tables
        plus the NETWORK LAYER: the supplier's consent-gated view across
        many customers (benchmarks → call lists → coaching → outcomes)
```

The loop closes because a measured result is written as real rows into the same fact tables the
next sweep reads (`packages/db/src/ports.ts:194-195` — "a campaign that 'worked' means real
visits on the floor"). That closure is the product's central mechanism and it is already
vertical-neutral in *shape*: only the row types are salon's.

## 2. Design thesis: the seam is the facts shape, not the vocabulary

"Rename salon to business" fails immediately, and the inventory shows why: the deepest coupling
is `SalonFacts` (`packages/core/src/insights/facts.ts:160-172`). Every detector, benchmark,
dollar-izer, segment predicate, and settle rule is a **function of a vertical-defined data
shape**. The thresholds, prompts, and copy are shallow couplings sitting on top of that one deep
one.

So the architecture is three layers:

1. **Invariant core** — mechanisms that are already vertical-free (proven by the inventory):
   evidence schema, detector engine, insight lifecycle, pipeline ordering + ports, AI
   client/guardrail-walker/provenance pattern, approval workflow, consent
   ladder/filter/k-anonymity/audit, peer standing, outcome aggregation, claim-provenance spine,
   ETL contract mechanics, guidance-dictionary shapes, demo harness.
2. **Pack interface** — a typed contract the core consumes: the vertical's facts schema, detector
   set, thresholds-as-data, action types + channel schema, settle definition, consent field
   manifest, benchmark definitions, claim taxonomy, vocabulary.
3. **Vertical pack** — content + schema + queries implementing that interface for one industry.
   Salon is the first pack and the reference implementation.

The test of the design: **a new vertical is a pack directory plus fact-table migrations — zero
edits inside the core.**

## 3. What stays fixed (the invariant core)

Named against the real files (full citations in `02-inventory.md`):

| Core module | Today's implementation | Status |
|---|---|---|
| Evidence | `packages/core/src/evidence.ts` zod schema (metric/window/comparison/impact/factors/series/sentence) | Ship as-is |
| Insight engine | `insights/engine.ts` (isolation, money ranking, top-N), `types.ts` dedupe/lifecycle | Ship as-is; `DetectorContext.salonId` → `tenantId` |
| Pipeline | `pipeline/index.ts` stage ordering, `pipeline/ports.ts` Prisma-free ports | Ship as-is |
| Materiality | `insights/scaling.ts` abs-OR-relative `MaterialityRule` | **Promote to the core threshold primitive** (today: written and calibrated against the real 12-year dataset, but untested and wired to nothing) |
| AI layer | `core/src/ai/client.ts` (generateJson, prompt-hash cache, refusal handling, generation log), `guardrails.ts` walker, the "model writes prose, never numbers" pattern | Ship as-is; rule *tables* move to packs |
| Action workflow | `routers/marketing.ts` draft→edit→regenerate→schedule; sent/measured owned by the pipeline; consent-narrowed counts | Ship as-is; content schema moves to packs |
| Consent | `core/src/consent/index.ts` tier ladder, allow-list filter, k=8 suppression, disclosure-from-filter, audit | Ship as-is; the *field manifest* moves to packs |
| Network | `network/standing.ts` PeerMetric bands, `network/outcomes.ts` medians+floors, `compass/derive.ts` discipline (no naked scores, no invented figures, one exit) | Ship as-is; signal taxonomy + metrics move to packs |
| Corpus | `knowledge/curation/*` claim spine, alerts, audit; `chunk.ts`/`retrieve.ts` | Ship as-is; taxonomy moves to packs |
| Ingest | `salon-ingest/etl/contract.ts` mechanics (remapId, pure mappers, dry-run txn load), `profile.mjs` | Ship as-is; entity manifest + enum maps + mappers move to packs |
| Guidance | `<Guided>` primitives, dictionary *types*, tours/empty-state machinery | Ship as-is; entries move to packs |
| Demo harness | virtual clock, presenter panel, bookmarks, `demo:verify` | Ship as-is; fixtures move to packs |

Universal DB spine (tables that exist for every vertical): `Org`, `Location` (today `Salon`),
`Staff/Agent`, `Party` (the action target — person **or** company+contacts), `Product`,
`Insight`, `Action` (today `Campaign`), `KnowledgeClaim(+Event)`, `ConsentProfile(+Audit)`,
`ActivityEvent`, `AppLog`, `DemoState`, and the **Account cluster**
(`Account/AccountLifecycle/SignalSnapshot/ContactLog/CoachingRequest/Playbook`,
`schema.prisma:1094-1190`) — which the inventory found is already a generic B2B supplier-side
model, welded to salon by one line (`Account.salonId @unique`, `schema.prisma:1096`). Unweld it:
`Account.tenantId`.

## 4. Five missing core primitives

The stress test against car sales / manufacturing / medical (see §7) finds the current fact
model can only express **site-level, closed-transaction, visit-frequency rollups**. Five
primitives must be added to core — as optional modules a pack opts into, not as mandatory
complexity for simple verticals:

1. **Open entity with stage and age** (`Deal`/`Case`): id, party, owner (agent), stage (pack
   enum-as-lookup), value, opened_at, stage_entered_at. Powers: RFQ aging, car-sales funnel,
   referral cases. Today nothing represents an in-flight entity — every fact is a completed
   transaction (`insights` report, gap 1).
2. **Expected-event schedule**: per-party (or per-account) expected next event with due date —
   derived (median repurchase gap, order cadence) or clinical (recall interval). Powers: recall
   compliance, reorder-due, bottle depletion. Today only trailing-average baselines exist.
   (Compass's `orderRecencyDays` vs "usual cadence", `derive.ts:232-236`, is this primitive
   half-born.)
3. **Flow edges**: source → destination event links (referrals between providers, lead sources).
4. **First-class agent dimension**: per-rep/per-staffer keying on facts and actions. Exists once
   today (`StaffAttachmentFacts`, `facts.ts:43-50`); car sales needs it everywhere.
5. **Configurable window semantics**: cohort-by-entry-date windows and pack-defined comparison
   windows, not only trailing 30/60 days.

## 5. The vertical pack — the complete manifest

What a new industry supplies. Each artifact is the generalization of a thing that exists today
(cited), so nothing here is invented without a working instance.

| # | Pack artifact | Salon instance today | Form in the pack |
|---|---|---|---|
| 1 | **Entity schema module** — the vertical's fact tables | `Visit/Session/Sale/SaleLine/Membership/Package/Room/Booking` in `schema.prisma` | Prisma schema fragment (multi-file schema), migrations owned by the pack |
| 2 | **Ingest manifest** — source→entity map, enum translation tables (data, not code), field mappers, derivation rules with thresholds | `etl/run.ts:74-84` file list; `contract.ts:85-129` enum maps; 8 `map-*.ts`; 45/120-day recency in `map-customers.ts:56-60` | Manifest JSON + pure mapper functions + parameterized derivations; load order derived from the FK graph instead of hardcoded (`run.ts:92-101`) |
| 3 | **Facts schema + rollup queries** — the pack's `Facts` type and the query that fills it | `SalonFacts` (`facts.ts:160-172`) + `packages/db/src/facts.ts` (95-day window builder, `db/ports.ts:318-357`) | The central pack artifact. Core takes `buildFacts(tenantId, today) => PackFacts` through the ports. |
| 4 | **Detector set + thresholds-as-data** | `ALL_DETECTORS` (`detectors.ts:704-711`); frozen consts in 7 files | Pure `run(facts, ctx)` functions + a threshold config object per detector, every threshold a `MaterialityRule` (abs OR relative — `scaling.ts`), overridable per tenant |
| 5 | **Action types + channel/output schema** | One type: segment broadcast with 6 hardcoded B2C pieces (`campaign.ts:66-73`, `marketing.ts:62`) | Pack declares its action types from a core-supported set: `broadcast` (segment → channels), `direct` (1:1 message to a named contact), `task` (assigned to an agent, with talking points, due date, disposition — the Compass call-list shape promoted to a first-class action). Per-channel constraints (length, compliance suffix, tokens). |
| 6 | **Prompt persona + compliance clause + fallback templates** | `campaign.ts:193-205` system prompt; `campaign.ts:454-521` templates | Pack strings consumed by the invariant generation skeleton |
| 7 | **Guardrail rule table + offer/constraint model** | Tanning `MEDICAL_PATTERNS` + 25%/$50 caps (`guardrails.ts:41-86`); offer = discount only (`campaign.ts:55-62`) | Pack rule table for the generic walker; offer generalized to "constraint set" (max discount / no-price-promise / mandated disclaimer / no offer at all — Offer step becomes pack-optional in the wizard) |
| 8 | **Segment definitions + idea-shelf rules** | `segments.ts:95-146` visit-recency predicates; `marketing.ts:148-203` | Pack predicates over pack entities (accounts-by-quote-age, patients-by-recall-due) + surfacing thresholds |
| 9 | **Settle/attribution definition** | Fabricated: recipients × rng(0.16–0.24) same-day POS rows (`db/ports.ts:196-231`) | Pack defines: qualifying result event, match rule (source tag / quote linkage / appointment kept), attribution window + lag, value formula. Port shape survives; vocabulary generalizes `recipients/bookings/revenue` → `reached/responses/value`. In production the port *observes*; in demo the pack's simulation constants replace the hardcoded ones. |
| 10 | **Claim taxonomy + corpus sources** | `CLAIM_CATEGORIES` + `CLAIM_MOMENTS` (`curation/types.ts:22-41`); hardwired ingest fixture (`embed.ts:40-41`) | Pack supplies both taxonomies **together** (they cross-reference opportunity categories and the vertical's conversation model) + source/era config |
| 11 | **Network pack**: consent field manifest, signal taxonomy (one declarative table replacing the five parallel switch blocks in `derive.ts:368-647`), benchmark metric definitions + value-formula "workings", cohort predicates, playbook library, lifecycle vocabulary | `consent/index.ts:73-99`; `peers.ts:51-94, 297-364`; `derive.ts` switches | Declarative tables consumed by the invariant filter/derive/standing machinery |
| 12 | **Vocabulary + guidance content** | `guidance.ts` 448 lines ~80% salon | Pack dictionary entries in the core-typed shapes; core keeps `INSIGHT_UI`/`TOUR_UI`/`GUIDED_UI` |
| 13 | **Demo fixtures + story arcs** (this is a demo-first company — a pack without a demo is not sellable) | `packages/db/fixtures/` seeded arcs | Pack seed generator + pitch bookmarks |

## 6. Stage-by-stage: mechanism / contract / content

**Data.** Mechanism: profiler, remapId, pure mappers, dry-run transactional load, new-tenant
isolation, anonymize-at-extraction. Contract: `IngestPack = { manifest, enumMaps, mappers,
derivations }`. Content: the pack's tables and maps. The human-writes-the-mapping-off-the-profile
discipline (`salon-ingest/README.md:19-24`) stays — it is the honest answer to "every vertical's
POS/CRM/ERP export is different".

**Opportunity.** Mechanism: engine, evidence, dedupe, materiality. Contract:
`OpportunityPack = { FactsSchema, buildFacts, detectors[], thresholds }`. Content: pack
detectors. The 30%-vs-5–9% failure is the cautionary tale baked into the design: **absolute
thresholds are a bug class** (`scaling.ts:1-28` documents it against real data), so the pack
interface only accepts `MaterialityRule` abs-OR-relative pairs.

**Corpus.** Mechanism: claim spine, provenance, curation, retrieval-with-citation-safety.
Contract: `CorpusPack = { categories, moments, sources }`. Content: the vertical's expert
material (salon: Elaine/Mike/Sarah; car sales: closer recordings; manufacturing: veteran rep
know-how). Honesty note: the corpus→action consumer does not exist yet for salon either
(`retrieve()` has zero callers) — the generalization must include *building* that consumer once,
in core, as "claims ground generation": retrieval feeding the campaign/call-brief prompt context
with citations.

**Action.** Mechanism: generation skeleton, guardrail walker, approval workflow, lifecycle.
Contract: `ActionPack = { actionTypes, channels, prompts, guardrailRules, constraintModel,
segments, ideaRules }`. Content: per §5 rows 5–8. The key structural addition is the **task
action type** — the rep call task with disposition — which already exists in spirit as Compass's
call list (`compass.ts` callList + `ContactLog`) and just needs promotion to the same lifecycle
machinery campaigns use.

**Measured result.** Mechanism: settle-before-rollups ordering, real-rows writeback, ports.
Contract: `SettlePack = { qualifyingEvent, matchRule, window, valueFormula, (demo) simParams }`.
Content: per vertical — salon: visit+sale matched by source tag, same-day; manufacturing:
quote→won within 45 days, value at quote; medical: appointment kept within the recall interval.
Because writeback is real rows into pack fact tables, the Daybreak payoff generalizes for free —
the next sweep notices.

**Network.** Mechanism: consent ladder/filter/k-anonymity/audit/disclosure, derive discipline,
standing, outcomes. Contract: `NetworkPack` per §5 row 11. Content: per vertical. The consent
mechanism is the strongest part of the codebase for regulated verticals — the allow-list filter
makes customer-level data *structurally unrepresentable* (`consent/index.ts:21-26`), which is
the right shape for PHI — but medical needs two core upgrades: enforcement pushed from
in-process filtering to authn+RLS (already planned as M3), and per-purpose/expiring consent
grants (the `TIER_GROUPS` structure extends to this without changing filter mechanics,
`index.ts:103-107`).

## 7. Stress test against the three named verticals

| | Car sales | Manufacturing sales | Medical office sales |
|---|---|---|---|
| Party model | Person + household; **agent dimension everywhere** (per-salesperson close/attach) | **Company + contacts** (the Account cluster shape) | Patient + referring provider (**flow edges**) |
| Commercial event | Deal (open entity: lead→test drive→desk→F&I→close, weeks long) | Quote/RFQ (open entity, aged), then order | Encounter/appointment; recall schedule (**expected-event**) |
| Opportunity examples | Finance-attach slip per rep (maps ~1:1 to `retail_attachment_slip` with relative thresholds + agent dimension); aged deals; service-lapse | RFQ aging; account dormant vs own cadence; category gap vs cohort (direct reuse of `category-gap.ts`); concentration risk (**needs share-of-total fact**) | Recall non-compliance (structurally = `first_visit_lapse`); referral-flow decline (**needs flow edges**) |
| Action | Task-to-salesperson + 1:1 SMS/email; broadcast for service marketing | 1:1 email to named contact + rep task; **no consumer broadcast at all** — a pack with zero `broadcast` actions must be legal | Recall reminder (direct, compliance-constrained, offer-less); guardrails *invert* — must contain clinical content while excluding PHI from bodies |
| Result | Deal stage → won; long lag; per-agent | Quote won within window; value known at quote time | Appointment kept; audit-grade per-recipient delivery |
| Network layer | OEM→dealer network: **near-isomorphic to Compass today** (Account/territory/lifecycle map directly; `reorder_due` → allocation/inventory-turn) | Distributor→industrial customers: order-cadence machinery is the strongest fit; benchmark coefficients must be throughput-based, not visit-based | Supplier→practices: consent mechanism right-shaped; needs RLS enforcement + per-purpose grants + a PHI stance on free-text (`ContactLog` notes render verbatim at coaching tier, `derive.ts:88-90`) |

A design that only handled repeat-visit consumer retail would fail columns 1–3 at: open
entities, agent dimension, company parties, offer-less compliance-first actions, lagged
attribution, and expected-event schedules. Those are exactly the §4 primitives plus the §5
action-type generalization — which is why they are in the design.

## 8. Honest constraints the design inherits

1. **Two pipeline stages are aspirational for salon too.** Corpus→action has no consumer
   (`retrieve()` uncalled, 0 chunk rows); measurement is generative simulation
   (`db/ports.ts:196`). The agnostic platform must build both once, in core — it is not
   "porting" them.
2. **The salon detectors currently fire nothing on real data** (absolute thresholds vs 5.28%
   real attachment; fix written in `scaling.ts`, unwired). Wiring `MaterialityRule` is both the
   salon fix and the first pack-interface migration — the same work.
3. **Consent enforcement is demo-grade** (in-process filter, role from URL, no RLS). The
   contract survives; regulated verticals gate on the M3 hardening.
4. **Network cohort data is fixture-synthesized** (`peers.ts:37-66`) — real cohorts need n
   real tenants per vertical before Peers is honest.
