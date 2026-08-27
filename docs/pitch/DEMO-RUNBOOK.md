# Demo runbook — the stakeholder meeting

**Companion to `PITCH.md`, not a replacement.** PITCH.md is what you *say*; this is what you *do* to
the machine. Rewritten 2026-08-27 after the fixture rebuild and the Floor removal — every claim below
was checked by opening the thing, not by reading the code.

---

## 0. Where the environment actually is

- **`node scripts/demo-verify.mjs` → 10 passed · 0 not built · 0 failed**, local and production.
- **Production is current.** `bask-psi.vercel.app`, all work pushed and deployed.
- **The demo clock is at day zero** (`2026-08-06`, Thursday) and the brief is written.
- **Five bookmarks**, matching the five beats. Floor and Inventory are gone from the nav (`0a8f256`).
- **Deck is built** — `docs/pitch/DECK.html`. Arrow keys; **P** gives the print/PDF layout. Self
  contained, opens from `file://`, nothing to fail in the room.
- **Every beat walked at 1440 and 390**, every route 200, zero horizontal overflow, zero JS errors,
  every Today action button verified clickable on production.
- **Beat 2's payoff was run end to end** — clock advanced, campaign settled at 8 bookings/$248,
  Daybreak read "52% above your usual Tuesday", then restored to day zero. The rebuild is
  deterministic: checksum `94099f9d…` identical before and after.

**The cold open now reads, verified on production:**

> **"Good morning, Dana. Yesterday finished 12% above your usual Wednesday."**

Underneath it, the retail card: **attachment 8.3% → 5.9%, ~$4,260/mo** — derived from the rows, not
written into a template.

---

## 1. What changed today, and why it matters in the room

**The demo data is now anchored to the real client dataset.** It used to claim 21% retail attachment;
the SalonTouch field data (194,672 visits, four salons) measures **5.2–9.4%**. Nick sells lotion for a
living — 21% is a number he would not recognise. The fixture now runs 8.3% → 5.9%.

That was also why the pitch used to open on *"24% below your usual Friday"*: retail was 59% of the
fixture's revenue, so the attachment slip the pitch *wants* dragged total revenue down 30% and
reported a salon whose traffic was **up** as collapsing. Fixing the mix fixed the headline. **No metric
was changed to flatter the demo** — the number is the same number, computed on believable data.

**Still true and worth knowing:** retail is 41% of revenue, better than 59% but above the real 9–12%.
The remainder is the fixture's $0-member-session model. Not a demo blocker; do not claim the mix is
fully realistic if asked.

---

## 2. Meeting time no longer constrains anything

Earlier advice said "book the afternoon" because Sunset Ridge is in Kelowna (Pacific) and the room
board looked dead before noon Eastern. **That advice is withdrawn.** There is no room board. Every
remaining surface reads the demo clock, not the wall clock. **Book whenever suits.**

---

## 3. Pre-flight — the morning of

Nothing here is destructive.

```bash
# 1. Server. 3417 is the port demo:verify and every bookmark assume.
cd apps/web && pnpm dev

# 2. The gate. Must be 10/10. A SKIP means a surface stopped existing.
node scripts/demo-verify.mjs

# 3. Read the cold open WITH YOUR EYES. A green gate is not a good sentence.
#    Open http://localhost:3417/ and read the first line out loud.
```

**If the brief is missing** ("Your letter isn't written yet"), the pipeline has not run for the current
clock day: `pnpm demo:advance --days 0` writes it without moving the clock.

### Physical — none of it verifiable from here
- Phone with Bask Mobile, Daybreak cached (must survive dead venue wifi)
- Presenter push tested on **venue wifi and hotspot fallback** — Beat 2's buzz is the moment
- Deck: built (`DECK.html`). Open it and press **P** once to produce the PDF backup.
- One full run-through against a stopwatch, ≤ 13 min

---

## 4. The flow, with the campaign assets placed

Two finished deliverables postdate PITCH.md. Both are **static HTML — no server, no database, nothing
to break mid-meeting**, which makes them the safest things in the room.

| asset | what it is | where it goes |
|---|---|---|
| `docs/pitch/2026-08-27-insights-final.html` | The insight report off the **real** 2016–2020 client data. Every figure recomputed across three adversarial passes; four claims cut for dying to one question. | **The credibility close.** The thing you leave behind. |
| `docs/pitch/campaign/index.html` + `assets/` + `video/` | "The Glow Playbook" — six campaigns built from those numbers, flight calendar, production inventory, **23 stills and 3 videos**. | **Extends Beat 1.** |

- **The deck** (`DECK.html`) is a backdrop, not a document — slides 4–6 are parking screens you will
  often skip entirely. Open it before the meeting; do not present *from* it.
- **Beat 1**, after scheduling the Tuesday SMS — *"That's one campaign. Here's the year."* Open the
  Glow Playbook, then get back to the product.
- **Close, on the ask** — hand over the insight report. *"Every number in here came out of a real
  salon's twelve years, and we tried to kill each one before we printed it."* It answers the "is this
  real or a mockup" question after you have left the room, which is where it actually gets asked.

Have both **open in browser tabs before the meeting** — never navigate a folder in front of a
stakeholder.

---

## 5. Recovery, mid-demo

- Any beat fumbles → **⌘⇧D** → its bookmark. Numbered in PITCH.md.
- **Run the beats in ascending order.** Bookmark jumps are forward-only: an out-of-order jump lands
  you on the right screen at the wrong day, silently. The only true rewind is `pnpm demo:reset`.
- **Beat 2 is bookmark day 6, not day 5.** The Tuesday campaign SENDS on day 5, so day 5 shows a
  negative headline and no result. Press the bookmark — do not hand-advance five days.
- Nick grabs the phone and explores → **let him**. Surviving unscripted exploration is the demo.
- Everything falls over → the two HTML deliverables in §4 need no server at all.

---

## 6. Known-soft — read before the room, do not fix this week

- **`DEMO_OPPORTUNITIES` is a hardcoded constant** (`page.tsx:74`), so every salon renders identical
  opportunity figures. **Do not salon-switch mid-demo.**
- **The SalonTouch salons produce 0 insights.** Not missing data — real attachment is 2–8% where the
  detectors were tuned near 30%. Recalibration is a business call. Stay on Sunset Ridge.
- **Positioning is SETTLED: "salon intelligence."** Owner, 2026-08-27. Never "operating system",
  "all-in-one" or "salon management" — Nick ruled that category out to your face on 2026-08-19
  ("there's five other guys doing it"), which is the same reason Floor and Inventory are gone.
  Corrected in the app metadata, PITCH.md, PRODUCT_SPEC, README and CLAUDE.md.
- **`demo:reset` is NOT atomic.** Its `DELETE_ORDER` is a bare list of `deleteMany` calls; it timed out
  mid-wipe on 2026-08-27 and left `sale` and `sale_line` at zero across every org. If you must run it,
  clear `bask.visit` in 80k batches by `ctid` first, then reset — and reload SalonTouch afterwards
  (`etl/run.ts` with `INGEST_ORG_SLUG=salontouch-real` and the **default** `INGEST_NS`, then
  `backfill-sale-lines.ts`). **Never the morning of.**
- **`uvalux-practice` is gone** (6 salons, 50,511 visits) — the reset took it and its source CSVs are
  not on disk. Grading dataset only; the pitch path does not touch it.
