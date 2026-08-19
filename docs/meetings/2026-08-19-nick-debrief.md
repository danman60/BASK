# Nick — 2026-08-19, 2:00 PM. Debrief.

**Source:** `transcripts/2026-08-19-1412-conversation.txt` (auto-transcribed, 8 diarized speakers).
**Reliability caveat that governs this whole document:** speaker labels are unreliable and swap
mid-file, and names are ASR-mangled ("Q Fork" = Q4, "sunlight" = Sun Link, "Hermosey" = Hormozi).
Attribution below is by *content*, not by label. Nothing here should be quoted to anyone as
verbatim — treat every quoted phrase as approximate wording.

---

## The one line that matters

Nick asked for a proposal, unprompted, in his own words:

> "I'm asking, you make me a proposal. Be like, hey Nick, I'm gonna hang out with you — this is the
> time I can dedicate for you, this is what I want to look for in return."

Three components, all of which are Daniel's to fill: **time committed · what he wants in return ·
the shape of the engagement.** That is the deliverable coming out of this meeting.

He also said, separately, that he's happy to pay cash rather than only equity, because he wants
skin on the table. And that he needs "somebody to take the lead on this salon data side."

---

## What he ruled OUT — say this back to him before anything else

This is the part that invalidates the current pitch, so it goes first.

**He does not want to be in the salon management software business.** Stated more than once, in
different ways:

- "I don't want to develop software for salon management — there's five other guys doing it, they're
  primarily US market, and they're all gobbling after it."
- "I don't want to be in the software business."
- On the gap, precisely: **"It's not tracking minutes and putting butts in beds. It's what to do
  with that data."**

**And he structurally can't.** He does the data hosting for Sun Link. Launching a competing salon
front end "would piss off my partners." Sun Link is the incumbent whose back end he's paid to host.

**What this means for Bask as demoed:** the Floor (room board, check-in, waiver), the till/POS, and
public booking are the exact territory he ruled out. They were 40% of the pitch and roughly half the
film. They are not the product he is asking for.

---

## What he actually wants

### 1. The analytics and benchmarking layer — his four-year-old idea
He has been sitting on this: salons submit monthly sales, unique customers, product sales →
anonymized → spun back as **rank and percentile**. His framing: *"You sell 35 tanning lotion while
the industry average is 22 — are you above or below? Scoreboard it."* He floated leaderboards and
scoreboarding for participants; anonymous industry benchmarking for non-participants.

He has already asked salon owners this to their faces, in a room in California, and got "we'd love
that." That is validated demand, from him, not a hypothesis of ours.

He does a crude manual version today off UVALUX purchase data alone — ranks a salon against last
year and industry averages. Its limit is that it only sees what they buy from him.

### 2. The data he already holds, unmined
This is the asset that makes him the right partner and it is new information:

- He took over **Sun Link's data hosting** — US, Canada, one in Ireland. ~7 weeks in at the time.
- **Glow = ~140 locations**, one of the fastest-growing chains in the US, already on.
- Sun Link's base includes **Palm Beach Megatan ~200 stores, Sun Tan City ~200 stores**.
- **"There's insights in there that we're not tapping into, nor do we have rights yet."** He has not
  asked permission. Rights are unresolved — that is a real gate, not a formality.
- His own book: ~1,800 active customers, of which ~300 are "real salons."

He loves this business — great margin, no development cost. Hosting is the moat; analytics is the
thing he can't staff.

### 3. Customer CRM and health — the beat you both landed on independently
He described wanting, at the front desk: *"It's been 85 days since Daniel last spent — this is what
he generally likes."* A second screen for whoever is serving the customer.

Daniel offered the Sims-style health grid — every customer scored, lapsing ones visible, one-click
personalized reach-out. He took it: "the customer health dashboard, the staff health — that's really
interesting."

**The concrete feature that fell out of it, and it is a good one:** they don't track how full a
customer's bottle is, but they track tans used and last purchase date, and *"it's about half an ounce
per tan."* So bottle depletion is computable. That predicts the reorder conversation before the
customer thinks of it. This is buildable from data he already has.

### 4. Coaching, systematized — but delivered by humans
Mike (California Sun) coaches salons on data: memberships priced on value not price, more modalities
→ **average member tenure 2.5 months → 3.5 months**, which he called worth more than a new customer.
Elaine and the UVALUX team coach today.

Daniel pitched the Hormozi GPT model — SME brain into a knowledge base, charged monthly, the moat
being private material nobody else has (Sarah's recordings, Elaine's coaching, Mike's numbers).

**The constraint he set:** *"People buy from people. I want to be the expert in it."* So the AI is the
engine and Elaine/Nick stay the face. Do not propose a bot that replaces the coach.

### 5. Staff conversation capture — his idea, and the sharpest one
He told a story about overhearing a salon owner (Chaz, Utah) pitch a customer over an open FaceTime
and thinking: *if I could bottle that pitch and serve it to other customers.* From there: record the
sales floor, analyze closing ratios, coach the staff. He reached for the car-dealership analogy
himself.

They discussed Ontario single-party consent and "they consented when they signed up." Daniel's
`Reflect` product for dance studios is the working analog.

**Flag honestly:** this is the highest-value and highest-risk idea in the meeting. Recording customer
conversations in a salon, including spray-tan rooms, is a legal and PR question, not a feature
question. It belongs on the roadmap as a later phase with counsel attached, not in the first build.

### 6. One-click, data-driven campaigns
Both agreed generic LLM campaigns "all look the same." The differentiator is campaigns tuned to the
industry and driven by that salon's actual numbers — "we noticed Thursdays..." → whole campaign in a
click. This is what Studio already does, and it survives the pivot intact.

---

## The commercial shape he described

He laid out the sequence himself, and it is the spine of the proposal:

1. **Proof of concept serving Canadian salons**, with direct impact to his business. **"I'll pay you
   for that."**
2. **Prove the number** — show non-revenue/revenue lifted by X, with the impact evidenced.
3. **Then build the sellable product together**, to Canada and abroad — US trade shows, sold into his
   data-hosting customers as an add-on. *"Then we're selling something."*
4. **Separate brand.** He raised keeping the name **Bask** for it, unprompted.

Other commercial signals:
- **"Equity and cash"** is how he frames build deals now, and he offered both.
- US market is 10× Canada; ~10,000 salons in North America came up as the wider frame.
- He wants it API-pluggable into other platforms — Angie, his new hire, sells wellness/spa/sauna/gym,
  explicitly *not* tanning. Sector-agnostic architecture matters to him commercially.

## The relationship gates
- No assholes. He has to be able to have a beer or go to a ball game with a partner, or there's no
  partnership. That test was passed — this meeting *was* the test.
- He books Daniel for video a year to eighteen months out and volunteered to "sing your praises."
- He named his own constraint: *"I do not have the bandwidth or the time to do this, but I know
  there's money and I know there's opportunity."*

## Named people to know
- **Wilfred** — his technical lead, ex-data-centre, runs the hosting. He offered an intro twice.
  This is the technical due-diligence gate.
- **Elaine** — coaching delivery. The SME whose knowledge becomes the knowledge base.
- **Mike** (California Sun) — the data-driven coaching exemplar; membership/modality numbers.
- **Sarah** — has "everything recorded"; the raw material for a lotion-specific knowledge base.
- **Angie** — new salesperson, wellness/spa/gym, banned from tanning accounts.
- **Nick** (the intern) — Guelph student, spent the summer pulling UVALUX data into Zoho Analytics.
  Do not confuse with Nick the president.

---

## What this changes about what we built

| Built | Status after this meeting |
|---|---|
| Daybreak / insights | **Keeps.** The daily "what needs attention" is the wrapper he wants. |
| Insights + **Peers** benchmarking (`/insights/peers`) | **Promoted to hero.** This is his four-year idea. |
| Customers, segments, recovery (`/customers`) | **Promoted.** Becomes the customer-health grid. |
| Studio one-click campaign (`/marketing`) | **Keeps.** He liked it; it is the "french fries." |
| Inventory → UVALUX draft order (`/inventory`) | **Keeps**, reframed as demand signal + bottle depletion. |
| Compass network, call list, accounts, coaching | **Keeps.** This is the UVALUX-side product. |
| Consent / data-sharing (`/settings/data-sharing`) | **Load-bearing.** He has no rights to the hosted data yet. |
| **The Floor** — room board, check-in, waiver | **Cut from the pitch.** "Butts in beds" is the ruled-out half. |
| **POS / till / wedge scanner** | **Cut from the pitch.** Same reason. |
| **Public booking (`/book`)** | **Cut from the pitch.** |

Nothing needs to be deleted from the codebase — it stays as capability. It comes out of the
*pitch* and out of the *film*.

## Open questions only Daniel can answer
1. Time he will commit, in hours or days per week.
2. What he wants in return — cash rate, equity ask, or the mix, and at which phase.
3. Whether the proof of concept is paid work-for-hire or founding equity with a cash floor.
4. Whether Bask keeps its name under UVALUX or stays Daniel's asset licensed in.
5. Whether staff conversation capture goes in the roadmap at all, given the legal exposure.
