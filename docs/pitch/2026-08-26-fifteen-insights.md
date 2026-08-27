# 15 insights that close the deal — computed from the real data

Source: `~/salon-pull/canonical/` — 4 salons, 194,672 visits, 53,839 transactions, 20,179 customers,
13,225 memberships, 2016-01-02 → 2020-03-14, $2,088,612 revenue. Every number below is computed, not
estimated. De-identified as Salon A–D.

**Scale discipline.** Revenue is ~$124k/salon/yr and product is only **8.75%** of it. Absolute upside
figures are small. Lead with *percentages and ratios*, not dollars — the dollars are honest but
unimpressive, and quoting them invites the wrong argument.

---

## TIER 1 — the four that do the actual closing

### 1. The activation cliff: 40% never come back, and after that almost nobody leaves
Of true-new customers (n=6,184, cohort de-censored to first visit ≥2016-04-01), **60.0% reach a second
visit within 180 days. 40.0% never return.** Every step after that is flat: 2→3 is 83.9%, 3→4 is 86.2%,
9→10 is 86.2%.

**100% of the retention problem lives in one transition.** One-and-done customers are 28% of the base
and 3% of revenue. Confidence: HIGH.

*Why it closes:* one number, one lever, impossible to argue with. Every owner believes they have a
"retention problem" spread across the whole journey. It isn't — it's one door.

### 2. The lotion sale happens on visit one or never — 16.06% vs 3.84%
First visit attaches product at **16.06%**. By the sixth visit it is **3.84%**. A first visit is worth
**$3.03** of lotion, a later visit **$0.75** — **4.0x**. Ten percent of visits generate **30.9%** of all
lotion revenue.

Holds in all four salons and all three full years. Not a bundling artifact — first-visit lines are
ordinary SKUs at the same median $10.00 line value. χ² p<1e-300. Confidence: HIGH.

*Why it closes:* this is the replacement for the dead staff-ceiling pitch. Same emotional shape
("money on the table you can see"), 4.0x instead of 1.3x, and statistically bulletproof.

### 3. Salon B held its traffic flat and still lost 28% of its product revenue
2017→2019, **Salon B: visits +0.8%, retail revenue −27.9%.** Traffic contributed +$106; attach and
basket contributed −$3,629. Group-wide: retail −37.4% against visits −13.5%, while *service* revenue
per visit rose 11.4%.

They raised session prices and stopped selling lotion. Confidence: HIGH.

*Why it closes:* it is the "you have a selling problem you cannot see" argument, proved on one salon
where the usual excuse — footfall — is arithmetically unavailable.

### 4. The sister store converts 1.9x better with the SMALLEST basket
Product revenue per visit: **Salon C $1.322 vs Salon A $0.831 and Salon B $0.813.** Attach 8.47% vs
5.09%/4.82%.

**Salon C's basket when it does attach is the lowest of the four ($15.61).** Its bottle-size mix is
within a point of Salon A's. Its entire advantage is *asking more often*.

Every one of Salon C's 18 qualifying staff sits at or above the other salons' medians — **C's worst
performer (5.23%) beats A's median (4.95%)**. One person who worked all three: 5.86% at A, 5.19% at B,
**8.38% at C**. Confidence: HIGH on the gap, MODERATE on cause (n=1 shared staffer).

*Why it closes:* it kills every excuse at once — not pricing, not clientele, not assortment. And the
floor-beats-ceiling framing needs no statistical matching to stand up.

---

## TIER 2 — the operator's "I didn't know that"

### 5. "Churn" is a fiction: 92% of cancellations are a 30-day package expiring
**92.4% of 13,007 "cancelled" memberships end 28–35 days after start.** Median tenure exactly 30 days.
These are one-month packages, not subscriptions. 3.43 packages per member.

**There is no month-3 or month-12 tenure cliff and there cannot be one.** Anyone pitching
subscription-churn language against this data gets corrected in the room.

The real cliff is **cycle 1→2 at 38.1% renewal**, rising monotonically to **86.0% by cycle 10→11**.
Median gap between packages: **26 days** — and it stays double-digit in every month of the year.
Multi-cycle members are only covered by a paid membership **40.4%** of their span.

### 6. Half your revenue is 1,103 people, and you can name them in 90 days
Top 10% of customers = **50.4%** of revenue. Top 1% = 12.4%. Gini 0.656, stable across all four salons.

**Deployable rule: ≥9 visits AND ≥$150 in the first 90 days → 63.9% precision, 36.6% recall**, mean
730-day revenue **$533 vs $99**. corr(90-day, 730-day revenue) = 0.691.

*This is the best demo artifact in the set* — a concrete rule with stated precision, not a vibe.

### 7. Two-thirds of the catalogue has never sold a single unit
**454 of 673 SKUs (67.5%) never sold once. 408 are still flagged `active`.** Top 10 SKUs = 40.9% of
product revenue; top 50 = 80.1%.

By brand: **SUPRE holds 103 catalogue slots — 15% of the entire assortment — and produced $664 in four
years.** Devoted Creations: 66 slots, $81. Five brands have 61 slots and **zero** sales.

*Caveat that must travel:* `inventory_snapshots` is empty, so say "never sold in this window", never
"$X of dead inventory sitting on the shelf."

### 8. The morning shift doesn't sell — and it's the shift, not the customers
Pre-11am attaches at **3.30%** vs **5.17%** midday — a 36% relative collapse. Consistent in all four
salons, χ² p=4.1e-10.

**Isolated properly:** same staffer against themselves (12 with ≥150 morning and ≥500 other visits) —
3.32% vs 4.37%, **11 of 12 sell less in the morning**, Wilcoxon p=0.0024. Same *customer* against
themselves shows only a 0.29pp effect, a quarter the size. So the shift explains most of it.

**Worth only $683/yr. Present it as a management insight and attach no dollar figure.**

### 9. A short first session nearly doubles the return rate
Non-members, first visit: **1–6 minutes → 69.9% return. 13–15 minutes → 32.1%.** z=11.5, survives
multivariate logistic at OR=1.70. Not a bed-tier proxy (corr with visit-1 spend = −0.039).

**The nuance that makes it credible:** the effect vanishes entirely among day-1 members (97.8% vs
98.0%). It only operates on the undecided. Plausible mechanism: burning a first-timer ends the
relationship.

### 10. Which staffer serves a first-timer changes membership conversion 12.7x
Day-1 membership conversion by staffer (n≥80 first-visits, 24 staff): **3.5% → 44.3%.** χ²=283 on
df=23. **Within a single salon**, removing pricing and location: Salon C runs 3.5%–23.6%.

Day-1 members return at **97.4%** vs 48.4%. The staff effect survives controlling for membership
(non-members only: 37.8%–68.0% second-visit rate).

*Caveat:* staff aren't randomly assigned, and `staff_id` labels repeat across salons — "Staff 17" at B
and C are different people.

---

## TIER 3 — the supplier-facing and defensive numbers

### 11. Lotion demand is 3.77x seasonal and the reorder decision lands in the trough
Visits swing **2.79x** (peak ISO week 20 mid-May at 211.3/open-day, trough week 44 late October at
75.7). **Product revenue swings harder — 3.77x.** All four salons peak in May, all four years.

The ramp inflects at **week 9–10 (early March)**, jumping from +8.8/week to +21.7, +18.5, +24.2, +24.6.
Three weeks of foresight covers a **12.6% volume step**.

*The UVALUX argument:* the reorder decision has to be made when the salon's own recent sales data is at
its least informative.

### 12. Beds are not the constraint — the floor runs at 7–9% of capacity
Peak-hour utilisation: Salon A **13.7%**, B 11.7%, C 11.5%, D 5.9%. Week-mean 3.4–8.7%. There is
**59% headroom (566 more sessions/week) before any salon touches its own existing peak-hour rate.**

Method: no room/bed rows exist, so maximum observed simultaneous sessions is used as a *lower bound* on
bed count — if real bed count is higher, utilisation is lower and headroom larger. Error runs safe.

**This cuts against an equipment pitch — get ahead of it.** The data says these dealers don't need more
beds; the lever is consumables throughput per existing visit. Say it first, or the sharpest person in
the room finds it and you're on the back foot.

### 13. One brand family is 77.3% of every product dollar
Australian Gold alone: **73.1% of lotion revenue** ($123,916 of $169,526). Grouped with Swedish Beauty,
Designer Skin and Emerald Bay: **77.3% of all product revenue** — within 0.4pp of the previously
reported 77.7%.

**But the two figures measure different things.** $433,333 was *purchases*; there is no purchase-order
or inventory table in this extract. Sell-through here is $182,843. **Do not present 42.2% as a
sell-through rate** — the windows may not match.

Safe framing: "Product is 8.75% of revenue. Within it, one brand family is 77.3% of every dollar."

### 14. Over half your lotion buyers never buy twice — and they keep walking past you
**53.9% of customers who ever bought a lotion (1,807 of 3,354) bought exactly once.** Those proven
buyers then made **30,111 further visits — 9.0 each — without buying again.**

Median gap between a customer's consecutive lotion purchases: **26 days** (p25 7, p75 123). A clean
replenishment cadence you could trigger on. Overall penetration: only 26.1% of customers ever buy.

### 15. Customer quality is FLAT — hold this in reserve
Naive lifetime revenue by first-visit year reads **$277 → $142 → $121 → $82**, which looks like a
business whose customers are getting worse. It is pure right-censoring.

Fixed-window truth — first-365-day revenue per true-new customer: **2016 $91 · 2017 $91 · 2018 $96 ·
2019 $106.** Flat to slightly improving.

*Why it matters:* if anyone in the room runs the obvious query they will "discover" a collapsing
business. Have this ready.

---

## DEAD — do not put these in the deck

| Claim | Verdict |
|---|---|
| **"Your best staffer proves the attachment ceiling"** | **DEAD.** Per salon, 500-visit floor: only 3 of 12 salon-years p<0.05. Spreads 1.1–2.0x, not 3–5x. Worth $859–$3,240/salon/yr. Replace with insight #2. |
| "Buying product on visit 1 predicts a 2nd visit" | **DEAD.** Naive 1.15x → OR=1.06 controlled. Pure spend/membership confound. |
| "Lotion buyers are more loyal" | **DEAD.** Exposure bias. Matched on early-visit count, non-buyers had MORE later visits in 19 of 20 strata. |
| Gross margin / best-seller-vs-best-margin | **UNCOMPUTABLE.** `unit_cost` null on 673/673 products. |
| Discount / margin leakage | **DEAD.** Non-zero on 16 of 53,839 transactions (0.03%, $1,098). Realized price is 102.1% of list. |
| Price leakage by staff | **DEAD.** 95.9% of lines sell at exactly list. |
| Membership tenure cliff at month 3/12 | **DEAD.** 30-day packages; no such cliff can exist. |
| COVID crashed the business | **DEAD.** Mar 2020 = 106 visits/day vs Feb 101. Data just ends 2020-03-14. |
| Customer quality declining | **DEAD.** Censoring artifact — see #15. |
| Walk-in vs booked | **DEAD FIELD.** `walk_in` = true on all 194,672 rows. |
| Why members cancel | **UNANSWERABLE.** `cancel_reason` 100% null. |
| Failed-payment recovery | **UNANSWERABLE.** `membership_payments.csv` empty by design. |

## Traps that must travel with the numbers

1. **Attachment has two denominators** — per-visit 5.74%, per-transaction 21.74%. Bask uses per-visit.
   Say which, every time.
2. **Per-visit attachment penalises high-frequency salons.** corr(visits per customer, attachment) =
   **−0.81, p=0.001**. Two-thirds of Salon C's headline 1.9x lead is a denominator artifact — on
   lotion $ per customer-year the gap is 1.2x. **If Bask ships a cross-salon attachment league table,
   it will rank high-frequency salons last for a reason unrelated to selling.** Report $/customer-year
   alongside it.
3. **The 71.4% reactivation figure is per lapse-episode, not per customer** (54.5% at customer level).
4. **Only 26.1% of visits carry a transaction** — 74% of tanning is pre-paid. Revenue-per-visit is a
   trap metric.
5. **Membership revenue is already inside `transactions.csv`** (98.1% matched within ±1 day). Adding
   `monthly_price` double-counts $714,321.
6. **Salon D covers only 2017-01-29 → 2019-07-14.** Never include it in a year-over-year trend.
7. **2020 is 74 days.** Never annualise it.
8. **43.5% of customer records have zero visits.** The honest base is **11,411 ever-visited**.
