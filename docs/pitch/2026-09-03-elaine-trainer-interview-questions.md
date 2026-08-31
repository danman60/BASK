# Trainer interviews — the question list
### For Elaine · Thursday 2026-09-03

## What this is

A proposal for a **training lane**: sit UVALUX's trainers down on camera and ask them a targeted
set of questions, then turn the answers into coaching the product hands a salon owner at the moment
the owner needs it.

The questions below are **not** a general interview. Each one comes from a pattern the product
already detects in real salon data — and each is ranked by how badly the existing training corpus
fails to answer it.

## What we already have, and what it is missing

**1,007 claims** were mined from UVALUX's own recorded training sessions (Room B, 2024–2026) and are
live in the product now: each one a single piece of advice, carrying the verbatim quote it came
from, a timecode back into the recording, and a Verify/Reject state.

On 2026-08-30 we measured that corpus against the twelve patterns the product actually detects.
The measurement is repeatable — `packages/api/scripts/coaching-coverage.ts`.

**The finding that matters: of the 96 best-matching claims across all twelve patterns, only 4 were
scripts.** The corpus is rich in *principles* and nearly empty of **the words a person says out
loud**. An owner at 7am does not need "increase lifetime value" — they need the sentence to say to
the customer at the counter.

That gap is the pitch. Filmed interviews are how it gets closed, and it is why the questions below
all end up asking for the same thing: *say it the way you'd say it to them.*

| Pattern the product detects | Best match | Concrete tactics | **Scripts** |
|---|---|---|---|
| Seasonal pause vs real lapse | 0.365 | 7 of 8 | 1 |
| Quiet weekday capacity | 0.384 | 5 of 8 | **0** |
| Failed payments | 0.430 | 6 of 8 | **0** |
| Overstock | 0.436 | 5 of 8 | **0** |
| New customer → regular | 0.447 | 6 of 8 | **0** |
| Lapsed 30 days | 0.451 | 5 of 8 | 1 |
| Upgrade headroom | 0.460 | 7 of 8 | **0** |
| Retail attachment slipping | 0.510 | 3 of 8 | **0** |
| Nearly out of product | 0.549 | 6 of 8 | 1 |
| First visit never returned | 0.561 | 7 of 8 | **0** |
| Category gap vs cohort | 0.564 | 8 of 8 | **0** |
| Member tenure vs cohort | 0.701 | 5 of 8 | **0** |

Low score = we can see the problem in a salon's numbers and have little good coaching for it.
Those are the first four interviews.

---

## How to run a session

- **One pattern per block.** Open with the real example (below), then the questions.
- **Ask for the words, not the theory.** Every block ends with "say it out loud, the way you'd say
  it to the customer." That sentence is the asset.
- **Ask for the number.** "How much does that usually move it?" turns advice into something the
  product can measure against afterwards.
- **Ask what NOT to do.** Rejections are as useful as advice — the product has a Reject state and
  currently nothing is in it.
- 20–30 minutes per pattern. Four patterns is a comfortable half-day per trainer.

---

## THE QUESTIONS

### 1. Seasonal pause vs real lapse — *weakest coverage (0.365)*
**What the product sees:** a member goes quiet, and it knows from the salon's own 12 months of
history whether this month is that salon's trough. It refuses to call a July quiet spell churn.

1. When a regular goes quiet in the slow season, how do you tell the difference between "they'll be
   back in September" and "you've lost them"?
2. What do you do about it in the trough — reach out, leave them alone, or offer something
   different?
3. If you reach out, **what do you actually say?** Say it the way you'd say it to them.
4. What's the mistake owners make every summer?
5. How much of the summer dip is normal in a healthy salon — what's the number you'd expect?

### 2. Quiet weekday capacity — *0.384, zero scripts*
**What the product sees:** Tuesday and Wednesday afternoons under half full while evenings are
packed.

1. What actually fills a Tuesday afternoon — and what only moves people who'd have come anyway?
2. Is discounting the quiet hours a mistake? What does it cost long term?
3. Which customers do you target for an off-peak offer, and how do you pick them?
4. **What's the text or the post that works?** Give me the wording.
5. How long before you'd expect to see the room fill?

### 3. Failed payments — *0.430, zero scripts*
**What the product sees:** membership payments that failed this month and cards that were never
updated.

1. Walk me through what a good salon does the day a membership payment fails.
2. Who makes contact, how fast, and by what channel?
3. **What do you say?** It's an awkward call — give me the words that keep the member.
4. When do you stop chasing, and what do you offer instead of cancelling?
5. What share of failed payments should a well-run salon recover?

### 4. Overstock — *0.436, zero scripts*
**What the product sees:** product sitting for months with cash tied up and no sales.

1. When product isn't moving, what's the first thing you check — the product, the shelf, or the
   staff?
2. How do you move it without training customers to wait for a discount?
3. **What does a staff member say to put that specific bottle in someone's hand?**
4. How much stock should a salon carry, and how do you know when you've overbought?
5. When is the answer "stop carrying it" rather than "sell it harder"?

### 5. First visit that never came back — *0.561, zero scripts*
**What the product sees:** customers who came once and never returned. The most expensive customer a
salon ever buys.

1. What happens on a first visit that makes someone come back — and what quietly loses them?
2. What's the follow-up window, and what does it look like?
3. **What do you say to a first-timer at the desk before they leave?** The exact words.
4. Where does a membership conversation belong — visit one, two, or later?
5. What's a healthy first-to-second visit conversion, in your experience?

### 6. Retail attachment slipping — *0.510, but only 3 of 8 tactics were concrete*
**What the product sees:** lotion per visit falling while traffic holds, concentrated on particular
shifts. Existing corpus favourite: *"the most effective way to sell lotion is by breaking down the
cost per session."*

1. When attachment drops on one shift and not another, is that the staff, the display, or the hours?
2. How do you coach a staff member who isn't selling without making them feel sold-to themselves?
3. **Give me the cost-per-session line the way you say it to a customer.** Start to finish.
4. What are the three objections you hear, and the answer to each?
5. What's a good attachment rate, and what's the number where you'd step in?

### 7. Upgrade headroom — *0.460, zero scripts*
**What the product sees:** members already using more than their tier includes — the honest upsell.

1. How do you raise a tier upgrade so it lands as fair rather than as a squeeze?
2. **What's the sentence?** For someone who's plainly outgrown their plan.
3. When should you NOT upgrade someone, even though the usage says you could?
4. What do you do with grandfathered pricing when someone moves up?

### 8. Member tenure — *0.701, our strongest area · this one is a validation interview*
**What the product sees:** average tenure against comparable salons. The corpus already says the
industry average is about four months and that strong salons beat it substantially.

1. Is four months still right in 2026?
2. What separates a salon whose members stay a year from one whose members stay four months?
3. What's the moment a member decides to cancel — and what happens just before it?
4. **What does the save conversation sound like?**

---

## What we'd ask Elaine to help with

1. **Which trainers, and in what order?** Two or three whose material is strongest on the weak
   patterns above.
2. **What is already recorded** that we have not mined? The 1,007 claims come from Room B sessions;
   anything else recorded is corpus we already know how to ingest.
3. **Consent and release for filming** — and whether trainers are comfortable with their advice
   appearing in-product. It appears **de-identified**: the product attributes to "UVALUX training"
   with a timecode and never names an individual.
4. **Who reviews.** Every claim carries a Verify / Reject state and an audit trail. Today 3 of 1,007
   are decided. A trained reviewer signing off the material is what turns the corpus from mined text
   into UVALUX-endorsed coaching — and that is a role Elaine's team is the natural home for.
5. **Cadence.** Is this a one-off shoot or a standing loop — new season, new questions, driven by
   what the product could not answer that quarter?

## The loop we are proposing

Product detects a pattern it cannot coach → that becomes an interview question → the trainer's
answer is mined into claims → the claim is reviewed by UVALUX → it appears under the exact insight
that raised it, with the quote and the timecode. **Training stops being an event and becomes
inventory.**
