# BASK value follow-up for Wilfried (Hexaport), Wed Oct 21, 2026

**This exists so that** Daniel can send Wilfried (Hexaport, Duncan cc-able, Nik away this week) a follow-up that
raises the VALUE of the BASK deal: "I've been thinking more about this, and here's what can really drive it." Not a
feature update, not a check-in.

**Where it stands (PA record, as of Oct 20):** proposal live at dancoded.ca/p/bask-uvalux-cmxb8vlay3; last visit
Oct 13 12:06 to 12:18 ET. Wilfried, Oct 14: he and Duncan reviewing, regroup internally week of Oct 19. Daniel,
Oct 14: "Once Nik's back, I'd love to jump on a call; October 28th looking good."

**Sources and how to read the quotes.** Transcripts are auto-transcribed, speaker labels drift, so quotes are exact
to the file but the wording is rough and speakers are tied by content, not label. Line numbers `L<n>` are in the PA
corpus files `~/projects/assistant/corpus/clients/uvalux/zoom/`:
`2026-08-19-Nick-in-person…txt` (Aug 19), `2026-09-03-Nick-dinner…txt` (Sep 3; never call it a dinner to them),
`2026-10-06-UVALUX-in-person…txt` (Oct 6). The Oct 6 copy in `docs/meetings/` is offset by about 7 lines.
Proposal numbers are from the live Value tab (read 2026-10-20 22:55 ET from `ddd` source). Framing rule: the data
is the **salons' customers'** data; UVALUX is the supplier, Hexaport the host.

---

## The thesis in one breath

On October 6 we priced BASK as an app for salons. The bigger value is that it sits where three businesses meet:
Hexaport's hosted data, UVALUX's supply relationship, and the salon's own customers. Hexaport's hosted owners already
want AI on their data badly enough to break things to get it. UVALUX already sells on membership and lamp arithmetic
it does by hand. Salons already hold paid-for time and lost retail they cannot see. BASK turns each of those into
money for the party that owns it, and none of it works without UVALUX and Hexaport, which is the point they made
themselves ("this is the only path to Market", Oct 6 L1933).

## The five value drivers

### 1. Hexaport: the AI-bot problem becomes a hosted product (lead with this; it is Wilfried's own story)

What they said:
- Oct 6 L293 (hosting voice): "We see customers now. Let's say, without blessing of the CTO, do their own AI. They
  literally are now running AI Bots against the database, locking tables like, there's no tomorrow because they
  don't know what they're doing right."
- Oct 6 L1536, L1560: "they reverse engineered how to access the database" … "bring the whole other 96 stores down
  right because of it".
- Oct 6 L801: "we have a great business is continuing to grow on hosting, and I don't want to risk the reputation".
- Aug 19 L74 (Nik): "I'm doing the data hosting, which I love because … really great margin in that."
- Aug 19 L470 (Nik): "Or better yet, if you want live insights? You're the host with us will plug Us in somehow".
- Oct 6 L804 (Daniel): data hosted in Canada "should be a badge on the front of the product".

Why it is worth more than it looks: the demand for AI on salon data is already inside Hexaport's customer base, and
today it shows up as risk (locked tables, 96 stores down). BASK reads a nightly changes-only copy and never queries a
live database (proposal Technical tab, "What Bask never does"). So the same build that serves salons is the
sanctioned, safe answer Hexaport can offer every hosted owner instead of policing them.

- **Worth to Hexaport:** protects the hosting reputation they named; adds a reason to host with Hexaport ("live
  insights" only for hosted salons, Nik's Aug 19 line); sits on a business Nik called high margin. Proposal card 3.2
  already names "an add-on for hosting customers".
- **Worth to UVALUX:** its own hosting arm becomes harder to leave.
- **No dollar figure:** Hexaport's hosting revenue is not on record anywhere. [DAN: ask Wilfried what one locked-table
  incident costs them, or skip.]

### 2. UVALUX: every salon sale is a reorder, and the big tickets are lamps and equipment

What they said:
- Sep 3 L126 to L147: "lamps are good for 600 hours" … "we're like logging like pets" … "Do you have enough
  utilization to justify this new equipment?" … "Oh, you're eligible." / "Yeah, that's a manufacturer sale."
- Aug 19 L320: "our entire selling pitch, right, has been. Hey, buy a cocoon … drive your membership from 89 to a
  hundred dollars, right. 120". L327 to L330: "It's worth more than another customer, right? Because they're already
  there".
- Oct 6 L386 (Daniel): "How many salons don't even bring something up until they're at the Expo."

Numbers already on the proposal (Value tab):
- Four salons in the Salon data tab: **134 lamps past rated life now, 141 more within 12 months: 275 relamp orders**.
- Equipment payback worked example: **40 members $89 to $120 pays a $28,000 machine in 22.6 months**; moving tenure
  2.5 to 3.5 months adds **$4,800 a year**.

- **Worth to UVALUX:** relamps on time instead of late, retail reorders rising with salon sales, and the cocoon pitch
  run from the salon's own numbers before the rep calls. UVALUX's own prices turn the 275 into dollars; the proposal
  deliberately does not.
- **Worth to the salon:** a lamp budget instead of a surprise, and an equipment decision made on its own data.

### 3. Salons: money already sitting in their own books

What they said:
- Sep 3 L1707 (Nik) is the quote used on the staged panel.
- Oct 6 L263 (Daniel, on a nine-salon owner): "She needs like three to five percent … That's tens of thousands."
  L266 (Nik): "if I can move Rachel's needle a little bit? Right. The return is, is huge".
- Oct 6 L276 (Daniel): "They won't even take the one or the two, but we can make them take 15 a day."
- Sep 3 L1707 to L1713 (Nik, on the old salon computer): "I think there's a huge opportunity there … the minutes
  that they had … If you want to email all these people on, this is the number of minutes that they had left."

Numbers already on the proposal:
- **$153,276** of time customers paid for and never used, in the four salons (Salon data tab; 4,287 customers).
- 3 to 5% on about $492,000 a year across the four = **+$14,800 to $24,600 a year** (the goal Daniel set Oct 6,
  labelled a goal, not a measured result).

- **Worth to the salon:** customers invited back with time they already own, plus the retail that comes with a visit
  (Oct 6 L130: no lotion by the second visit, "they won't come back").
- **Worth to UVALUX:** that retail is UVALUX stock (driver 2).

### 4. The first buyers are the big hosted groups, not just the Expo floor

What they said:
- Oct 6 L910 to L921 (Nik and the hosting voice): "let's call Glo, the ultimate consumer of it, right, with their 140
  stores today" … "They're really keen on something like this. They're currently using Looker Studio from Google" …
  "they're getting literally just 2D flat report out of it" … "They're 20 plus year customer already".
- Sep 3 L384 (Nik, Hexaport's largest data customer): "We got 180 locations today, so we have 300 locations in the
  next 3 years." (Aug 19 L28 says "glow is 140 locations". The counts differ by date and source; not reconciled.)
- Oct 6 L481 to L493 (Nik): "my greater Vision is something we provide to Canadians … The more we can help them.
  Transact and sell … suddenly we sell to to Americans and abroad … put a subscription on."
- Sep 3 L1098 (Nik): "two groups in the US that are chasing it … they want people to switch a software … we're
  agnostic, incredibly sticky".

- **Worth to all three:** one multi-store hosted group is many salons in one decision, on data Hexaport already
  hosts. The proposal's licensing calculator (Value tab) shows 300 salons at $100 a month = $360,000 a year, valued
  at $1.26M at 3.5×; that fee range is Daniel's own, Oct 6 L498 ("a hundred dollars 200 a month").
- [DAN: whether to suggest customer zero be a multi-store hosted group (the Oct 6 meeting named Rachel's nine Calgary
  salons and Kelly Kerr; Glo was named as the "ultimate consumer"). No customer names in the email.]

### 5. The moat is theirs, and BASK is how it gets used

What they said:
- Oct 6 L1933: "this is the only path to Market, right? So, I think there's. More of a partnership". L1949: "without
  us. This is not worth anything."
- Sep 3 L1824 (Nik): "like God, if I could bottle that out and train people" (his best owners selling live).
- Oct 6 L1993 (Daniel): "if it's not 10 times more valuable than what it costs. Let's not build it."

The answer to "without us it's not worth anything" is to agree out loud: UVALUX's 40 years of coaching, its supply
relationship, and Hexaport's Canadian servers are exactly what a U.S. software company cannot copy. BASK is the part
that turns them into something salons use every morning. This reframes the October 6 price pushback without touching
price: the build is cheap relative to what it unlocks *for them*, and they keep the moat.

---

## What it changes about Phase 1 (no new prices, dates or terms)

Phase 1 stops being "an MVP for salons" and becomes **proof of one number for each party on customer zero**:

| Party | The number Phase 1 proves | Where it comes from |
|---|---|---|
| Salon | Customers invited back with paid-for time, and the retail on those visits | Driver 3; baseline frozen first (Aug 19 L1321: "you show the fact that we can increase non-revenue by X") |
| UVALUX | Lamps and reorders seen before the salon calls | Driver 2; lamp hours from the salon's own data |
| Hexaport | The nightly changes-only feed running on hosted data, no live queries | Driver 1; the API Hexaport offered (Oct 6 L563 "We can build an API") |

Same C$25,000, same Dec 1 stop rule ("Where we landed" tab), same customer zero to Expo plan.

**[DAN] slots, none drafted:**
- [DAN: does Hexaport get anything for being the hosting partner beyond the -$8,500 already on the board (feed $5,000
  + hosting $3,500)? e.g. a share of hosting add-on fees. Not proposed.]
- [DAN: the Oct 6 asks still open: a lower base number, then sweat equity (L1856 to L1979), and Nik's retainer
  preference (L1749). This follow-up deliberately does not answer them; it raises value first.]
- [DAN: publish the staged "What can really drive it" panel to the live Value tab, or keep it for the Oct 28 call.]
- [DAN: whether to ask Wilfried what a locked-table incident costs Hexaport (driver 1 has no dollar figure).]

**Not used, on purpose:** Nik's "pitch something even bigger" all-in-one management idea (Oct 6 L2173) conflicts with
"Bask grows, it does not run". Market sizes beyond what the proposal already cites. Customer names.

---

## SUGGESTED email body (Daniel's voice; PA builds the Gmail draft, nothing sent from here)

To wilfried@hexaport.io, Duncan cc-able, in thread 1a117f83d948fd0a. 168 words with sign-off.

> Hey Wilfried,
>
> I've been thinking more about BASK since we met, and I think I undersold where the real value is.
>
> The biggest piece might be on your side. You told us store owners are already running AI bots against the hosted
> databases and locking tables. They want answers from their data badly enough to break things to get them. BASK
> could be the safe way to give them that: a nightly copy, read only, hosted by you in Canada. That turns a risk to
> your hosting into a reason to host with you.
>
> For UVALUX, every salon that sells more reorders lamps and lotion, and busy beds make the case for new equipment
> before a rep calls. In just the four salons we looked at, 275 lamps are past rated life or reach it within a year.
>
> Happy to send a one page version for you and Duncan to poke holes in.
>
> Does Wednesday the 28th still work for a call once Nik's back?
>
> Talk soon,
> Daniel

Checks: opener "Hey Wilfried,"; no em or en dashes; offers, does not instruct; ends on the Oct 28 call; no new price,
date or term; no customer names; every claim traces to driver 1 (Oct 6 L293, L1560, L801) or driver 2 (Value tab,
275 lamps).

## Staged page section

`docs/pitch/staged/2026-10-21-value-panel/index.html`: a copy of the live proposal with one new panel at the top of
the Value tab, "What can really drive it", carrying drivers 1 to 3 and the Phase 1 table. Not published to
dancoded.ca. Screenshots in the same folder.
