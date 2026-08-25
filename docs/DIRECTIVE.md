# CURRENT DIRECTIVE — build toward the Phase 1 proposal

**Set** 2026-08-24 · **Authority** `docs/pitch/PROPOSAL-PHASE1-UVALUX.md` (local only — gitignored,
carries commercial pricing; Q3 delivery)

This is the standing directive. Check work against the proposal's deliverables and success
criteria, not against any older plan. `docs/pitch/PROPOSAL-NICK.md` is SUPERSEDED for scope —
its Phase 1 fenced out salon POS data; the real proposal explicitly invites it
("File/database ingestion — for selected pilot salons, historical exports or databases may be
imported directly").

## The loop the proposal buys

```
BUSINESS DATA → ANALYTICS → OPPORTUNITY DETECTION → UVALUX KNOWLEDGE
→ AI INTERPRETATION → ACTIONABLE RECOMMENDATION → BUSINESS ACTION → MEASURED RESULT
```

Demonstrable on **real or representative** salon data, not a static prototype. The SalonTouch
counterfactual replay (`docs/plans/2026-08-24-salontouch-counterfactual-replay.md`) is how we
demonstrate it end to end.

## Deliverable status (verify before trusting — this table is a derived artifact)

| Proposal deliverable | State |
|---|---|
| Initial data-ingestion framework | **BUILT** `salontouch-extract.mjs`, dry-run validated, 12/12 referential checks |
| Demonstration datasets | **BUILT** real (194,672 visits) + synthetic demo tenant |
| Initial analytics engine | BUILT, **NEEDS RECALIBRATION** — thresholds cannot fire at real 5–7% attachment |
| Salon intelligence dashboard | BUILT (Today / opportunity feed) |
| UVALUX intelligence dashboard | BUILT (`/compass`) |
| Benchmarking prototype | BUILT (`/insights/peers`) |
| UVALUX knowledge prototype | **PARTIAL** corpus mined; `retrieve.ts` unwired; `knowledge_doc` = 0 rows |
| AI recommendation layer | **AT RISK** — Anthropic key out of credits, deterministic fallback everywhere |
| Working software (db-backed, interactive) | BUILT, deployed https://bask-psi.vercel.app |
| Pilot testing | NOT STARTED |
| Phase 2 roadmap | NOT STARTED |

## Priority order

1. **Threshold recalibration.** Success criterion 2 ("useful business conditions can be
   detected"). `attachmentDropPoints: 3` and `staffGapPoints: 6` are absolute percentage points
   tuned to synthetic data; on a 5.28% real base the staff-laggard path is mathematically
   unreachable. Needs a relative (ratio-of-baseline) form alongside the absolute one.
2. **Signal → coaching claim → generated action.** Success criterion 4 ("UVALUX expertise
   improves the recommendation rather than generic AI advice") — the criterion most at risk and
   the one nobody else can copy. `packages/core/src/sources/experts.ts` exists and is unwired.
3. **Coefficients from natural experiments** (below), then the replay surface.

## The credibility rule — non-negotiable

No uplift coefficient may be imported from outside the dataset. Each comes from a natural
experiment already inside it. Everything on screen is labelled **measured** or **assumed**;
assumed values are sliders the stakeholder sets.

| coefficient | source | status |
|---|---|---|
| attachment ceiling | the salon's own best staffer vs house rate, 2019 | **8.48% vs 5.28%**, both on 2,400+ visits |
| reactivation baseline | unprompted return rate by days-silent, pre-COVID censored | **MEASURED** — 30d silent: 71.2% return, avg **207 days** |
| upgrade value | within-customer spend/tenure, session-pack → UNLIMITED | to compute |
| modality/tenure | within-customer tenure before/after a second `BedTypeUsed` | to compute — tests the 2.5→3.5 month coaching claim |

**The reactivation reframe:** we are not saving churned customers, they were returning anyway.
The product compresses a 207-day return into ~3 weeks. Zero assumptions in that claim.

## Known gaps to state, never paper over

- **Zero reactivation coaching** in the 224-cluster corpus, against 13,807 lapsed customers.
  Biggest gap between the proposal's promise and what exists. First ask for Elaine/Mike.
- Proposal's example reads "14% vs 21% historically"; real data is **5.28% vs 6.32%**. Show both
  and label which is which — the honesty persuades harder than the bigger number.
- No payment-failure data exists in the real file (`FAILEDLYNK`=0 on 121,058 rows).
- Inventory on-hand is unreconstructable (adjustment ledger, negative for 1,039/1,147 pairs).

## Execution rules

- **Local models do the building** (user directive, 2026-08-24). Dispatch via
  `python3 -m broker.submit` from `~/projects/sysadmin`. Broker is UP on :3110; 4090 holds
  `qwen3-coder:30b`, 3060 holds `gemma4:12b`. Last session's "pipeline broken" was the old
  runner, not the broker — verified.
- Never `demo:reset` while the real tenant is loaded — it truncates the whole bask schema.
  Real tenant uses `INGEST_NS=salontouch-2026`, `INGEST_ORG_SLUG=salontouch-real`.
- Public repo. No client name, no creds, no exact financials in tracked files. Research lives
  under the gitignored `docs/research/salontouch-*`.

## Open inputs — cannot be self-answered

- **Demo date.** Asked three times, still unanswered. Decides what is reachable.
- Industry attachment benchmark: none in hand. Ask Nick or Mike; do not invent one.
- Lapse-recovery lift: the stakeholder's slider, not our claim.
