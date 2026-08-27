# Accuracy review — Fable's 14 insights

Every number independently recomputed from `~/salon-pull/canonical/` by three adversarial passes
instructed to **refute**, not confirm. Reviewing `2026-08-27-fable-ten-insights.md`.

**Headline:** the arithmetic is clean — most figures reproduce to 3 decimals. The failures are
**framing** and **one systemic cohort error**. Four insights are stakeholder-ready as written; five
need a rewritten sentence; five have numbers that must not be shown.

---

## THE SYSTEMIC ERROR — fix this first, it contaminates four insights

The report defines the true-new cohort as **"first visit ≥ 2016-04-01"**. The banked analysis used
**"first visit ≥ 2016-04-01 AND signup ≥ 2016-01-02"**. Dropping the signup filter re-admits
**2,518 left-censored customers** — people who were already long-standing before the extract opened.

Proof it is an error, not a preference:
- Median **1,462 days** (4 years) between `signup_date` and first *observed* visit for the re-admitted
  group, vs **0 days** for genuinely new customers.
- The share of "true-new" whose signup predates 2016 **decays monotonically** by quarter —
  59.0% → 48.2% → 36.6% → 22.4% → … → 13.5%. The textbook left-censoring shape. **59% of the
  Q2-2016 "true-new" cohort are returning veterans.**
- They behave like veterans: 73.1% return within 180d vs 60.6% for genuinely new.

**Contaminates insights 1, 4, 5 and 10.** (#4's headline survives — see below.)

---

## STAKEHOLDER-READY — survived every attack, use as written

### #2 Renewal is decided by usage, not price — the strongest in the set
Gradient reproduces (15.5 / 20.2 / 33.2 / 41.3 / **54.2%** by visits during the first package).
Price is genuinely null (32.1 / 32.8 / 27.7 / 35.2). **Four attacks all failed:** duration-proxy
(92% of packages are 28–32 days; median exactly 30.0 in *every* price band), cheap-plans-differ,
price-masked-by-usage, and left-censoring — which *strengthens* it (de-censored gradient
8.1 → 52.1, r=0.233 vs 0.215).
⚠️ Two fixes: the **32.0% base rate is left-censored → 27.8%**, and the owner sentence overstates
(below).

### #3 The two-week expiry clock — under-sold by the report
Plateau genuinely flat (χ² across the four ≤14d buckets **p=0.737**); cliff genuinely real
(≤14d 53.4% vs 15–90d 36.3%, **p=6.4e-09**). Survives de-censoring. The report self-rates MODERATE;
it is **HIGH on the shape**, moderate on any single bucket rate.

### #4 The membership question is a first-two-visits question
76.8% / 87.2% / 92.3% at visits 1/2/5 — exact, and **cohort-insensitive** (signup-filtered gives
75.0 / 88.1 / 92.7), so it does *not* inherit the systemic error. The flat conditional
(P(ever join) ≈ 9–11% at every k from 1 to 12) survives the censoring attack; forcing ≥365d residual
observation shifts the level but not the shape.

### #5b The no-warning signature
Reproduced almost exactly (n=3,458, ratio 1.21 vs 1.17, MWU **p=0.183**). Interval-stretch alerts
top out at 8.7% precision / 1.53× lift — useless, as claimed. "Run a calendar, not a feeling" holds.
**Bonus the report missed:** lapsed regulars had a *shorter* baseline gap than survivors (3.0d vs
5.0d, p=1.5e-23) — they were burst tanners on a run, not habituated regulars decaying. Better
explanation, same conclusion, and it argues for segmenting the 90-day list by tenure.

### #6 The packette trap — survived every attack, and got stronger
69.6% start with a packette; $19.00/oz vs $4.53/oz; 15.0% graduate. The size parse holds
(475/598 vs their 472 — a 3-SKU regex difference). Unparsed SKUs are only 2.4% of lotion lines and
cannot move it. Only **2 SKUs** fall in the 1–2oz gap, so the dichotomy hides nothing. Three
independent $/oz methods agree (4.19× / 4.19× / 3.92×). Junk rows correctly excluded; no margin
claim made (correct — `unit_cost` is 100% null).
**Strengthened:** conditional on a second lotion purchase, packette-first buy a bottle **14.1%** vs
bottle-first **54.6%**.

### #7 Multi-store shoppers — the id-namespacing attack failed
`customer_id` **embeds the salon id**, so cross-salon collisions are impossible and a shared id is a
genuine upstream linkage. 11.5% of customers / **25.5% of revenue** reproduces exactly. Cross-salon
share by year is stable (9.3 → 13.5%), so no migration artifact.
⚠️ Linkage is *incomplete* — someone holding separate ids at two salons is invisible, so **11.5% is
a floor**. And the owner sentence oversells (below).

### #11b Stable tanning pairs are real
This was the intended kill and it **held**. 313 stable pairs (≥5 co-arrivals) across 554 customers.
Permutation nulls that preserve every customer's visit count give **4.5–6.7** — roughly **50× below
observed**, p<0.001. Repeat co-arrival is a genuine signal.

---

## NUMBERS THAT MUST NOT BE SHOWN

| Claim | Stated | Correct |
|---|---|---|
| #1 cohort / return rate | n=8,732, 64.2% | **n=6,214, 60.6%** |
| #1 day-7 conditional | 29.8% | **27.3%** (then 19.5 / 13.5 / 4.9) |
| #1 late-returner value | $113 (n=1,327) | **$94.08** — $113 drops 238 zero-spend customers from the denominator |
| #1 sizing | $360/salon-yr | **$293/salon-yr** |
| #2 renewal base rate | 32.0% | **27.8%** de-censored |
| #8 opportunity volume | ~2,700 moments/salon-yr | **560** — a 5× overstatement |
| #8 significance | χ² p=9.1e-41 | **1.48e-28** (still overwhelming) |
| #9 January vs July | 1.9× | **1.75×** year-matched (their cell mixes 2016 July against 2017–19 January) |
| #11a co-arrival rate | "20.6% of visits, a fifth walk in as pairs" | **Category error AND below chance** — 36.7% have a neighbour; null model gives *more* than observed |
| #11d co-lapse multiple | 3.1× | **2.1×** against a frequency+salon-matched null |
| #11g brought-by-a-friend | p=0.036 | **p=0.568** (their "mostly dead" verdict was right; the p was wrong) |
| #14b escalator | "without exception" | **Their own printed list has one** (70.4 → 67.7 at cycle 8→9) |
| #14d escalator effect | "roughly doubles" | **1.45 / 1.40 / 1.28 / 1.22 / 1.18 / 1.20×** — never near 2× |
| #14i bed capacity | "7–9%, 93% empty" | **NOT DERIVABLE** — no bed/room/capacity field exists in these files. Imported unverified |

### Two claims that collapse entirely

**#5a — the winback value premium is a denominator artifact.** "A lapsed customer out-earns a new one
1.5× at the mean, 12.5× at the median" only works because a reactivation requires ≥2 visits by
construction while the new-customer denominator includes the ~36% who never return.

| | mean | median |
|---|---|---|
| reactivators (n=3,929) | $93.44 | $50.00 |
| new who returned ≥1× (n=5,302) | $92.37 | $43.95 |
| new with ≥3 visits (n=4,572) | $104.49 | $60.00 |
| new with ≥8 visits (n=2,584) | **$158.47** | **$117.95** |

**No residual advantage.** Worse, the same reactivators earned **$108.04 in the 365 days *before*
they lapsed** — more than the $93.44 after. A reactivated customer is a *partial recovery of a
customer you already had*, not an upgrade on a new one. Re-lapse is also understated: **62.1%**, not
53.6%.
*What survives:* the **targeting** argument. You cannot pre-select which walk-in will return, so a
name on a reactivation list carries a known ~$93 expected year against an unknown walk-in's $63.

**#11e — "lose one, lose two" is regression to the mean.** The survivor's visit rate drops 47.0%
after their partner's last visit. But activity+calendar-matched controls drop **49.5%**, and the
population baseline at the same pre-level drops **50.4%** with 82% declining. **The survivors
declined *less* than chance.** There is no measured contagion. The remaining co-lapse correlation is
inseparable from the pairs' 61% shared-visit-day rate — people who always arrive together
mechanically stop together.

---

## RIGHT NUMBER, WRONG SENTENCE — rewrite before showing

- **#2** — "I can tell by the 15th which members won't renew." The recommended flag catches 31% of
  churners at **1.12× lift** against a 68% base rate. Rewrite: *"By the 15th I can pull the 1-in-4
  members I've barely seen — three-quarters of them won't renew, against two-thirds of everyone else."*
- **#7** — "one customer in nine *uses* more than one of these salons." **50.8% have ≤2 lifetime
  visits at the second salon.** At ≥3 secondary visits it is 5.7% of customers / 16.9% of revenue.
  The revenue headline is literally true; the usage claim is not.
- **#10** — "autumn recruits are worth the same when kept." Equal *unconditional* means are
  manufactured by autumn's larger mass of $0 non-returners. **Conditional on returning — which is
  what "when kept" means — autumn returners are worth ~21% MORE** ($108.69 vs $89.80, p=0.008). The
  error runs in the report's favour; the lever is stronger than claimed.
- **#12** — "more ready to join **and more ready to buy** than anyone else, including brand-new."
  True for membership, **false for retail**: first visits attach at **18.63%**, comebacks at 13.76%.
  Also 54% of the comparison base is visits inside an active package where a new start is nearly
  impossible; like-for-like the membership multiple is **2.5×**, not 4.4×, and retail **1.58×**, not
  2.4×. And it is not a discrete moment — attach rises monotonically with gap length (6.0% at 1–6d →
  15.0% at 180d+); the 90-day cut is arbitrary.
- **#11c** — buddy customers "average 67.3 visits / $451." Pure selection artifact of the
  ≥5-co-arrival rule. **Controlling for visit volume they are worth *less*** — $6.39 vs $10.10
  revenue per visit; among ≥30-visit customers, $632 vs $695 (p=0.002).
- **#14g** — "one conversion ≈ +$70/yr" is a between-group difference presented as a treatment
  effect. Correct: *members out-earn casuals by $69/yr.* Casuals who convert are not average casuals.

---

## Undisclosed method — worth knowing

The co-arrival analysis states "compare each visit to all visits inside the 180s window." The numbers
only reproduce by comparing each visit to **the immediately following visit only**. A three-person
cluster counts as one pair under the code, three under the stated method — the headline event count
is ~14% low. The report also asserts sensitivity was not swept because "sub-minute clustering would
only tighten pairs"; at W=60s stable pairs fall from 313 to **212 (−32%)**.

## Credit where due

The **"hypotheses that died"** section is substantially real — five of six verified honest, including
the gift-certificate counts to the row and the front-loaded-value figures to three decimals. It is the
report's strongest part. The membership-revenue double-count trap ($714,321) was **avoided
everywhere**. #13's comparison group is correctly "downgraders vs kept-same-plan," not "vs people who
left" — the obvious trap, sidestepped. #13 is unproven rather than wrong (MWU p=0.054, and 24% of
"downgrades" move to a $0 package or keep the same plan name).

## Bottom line

Four insights are stakeholder-safe today: **#2, #3, #4, #6** — plus **#7** and **#5b** with a
tightened sentence. Everything else needs the cohort fix, a rewritten sentence, or removal. Nothing
here is fabricated; the model computed honestly and then oversold in prose. That is a fixable
failure, and the correction list above is the fix.
