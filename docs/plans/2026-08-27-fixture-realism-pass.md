# Fixture realism pass — anchor the demo salon to the SalonTouch field data

**Owner directive, 2026-08-27:** *"yes bring the demo data closer to the salontouch"* — after approving
both (a) realistic retail attachment and (b) the database wipe a fixture rebuild requires.

**Purpose line.** This exists so that the demo data is *closer to the SalonTouch field data* — the real
client dataset the pitch claims to be grounded in.

---

## The measurement that drives every number below

Taken from `salontouch-real` **before** any reset, because the reset destroys it. 194,672 visits across
four de-identified salons, 2016–2020.

| metric | SalonTouch (real) | fixture before | fixture target |
|---|---|---|---|
| attachment — retail lines ÷ visits | **5.2 – 9.4%** (house ≈ 5.8%) | 21% → 15% | **8% → 5.5%** |
| average product line | **$16** | $47.80 velocity-weighted | **$18 – 22** |
| **retail as a share of revenue** | **8.6 – 12.1%** | **59%** | **~20%** |
| % of sales carrying retail | 18 – 27% | — | falls out of the above |

The 8% → 5.5% target is not invented: `docs/research/salontouch-coefficients.md` already records the
attachment ceiling as **8.48% best staffer against a 5.28% house rate**. The fixture's laggard-vs-rest
split maps onto exactly that finding.

## Why the cold open was negative — the actual mechanism

Retail is **59% of revenue** in the fixture. The attachment arc (21% → 15%, which the pitch *wants*)
therefore drags **total** revenue down ~30%, and the Daybreak headline compares total revenue against
the mean of the previous four same weekdays. So a salon whose traffic was **up 8.7%** reported as
"24% below your usual Friday".

Confirmed three ways: sales count flat (654 → 640 weekly), non-retail revenue flat (~$5,100/wk),
retail revenue halved ($8,218 → $4,147). Visits up. Only retail moved.

Fix the share and the headline fixes itself — no metric was changed to flatter the demo.

## What changes

1. **`ARCS.attachment`** — `baselineRate` 0.225 → ~0.085; `laggardFloorRate` 0.05 → ~0.02;
   `othersFloorRate` 0.166 → ~0.065. Blended floor lands ≈ 5.5%.
2. **Catalogue velocity mix** (`ATTACHMENT_CANDIDATES`) — re-weight toward the cheap end so the
   velocity-weighted average line falls from $47.80 to ~$20. **Prices are NOT touched**: every
   `retailPrice` derives from a real published UVALUX wholesale price × `RETAIL_MARKUP`, verbatim
   from uvalux.com. Only how often each sells changes. BSK-10007 stays the top bronzer — Beat 3's
   low-stock story names it.
3. **New `ARCS.growth`** — a modest traffic ramp over the last 28 days, applied in `visitsForDay`.
   Real salons grow; the fixture's traffic was flat plus noise. This is what turns the headline
   positive **honestly**: traffic genuinely up, retail genuinely slipping.

## What must NOT break

Re-verify each after the rebuild — these are the beats:

- Attachment detector still fires (needs the decline inside its 14-day window vs the prior 28)
- 7 failed payments, 4 recoverable summing to $284/mo
- BSK-10007 ~8 days from stockout · BSK-10021 overstocked
- Tuesday 1–5pm soft window survives as the softest slot
- Spray tans +22%
- Tuesday campaign settles on day 5 into 9 bookings / ~$310

## Sequence

1. ✅ Measure SalonTouch (done — table above; reset destroys the source)
2. Edit constants + velocity mix + growth arc
3. `pnpm demo:reset` — **destructive, owner-approved 2026-08-27**
4. Measure the cold open; iterate 2–3 until it reads positive and the detectors still fire.
   Reset is ~32s, so iterate freely — SalonTouch is already gone by then and reloads once at the end.
5. `backfill-consent-profiles` — reset drops `consentProfile`, which is Beat 7's own data
6. Reload SalonTouch: ETL (`INGEST_ORG_SLUG=salontouch-real`, **default `INGEST_NS`**) then
   `backfill-sale-lines.ts`. A fresh load needs no `INGEST_WIPE` — the tables are empty — which
   avoids the non-atomic wipe that lost `sale_line` on 2026-08-26.
7. `demo-verify` 12/12 local **and** production, then read the cold open with my own eyes

## Known consequence, stated up front

**The opportunity cards get smaller.** The retail-attachment card quotes ~$1,270/mo today; against
realistic attachment it lands nearer $150–250/mo. That is the honest number for one salon, and it is
the trade the owner accepted. The pitch's answer is the network: 5.3% → 8.5% attachment across every
salon UVALUX supplies is where the money is, and that is Compass's story, not Today's.

## Rollback

The fixture generator is deterministic and seeded (`sunset-ridge-v1`). Reverting the constants and
re-running `demo:reset` restores the previous dataset exactly. SalonTouch reloads from
`~/salon-pull/canonical/` regardless, and NETCUP holds an independent copy of the pre-change schema.
