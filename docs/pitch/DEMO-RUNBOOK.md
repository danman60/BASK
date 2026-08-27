# Demo runbook — the stakeholder meeting

**Companion to `PITCH.md`, not a replacement.** PITCH.md is what you *say*; this is what you *do* to
the machine before and during it, in order, with the failure modes named. Written 2026-08-27 against
a live environment, every claim below checked by opening the thing rather than reading the code.

---

## 0. State of the environment right now

`node scripts/demo-verify.mjs` against `http://localhost:3417` — **12 passed · 0 not built · 0 failed.**
Every one of the seven pitch beats, plus the cold open, the public booking page and the presenter
panel. Nothing in the script points at a surface that does not exist.

All seven Presenter Panel bookmarks are wired (`apps/web/src/lib/scenario-bookmarks.ts`), and the
Bask and Compass navs both carry every route the script visits — including The Floor and Inventory,
which an earlier handoff recorded as stripped from the nav. They are not; the live DOM has both.

**Two things are wrong, and neither is a broken screen.** Both are the environment being parked in
the wrong position, and one of them cannot be fixed without a decision (§1).

---

## 1. THE ONE DECISION — the clock is two days past the cold open, and bookmarks cannot rewind

`bask.demo_state.virtual_today` = **2026-08-08** (Saturday). Fixture day zero is **2026-08-06**
(Thursday). So the clock sits at **day 2**.

Bookmark jumps are **forward-only** by design — `demo.jumpTo` advances the clock or does nothing;
it never rewinds, because rewinding used to re-run days the world had already lived and made the
same bookmark produce two different states. Measured against the current day 2:

| beat | bookmark | staged for | reachable now? |
|---|---|---|---|
| Cold open | `morning-brief` | day 0 | **NO — behind us** |
| 1 · Insight → campaign | `tuesday-campaign` | day 0 | **NO — behind us** |
| 2 · Floor | `floor-live` | day 2 | yes |
| 3 · Inventory | `inventory-low` | day 2 | yes |
| 4 · Campaign results | `campaign-results` | day 5 | yes |
| 5–6 · Compass | `compass-morning` | day 5 | yes |
| 7 · Consent | `consent-flip` | day 5 | yes |

**The two opening beats — the ones that carry the whole pitch — are the two that are out of reach.**
Pressing their bookmark lands you on the right screen at day 2, not at day zero.

At day 2 the cold open currently reads:

> Good morning, Dana. **Yesterday finished 24% below your usual Friday.**

PITCH.md's script wants the opposite ("yesterday beat the four-week Thursday average"), and the
first sentence Nick reads is the single highest-leverage line in the meeting.

### The only true rewind is `pnpm demo:reset` — and it is not free

`demo:reset` (~32s, 36,351 rows) is the only thing that puts the clock back to day zero. Read
`packages/db/scripts/demo-reset.ts`: its `DELETE_ORDER` walks `saleLine · sale · visit · customer ·
salon · org` **with no org scoping at all**, then reseeds the 12 fixture salons only. It is
bask-scoped and touches no other product's tables — but inside `bask` it is total.

So a reset also destroys:

1. **The SalonTouch field tenant** — 4 salons, 194,672 visits, 53,839 sales, and the 59,787
   `sale_line` rows recovered this morning in `5426cc0`. This is the real 2016–2020 client dataset
   behind the credibility story.
2. **The consent backfill** — which is *Beat 7's own data*. `consentProfile` is in the delete list
   and the fixtures reseed only the 12. Re-run `packages/db/scripts/backfill-consent-profiles.ts`
   after any reset or the trust beat degrades.

**Restoring SalonTouch after a reset** = re-run the ETL (`packages/db/scripts/salon-ingest/etl/run.ts`
with `INGEST_ORG_SLUG=salontouch-real`, **default `INGEST_NS`** — see `DIRECTIVE.md`) then
`backfill-sale-lines.ts`. That is 200k+ rows through the pooler and is exactly the path that lost a
table last time. **Do not attempt it the morning of the meeting.**

### The fork — Daniel's call, not mine

| | Option A — reset to day zero | Option B — run from day 2 |
|---|---|---|
| Cold open | day-zero brief, as scripted | opens on a **negative** line |
| Beats 2–7 | re-advance with bookmarks, fine | already in position, fine |
| SalonTouch tenant | **gone** until re-loaded | intact |
| Consent data | must re-run the backfill | intact |
| Risk | reload is the step that broke before | zero — nothing is touched |

**Do it days ahead, never on the morning.** If Option A, reset now, immediately re-run the consent
backfill and the SalonTouch load, then re-run `demo-verify` and re-read the cold open with your own
eyes before calling it good.

> ⚠ One caveat I could not settle without resetting, and will not guess at: `CLAUDE.md` records that
> **even at day zero** the brief has read a negative ("31% below your usual Monday" where PITCH.md
> wants "8% above"), because fixture volume runs ~10× the mockups. If that note still holds, Option A
> buys the correct *day* but not automatically a positive *opening line*, and the fixture arc needs
> tuning as a separate job. Verify the actual sentence after any reset before trusting the plan.

---

## 2. THE SECOND FINDING — schedule the meeting for the afternoon, Eastern

Sunset Ridge is **Kelowna, BC** (`fixtures/constants.ts:26`), timezone **America/Vancouver**. That
is correct and deliberate, not a bug — but you are demoing from Eastern, three hours ahead.

Fixture opening hours are salon-local: **9–21 Mon–Fri**, 9–19 Sat, 11–17 Sun.

| meeting time (ET) | salon local (PT) | what The Floor shows |
|---|---|---|
| 09:00 | 06:00 | **shut** — every room "Ready", no countdowns |
| 11:30 | 08:30 | **shut** |
| **13:00+** | **10:00+** | open, live sessions, countdowns |

Caught by screenshot, not inference: at 09:15 ET the room board read **6:15 a.m. with all 8 rooms
Ready**. PITCH.md Beat 2 promises *"Rooms live, countdowns ticking, one room wearing the sunset
ring."* Before noon Eastern, none of that is on screen and the line falls flat.

**Book the meeting after 12:00 ET.** If that is impossible, pre-stage §3.

---

## 3. Pre-flight — the morning of

Run in this order. Nothing here is destructive.

```bash
# 1. Server. 3417 is the port demo:verify and every bookmark assume.
cd apps/web && pnpm dev            # ✓ Ready in ~300ms

# 2. The gate. Must be 12/12. A SKIP means a surface stopped existing.
node scripts/demo-verify.mjs       # exit 0 or do not walk into the room

# 3. Read the cold open WITH YOUR EYES.
#    Open http://localhost:3417/ and read the first sentence out loud.
#    A green gate does not mean the sentence is one you want to open on.
```

**Then, if the meeting is before noon ET** (or you just want the board alive on arrival): open
`/floor` and check two or three customers into rooms a few minutes before you start. The Floor is a
live state machine — sessions exist because someone started them, not because a fixture placed them.
Beat 2's "check in Sarah" then lands on a board that is already breathing instead of a wall of
"Ready".

### Physical, from PITCH.md's own checklist — none of it verifiable from here
- Phone with Bask Mobile, Daybreak cached (must survive dead venue wifi)
- Presenter push tested on **venue wifi and hotspot fallback** — Beat 4's buzz is the moment
- Tablet for Nick's live signature
- Real lotion bottle whose UPC is seeded in fixtures (Beat 2's scan)
- Deck S1–S8 rendered, PDF backup
- One full run-through against a stopwatch, ≤15 min

---

## 4. The flow, with the new assets placed

The 24 hours before this produced two finished deliverables that PITCH.md predates and does not
mention. Both are **static HTML — no server, no database, nothing to break mid-meeting**, which makes
them the safest things in the room.

| asset | what it is | where it goes |
|---|---|---|
| `docs/pitch/2026-08-27-insights-final.html` | 60KB. The insight report off the **real** 2016–2020 client data. Every figure recomputed across three adversarial passes; four claims cut for dying to one question. | **The credibility close.** Not a demo screen — the thing you leave behind that proves the product's claims survive scrutiny. |
| `docs/pitch/campaign/index.html` + `assets/` + `video/` | "The Glow Playbook" — six campaigns built from those numbers, with a flight calendar, production inventory, **23 stills and 3 videos**. | **Extends Beat 1.** The demo shows one Tuesday campaign; this shows what a year of them looks like. |

Suggested placement, changing nothing about the spoken script:

- **Beat 1**, after scheduling the Tuesday SMS — *"That's one campaign. Here's the year."* Open the
  Glow Playbook. Six flights, each priced off a real number. Then get back to the product.
- **Close (slide 8), on the ask** — hand over the insight report. *"Every number in here came out of
  a real salon's twelve years, and we tried to kill each one before we printed it."* It answers the
  "is this real or a mockup" question after you have left the room, which is where that question
  actually gets asked.

Both are files on disk. Have them **open in browser tabs before the meeting starts** — do not
navigate to a folder in front of a stakeholder.

---

## 5. Recovery, mid-demo

- Any beat fumbles → **⌘⇧D** → its bookmark. They are numbered in PITCH.md.
- **Run the beats in ascending order.** Forward-only means an out-of-order jump lands you on the
  right screen at the wrong day, silently.
- Nick grabs the phone and explores → **let him**. Surviving unscripted exploration is the demo.
- Everything falls over → the two HTML deliverables in §4 need no server at all.

---

## 6. Known-soft, deliberately not fixed this week

- **The SalonTouch salons produce 0 insights.** Not missing data any more — the ETL was repaired in
  `5426cc0`. Real retail attachment runs 2–8% where the detectors were tuned near 30%, so a genuine
  halving at one salon reads as below-threshold. Recalibrating is a business call. **Consequence for
  the demo: do not switch the presenter panel to a Salon A–D tenant and expect insights.** Stay on
  Sunset Ridge.
- `page.tsx:74` passes a hardcoded `DEMO_OPPORTUNITIES` constant, so **every salon renders identical
  opportunity figures**. Another reason not to salon-switch mid-demo.
- `5f1c2c9` (73 files, the twenty-item pass) is **committed and unpushed**, as are `5426cc0` and
  `397fdde`. Master auto-deploys to production. **If the demo runs off `bask-psi.vercel.app` rather
  than this laptop, production is missing all three** — decide and push with time to watch the build,
  never minutes before.
