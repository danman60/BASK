# "The Quietest Register" — voice-over script
**Film:** a long-form narrative built entirely from four salons' own point-of-sale records.
**Source of truth:** `docs/pitch/2026-08-27-insights-final.html` (13 findings) and its accuracy
review `docs/pitch/2026-08-27-fable-review.md`. Three figures not in that report were recomputed
directly from `~/salon-pull/canonical/` on 2026-08-28 and are marked **[recomputed]** below.
**Rule honoured throughout:** the client is never named; salons are A–D; no figure appears that
isn't in the report or the register files; no claim the review killed is resurrected.

**Register:** grade-7. The joke is always the *situation* — a business that kept every customer and
quietly stopped selling to them — never the people in it.

**Read pace:** 2.5 words/second, measured. Times below are at that pace.
**Total:** 611 words ≈ 4:04 of voice-over across a ~4:40 film.

---

## Beat 0 — Cold open · over SHOT-001
> Four salons. Four years. Every visit, every sale.
> A hundred and ninety-four thousand, six hundred and seventy-two visits — sitting in a till log,
> being right, while nobody read it.

**32 words · 12.8s** · Source: report masthead — 194,672 visits, 2016–2020, four salons.

---

## Beat 1 — The paradox · over SHOT-002
> Here's the strange part. The customers never left.
> Between 2017 and 2019 visits fell thirteen and a half percent.
> Retail fell thirty-seven point seven.
> They kept the people. They just stopped selling them anything.

**40 words · 16.0s** · **[recomputed]** visits 50,800 → 43,966 = −13.45%; product-line revenue
$56,015 → $34,893 = −37.71%. Query: `transactions.csv` + `transaction_items.csv` where
`item_type='product'`, grouped by year of `transaction_at`.

---

## Beat 2 — The shelf · over SHOT-003
> Sixty-three percent of everything that shelf ever sold was one brand.
> A hundred and twenty-three thousand, nine hundred and sixteen dollars, out of a hundred and
> ninety-five thousand.
> The shelf was fine. The shelf was never the problem.

**42 words · 16.8s** · **[recomputed]** Australian Gold $123,916 of $195,826 in product-line
revenue = 63.28%.

---

## Beat 3 — The quietest register · over SHOT-004
> The day a member hands you money for another month is the day you sell them the least.
> Renewal day attaches a retail item seven point seven percent of the time.
> Ordinary days, eleven point seven. Sign-up day, nineteen.
> Same counter. Same lotion. Same person.
> A sign-up gets a conversation. A renewal gets a receipt.

**60 words · 24.0s** · Source: finding № 13 — 7.7% (n=9,395) vs 11.7% (n=31,885) vs signup 19.2%
(n=4,044), per transaction, χ² p=1.48×10⁻²⁸; survives a veteran-only control.

---

## Beat 4 — Provenance · over SCREEN-A (the report page, scrolling)
> None of this is a hunch. It all came out of their own registers, and every number opens.
> Thirteen findings survived being attacked. Four good-sounding ones didn't — including two that
> were ours.

**37 words · 14.8s** · Source: report method note + "Things we checked so you don't have to".

---

## Beat 5 — The nine-dollar dead end · over SHOT-005
> Seven in ten lotion customers start with the little packet. Nine dollars.
> That's nineteen dollars an ounce. The bottle beside it is four dollars and fifty-three cents an
> ounce.
> They're not sampling their way up. They're settling in — at four times the price.
> Take everyone who bought lotion twice. Start on a bottle, and the next one is a bottle
> fifty-four point six percent of the time. Start on a packet: fourteen.
> Nobody graduates without being asked.

**87 words · 34.8s** · Source: finding № 2 — 69.6% start ≤1 oz; $19.00/oz vs $4.53/oz; 54.6% vs
14.1% conditional on a second lotion purchase. No margin claim (unit cost is 100% null).

---

## Beat 6 — Week one · over SHOT-006
> Six in ten first-timers come back.
> But let a week go by quiet, and that falls to fewer than three in ten.
> Two in ten after a fortnight. One in twenty after ninety days.
> Which makes the month-end follow-up a very nice note to somebody who decided three weeks ago.

**55 words · 22.0s** · Source: finding № 5 — 60.6% return within 180 days (n=6,214); conditional
27.3% / 19.5% / 13.5% / 4.9% at days 7 / 14 / 28 / 90.

---

## Beat 7 — The buddy economy · over SHOT-007
> Three hundred and thirteen pairs of their customers always arrive together. Same minute, same
> salon, for years. Five hundred and fifty-four people.
> We shuffled every visit at random, thousands of times, to make it go away.
> Chance gives you five pairs. They have three hundred and thirteen.
> Nobody ever sold them anything as a pair.

**58 words · 23.2s** · Source: finding № 12 — 313 pairs with 5+ co-arrivals inside 180 seconds,
554 customers; permutation null preserving each customer's visit count yields 4.5–6.7 pairs,
p<0.001. *Not claimed, per the review: that pairs quit together, or that pairs are worth more.*

---

## Beat 8 — The comeback · over SHOT-008
> Nearly three in ten comeback visits end with a membership sold that same day — two and a half
> times a comparable visit.
> The person walking back through the door after months away isn't a retention problem.
> They're the warmest buyer in the building. And they let themselves in.

**53 words · 21.2s** · Source: finding № 7 — 28.7% of reactivation visits (n=9,741); like-for-like
multiple 2.5×, not the raw 4.4×. *Not claimed: a matching retail lift — comeback attach is 13.8%,
below first-visit 18.6%.*

---

## Beat 9 — January and July · over SHOT-009
> A member who joins in January renews at thirty-eight point seven percent.
> Every other month of the year: twenty-seven.
> July? Twenty point four.
> They came for a fortnight in the sun, and they meant it.

**37 words · 14.8s** · Source: finding № 11 — de-censored cohort n=2,331, χ² p=0.0015; honest
year-matched multiple is 1.75×, not the raw 1.9×. December and February look like everybody else.

---

## Beat 10 — The bottom step · over SCREEN-B (the escalator chart) + SHOT-010
> Fewer than three members in ten renew their first month.
> By the tenth, nearly eight in ten. By the fifteenth, nearly nine.
> All of the loss is on the bottom step.
> And the price has nothing to do with it — thirty-dollar plans and hundred-and-forty-dollar plans
> renew within a few points of each other.
> What predicts it is whether they actually came in.
> Barely used the month: fifteen percent renew. Used it hard: fifty-four.

**79 words · 31.6s** · Source: findings № 9 and № 1 — 27.8% de-censored first cycle, 77.4% at cycle
10→11, 86.6% at 15→16; price bands 32.1 / 32.8 / 27.7 / 35.2 with no gradient; renewal by first-package
visits 15.5% → 54.2%.

---

## Beat 11 — Four calendars, no discounts · over SHOT-011 + SCREEN-C
> So the whole playbook is four lists, and not one of them is a discount.
> Day five, for the first-timer who went quiet.
> Day fifteen, for the member you've barely seen.
> Expiry plus seven — because after fourteen days the odds fall off a cliff, and that cliff is one
> of the surest numbers in the entire file.
> And ninety-days-quiet. Every month. Forever.

**66 words · 26.4s** · Source: report's "four lists" summary + finding № 3 — ≤14 days 53.4% vs
15–90 days 36.3%, p=6.4×10⁻⁹; the plateau inside 14 days is flat (χ² p=0.737).

---

## Beat 12 — The sentence · over SHOT-012
> That's the whole product. Say the sentence.
> "Two of those cost more than half the bottle."

**16 words · 6.4s** · Source: finding № 2's Monday action, verbatim in spirit.

---

## Beat 13 — Sign-off · over SHOT-013 + SCREEN-D
> Four salons kept their customers for four years, and quietly stopped selling to them.
> It was all in the till log. It always was.
> Nothing here was estimated, benchmarked or imported.
> If it isn't in your registers, it isn't in this film.

**46 words · 18.4s** · Source: report footer, adapted.

---

## Cut list — lines that were written and then removed

| line | why it is not in the film |
|---|---|
| "the best staffer attaches at 8.48%" | Did not reproduce. My recompute gives a 9.94% top performer, and staffer rank is confounded by salon (Salon C's house rate is 8.47% against Salon A's 5.09%). Unverified → cut. |
| "a won-back customer is worth more than a new one" | Killed by the accuracy review — denominator artifact. The targeting argument survives; the premium does not. |
| "when half a pair quits, the other follows" | Killed. Survivors declined *less* than matched controls (47.0% vs 49.5%). |
| "a fifth of visits walk in as pairs" | Killed — below what chance produces. |
| "their beds run 93% empty" | Not derivable. No bed, room or capacity field exists in these files. |
| "attach runs 5.2–9.4%" | House per-visit attach recomputes to 5.74%, salon spread 4.82–8.47%. The stated range doesn't match either definition → cut rather than reframed. |
