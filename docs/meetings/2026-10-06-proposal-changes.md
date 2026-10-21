# Proposal changes from the October 6 meeting: DRAFT, waiting on Daniel

Purpose: Daniel can send Nik the proposal, updated with what was said in today's in-person meeting.

Target: https://dancoded.ca/p/bask-uvalux-cmxb8vlay3 (`~/projects/ddd/public/p/bask-uvalux-cmxb8vlay3/index.html`).
Evidence: `2026-10-06-uvalux-meeting-notes.md`; `L<n>` = line in `2026-10-06-uvalux-meeting-transcript.txt`.
**No price, equity or date number changes in this list.** Nothing new on price was said in the meeting.
Daniel restated $75,000 total and about $50,000 to the Expo (L2000), which matches the board as it is
(Phase 1 C$25,000 + Phase 2 committed $27,500 = $52,500).

Each change is marked **A** (apply on approval) or **Q** (needs Daniel's answer first).

## Cover and sources

1. **A** Cover line "Prepared for Nik Van Haeren, UVALUX, for Tuesday, October 6, 2026" changes to
   "Prepared for Nik Van Haeren and the UVALUX team, following our meeting on Tuesday, October 6, 2026".
2. **A** Add "the meeting with Nik and the UVALUX team on October 6, 2026" to the Sources lines on the System, Value and Plan tabs.

## Plan + price calendar

3. **A (standing rule fix)** Sep 3: "Dinner with Nik." changes to "Met with Nik." The rule is never to call Sept 3 a dinner.
4. **A** Oct 6: "This meeting. Kickoff on signature and the first payment." changes to
   "Met Nik and the UVALUX team. Proposal shared to live with; no decision asked for. Kickoff on signature and the first payment."
   (L1825 "We don't need to make a decision today", L2018 "live with it. Come come back.")
5. **Q** JAN 2027 "A polished salon experience shown at the January Expo." Daniel said a customer-zero beta mid-January
   plus four weeks of results, shown at the Expo (L1054, L1831). That does not fit an Expo in January.
   Expo name and date needed. Suggested text once known: "Customer zero live from mid-January; the Expo shows a month of its results."

## Board items (text only, no item moves between phases, no price effect)

6. **A** 1.9 "Data ingestion framework": append "A nightly sync of only what changed, deletes included, never a
   full copy each night. A one-button sync where there is no API. UVALUX offered to build the API for the data it hosts." (L548, L565, L551, L556)
7. **A** 1.11 "Pilot with friendly salons" renamed "Customer zero, then friendly salons"; text:
   "One multi-salon owner who likes data goes first, chosen with UVALUX, so the Expo shows a month of real results." (L383, L1752, L1831) No customer name on the page.
8. **A** 1.8 "UVALUX knowledge base": append "Turn what UVALUX's trainers know into what to say for each signal, and write short messages,
   about the length of a text, in the voice of the best trainers." (L928, L1108-1128)
9. **A** 2.1 "Measured lift": append "Each action is scoped to one insight and one group of customers, so a result traces back to the
   action that caused it, not to six things clicked at once." (L1059-1076)
10. **A** 2.5 "Production sign-in, privacy and consent": append "Consent is scoped per insight. The analysis runs as fixed calculations, not
   an AI reading the data. Anything sent to an AI model has salon and customer names removed first. Data hosted in Canada." (L779, L787-789, L797, L823)
11. **A** L.3 "Front Desk Listener": append "Disclosed with a sign at the desk. A customer who does not consent is excluded with one button.
   It may be offered only where the salon's software allows it." (L671-677, L421) Uses "consent" in proposal text, not in a film.
12. **A** New "To place" item N.9 "Trend projection": "A forward view built on each salon's own track record, so an owner sees a slide a month or two before it shows in sales. Projections use proven forecasting, never an AI guess." Source: Oct 6 (L850-870).
13. **A** New "To place" item N.10 "Data custody plan": "Where each piece of data lives, who can see it, which step the owner consents to, and where UVALUX's hosting keeps it. Written with UVALUX's hosting team before any live salon data moves." Source: Oct 6 (L751, L794, L926 "What is the chain of custody for the data and for the user consent").
14. Add a source code `O06` ("meeting, October 6, 2026") to the legend used for item sources.

## Deal tab

15. **Q** UVALUX asked for a lower base number and then sweat equity on the rest (L1849-1972), and by content Nik leans "more on the
   retainer side type of arrangement" (L1742). Options: (a) leave the deal as is and answer in the cover email; (b) add a retainer option
   to the slider; (c) lower the minimum cash. (b) and (c) change money terms, so nothing is drafted until Daniel picks.

## Salon data tab

16. **Q** Daniel said in the meeting he was given "three-store data of Helios" (L107). The tab says "four Ontario salons" from a SalonTouch
   database. Same data set or different? No change until answered.

## Letter

17. **Q** If the hosting lead who led the price discussion is Wilfred, add him as a cc on the letter? The letter today is addressed only to Nik.

## Phase 1 is NOT agreed (Daniel, 2026-10-06 15:50 ET: "THEY NEVER AGREED TO 25K")

18. **Q, must fix before send.** The live page claims agreement in five places: "Phase 1 as agreed." (Plan + price
    heading); "Phase 1 is as agreed in the Phase 1 letter agreement sent on September 4, 2026" (letter clause 1.2);
    "terms follow the Phase 1 letter agreement until a full agreement replaces it" (footer, letter clause, copied
    scenario text); "the Phase 1 letter agreement" in two Sources lines. The Sept 4 letter was sent, not accepted.
    Proposed wording: "Phase 1 as proposed in the September 4 letter". Daniel to confirm wording; the C$25,000 figure itself is not changed.

## Not in the proposal on purpose

- Customer names said in the room (Rachel, Kelly Kerr, Mike, Glo): never on the public page.
- Nik's "pitch something even bigger" (all-in-one management, L2166): conflicts with "Bask grows, it does not run". Separate decision for Daniel.
- Side conversations (youth-athlete marketplace, Neighbor Market, Germany/Marcus): not BASK scope.

## After approval

Apply to `index.html` only, screenshot at 390 and 1440 and read the shots, commit and push `ddd` main
(only that folder), and check the live page with Playwright. Daniel owns the send to Nik.

## Card pricing (Daniel 2026-10-06 19:43 ET: "do the 75k on the cards, allow drag/drop, keep 25k base. You decide item pricing based on effort")

Built in the staged copy, not live. Phase 1 = C$25,000 base, items locked ("In the base"), no cards can be dropped into it.
Each other card carries a price; a phase's price = the sum of its cards. Phase-by-phase price keeps the old ratio (P2 38/27.5, P3 32/22.5).
Default board = $75,000. Prices by Claude, from effort:
P2 ($27,500): 2.1 lift 3,500 · 2.2 tenure 2,000 · 2.3 staff 2,500 · 2.4 campaigns 5,000 · 2.5 sign-in/privacy 4,500 · 2.6 hosted ingestion 4,500 · 2.7 community 3,000 · 2.8 beta + Expo 1,500 · 2.9 subscription pricing 1,000
P3 ($22,500): 3.1 U.S. rollout 4,000 · 3.2 hosting add-on 5,000 · 3.3 integrations 7,500 · 3.4 wellness/spa/gym 6,000
Add-ons, not in $75k: Listener 6,000 · chatbots 4,000 · bottled pitches 2,500 · trend projection 2,500 · lamp budget 2,000 · front-desk prompt 2,000 · payback calc 1,500 · compliance 1,500 · reactivation 1,500 · custody plan 1,500 · coaching call 1,000 · failed payments 1,000 · draft order 1,000
Also applied: every "agreed / letter agreement" claim reworded to "proposed in the September 4 letter"; saved-state key bumped so old browsers start fresh.
Tested in Chromium: moves, a real mouse drag, Phase 3 off ($52,500), base lock toast, letter text. 0 page errors.

## Technical tab (Daniel 2026-10-06 19:49 ET: "Go")

New tab between Salon data and Plan + price, written for Wilfred: what Bask asks of UVALUX's systems and what it never touches. No stack list, no build plan.
Never on the live database; changes-only nightly feed (API UVALUX offered, L556); proposed to run in UVALUX's Canadian data centers; fixed calculations find insights, AI only drafts text, names stripped first; owner sends.
Each line labelled Built (checked in the working build: detectors, consent tiers live at /settings/data-sharing, OpenAI client) or Proposed / Phase 2 / Option.
Screenshotted 390 + 1440, no horizontal scroll, 0 page errors.
