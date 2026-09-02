# Worked example: manufacturing sales, end to end on paper

**Why this vertical for the deep pass:** of the three the owner named, manufacturing sales breaks
the most current assumptions at once — B2B parties (company + contacts, not persons), open
documents with age (quotes/RFQs), no consumer broadcast channel at all, lagged attribution, and
account-level (not site-level) keying. If the pack interface survives this walk, car sales and
medical are easier subsets (car sales reuses the agent dimension + long-cycle deal; medical
reuses expected-event schedules + the consent hardening path). Cross-checks for those two are in
`01-architecture.md` §7.

**The business:** "Norquay Industrial" — a regional distributor of cutting tools and abrasives
selling to ~400 machine shops and fabricators. 6 outside reps, each owning ~65 accounts.
Customers buy on quotes and blanket POs; reorder cadence per account ranges from 2 weeks to 6
months. The supplier-side twin (the Compass role) is the tooling manufacturer whose regional
distributors these are — same two-sided shape as UVALUX → salons.

Every step below names: what the pack supplies, which core mechanism consumes it, and which
salon file is the working precedent.

---

## Stage 1 — Data

**Source:** ERP export (accounts, contacts, quotes, quote lines, orders, order lines, invoices,
product catalogue, rep assignments). Same three-phase discipline as salon ingest:

1. `profile.mjs` runs unchanged on the CSVs (it is format-agnostic — `salon-ingest/profile.mjs`).
2. A human writes the mapping off the profile (`salon-ingest/README.md:19-24` rule, unchanged).
3. Pack mappers load through the unchanged contract mechanics: `remapId('account', srcId)`,
   pure mappers, dry-run-by-default transactional load (`etl/contract.ts:16-32`,
   `etl/run.ts:154-168`).

**IngestPack contents:**

| Artifact | Manufacturing instance | Salon precedent |
|---|---|---|
| Entity manifest | `accounts, contacts, reps, products, quotes, quote_lines, orders, order_lines` | `run.ts:74-84` file list |
| Enum maps (data, not code) | quote status: `{"OPEN":"open","EXPIRED":"lost","PO RECD":"won"}`; contact role: `{"BUYER":"buyer","ENG":"engineering"}` | `contract.ts:85-129` |
| Derivation rules (parameterized) | account activity status from **order gap vs the account's own median cadence** (not fixed 45/120 days — a 2-week-cadence shop is dormant at 5 weeks; a 6-month shop is fine at 5 months) | the hardcoded 45/120 in `map-customers.ts:56-60` is exactly what this generalizes |
| Inferred-join provenance | quote→order match by PO number where present, else amount+date proximity, labeled INFERRED | `salontouch-extract.mjs:11-22` |

**Pack fact tables (schema module):** `Account` (company; the tenant's *customer*, distinct from
the platform's supplier-side `Account`), `Contact`, `Quote` (the **open-entity-with-stage-and-age
core primitive**: stage `open|quoted|negotiation|won|lost`, value, opened_at, stage_entered_at,
owner rep), `Order`, `OrderLine`. Universal spine tables used as-is: `Org`, `Location`,
`Agent` (reps), `Product`, `Party` (= Account+Contacts in B2B mode), `Insight`, `Action`,
`KnowledgeClaim`, `ConsentProfile`.

## Stage 2 — Opportunity

**FactsPack:** the pack's facts shape and rollup query, replacing `SalonFacts`:

```ts
interface DistributorFacts {
  window: FactsWindow;                       // core type, evidence.ts-compatible
  accounts: AccountCadenceFacts[];           // per-account: median order gap, days since last order
  openQuotes: QuoteAgingFacts[];             // per-quote: age, stage age, value, rep   ← core primitive 1
  categoryMix: CategoryShareFacts[];         // per-account category shares vs cohort median
  concentration: ConcentrationFacts;         // top-5 accounts' share of revenue        ← new share-of-total fact
  reps: RepFunnelFacts[];                    // per-rep: quotes issued, win rate, aging  ← core primitive 4
}
```

Consumed by the **unchanged** engine (`insights/engine.ts`), producing **unchanged** `Insight`
rows with **unchanged** `Evidence` (`evidence.ts:122-138` — metric/window/comparison/impact all
express these facts; units `currency|count|days|ratio` suffice).

**Detector set** (each with `MaterialityRule` thresholds — abs OR relative, per
`scaling.ts:56-110`, tenant-overridable):

| Detector | Fires when | Salon precedent |
|---|---|---|
| `rfq_aging` | open quote value in stage > `staleDays` for the account's quote-turnaround norm; grouped per rep | structurally new (needs primitive 1) but engine-identical to `soft_capacity`'s "recurring condition" pattern |
| `account_dormant` | days-since-order > 1.5× the account's own median cadence | `derive.ts:232-236` order-recency logic, promoted from Compass-side to detector |
| `category_gap` | account buys cutting tools but ~zero abrasives while cohort median is 30% | **direct reuse** of `sweeps/category-gap.ts` (MIN_COHORT/GAP_RATIO/CLOSABLE_SHARE already the right shape) |
| `finance… n/a — attach_gap` | rep's tooling-plus-coating attach rate sits `MaterialityRule` below house rate | **direct reuse** of `retail_attachment_slip` (`detectors.ts:76-226`) with the relative thresholds it should have had anyway |
| `concentration_risk` | top-5 share crosses band; evidence `contributingFactors.share` (`evidence.ts:104` already displays shares) | new fact, existing evidence support |

Ranking, dedupe (`type + accountId`, never date), top-5 attention cap, `$ impact` cadence
normalization: all core, untouched.

## Stage 3 — Training corpus

**CorpusPack:**
- `categories`: `pricing | quoting | product_application | account_management | prospecting |
  service` — mirroring the pack's opportunity categories (the cross-reference rule from
  `curation/types.ts:22-30` ↔ `opportunities/types.ts:16-23`).
- `moments`: the B2B sales conversation model: `discovery | spec | quote | objection | close |
  follow_up` — replacing the front-desk `greeting|needs|product|membership|close`
  (`curation/types.ts:33-41`).
- `sources`: recorded ride-alongs and training sessions with the two veteran reps; application
  engineering lunch-and-learns. Same mining → claim → provenance → curation flow; the claim
  spine (verbatim quote, anchored/interpolated attribution, corroboration, review states,
  audit) is used **unchanged**.

Example claim: *"Shops that send drawings with the RFQ close at twice the rate — ask for the
drawing before you price."* — quote anchored to `ride-along-03.mp3 @ 14:32`, speaker Dale,
corroborated 3 distinct events, category `quoting`, moment `spec`.

**The consumer (built once, in core — does not exist for salon either):** retrieval
(`knowledge/retrieve.ts`, currently zero callers) feeds verified claims into the action prompt
context with citations — "grounding fragment: Dale's drawing rule (verified, 3 events)" — and
into rep call-brief talking points. This is the corpus→action edge the pipeline diagram promises;
building it for either vertical builds it for all.

## Stage 4 — Action

**ActionPack:**
- `actionTypes`: `direct` (1:1 email to a named contact) and `task` (assigned to a rep, with
  talking points, due date, disposition). **Zero `broadcast` actions — and the pack stays
  legal**, which is the acid test that the wizard's segment/audience/offer steps are
  pack-optional. (Salon precedent for `task`: Compass's call list + `ContactLog` — the shape
  exists, promoted to the campaign lifecycle machinery of `routers/marketing.ts:303-575`.)
- `channels`: `email` (per-contact, business tone, no SMS-consent machinery), `phone_task`.
- `prompt persona`: "You write follow-ups for an industrial distributor's outside rep. Plain,
  specific, engineer-respecting. Reference the quote by number and line items verbatim." —
  replacing `campaign.ts:193-205`.
- `guardrailRules` for the generic walker (`guardrails.ts:170-186` unchanged): no delivery-date
  promises not present in the quote context; no price changes vs the quote facts; no
  disparagement of named competitors; mandated quote-validity disclaimer appended.
- `constraintModel`: no discount offer machinery at all (replaces `campaign.ts:316-394`);
  constraint = "value framing only, price is the quote's".
- `segments` → account predicates: `quotes_aging_14d`, `dormant_vs_cadence`,
  `single_category_accounts` (replacing visit-recency predicates in `segments.ts:95-146`).

**The generated action, concretely:** the `rfq_aging` insight for Quote #Q-4471 (Lakeshore
Fabricating, $18,400, 19 days in `quoted`, rep Dale) produces — via the unchanged two-path
generation with `ai|fallback` provenance and prompt-hash caching — a **task** for Dale: call
brief with 3 talking points (one grounded in a cited corpus claim), plus a **direct** email
draft to the buyer contact referencing the quote lines. Owner/manager approves; `schedule` is
still the only human state transition; the insight flips to `actioned`
(`marketing.ts:544-549`).

## Stage 5 — Measured result

**SettlePack:**
- Qualifying event: `Quote.stage → won`.
- Match rule: quote linkage (the action carries `quoteId` in its `linkedActionRef` — the
  pack-shaped ref replacing salon's `weekday/startHour` shape, `marketing.ts:723-730`).
- Attribution window: 45 days from action sent.
- Value formula: quote value at win (known at quote time — no revenue fabrication needed).
- Demo simulation params (demo builds only): P(win | followed-up, quote age) table replacing the
  hardcoded `rng(0.16-0.24)` + afternoon-visit fabrication in `db/ports.ts:196-231`.

Settle runs in the same pipeline slot (settle → rollups → sweep → brief,
`pipeline/index.ts:104-141`). The result writes **real rows** — the Quote flips to `won`, the
Order lands — so the next sweep's facts contain it and the brief notices without a special
card: *"Lakeshore signed the $18,400 tooling quote Tuesday — 19 days quiet, closed 6 days after
Dale's follow-up."* Result vocabulary renders from the pack: `reached: 1, responses: 1,
value: $18,400`.

Loop closed: the won order changes Lakeshore's cadence facts, which changes what
`account_dormant` and `category_gap` say next month. Measured result became data.

## Network layer (the manufacturer over its distributors — or the distributor over its accounts)

**NetworkPack:**
- Consent field manifest (replacing `consent/index.ts:73-99`): identity = region, shop-size
  band, equipment classes; participation = platform adoption; signals = `orderCadenceBand`,
  `categoryPenetrationBand`, `quoteWinRateBand`, `shareOfWalletBand`. NEVER_SEEN: contact
  names, quote line prices, individual order amounts. Filter, k=8 suppression,
  disclosure-derived-from-filter, audit: all **unchanged** core.
- Signal taxonomy (one declarative table, replacing derive.ts's five switch blocks):
  `cadence_break`, `category_whitespace`, `quote_stall`, `expansion_ready` (adding a machining
  cell), `dormant_account`.
- Benchmark metrics + workings (replacing `peers.ts:51-66, 297-364`): category penetration %,
  win rate, share of wallet — dollar-ized as "closing half the abrasives gap ≈ $2,100/mo at
  your volume", throughput-based instead of visits/day.
- Cohorts: shop-size band (spindle count / headcount), industry served (aero/auto/job-shop),
  region.
- Peer standing (`standing.ts`), outcome medians with the n≥5 floor (`outcomes.ts`): unchanged.

## Scorecard

| | Count |
|---|---|
| Core mechanisms used unchanged | evidence, engine, dedupe, pipeline ordering, ports, AI client + walker + provenance, approval lifecycle, consent ladder/filter/k-anon/audit/disclosure, standing, outcomes, claim spine, curation, profiler, ETL contract mechanics, demo harness — **16** |
| New core primitives exercised | open-entity (Quote), agent dimension (reps), share-of-total fact, pack-defined windows — **4 of 5** (flow edges unused; medical exercises it) |
| Pack artifacts written | schema module, ingest manifest+maps, facts+rollups, 5 detectors + thresholds, 2 action types + channels + prompts + guardrails, 3 segments, settle definition, claim taxonomy, network manifest + taxonomy + metrics + cohorts, vocabulary, fixtures — **all 13 manifest rows, no core edits** |
| Core edits required | zero (by construction — anything that needed a core edit was moved into §4/§5 of the architecture as a core change first) |

The abstraction held against the hardest of the three named verticals. The two places it bent —
needing `task`/`direct` action types and the open-entity primitive — are now core requirements,
not manufacturing special cases, because car sales needs both too.
