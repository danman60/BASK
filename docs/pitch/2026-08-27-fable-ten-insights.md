# Ten new insights — computed 2026-08-27 (Fable pass)

Source: `~/salon-pull/canonical/` — 4 salons, 194,672 visits, 53,839 transactions, 20,179 customer
records (11,411 ever visited), 13,225 memberships, 2016-01-02 → 2020-03-14, $2,088,612 revenue.
All numbers computed fresh this pass; nothing below re-derives the fifteen already banked in
`2026-08-26-fifteen-insights.md` (cited as F#1–F#15 where built upon). True-new cohort = first visit
≥ 2016-04-01. Observation end 2020-03-14. Every rate states its denominator.

Companion deliverable: `2026-08-27-fable-ten-insights.html` — Bask-branded, owner-facing, stats in
collapsed provenance blocks per the two-audience rule.

---

## 1. The week-one door — first-timers decide in days, not weeks

**Owner sentence:** "A first-timer who hasn't come back within a week has probably already decided —
if I'm going to call anyone, it's them, on day five, not day thirty."

**Stats:** True-new customers with ≥180d observation, n=8,732; 64.2% return within 180d. Among
returners, median gap to second visit = **2 days** (p25 1, p75 7, p90 31). **76.3% of all eventual
returners are already back within 7 days**; 84.4% within 14. Conditional survival: not back by day
7 → P(return within 180d) = **29.8%** (n=4,451 at risk); by day 14 → 21.9%; by day 28 → 15.7%;
by day 90 → 6.0%. Builds on F#1 (the 40% activation cliff) — this is its clock.

**Sizing:** the undecided-at-day-7 pool is ~322 customers per salon-year. A late returner
(second visit day 8–180) is worth **$113 mean first-365-day revenue** (n=1,327). Each percentage
point of extra conversion from outreach ≈ 3.2 customers ≈ **$360/salon-yr** — modest dollars, but
the lever is a free text message and the pool is enumerable by name.

**Lever (salon + Bask feature):** automatic day-5 "come back" touch to any first-timer without a
second visit. Bask can generate the daily list; the owner sends one message.

**Moves:** salon (Bask feature). **Confidence: HIGH** — large n, monotone hazard, consistent with
banked cliff. The 29.8% is observational; the lift from outreach is untested in this data.

## 2. Renewal is decided by mid-month — and it's visits, not price

**Owner sentence:** "I can tell by the 15th which members won't renew — they're the ones I haven't
seen. And it has nothing to do with what the package costs."

**Stats:** First-cycle members whose package ended ≥90d before data end, n=3,741; 32.0% renew
(next membership starts ≤90d after cancel, consistent with the banked 38.1% cycle-1→2 figure F#5,
which used a different renewal window). Renewal by visits **during the whole first package**:
1–2 visits → 15.6% (n=231); 3–5 → 20.7%; 6–9 → 33.7%; 10–14 → 41.7%; 15+ → **52.3%** (n=214).
Point-biserial r=0.208, p=6.7e-38. Direction holds in **all four salons** (use≤2 vs use≥10:
8.3%→48.5%, 8.7%→41.3%, 21.1%→48.4%, 11.9%→35.4%).

**Actionable-early version:** visits in the **first 15 days** alone: 0–1 → 17.4% (n=155);
2–3 → 25.3%; 4–5 → 31.7%; 6–7 → 37.2%; 8+ → **42.4%** (n=446).

**The dead alternative that makes it land:** plan price does NOT move renewal — ≤$35 → 32.5%,
$36–65 → 32.8%, $66–90 → 27.7%, >$90 → 35.2% (n=742/1,817/674/400). Discounting is not the lever;
usage is.

**Lever (salon + Bask):** a mid-month save list — members under ~4 visits by day 15. The nudge is
"come in", not "here's 10% off". Causality caveat below.

**Moves:** salon. **Confidence: HIGH on the association, MODERATE on the intervention** — low usage
partly reveals already-lost interest; a usage nudge may not convert all of the gap. But the gradient
is steep enough that even partial causality pays, and the save list costs nothing.

## 3. The two-week expiry clock

**Owner sentence:** "When a member's month runs out, I have about two weeks to sell the next one —
after that they slide from member to occasional."

**Stats:** Cycle-2 packages, by latency after cycle-1 expiry, outcome = cycle-3 renewal (≤90d,
observable n=1,188): started ≤0d late → 51.0% (n=147); 1–3d → 54.4% (n=195); 4–7d → 55.9%
(n=188); 8–14d → 52.6% (n=156); **15–30d → 40.3%** (n=216); **31–90d → 33.2%** (n=286). Flat
plateau through day 14, then a cliff. Related: banked median gap between packages is 26 days (F#5).

**Lever (salon + Bask):** the winback touch for an expired member belongs at **expiry + 7**, not
month-end. Bask: expiry calendar with a 14-day countdown per lapsed member.

**Moves:** salon. **Confidence: MODERATE** — n per bucket is 147–286 and prompt rebuyers are
self-selected keener members; the plateau-then-cliff shape (not a smooth decay) is what suggests a
real window rather than pure selection. Present as a window, never as a guaranteed save rate.

## 4. The membership question is a first-two-visits question

**Owner sentence:** "If somebody didn't join in their first visit or two, they're almost certainly
never joining — no matter how often they keep coming in."

**Stats:** True-new members (n=2,854 joiners): **76.8% join at visit 1, 87.2% by visit 2**, 92.3%
by visit 5. The striking part is the conditional: among customers with ≥k visits and no membership
yet, P(ever join) is **flat at 8.7–10.1% for every k from 1 to 12** — a customer on their 12th
unmemebered visit is no more likely to join than one on their 2nd. Loyalty does not ripen into
membership here. Complements F#10 (day-1 conversion varies 3.5%–44.3% by staffer): the staffer
effect operates inside exactly this two-visit window.

**Lever (salon):** put the membership pitch — and the best converter (F#10) — on visits 1–2.
Stop re-pitching the 9%; the veteran non-member needs a different product (e.g. a punch-card /
loyalty construct), not the same monthly close.

**Moves:** salon. **Confidence: HIGH** — big n, and the flatness of the conditional is the finding;
no significance test needed beyond the stability across k.

## 5. Your best "new customer" is an old one — and they leave without warning

**Owner sentence:** "Somebody who used to come and stopped is worth more than a brand-new walk-in —
and they don't slow down before they disappear, so I have to run a list, not a feeling."

**Stats, part 1 (winback value):** first reactivation events (gap ≥90d, ≥365d observation,
n=3,929): forward-365 revenue mean **$93.40, median $50.00**, 12.2 visits. New true-new customers
with 365d observation (n=7,813): mean $62.80, **median $4.00**. A returned lapser out-earns a fresh
walk-in 1.5x at the mean and 12.5x at the median. 53.6% of reactivators lapse ≥90d again — the cycle
repeats, and per banked trap #3, 71.4% of lapse episodes reactivate.

**Stats, part 2 (no warning signature):** lapsed regulars (≥8 visits then ≥120d silence, n=3,458)
show final-3-visit median gap 4.0d vs their own baseline 3.0d, ratio 1.20 — statistically
indistinguishable from still-active regulars' 1.17 (Mann-Whitney p=0.18). An interval-stretch alert
("their visits are slowing down") has **10.6% precision against a 6.9% base rate** — useless.
Customers here stop cold.

**Lever (salon + Bask):** a monthly 90-day-quiet list. Because there is no behavioural early
warning, the *calendar* is the only trigger that works — which is exactly what software is for.

**Moves:** salon (Bask feature); Compass angle — reactivation-list volume is a sellable account
metric. **Confidence: HIGH on the numbers, with an honest selection caveat** — reactivated lapsers
are proven tanners, so this ranks winback *targeting* above cold acquisition; it does not prove a
winback message causes the return.

## 6. The sample that never becomes a sale — the packette trap

**Owner sentence:** "Most people's first lotion is a $9 sachet — and almost none of them ever move
up to the bottle. They're not sampling, they're settling."

**Stats:** first lotion purchase per customer with parseable size (472/598 lotion SKUs parsed,
buyer n=3,271): **69.6% start with a packette (≤1 oz)**. Packette median $9.50 = **$19.00/oz**;
bottle (>2 oz) median $38.50 = **$4.53/oz** — the sachet customer pays 4.2x per ounce. Only
**14.9%** of packette-first buyers ever buy a bottle (vs 26.9% of bottle-first buyers buying
another bottle). Packette-first buyers actually repurchase *more often* (50.1% vs 38.1% any
repurchase) — they are loyal to the sachet, not on a ladder to the bottle. Among the 340 who did
graduate, median time to first bottle = 67.5 days. 365-day lotion spend (≥365d obs): packette-first
mean $29.10 / median $11.20 (n=1,939) vs bottle-first mean $57.70 / median $43.00 (n=898),
Mann-Whitney p=2.0e-168.

**Lever (both, and this is the most UVALUX-shaped finding in the set):**
- *Salon:* a trade-up script at the **second** sachet purchase ("two of these costs more than half
  the bottle") — the repurchase moment is frequent (50%) and identifiable at the register.
- *UVALUX/Compass:* sampling-program design — sachet-to-bottle conversion is a per-account metric
  a rep can sell against; counter cards and sachet+bottle bundle pricing are supplier moves.

**Moves:** UVALUX first, salon second. **Confidence: HIGH on the pattern; the spend gap carries a
selection component** (bottle-first buyers are more committed to begin with), so pitch the
*mechanism* (nobody graduates without being asked) rather than promising the full $29→$58 gap.

## 7. A quarter of the revenue shops at more than one store

**Owner sentence (owner-group / supplier framing):** "One customer in nine uses more than one of
these salons — and that one-in-nine is a quarter of all the money."

**Stats:** customers visiting ≥2 salons: 1,314 of 11,411 ever-visited (**11.5%**), carrying
**30.1% of all visits** and **$533,585 = 25.5% of all revenue**. Multi-salon customers average 44.5
visits / $406 vs 13.5 / $154 for single-salon (visit-count MWU p=6.4e-255). 11.2% of all visits
happen away from the customer's home salon. (Home = `customers.salon_id`; salon_id read as string —
a leading-zero dtype bug makes this figure 77% if salon ids are parsed as integers.)

**Lever:** *Owner-group:* cross-honored memberships and consistent pricing/assortment — the
heaviest quartile of revenue already treats the four salons as one brand. *UVALUX/Compass:* sell
and stock the group as **one market**, not four accounts — an assortment gap at one location leaks
the group's best customers' baskets, and account-level metrics understate these customers at every
individual store.

**Moves:** UVALUX + owner group. **Confidence: HIGH on the concentration; heaviness→roaming is
selection (heavy users roam because they visit a lot), so frame as market structure, not causation.**

## 8. Renewal day is the quietest register in the shop

**Owner sentence:** "The day a member hands us money for another month is the day we're least
likely to sell them anything else."

**Stats:** per-TRANSACTION attach (retail_revenue > 0; stated because per-visit is the banked
default): membership **signup-day** transactions attach at **19.2%** (n=4,044) — commitment
moments can sell. Membership **renewal-day** transactions attach at **7.7%** (n=9,395) vs 11.7%
for other service-carrying transactions (n=31,885), χ² p=9.1e-41. Veteran-controlled (customers
with ≥10 lifetime visits only, removing the F#2 visit-rank decay confound): renewal-day 7.6%
(n=9,273) vs same-customers' other service transactions 10.3% (n=23,442), χ² p=6.1e-14 — a 26%
relative gap that survives the control.

**Sizing:** honest and small — closing the gap at the median attached line (~$9.75) is worth only a
few hundred dollars a year per salon. The value is that these ~2,700 moments/salon-yr are
**scheduled and known in advance** — the cheapest possible prompt to automate.

**Lever (salon + Bask):** a renewal-day bundle prompt at the register ("add the bottle to the
package for $X"). Present as a system insight, not a revenue projection.

**Moves:** salon (Bask trigger feature). **Confidence: HIGH on the gap, LOW on the dollars — say so.**

## 9. January members stay; July members are borrowing a tan

**Owner sentence:** "The members I sign in January stick around; the ones who join in July are
gone with the season."

**Stats:** first-package renewal by start month, de-censored cohort (first package ≥2016-07-01 AND
first visit ≥2016-04-01, n=2,331): **January 38.7%** (n=168) vs 27.0% all other months
(n=2,163), χ² p=0.0015; **July 20.4%** (n=216) — Jan/Jul = 1.9x. Broad winter-vs-spring is NOT
significant (DJF 31.1% vs MAM 28.2%, p=0.30) — the effect is January-specific.
**Censoring correction that must travel:** the naive all-data January figure is 51.3% (p=1.4e-19)
but 58% of that sample starts January 2016 — pre-2016 members invisible in this extract renewing,
not new joiners. 38.7% is the honest number.

**Lever:** *Salon:* January acquisition push (the resolution-season joiner is worth ~1.4x the
average, ~1.9x the July joiner); sell summer joiners a bigger upfront package instead of banking on
a renewal that four times out of five won't come. *UVALUX:* January sell-in support alongside the
banked March inventory ramp (F#11).

**Moves:** both. **Confidence: MODERATE — n=168 in the clean January cell; direction consistent in
2017/2018/2019 taken separately (31.8%/40.9%/44.0% vs ~28%) but each year is thin.**

## 10. Autumn first-timers walk away more — point the week-one machinery at them

**Owner sentence:** "A first-timer who walks in this fall is more likely to vanish than one who
walked in this spring — they're the ones worth the follow-up."

**Stats:** true-new customers with ≥365d observation (n=7,813): 180-day return rate by
first-visit month — spring (Mar–May) **69.2%** (n=3,183) vs autumn (Sep–Nov) **56.9%** (n=1,044),
z=7.09. First-365-day revenue is identical (mean $62.80 vs $63.10, MWU p=0.009 on distribution
shape but no practical mean difference) — autumn recruits are worth the same *when kept*; they are
simply lost at the door more often.

**Lever (salon):** the day-5 touch from insight #1 and the best-converter scheduling from F#10,
aimed first at Sep–Nov first-timers — the smallest, hardest-won, equally-valuable cohort, arriving
exactly when the banked seasonal trough (F#11) makes every customer scarcer.

**Moves:** salon. **Confidence: HIGH on the gap; mechanism (season vs who walks in off-season) not
separable in this data.**

---

## What we tested that died this pass

| Hypothesis | Verdict |
|---|---|
| "Customers slow down before they quit" (interval-stretch early warning) | **DEAD.** Lapsed regulars' final-3-visit gap ratio 1.20 vs active regulars' 1.17, MWU p=0.18. A gap≥3×-personal-median alert: 10.6% precision vs 6.9% base. They stop cold. This is *why* insight #5's calendar list is the only workable trigger. |
| "A faster second visit means a better customer" | **DEAD.** 365d revenue by return-velocity bucket: $85–$109, no monotone gradient (1–3d $90.8, 8–14d $101.7, 61–180d $84.8; day-1-member exclusion doesn't change it). Speed of return predicts nothing once they return. |
| "Seeing the same staffer builds loyalty" (continuity → retention) | **DEAD.** Staff-continuity share over first 5 visits vs later visit count: Spearman r=0.003, p=0.84 (n=5,623). |
| "First-timers arrive on the weak morning shift" (staffing mismatch) | **DEAD.** Only 3.3% of first visits happen before 11am (vs 4.3% of all visits) — there is nothing to re-schedule. First visits are flat Mon–Sat (1,550–1,869), dip Sunday (1,022). |
| "Cheaper plans renew better" (price sensitivity of renewal) | **DEAD / null.** ≤$35 32.5%, $36–65 32.8%, $66–90 27.7%, >$90 35.2%. No gradient. Feeds insight #2: usage, not price. |
| "The busy floor kills the lotion sale" (crowding) | **REAL BUT TINY.** Attach falls monotonically with same-hour visits, 6.5% (alone) → 5.2% (9+/hour) within 11:00–19:59, χ² p=4.5e-6 — but closing it is worth ~$933/yr across all four salons. Keep as a management observation; never monetize it. |
| "Winter joiners renew better than spring joiners" (broad seasonality) | **DEAD.** DJF 31.1% vs MAM 28.2%, p=0.30. Only January specifically survives (insight #9). |
| "January members renew at 51%" | **CORRECTED.** Left-censoring: Jan-2016 'first' packages are largely pre-2016 members renewing. Clean figure 38.7%. |

## Denominators & traps carried forward

- Attach rates in insight #8 are per-**transaction** (stated inline); everywhere else attach is
  per-visit per the banked convention (F trap #1).
- All cohort work uses first visit ≥2016-04-01 and explicit observation-window floors (180d/365d/
  545d as stated) against END=2020-03-14 — no naive lifetime numbers (F trap re censoring).
- Membership revenue never added on top of transactions (F trap #5). Salon D never in YoY (F trap #6).
- `salon_id` must be read as a string — integer parsing silently drops a leading zero and corrupts
  any cross-salon join (discovered and fixed this pass; the 77% cross-salon figure it produces is
  garbage vs the true 11.2%).
- Lotion size parse covers 472 of 598 lotion SKUs; packette analysis excludes the unparseable 126.

---
---

# PART II — second pass, same day (social graph, sales moments, strategy layer)

Computed 2026-08-26 evening. New veins: co-arrival social graph, reactivation-moment conversion,
plan migration, LTV shape, membership annuity. The HTML deliverable now integrates both passes
(diagnosis block + 12 cards).

## 11. The buddy economy — tanning is social, and churn is contagious

**Owner sentence:** "A fifth of my visits walk in as pairs — and when one half of a pair quits,
the other half usually follows within weeks. Lose one, lose two."

**Stats:** co-arrival = two different customers checking in at the same salon within 180 seconds.
**40,014 co-arrival events = 20.6% of all visits.** 35,111 distinct pairs; 313 pairs co-arrived
≥5 times ("stable pairs"), containing 554 customers (**4.9% of ever-visited**) who average **67.3
visits / $451** vs 14.5 / $169 for everyone else and carry **12.0% of all revenue**.

**Contagion:** partners' *final* visits land within 30 days of each other **46.3%** of the time
among pairs both active into 2019 (n=188), vs **14.9%** for random same-salon pairs both active
into 2019 (n=11,997) — 3.1x. Direction test: for pairs that split ≥120d apart (clear leaver +
survivor, leaver's last visit inside a clean window, n=118 survivors with non-zero pre-rate), the
survivor's own visit rate drops **45.4%** in the 90 days after the partner's last visit (13.5 →
7.4 visits, Wilcoxon p=3.2e-11, 80.5% of survivors declined).

**The inversion that survives scrutiny:** a first-timer *brought by an existing customer* returns
at 66.3% vs 63.9% solo — barely anything (p=0.036). But **two first-timers arriving together
return at 56.9%** vs 63.9% solo (χ² p=0.0018, n=522) — friend-group first visits are event tanning
(weddings, vacations), not habit formation.

**Levers:** (salon/Bask) when one member of a known pair goes quiet, flag **both** — the survivor
is now the highest-risk regular in the building; winback messaging can address the pair ("bring
her back — two-for-one week"). Sell duo memberships to stable pairs. Treat two-first-timers-together
as an event signal: sell the occasion package, then run the day-5 window (insight #1) twice as hard.

**Moves:** salon (Bask feature — the pair graph is computable from the till log alone).
**Confidence: HIGH on pair prevalence and value; MODERATE-HIGH on contagion** — common shocks
(shared season, shared life event) can't be fully separated from influence, but for *targeting* it
makes no difference: the partner's lapse is observable and predicts the survivor's decline either way.

## 12. The comeback visit is the best sales moment in the shop (upgrade of Part I #5)

**Owner sentence:** "The day a lapsed customer walks back in, they're more ready to join and more
ready to buy than anyone else who comes through the door — including brand-new customers."

**Stats:** reactivation visits (return after ≥90d gap, n=9,741): a membership is purchased **that
same day 28.7%** of the time vs a 6.5% same-day base rate across all visits — **4.4x**. Retail
attaches on the comeback visit at **13.74% per-visit** vs the 5.74% all-visit rate — **2.4x** —
nearly matching the first-visit rate (16.06%, banked F#2). The comeback is a *second first visit*,
and it is even better at the membership close than visit 1.

**Lever:** the winback list (Part I #5) is not a retention expense — it is the highest-converting
sales audience the salon has. Script the comeback: greet, re-tour, offer the join. For UVALUX:
comeback volume × 2.4x attach makes reactivation campaigns a lotion-velocity lever, not just a
visits lever.

**Moves:** salon + UVALUX. **Confidence: HIGH** — n=9,741, both ratios large; note the comparison
base is all-visits, and comeback visits are self-selected moments of renewed intent — which is
precisely why the moment is worth staffing for.

## 13. Let them downshift — the downgrade is a retention move, not a churn signal

**Owner sentence:** "A member who drops to a cheaper plan isn't halfway out the door — they stick
around longer than the ones who never change plans."

**Stats:** cycle-to-cycle plan moves (n=9,374 transitions with both prices): 73.9% same, 15.1% up,
11.0% down. Members who **downgraded at cycle 2** (n=254) go on to **6.06 total packages on
average (median 4)** vs 5.23 (median 3) for same-price (n=1,529) and 5.42 for upgraders (n=366);
lifetime revenue $415 vs $427 vs $474. The downgrader gives up ~$12–59 of lifetime revenue but
buys the most months of tenure — and upgraders are worth most of all.

**Lever:** when a member balks at renewal, the save offer is the **cheaper tier**, not a discount
on the same tier (discounting is a dead lever here — Part I #2). A downshift keeps the annuity
alive; the escalator (see Part II diagnosis) does the rest. Plan-change friction is self-harm.

**Moves:** salon. **Confidence: MODERATE** — n=254 downgraders at cycle 2; direction consistent,
magnitudes modest; present as "downgrades are safe", not "downgrades are better".

## 14. The membership escalator — the annuity math (strategy layer)

**Owner numbers, plain:** renewal gets easier every single cycle, without exception:
32.0% (1→2), 39.2%, 47.5%, 53.8%, 58.7%, 60.7%, 64.4%, 70.4%, 67.7%, 77.4% (10→11), … 86.6%
(15→16); n falls 3,741 → 119 along the curve. Expected *remaining* packages (median package
$39.95, curve held flat past cycle 15): cycle-1 member ≈ 0.6 more (~$24); cycle-3 ≈ 1.2 (~$49);
cycle-5 ≈ 1.9 (~$76); cycle-10 ≈ 4.2 (~$169). **Every early renewal roughly doubles the expected
tail.** All of the mortality is at the bottom of the escalator, which is exactly where Part I
#2/#3/#4 operate.

**Member-year vs casual-year (2018, the one full clean year):** 4,734 active customers; the 1,627
with any membership coverage that year average **$154** (median $100, median 12 visits); the 3,107
casuals average **$85** (median $55, median 3 visits). One conversion ≈ **+$70/yr**, on beds
running at 7–9% of capacity (banked F#12) — the marginal cost of serving it is approximately zero.
Ever-members are 33.7% of customers and 56.0% of revenue.

**The one-paragraph diagnosis a partner would sign:** this is a fixed-cost asset running 93% empty,
fed by an escalator of 30-day commitments whose survival compounds from 32% to 87%, in a demand
pool where a fifth of visits are social pairs. Nothing on the cost side matters at this scale;
every lever in this document is a demand-side lever, and at 7–9% utilization each incremental
visit, renewal and conversion drops through at close to full margin. The playbook is five
calendars — day-5 (first-timers), day-15 (member usage), expiry+7 (renewal window), 90-days-quiet
(comebacks), pair-partner-lapsed (contagion) — and zero discounts.

## Second-pass hypotheses that died

| Hypothesis | Verdict |
|---|---|
| "Friends who bring a friend create sticky customers" | **MOSTLY DEAD.** Brought-by-existing 66.3% vs solo 63.9% (p=0.036, trivial). The social effect is in *pairs of regulars*, not in the introduction moment. |
| "Customers with a fixed time-of-day habit retain better" | **DEAD (slightly inverted).** Tight-hour (<1.5h std, n=296) 40.2% still-active vs 53.5% for looser; Spearman r=0.048. Rigid-schedule customers are if anything more fragile. |
| "Gift certificates are an acquisition channel" | **DEAD.** 13 transactions ever paid with 'GIFT C.'; COUPON n=25. No channel exists in this data. |
| "Members free-ride in the gaps between packages" | **DEAD — opposite.** Only 5.8% of multi-cycle members' span-visits fall in uncovered gaps, and 40.8% of those carry a same-visit transaction (mean $35.25) vs 14.4% of covered visits. Gap visits are *paid* sessions. No leakage. |
| "Customer value is front-loaded — harvest fast" | **DEAD.** Only 12.5% of a 2-yr customer's revenue arrives in the first 30 days; 26.0% by day 90; 62.6% by day 365 (n=5,896 two-year-observed true-new, $596k). The customer is an annuity — which is why the retention calendars out-earn any harvest tactic. |

## Part II methods notes

- Co-arrival threshold 180s, same salon, different customer_id; pair key is the sorted id pair.
  Sensitivity not swept — 3-minute window chosen a priori; sub-minute clustering would only tighten pairs.
- Contagion null is random same-salon pairs conditioned on both members' last visits ≥2019-01-01
  (matches the survivor-era base); the naive unconditioned null (5.8% within-30d) overstates the effect.
- Survivor pre/post uses 90-day symmetric windows around the leaver's final visit; survivors with
  zero pre-window visits excluded (can't drop from zero).
- Annuity expectation holds the cycle-15 rate (86.6%) flat for cycles >15 — conservative if the
  true curve keeps rising.
- 2018 chosen for member-year vs casual-year because it is the only calendar year fully covered by
  all salons except D (D included; its partial-2019 coverage does not affect a 2018 slice).
