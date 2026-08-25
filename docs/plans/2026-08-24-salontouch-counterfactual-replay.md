# Plan — SalonTouch counterfactual replay (the stakeholder demo)

**Written** 2026-08-24 · **Owner** supervisor session · **Status** step 1–2 in flight

## What this is

Run Bask's daily loop over 12 years of real salon data as if the app had been installed in 2016.
Every simulated day produces a brief and ranked opportunities. Each opportunity is *detected* from
the data but its reason and its generated action come from the **coaching corpus**. The claim at the
end: had the owner run those actions, revenue would have moved by X%.

Not a proof. A modelled inference, sized off throughput, where **every coefficient is measured
inside this dataset** rather than imported from outside.

**Purpose line (verbatim, user 2026-08-24):** *"we want to use this real data now to be able to
bring this into the pitch and demonstrate that our app would have made these sort of recommendations
daily … the app automatically generates those actions based on the coaching corpus and they would
have ran those and we would have been able to increase sales whatever percentage reasonably."*

Check every deliverable against that line, not against this plan.

## The credibility rule (non-negotiable)

No uplift coefficient may come from outside the dataset. Each is a **natural experiment already in
the data**:

| coefficient | natural experiment | status |
|---|---|---|
| attachment ceiling | the salon's own best staffer vs house rate — 8.48% vs 5.28% (2019, both on 2,400+ visits) | measured |
| reactivation baseline | **unprompted** return rate by days-lapsed — of clients silent N days, what share came back with nobody calling | to compute |
| upgrade value | within-customer spend/tenure before vs after moving session-pack → UNLIMITED | to compute |
| modality/tenure | within-customer tenure before vs after adding a second `BedTypeUsed` — the direct test of the 2.5→3.5 month coaching claim | to compute |

Everything on screen is labelled **measured** or **assumed**. Assumed values are sliders the
stakeholder sets. The total is conservative by construction: we never claim more than this salon's
own customers already demonstrably did.

The replay runs the **whole period**, including days with nothing to say and the 2019 slide the
owner might have ignored anyway. A highlight reel gets caught.

## Steps

### 1. Coaching-corpus coverage audit  ← LOCAL MODEL, in flight
Classify all 224 clusters in `docs/ingest/2026-08-22-salon-advice-corpus.md` against Bask's signal
types. Output a coverage matrix and, more importantly, **the gaps** — which signals the app can
detect but has no coaching to act on. That gap list is a deliverable in its own right: it tells us
what to record or acquire next to beef up the corpus.

Corpus today: Operations 63 · Coaching 50 · Marketing 48 · Retail 29 · Memberships 25 ·
**Customers 9**. Reactivation looks thin before we start.

Runs on the local fleet via `broker.submit --kind bulk`. Read-heavy → write-light classification is
the measured-good local workload.

### 2. Extractor + real tenant
`salontouch-extract.mjs`: SQL Server → the canonical CSVs the existing pure mappers already consume.
Fresh Org, new `remapId` namespace (NOT `uvalux-practice-2026`). Never `demo:reset` while loaded.
Analysis dates: 2019-07-01 primary, 2019-12-31 second.

Known mapping decisions carried from `docs/research/salontouch-detector-grading.md`:
sale headers synthesized from `(SalonUID, ReceiptNumber, DateofSale)`; visit↔sale attachment
inferred on same client/salon/day; memberships from UNLIMITED packages, not `Client_EFT` (2 rows);
inventory **not loaded** (on-hand unreconstructable); no payment-failure data.

### 3. Threshold recalibration
Current thresholds are absolute percentage points tuned to synthetic data. On a 5–7% attachment base
`attachmentDropPoints: 3` barely fires and `staffGapPoints: 6` is mathematically unreachable. Add a
relative (ratio-of-baseline) form alongside the absolute one.

### 4. Coefficients
Compute the four natural experiments above. Each emits a measured value plus its sample size.

### 5. Signal → coaching claim → generated action
The join that does not exist yet. `packages/core/src/sources/experts.ts` was built and never wired
into the opportunity cards. This is the actual product gap and the thing nobody else has.

### 6. Replay surface
Scrub the timeline, brief + opportunities per simulated day, running value-left-on-table counter,
measured/assumed labelling throughout.

## Fences

- Public repo (github.com/danman60/BASK). No client name, no creds, no exact financials in tracked
  files. Research docs live under the gitignored `docs/research/salontouch-*`.
- We are **not** helping this salon — it is dead. The narrative is "what the app would have caught",
  presented as a real anonymized independent salon, not as a UVALUX relationship.
- `demo:reset` truncates the whole bask schema and would wipe the real tenant. Guard needed before
  demo day.

## Open

- **Demo date** — asked twice, unanswered. Decides whether steps 5–6 are reachable.
- Industry attachment benchmark: none in hand. Ask Nick or Mike; do not invent one.
- Lapse recovery lift: theirs to set, not ours to claim.
