# Signal sweeps — what to run over salon data the day it arrives

**Written 2026-08-19, before the data landed, on purpose.** The point is that the first pass over a
real export produces findings in an afternoon instead of starting a discovery project.

**The rule every sweep obeys**, in Nick's words: *"It's not tracking minutes and putting butts in
beds. It's what to do with that data."* A sweep that reports a number is not a signal. Every entry
below names an **action** and the **evidence** behind it. That is already the contract of
`packages/core/src/insights/` — new sweeps extend that engine and reuse the one `Evidence` zod
schema. Do not invent a second shape.

---

## Data tiers — get this right or the pilot is scoped wrong

Every sweep declares the tier it needs. From `docs/meetings/2026-08-19-nick-mining-pass3.md` §6:

| Tier | Source | Reach | Availability |
|---|---|---|---|
| **0** | UVALUX purchase data (what the salon buys from Nick) | **~300 Canadian "real salons"** | **Today.** He owns it outright. No consent gate. |
| **1** | Salon monthly export (upload) | Any salon that opts in | Needs an upload surface, which does not exist yet |
| **2** | Live hosted operational data (Sunlync) | **~10 Canadian salons** | Rights unresolved; Nick has offered to get them |

**The pilot runs on Tier 0.** The instinct is to reach for the hosted operational data, but in
Canada that is ten salons. Tier 0 is thirty times larger and available now.

## Two things that must exist before any sweep runs

1. **A frozen baseline.** Phase 1's entire deliverable is a measured lift — he wants to say
   *"48.2% increase in…"*. A lift claim needs a pre-period captured at onboarding, before anything
   changes. If the pilot starts by improving things, the number is unprovable and phase 2 has no
   pitch.
2. **A metric dictionary**, using the definitions Mike Blore gave on stage, not ours. He defined
   them for this audience already, and using his words means the output reads as UVALUX's own
   coaching rather than a vendor's invention.

## The metric dictionary (his definitions, from Room B)

| Metric | Definition as given | Where |
|---|---|---|
| **RPS** — revenue per session | Total revenue ÷ sessions | "RPS stands for revenue per session" |
| **Distinct / unique customers** | Individual people, not visits: "if there's two of us and we each come 10 times, that's 20 sessions but two distinct customers" | Room B ~0h47m |
| **Sessions per unique customer** | Sessions ÷ unique customers — "we even put the formula there for you" (Elaine's worksheet) | Room B ~0h22m |
| **Distinct customer annual revenue** | Annual revenue ÷ distinct customers. His worked example: **$108** at one store | Room B ~0h46m |
| **EFT** | Recurring membership billing. Live examples given: **$300–$400/month** | Room B ~3h16m |
| **Average member tenure** | How long a member stays. Named by Nick as **2.5 months, 3.5 with more modalities** | Meeting transcript |
| **Lifetime value** | "Absolutely imperative that you know what a customer is worth over a lifetime and over the next 12 months" | Room B ~2h33m |

**Average member tenure is the headline metric of this product and is currently nowhere in Bask.**

---

## The sweeps

Each: question → inputs → computation → threshold → action → tier.

### Group A — Benchmarking (his four-year-old idea; Tier 0, runs today)

**A1. Category units vs peer median.**
His own framing: *"You sell 35 tanning lotion while the industry average is 22 — are you above or
below? Scoreboard it."*
Inputs: purchase lines by category, salon, month. Computation: units per category per month,
percentile against the Canadian cohort. Threshold: below the 25th percentile in a category the
cohort buys routinely. Action: a specific product conversation, with the peer number attached.
Note: **units, not just dollars** — he said units, and units survive price differences.

**A2. Category absence.** Categories the cohort buys that this salon buys *none* of. Highest-signal
version of A1 — moisturizers were his own example of a category salons underplay. Action: a
first-order conversation, sized by what the cohort's median salon spends there.

**A3. Purchase cadence break.** A salon's own reorder rhythm per category, then flag a skipped
cycle. Distinguishes "stopped buying from us" from "buying less" — the first is a competitive loss,
the second is a business problem, and they need different calls.

**A4. Year-over-year rank movement.** He already does a crude version of this by hand. Automating
his existing manual report is the cheapest credible win available and it is a product he already
knows salons accept.

### Group B — Membership economics (the equipment sales instrument)

This group is the strongest commercial case in the whole engagement — see
`2026-08-19-nick-analysis.md` §1. UVALUX sells equipment financed by membership arithmetic.

**B1. Average member tenure.** Inputs: membership start/end dates. Computation: mean and median
tenure, plus survival curve. Tier 1/2. **Build this first of the whole group** — it is the metric
the entire equipment pitch rests on and nothing computes it today.

**B2. Modality count vs tenure.** The Mike Blore thesis, tested: group salons by how many modalities
they run, compare mean tenure. If it reproduces (2.5 → 3.5 months), it becomes the payback
calculator. Action: *"salons like yours that added this modality hold members N months longer; this
machine pays back in M months."* Tier 1 + Tier 0 equipment records.

**B3. Membership price positioning.** Where this salon's EFT sits against the cohort. His pitch is
"drive membership from $89 to $100 to $120"; this tells him which salons have room. Tier 1.

**B4. Upgrade headroom.** Members on the lowest tier who use enough to justify the next one. Action:
a named list for an upgrade conversation. This is his cocoon pitch, made per-customer instead of
per-salon.

**B5. Seasonal pause vs true lapse.** Tanning is seasonal — *"summertime comes, somebody will pause
or cancel."* Separate expected seasonal quiet from real churn. **Without this the board goes red
every July and the owner stops trusting it**, which is the single most likely way this gets
abandoned in a pilot. Feeds directly into the health engine's open tuning question.

### Group C — Customer health and the front desk

Nick's own answer to his own question *"what's the most valuable output?"* was this group, not the
campaign builder.

**C1. Days since last visit / last spend, against the customer's own rhythm.** Not a flat day count
— per-customer cadence. His example was *"it's been 85 days since Daniel last spent."*
**Calibration warning:** the current 90-day staleness curve spans an entire average customer
lifetime (2.5–3.5 months). Recommend full drain at ~45 days, flags at 14/30/45 — but settle it
against his real export rather than by argument.

**C2. Bottle depletion.** *"About half an ounce per tan"*, and Sunlync already tracks tans used and
last purchase date. Estimated remaining = purchased volume − (tans since purchase × 0.5 oz).
Action: the reorder conversation before the customer thinks of it. **Buildable from data that
already exists** — this is the highest ratio of value to effort in the catalogue.

**C3. Next-best-product.** Broader than C2, and his own words: *"the sister product to that is
this — if you've hit a plateau, it's best if you do this. Ding, sales flow."* Inputs: purchase
history + product ladder. Action: a cue on screen mid-conversation.

**C4. First-visit-never-returned.** Customers with exactly one visit and no membership. The cheapest
retention win in any subscription business and it needs only visit counts.

**C5. High-value at risk.** Cross C1 with lifetime value so the reach-out list is ordered by what is
actually at stake, not by who is quietest.

### Group D — Operations and staff (data-only — no microphone, no legal gate)

Both prior meeting docs bundled staff coaching with the sales-floor recording idea and deferred the
whole thing. **It splits.** Everything here is computable from actions the product already records.

**D1. Operator conversion.** Attach/close rate per staff member per shift. His words: *"why is this
guy's closing ratio [worse] than another guy's?"* Action: coaching target, and it names the best
performer, which is what makes it land as praise rather than surveillance.

**D2. Reach-out efficacy.** Which staff members' outreach actually brings customers back. *"Let's
look at the content of those emails."* Action: promote what works into the template library.

**D3. Retail attachment by shift.** Extends the existing `retail_attachment_slip` detector with a
staff and time-of-day dimension.

**D4. Slow-period detection.** Day-of-week and hour-of-day troughs against the salon's own baseline.
Feeds the campaign builder — this is the "we noticed Thursdays…" input.

### Group E — Corpus sweeps (over the expo knowledge base, not salon data)

**E1. Question-demand mining.** Every question asked from the floor across 9.6 hours. What owners
and staff actually ask is the roadmap for the knowledge base and the community surface.
Available now, needs no salon data.

**E2. Coaching-claim extraction.** Every numeric claim made on stage ("$108 distinct customer annual
revenue", "EFTs at $300–400", "average member stays 2.5 months") becomes a **benchmark to test
against real data**. This is the join between the two workstreams: the knowledge base proposes,
the salon data disposes.

---

## Suggested first pass, in order

1. **A4** — automate the report he already produces by hand. Fastest credible win, Tier 0.
2. **A1 + A2** — the scoreboard. His four-year idea, Tier 0, no new data needed.
3. **C2** — bottle depletion. Highest value-to-effort, data already exists.
4. **B1** — average member tenure. The headline metric, currently missing entirely.
5. **B2** — modality vs tenure. If it reproduces, it is the equipment sales instrument and it leads
   the pitch and the film.

## Honest limits

- Everything in Group B needs Tier 1 or 2 data. On Tier 0 alone the pilot can benchmark and it can
  do product-side work, but it **cannot** compute tenure. If the phase-1 promise includes a tenure
  number, the export in §1 of the mining doc has to arrive first.
- Peer benchmarking needs enough salons per cohort to be non-identifying. With ~300 Canadian salons,
  narrow cohorts (province × size × modality) will get thin fast. Set a minimum cohort size before
  anything ships, and route every read through `packages/core/consent` — no exceptions, not even
  for the demo.
