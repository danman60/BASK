# Inventory: generic vs. salon-coupled, by pipeline stage

**Date:** 2026-08-27. Derived from a full read of the code (four parallel read-only passes over
ingest/schema, insights/knowledge, action/measurement, compass/consent). Every claim cites
`file:line` against this repo at the time of writing.

Legend: **GENERIC** = survives unchanged for car dealers, manufacturers, medical offices.
**COUPLED** = must be replaced or parameterized per vertical.

---

## Stage 1 — Data (ingest + canonical schema)

### Generic

| Mechanism | Where |
|---|---|
| Format-agnostic profiler (JSON/NDJSON/CSV/TSV/SQLite/SQL dumps), read-only, emits `_profile.json`; mapping written by a human off the profile, never guessed | `packages/db/scripts/salon-ingest/profile.mjs`, `README.md:19-24` |
| Deterministic ID remap (`remapId(prefix, srcId)` → UUID) for cross-mapper FK consistency; `INGEST_NS` prevents dataset collisions | `etl/contract.ts:16-32` |
| Pure-mapper discipline: `(rows) => Input[]`, no I/O; orchestrator is the sole DB writer | `etl/contract.ts:7-11`, `etl/run.ts` |
| Dry-run-by-default load: whole insert in one transaction, rolled back unless `INGEST_CONFIRM=yes` — validates FKs/enums against the real schema, persists nothing | `etl/run.ts:154-168` |
| Batched idempotent inserts (5000/chunk, `skipDuplicates` + deterministic IDs) | `etl/run.ts:47-56, 93-101` |
| New-tenant isolation: load always creates a new Org, never touches other tenants | `etl/run.ts:10-12` |
| Anonymize-at-extraction pattern (ids/dates/money only; names synthesized from stable id hash) | `salontouch-extract.mjs:5-10`, `etl/map-customers.ts:16-42` |
| Schema conventions: uuid PKs, timestamptz, tenant id on every scoped table + RLS, "state machines are enums; business taxonomies are lookup tables" | `packages/db/prisma/schema.prisma:8-16` |
| Lookup-table extensibility already in use: `RoomType`, `Segment`, `Playbook` are rows, not enums — a pack adds rows, not migrations | `schema.prisma:433-449, 909-922, 1192-1207` |
| Insight/Campaign/ActivityEvent/ConsentProfile/KnowledgeClaim tables: `Insight.type` is a free string, evidence is JSON against one zod schema, `linkedActionType` free string — vertical-neutral by design | `schema.prisma:877-1000, 1006-1040, 1350-1361, 1377-1434` |
| Provenance labeling of inferred vs. translated mappings (visit↔sale same-day match documented as INFERRED) | `salontouch-extract.mjs:11-22` |

### Coupled

| Coupling | Where |
|---|---|
| Enum translation maps hardcoded in the contract: `STAFF_ROLE`, `bookingState`, `visitSource`, `membershipStatus`, `TENDER` | `etl/contract.ts:85-129` |
| Insert shapes named/typed for salons: `SalonInput`, `VisitInput` (checkedInAt/Out), `MembershipInput` (monthlyPrice, billingDayOfMonth) | `etl/contract.ts:133-183` |
| Recency thresholds hardcoded in a mapper: active ≤45d since last visit, lapsed ≤120d | `etl/map-customers.ts:56-60` |
| Revenue = exactly service + retail; a line is product or service, nothing else | `etl/map-transactions.ts:11-14, 46` |
| Hardcoded load/wipe order (topological sort of salon entities) | `etl/run.ts:73-101, 126-136` |
| **Hard Prisma enums** (migration to change) that are pure salon vocabulary: `RoomState`, `SessionState` (incl. `cleaning`), `EquipmentDriverType.tmax`, `VisitSource`, `BookingState`, `TenderType.package_credit/membership_included`, `CustomerStatus` active/lapsed/inactive | `schema.prisma:44-164` |
| Tanning-specific tables: `Room`/`RoomType`, `EquipmentDevice`, `Session` (timed equipment run), `WaiverSignature`, `Customer.skinType` | `schema.prisma:433-556, 571, 1283-1303` |
| Vendor-branded: `UvaluxCatalogItem`, `Product.uvaluxCatalogItemId` | `schema.prisma:746-769, 786` |
| Tenant = `Salon`, `salonId` on ~30 tables | throughout `schema.prisma` |

### Implicit domain model the schema bets on

1. Customer = individual person who returns on a days-to-weeks cadence (`lastVisitAt` is the health signal — `schema.prisma:581`).
2. Atomic commercial event = a Visit: minutes long, physically checked in, same-day sale attached (the visit↔sale link is *inferred by same-day matching*, `salontouch-extract.mjs:14-17` — only works because they co-occur within a day).
3. Capacity = rooms × time slots (`schema.prisma:470`).
4. Marketing = segment-based broadcast to opted-in consumers (`Campaign.segmentKey`, channels email/sms — `schema.prisma:924-951`).

**Structural finding:** the repo already contains *both* target shapes. Bask is the
consumer/visit model; **Compass's `Account`/`AccountLifecycle`/`ContactLog`/`SignalSnapshot`/
`CoachingRequest` cluster (`schema.prisma:283-293, 1094-1190`) is already an account-based B2B
model** — welded to the salon vertical by exactly one line: `Account.salonId @unique`
(`schema.prisma:1096`).

---

## Stage 2 — Opportunity (insight detection)

### Generic

| Mechanism | Where |
|---|---|
| `Evidence` zod schema: metric/window/comparison/impact/factors/series/sentence; units `percent|currency|count|days|ratio|minutes`; enforced at the sweep boundary | `packages/core/src/evidence.ts:122-138, 20-27`, `insights/engine.ts:85` |
| Detector framework: `Detector = { type, run(facts, ctx): InsightDraft[] }` — pure functions, no I/O/clock/randomness | `insights/types.ts:100-103`, `detectors.ts:2-7` |
| Sweep engine: per-detector try/catch isolation, cadence-normalized money ranking (per_week × 4.33), severity tiebreak, top-5 cap | `insights/engine.ts:40-109` |
| Dedupe/lifecycle: `dedupeKey` = type + subject (never date); states `new|seen|actioned|dismissed`; pipeline upserts created/updated/resolved | `insights/types.ts:57-71`, `pipeline/ports.ts:38-46` |
| Pipeline stage ordering: materialise day → campaign settle → rollups → insight sweep → brief; core is Prisma-free via ports | `pipeline/index.ts:1-16, 104-141`, `pipeline/ports.ts:1-9` |
| Scale-invariant materiality helpers (`isMaterialDrop`/`isMaterialGap`, abs-OR-relative `MaterialityRule`) — **written and calibrated against the real 12-year dataset, but with no unit tests and wired to nothing** | `insights/scaling.ts:56-74, 92-110` |

### Coupled

| Coupling | Where |
|---|---|
| **The facts shape itself — the deepest coupling in the codebase.** `SalonFacts` hardwires the ontology: `attachment`, `capacity` (rooms × hours), `stock`, `failedPayments`, `pulse.roomsInUse`. Every detector is a function of this one shape. | `insights/facts.ts:160-172, 82-101, 135-157` |
| All thresholds frozen as module constants — `attachmentDropPoints: 3` (absolute points, tuned to fixtures at ~21% attach; real world is 5.28%, so it never fires — the written diagnosis is `scaling.ts:1-28`), `staffGapPoints: 6` (arithmetically impossible below a 6% house rate), `softUtilisation: 45`, `lowStockDays: 14`, 10-day "assumed UVALUX turnaround" inline | `insights/detectors.ts:37-70, 81, 106, 458-459` |
| Copy inside detectors ("Lotion sales per visit fell…", "Add to UVALUX order") | `detectors.ts:156, 521` |
| `LINKED_ACTION_TYPES` vocabulary (`draft_order`, `recover_payment`, `review_membership`) | `insights/types.ts:40-52` |
| Six post-Nick sweeps (`bottle_depletion`, `member_tenure_gap`, `seasonal_pause`, `category_gap`, `first_visit_lapse`, `upgrade_headroom`) declared in `INSIGHT_TYPES` but **orphaned** — not in `ALL_DETECTORS`, take bespoke row shapes the pipeline never builds. Plus a live bug: `seasonal-pause.ts` parses month with `substring(4, 6)` → `"-0"`, so trough detection can never match. | `insights/sweeps/*`, `detectors.ts:704-711` |

---

## Stage 3 — Training corpus (knowledge)

### Generic

| Mechanism | Where |
|---|---|
| Claim spine: statement + verbatim quote (DB CHECK: never empty) + timestamped media provenance + attribution confidence (`anchored|interpolated`, never laundered) + corroboration counts + review lifecycle + append-only audit | `knowledge/curation/types.ts:87-111, 65-85`, `schema.prisma:1374-1434` |
| Alert rules (thin_topic, single_source, unanchored_attribution, contradiction, provenance_drift) — computed purely | `knowledge/curation/alerts.ts` |
| Chunking (1200/150) and retrieval with citation safety (`toCitation` refuses unanchored speakers) | `knowledge/chunk.ts`, `knowledge/retrieve.ts` |

### Coupled

| Coupling | Where |
|---|---|
| `CLAIM_CATEGORIES` (`marketing|membership|retail|operations|customer|coaching`) must mirror `OPPORTUNITY_CATEGORIES` | `curation/types.ts:22-30`, `opportunities/types.ts:16-23` |
| `CLAIM_MOMENTS` (`greeting|needs|product|membership|close`) = the five moments of a **front-desk sales interaction**, mirrors `MONITOR` `MOMENT_KEYS` | `curation/types.ts:33-41`, `monitor/types.ts:25-26` |
| Ingestion hardwired to one fixture (`uvalux26-expo.jsonl`); event-era labels (`uvalux26` → "Room B 2026") in the API layer | `packages/db/scripts/knowledge/embed.ts:40-41`, `packages/api/src/routers/knowledge.ts:70-80` |

### The honest status of this stage

**The corpus→action link does not exist.** 1,007 claims (3 verified) are mined, stored, and
curatable at `/compass/knowledge` — and consumed by nothing that generates output. `retrieve()`
has zero callers; `bask.knowledge_doc`/`knowledge_chunk` hold 0 rows; campaign generation,
Daybreak, and call briefs never touch a claim; the coaching page reads hand-authored `Playbook`
rows. Generalizing this stage is schema/taxonomy work, not consumer rewiring — the consumer has
to be built for the *first* vertical too.

---

## Stage 4 — Action (campaign generation + approval)

### Generic

| Mechanism | Where |
|---|---|
| Two-path generation with provenance: AI via one `generateJson` wrapper, deterministic template fallback, `provenance.source: 'ai'|'fallback'` on the content | `packages/api/src/ai/campaign.ts:89-99, 211-305` |
| "Model writes prose, never numbers": audience size/discount/dates assembled in code, handed to the model as verbatim facts | `campaign.ts:10-12, 400-418, 434` |
| Post-generation guardrails as *enforcement* (blocked → fallback), generic payload walker over every string | `campaign.ts:256-273`, `packages/core/src/ai/guardrails.ts:170-186` |
| Prompt-hash caching + regen variants | `campaign.ts:171-176, 459-461` |
| Insight→action bridge: detectors emit `linkedActionType` + typed `linkedActionRef`; router expands into goal/validity/send-time | `insights/detectors.ts:214-220, 424-431`, `routers/marketing.ts:786-819` |
| Approval workflow: wizard → persist-as-draft → inline edit (guardrails re-run) → per-piece regenerate → tone switch → **`schedule` is the only human state transition; `sent`/`measured` belong to the pipeline** → activity log → source insight flipped to `actioned` | `routers/marketing.ts:303-575` |
| Consent-narrowed audience count is the only count ever shown | `marketing.ts:11-14, 251-253` |
| Guidance-dictionary *shapes*: `MetricExplainer {label, what, how, why}`, whispers-as-functions, dismiss-reason taxonomy | `packages/ui/src/guidance/guidance.ts:17-27, 229-251, 423-448` |

### Coupled

| Coupling | Where |
|---|---|
| System prompt is 100% salon ("tanning and wellness salon… never mention vitamin D…") | `campaign.ts:193-205` |
| Output-piece schema hardcoded B2C: `graphicHeadline/instagramCaption/facebookPost/smsBody/emailSubject/emailBody`; channel enum `['instagram','facebook','sms','email']`; SMS compliance in the prompt | `campaign.ts:66-73, 109-147`, `marketing.ts:62` |
| Fallback templates ("Your glow called. It misses you.") | `campaign.ts:454-521` |
| Guardrail *rule table* is tanning-regulatory (vitamin D/acne/SAD regexes; 25%/$50 discount caps) | `guardrails.ts:41-45, 55-86` |
| Offer model = percent/dollar discount only; Offer is a mandatory wizard step | `campaign.ts:55-62, 316-394`, `StudioBuilder.tsx:30-32` |
| Segments all defined on visit recency / package credits / spend | `packages/api/src/segments.ts:95-146` |
| Channel-routing heuristic (`soft_capacity → sms-first`) | `marketing.ts:778-784` |
| Guidance dictionary content ~80% salon-flavoured (448 lines) | `guidance.ts:57-306` |
| **Only one action type exists: the segment broadcast.** No task-assigned-to-a-person, no 1:1 message to a named contact, no per-recipient disposition. | `marketing.ts:6-10`, `schema.prisma:924-951` |

---

## Stage 5 — Measured result (settle + writeback)

### Generic

| Mechanism | Where |
|---|---|
| Ports abstraction: `simulateCampaignOutcomes(date): CampaignOutcome[]`; settle must precede rollups so campaign-produced events count the same day; multi-day advance runs one pass per day | `pipeline/ports.ts:28-35, 61-62`, `pipeline/index.ts:86-141` |
| Writeback is real rows, not a results blob: "a campaign that worked means real visits on the floor"; settled rows flow into facts → sweep → brief. The payoff is the rollup noticing, not a special card. | `packages/db/src/ports.ts:194-195, 290-304, 318-357` |

### Coupled

| Coupling | Where |
|---|---|
| **Attribution is generative, not observational**: bookings *created as* `max(4, round(recipients × rng(0.16–0.24)))`; visits stamped into hours 13–16; revenue = full service price (75% UV / 25% spray), 12% tax; `HERO_SALON_ID` hardcoded. All in the DB adapter, not a configurable place. | `packages/db/src/ports.ts:196-231, 254, 287` |
| Result vocabulary (`recipients/bookings/revenue`) baked into router returns, Studio UI, copy | `marketing.ts:696-700`, `StudioHub.tsx:163-176`, `marketing/copy.ts:81-93` |
| Result model assumes result = a repeat visit producing a same-day POS sale. No pipeline-stage change (quote→won), no multi-week lag, no per-person result. | `db/ports.ts:175-316` |

---

## Stage 6 — Network layer (Compass + consent)

### Generic

| Mechanism | Where |
|---|---|
| Consent tier ladder (`private|benchmarks|coaching`), monotonic group grants, **fail-closed default** (missing row → `private`) | `packages/core/src/consent/index.ts:32, 50, 60-64, 103-107` |
| **Allow-list filter, drop-unknown**: `filterAccount` strips to declared `COMPASS_FIELDS`; an undeclared field cannot render. Customer-level data has no field to travel in; no raw amounts cross — banding is structural. | `consent/index.ts:73-99, 146-156, 21-26` |
| k-anonymity gate (`MIN_COHORT_SIZE = 8`), suppression *rendered* not hidden | `consent/index.ts:67, 171-185` |
| Self-disclosure derived from the filter itself (`describeConsent` generates "What the supplier sees" from the same tables; tested to match exactly) | `consent/index.ts:260-271`, `core/test/consent.test.ts:176-179` |
| Transactional consent audit trail; no downgrade friction | `routers/compass.ts:1104-1154` |
| Derivation discipline: no naked scores (band + factors), no invented figures (missing metric → tile dropped), one exported entry `deriveAccountView`, call-list membership decided off the *filtered* view | `compass/derive.ts:14-21, 399-401, 686-737`, `compass.ts:309-340` |
| Peer standing framework: generic `PeerMetric {key, label, you, peerValues, higherIsBetter}`, band-not-rank, quartiles with <4-peer kindness floor, guaranteed one win | `network/standing.ts:8-11, 26-37, 102-131, 177` |
| Outcome aggregation: `NetworkOutcomeRecord`, grouped medians, `MIN_SALONS_FOR_CONFIDENCE = 5`, below-floor renders nothing | `network/outcomes.ts:26-39, 72` |

### Coupled

| Coupling | Where |
|---|---|
| `COMPASS_FIELDS` names (`retailAttachmentBand`, `utilizationBand`, `roomCount`, `equipmentProfile`…) + plain-language labels + NEVER_SEEN list | `consent/index.ts:73-99, 199-253` |
| Signal taxonomy (7 types: `retail_decline, expansion_ready, reorder_due, membership_churn…`) hardcoded across **five parallel switch/Record blocks** in derive.ts (trend map, factor copy, evidence-tile recipes, playbook suggestions, call-status mapping) | `derive.ts:368-393, 255-263, 414-533, 576-605, 637-647` |
| Benchmark metrics (`attachment`, `utilisation`, `membershipRate`, `averageBasket`) + dollar-izing coefficients (visits/day × attached spend, with grade-7 "workings" strings) | `apps/web/src/server/peers.ts:51-66, 297-364` |
| Cohort definitions (size = 0.4×–2× annual wholesale, "tanning + wellness", "Western Canada") | `peers.ts:77-94, 171-187` |
| Core structural assumption: supplier sells consumables to repeat-visit retail; `annualWholesaleValue` as the size axis; `orderRecencyDays` vs usual cadence | `schema.prisma:1100`, `derive.ts:232-236` |

### Demo caveats (do not mistake for production machinery)

Peer cohort values are synthesized monotone maps from healthScore (`peers.ts:37-66`); 11 of 12
portfolio accounts have zero operational rows; `NetworkOutcomeRecord` has no production writer
(`network/opportunity-proof.ts:4-13` says so); enforcement is module design + convention, not
access control (role from URL, no RLS on these tables, raw `AccountRow` loaded server-side for
every tier and filtered in process memory — `trpc.ts:104`, `compass.ts:280`, `derive.ts:735`).
The *contract* (COMPASS_FIELDS + filterAccount + tests) survives a move to RLS unchanged.

---

## Summary counts

- **Generic and proven** (mechanism survives all three target verticals unchanged): evidence
  schema, detector engine, dedupe/lifecycle, pipeline ordering + ports, AI client + guardrail
  walker + provenance pattern, approval workflow, consent ladder/filter/k-anonymity/audit,
  peer-standing, outcome aggregation, claim-provenance spine, curation states/alerts, ETL
  contract mechanics, guidance-dictionary shapes, lookup-table extensibility rule.
- **Coupled but cleanly seamed** (replaceable behind an existing boundary): enum maps, insert
  shapes, prompts, fallback templates, guardrail rule tables, segments, benchmark metrics,
  cohort predicates, COMPASS_FIELDS manifest, signal taxonomy, guidance content, thresholds.
- **Coupled structurally** (needs new core primitives, not just new content): the `SalonFacts`
  shape; the single action type (segment broadcast); the settle definition (same-day POS sale);
  the absence of open-entity/stage/age, expected-event schedules, flow edges, per-agent
  dimension, configurable windows; `Account.salonId @unique`.
