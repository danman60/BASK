# Bask / Compass — Pitch Script & Deck
## For the Nick meeting. Versions with the build; update in the same PR as any demo change.

**Format:** ~13 minutes total. Deck is thin on purpose — 8 slides, mostly as connective tissue; **the product is the presentation.** Live demo carries 10 of the 13 minutes. Each demo beat maps to a Presenter Panel bookmark (`[BM:n]`) so any segment can be jumped to or recovered.

---

# Part 1 — Spoken Script (timed)

## 0:00 — Cold open, no deck, no laptop (1 min)

Hand Nick a phone. Bask Mobile is open on Daybreak. `[BM:1 morning-brief]`

> "Before I explain anything — this is what a salon owner sees when they wake up."

Let him read it. Silence is fine. The brief opens **"Yesterday finished 12% above your usual Wednesday"** (verified on the build 2026-08-27 — read it yourself before the meeting, the number moves with the data), then: retail attachment slipping 8.3% → 5.9%, seven failed payments, Tuesday afternoon wide open.

> "Nobody ran a report. Nobody opened a spreadsheet. The software did the analysis overnight and wrote it in plain English. That's the product in one screen: it tells you what changed, why it matters, and what to do about it. Everything else I'm going to show you is just that idea, applied everywhere."

## 1:00 — Frame (slides 1–3, 2 min)

**Slide 1 (title)** while transitioning to the screen.

**Slide 2 — the gap:**
> "Today, UVALUX helps a new salon with everything — equipment, inventory, training, business planning. Then, for the one system the salon touches every single hour, your own guide says: 'several third-party options exist, compare and choose.' The operating software is the only part of a salon's success that lives outside the UVALUX relationship."

**Slide 3 — the thesis:**
> "So we built two products that are really one. **Bask** — salon intelligence. **Compass** — the intelligence layer for UVALUX over the network that runs on it. Salons run better; UVALUX sees, for the first time, the health of the market it serves — with consent, by design."

*Never say "operating system", "all-in-one", or "salon management". Nick ruled that category out to your face on 2026-08-19 — "there's five other guys doing it" — and it is why Floor and Inventory are not in this demo. The word is **intelligence**.*

## 3:00 — Act 1: the owner (4 min, big screen)

### Beat 1 — Insight to action `[BM:2 tuesday-campaign]`
Open the Tuesday card → *Show me why* (capacity heatmap) → *Fix this* → Studio arrives pre-filled → generate → **edit one line of the SMS live** → preview in phone frame → schedule.
> "Watch the part that matters: I never started from a blank page. The system found the slow Tuesday, proposed the offer, wrote the campaign — and I stayed in control the whole way. Every salon owner is a marketer now; none of them have time to be."

> **THE FLOOR AND INVENTORY BEATS ARE GONE (2026-08-27).** They demoed a salon
> operating system — room board, check-in, waiver signature, POS, barcode scan,
> stock forecast. Bask is **salon intelligence** (`8e32efc`), and those
> surfaces are off-nav. The routes still render, so this is reversible, but the
> product decision is the one that stands: nothing in the pitch opens them.
>
> They were also holding the old product in place by circular reference —
> `nav.ts` had restored Floor and Inventory to the nav *because this script and
> the presenter bookmarks still opened them.* Deleting them here is what lets
> that stay deleted.
>
> **Act 1 is now two beats, not four**, and it is a tighter story for it: the
> software finds the money, writes the campaign, and reports back. If the supply
> beat ("the software just wrote a UVALUX order") is worth reviving for a
> distributor audience, that is a product call — bring Inventory back on purpose,
> then rewrite this section, in that order.

### Beat 2 — Close the loop `[BM:3 campaign-results]`
Presenter advances the demo clock (framed honestly: "let me jump us forward a week").
**The phone — still near Nick — buzzes** (presenter fired the push, which carries the REAL settled numbers): *"Campaign results are in — 8 bookings, $248."* Then the big screen: Daybreak reads **"Yesterday finished 52% above your usual Tuesday."**

*Verified 2026-08-27 by advancing the clock. The bookmark is day **6**, not day 5 — the campaign SENDS on the Tuesday (day 5), so on day 5 the brief is still about Monday and reads a negative. The payoff is the next morning.*
> "Marketing that reports back — and the phone told her before she asked. The owner learns what works. So does the system."

While in Insights: **grab the Peers gap slider** — drag retail attachment from 5.7% toward the peer cohort's ~8.4%, the $/month figure recomputes live under your finger. (One point of attachment is ~$1,738/month at this salon's traffic — the page shows its own working.)
> "Benchmarks that answer 'so what' — every gap is priced."

## 7:00 — Act 2: UVALUX (4 min)

Switch roles. Theme flips dark. `[BM:4 compass-morning]`

### Beat 3 — Network
> "Same nervous system, opposite end. This is the network you already serve — visible for the first time." Map, health distribution, category trends.

### Beat 4 — Call List
Open Maple Glow: retail down 17%, attachment below peers, traffic stable, hasn't ordered lotion in two cycles. Open the call brief.
> "Your rep doesn't call asking 'need anything?' They call knowing exactly what's wrong and what to suggest. And here —" (Northern Sun, expansion signal) "— they call knowing who's ready to grow. This makes every rep your best rep."
Show Sunset Ridge's draft order arriving on the account timeline — the Act 1 thread pays off.

### Beat 5 — Trust `[BM:5 consent-flip]`
Open a salon's "What UVALUX sees" screen. Flip the tier. Compass visibly loses detail.
> "This only works if salons trust it, so consent isn't a terms-of-service paragraph — it's a screen. The salon always knows exactly what you see, and it's business signals, never their customer list. Trust is the moat; we built it as a feature."

## 11:00 — Close (slides 7–8, 2 min)

**Slide 7 — three wins:**
> "Three parties win at once. The salon runs smarter and markets itself. Your reps and trainers get told where they're needed. And UVALUX adds a recurring software business that makes the wholesale business stickier — every salon on this platform is a salon that orders through you more easily."

**Slide 8 — the ask:**
> "What I want from today: your read on the concept, the branding question — UVALUX-branded, co-branded, or powered-by — and three to five salon owners you trust who'll spend thirty minutes reacting to this. If those conversations go the way I think they will, we talk structure."

Stop talking. Let him drive.

---

## Recovery notes (presenter only)

- Any beat fumbles → Presenter Panel (⌘⇧D) → jump to its bookmark. Bookmarks are numbered in this script.
- AI generation for Beat 1 is pre-warmed; the live edit is the authenticity moment — never skip it.
- If Nick grabs the phone and starts exploring: let him. The product surviving unscripted exploration IS the demo. Guidance layer catches him.
- Hard questions cheat-sheet: pricing → "category runs US$100–200/mo; we price above it on intelligence + marketing; real answer comes from the pilot." Hardware → "T-Max integration is designed-in, bench-verified before we promise it to anyone." Migration → "new salons first — no migration; concierge import for switchers later." Data ownership → point back at the consent screen.

---

# Part 2 — Deck (8 slides, content + speaker notes)

Design: Sunset theme tokens — warm ivory, ink, sunset-gradient accents, Fraunces display. Slides are backdrops, ≤20 words each. Render to HTML/PDF from this content when needed.

**S1 — Title.**
"**Bask** — salon intelligence for tanning & wellness businesses. **Compass** — the intelligence layer for the UVALUX network."
Small: "powered by UVALUX" lockup option shown. *Notes: on screen while cold-open phone moment happens; don't read it aloud.*

**S2 — The gap.**
Left: everything UVALUX guides today (equipment · inventory · training · planning · pricing · marketing). Right, highlighted: "Salon software: 'compare third-party options.'"
*Notes: their own onboarding guide is the evidence; say it warmly, not as a gotcha.*

**S3 — The thesis.**
Two-sided diagram: Salon ⇄ Bask ⇄ (consent gate) ⇄ Compass ⇄ UVALUX.
"Salons run better. UVALUX sees the market it serves."

**S4 — (Act 1 backdrop) "Tell me what needs my attention."**
Daybreak screenshot. *Stays up while demoing; slides 4–6 are parking screens if the projector must show something between demo segments — often skipped entirely.*

**S5 — (Act 1 backdrop) "From insight to action in three clicks."**
Insight card → campaign → measured result, as three tiles.

**S6 — (Act 2 backdrop) "Every rep, your best rep."**
Call List screenshot.

**S7 — Three wins.**
Salon: runs smarter · markets itself · orders easier. UVALUX reps: know who to call and why. UVALUX: recurring revenue · retention · network intelligence.
"A competitor can redesign a dashboard. They can't reproduce UVALUX."

**S8 — The ask.**
1. Your read. 2. Branding: UVALUX / co-brand / powered-by. 3. Intro to 3–5 trusted owners. 4. Then: structure.
Footer: contact.

---

# Pitch-asset build checklist (M1/M2 exit items)

- [ ] All 5 bookmarks staged and `demo:verify` covers the full script path
- [ ] Phone demo unit: Bask Mobile installed, Daybreak cached (survives dead wifi)
- [ ] Presenter "fire push" works with venue wifi AND phone hotspot fallback
- [ ] Peers gap slider rehearsed — drag reads smoothly on the demo hardware
- [ ] Deck rendered from S1–S8 in Sunset theme (HTML), exported PDF backup
- [ ] Screenshots in S4/S6 regenerated from current build (never stale UI)
- [ ] Full run-through rehearsed once against a stopwatch: ≤13 min with margin
