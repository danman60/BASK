# TEN AND TEN — Bask, 2026-08-26

Weighted for **the stakeholder demo this week**. Every item cites a real `file:line`, spot-checked
against live code and the live `bask` schema. Generate → user picks numbers → execute.
**Nothing here is built. Nothing auto-executes.**

## Two inherited claims that were WRONG — corrected before use

1. **"`membership_payments` is 0 rows, so failed-payment recovery has no data."** False.
   `membership_payments` is a *CSV input to the ETL*, not a table. The real signal is
   `bask.membership.payment_state <> 'current'` = **83 rows**. Failed-payment recovery *does* have data.
2. **"`inventory_snapshots` is 0 rows, so stock velocity has no data."** Also a CSV input, not a table.
   The real gap: all 4 SalonTouch salons have **0 `inventory_level` and 0 `product` rows**, so stock
   velocity and the Beat 3 order path cannot read SalonTouch at all — they demo on fixtures.

Also corrected: the orphan count is **10**, not 11 (`PulseCard` is allowlisted as deliberately parked).

---

## KILLER FEATURES

### 1. [industry-standard] Every opportunity action opens the real artifact, not a toast — ~half-day
`apps/web/src/components/today/OpportunityFeed.tsx:38`
Only `a.kind === 'social'` opens a sheet. Every other press falls through to `setConfirmed(label)`
(`:42`) — a toast. The cards for the other kinds are **already built and orphaned**:
`SmsPreviewCard`, `EmailPreviewCard`, `StaffTaskCard`, `FrontDeskScriptCard`, `StaffChallengeCard`,
`HandleItPlanCard`. Action kinds at `packages/core/src/opportunities/types.ts:55-147`.
**Demo:** 7 of 8 buttons on the money row are dead. PITCH.md:85 explicitly plans for Nick driving
unscripted. This is the single biggest "survives him touching it" fix.

### 2. [industry-standard] Compass Beat 6 opens an EMPTY salon; Sunset Ridge has no snapshot — ~1hr (seed) / multi-session (derive)
`packages/core/src/compass/derive.ts:175-218`
Live DB: **4 of 12 Compass accounts have zero `bask.signal_snapshot` rows — including Sunset Ridge**,
the hero salon whose draft order is meant to land on the account timeline (PITCH.md:63). Worse:
"Maple Glow Tanning" and "Northern Sun Wellness" each exist **twice** — once in the Compass portfolio
org (0 visits, 0 customers, 0 sales) and once in `uvalux-practice` (~8.7k visits). **Beat 6 opens the
empty one.** Its "retail down 17%" comes from one hand-seeded snapshot.
**Demo:** this is the Act 1 → Act 2 handoff. Seeding the 4 missing snapshots holds the beat; deriving
signals from Bask operational rows is the real feature.

### 3. [creative] The Peers gap slider — a scripted beat with zero implementation — ~1hr
`apps/web/src/app/(bask)/insights/peers/page.tsx:93` (static text) — the only `<input>`s on the page
are `type="hidden"` (`:253-275`); verified `grep -c 'type="range"'` = **0**.
PITCH.md:50 scripts it verbatim: *"grab the Peers gap slider — drag retail attachment from 15% toward
23%, the $/month figure recomputes live under your finger."* The maths is already pure and
re-runnable client-side: `apps/web/src/server/peers.ts:372`, `halfGapMonthly = (gapPoints / 2) * coefficient.perPoint`.
**Demo:** a rehearsed, named pitch beat that does not exist. UI-only gap.

### 4. [industry-standard] Run the detectors against the 194,672 real SalonTouch visits — ~half-day
`packages/db/scripts/salon-ingest/etl/grade-run.ts:83`
It already calls the **production** `buildFacts` + `runInsightSweep` against loaded DB salons — and
only `console.log`s the result (`:85, :96-99`). It never writes to `bask.insight`, and `:27` is
hardwired to `SAL001–SAL006`, not the SalonTouch ids. Live DB: `bask.insight` holds **5 rows total,
all Sunset Ridge**; all four SalonTouch salons have **0**.
**Demo:** answers the hardest question in the room — "does this work on real data?" — by pointing the
same engine at 194k real visits and reading what it found.

### 5. [boring-overlooked] Customer health stops calling never-visited people "healthy" — ~1hr
`packages/core/src/health/customer-health.ts:182` (`if (lastVisitAt) {` — staleness only accrues once
a visit exists) against `:74` (`BANDS = { healthy: 65 }`) and `:39` (`BASELINE.member = 65`).
Verified in DB: Golden Hour (750 customers) has exactly **4 active members with zero visits** — they
score 65 + 0 boost − 0 staleness = healthy, while everyone who actually came in pays staleness.
Rendered at `apps/web/src/app/(bask)/customers/CustomersSurface.tsx:79-85`.
**Demo:** Nick named the health dashboard as the thing he reacted to (`customer-health.ts:1-4`). A
wall of amber whose only green rows never set foot in the salon is a ten-second credibility hole.
**Tuning the constants is a business call — the fix needs your number, not mine.**

### 6. [boring-overlooked] Consent fails CLOSED, and every salon gets a profile row — ~1hr
`packages/api/src/routers/compass.ts:221, 292, 411, 455` + `apps/web/src/server/salon.ts:58` — all five
use `consentProfile?.tier ?? 'benchmarks'`. `apps/web/src/server/peers.ts:204` already defaults to
`'private'`, so the safe pattern exists in-repo. Live DB: **10 of 22 salons have no
`bask.consent_profile` row** — all 4 `salontouch-real` and all 6 `uvalux-practice`.
**Demo:** Beat 7 (PITCH.md:65-67) is "trust is the moat; we built it as a feature." A missing row
defaulting to *sharing* is the opposite claim, one query from being asked about.

### 7. [creative] Network outcome proof on the opportunity card — ~half-day
`packages/core/src/network/outcomes.ts:87` (`summariseNetworkOutcomes`) with a confidence floor at
`:72` (`MIN_SALONS_FOR_CONFIDENCE = 5`). Its renderer `packages/ui/src/components/NetworkOutcomeCard.tsx`
is an **orphan** — neither the function nor the component has a call site in `apps/web/src`.
**Demo:** "salons like yours ran this and 8 of 11 saw a lift" is the one thing a single-salon tool
structurally cannot say. The network-effect moat is built and rendering for nobody.

### 8. [creative] Show where the method came from — ~1hr
`packages/core/src/sources/experts.ts:40` (`METHOD_SOURCES`, 5 techniques) and `:74` (`methodSourceFor`).
Exported at `packages/core/src/index.ts:402`; **verified imported by zero files** across `apps/web/src`,
`packages/api/src`, `packages/ui/src`. De-identification is enforced inside the file (`:11-14` — the
name never renders; app label is "UVALUX analytics method").
**Demo:** "Membership penetration benchmark, 2.5–4% of the customer base" is arguable; a bare number
is a guess. It's the visible difference between a dashboard and UVALUX's advisory encoded in software
— Slide 7's exact claim (PITCH.md:117).

### 9. [creative] The phone buzzes when campaign results land — ~half-day
PITCH.md:47 scripts *"**The phone — still near Nick — buzzes** (presenter fired the push)"*, and
PITCH.md:129 lists it unchecked. Verified: **no service worker, no web manifest, no Notification API,
no push subscription** anywhere in `apps/web/src` or `apps/web/public`. The only "push" in the repo is
Supabase Realtime room-state (`apps/web/src/server/floor/realtime.ts:4`) — so the transport is
half-built. Trigger point exists at `apps/web/src/components/presenter/PresenterPanel.tsx:109`.
**Demo:** highest theatre-per-hour on the list. See also streamline #14 — the panel currently shows
that button greyed out and labelled "Fire push (M2)".

### 10. [boring-overlooked] Put one signed waiver on Sarah's file before the tablet moment — ~10min
`apps/web/src/app/(bask)/floor/components/WaiverSheet.tsx:32` — signature capture is fully built and
stores through `floor/actions.ts`. Live DB: **`bask.waiver_signature` has 0 rows.** PITCH.md:38 hands
Nick the tablet: *"sign here — his own signature lands on her file"*, and the stored-waivers panel
(`WaiverSheet.tsx:83`) renders empty until he signs.
**Demo:** the punchline is *his signature landing on an existing record*. An empty history panel makes
it read as built-for-the-demo rather than found-by-it. Cheapest item here.

---

## STREAMLINES

### 11. `/floor` and `/inventory` are off-nav — but they are Beats 2 and 3 — ~10min (re-add) / ~half-day (delete cleanly)
`apps/web/src/components/shell/nav.ts:28-35` lists six destinations; **neither Floor nor Inventory is
among them** (removed in `8e32efc`). `apps/web/src/lib/scenario-bookmarks.ts:52` and `:60` still point
at them.
**Demo risk: highest on this list.** Beat 2 ("switch to the Floor") and Beat 3 ("Inventory →") have no
click path — the presenter must open ⌘⇧D mid-sentence, and each bookmark click also rewinds the clock
(#13). If Nick takes the phone, both surfaces are invisible to him. Decide: restore, or delete.

### 12. Two insight→destination route maps that disagree — and the Insights one is dead — ~10min
`apps/web/src/app/(bask)/insights/page.tsx:111` builds `?from=insight&insightId=<id>`, but
`apps/web/src/app/(bask)/marketing/MarketingSurface.tsx:10` reads `params.get('insight')`.
`apps/web/src/lib/today-data.ts:94` sets the correct key. The same two maps also disagree about whether
Inventory exists: `insights/page.tsx:18-19` routes `draft_order`/`review_product` → `/inventory`,
`today-data.ts:81-82` routes them → `/insights`.
**Demo risk: real.** Beat 1 is *"Fix this → Studio arrives pre-filled."* Launched from the **Insights**
page it lands on the Studio **hub**, not the pre-filled builder. Only the Today path works.
Fix: delete the second map, reuse `actionHref()` from `today-data.ts`.

### 13. Every bookmark click silently rewinds the clock, and the "same state" promise is false — ~half-day
`apps/web/src/components/presenter/PresenterPanel.tsx:110` — `await reset.mutateAsync()` before every
jump. `packages/api/src/routers/demo.ts:80-87` shows `reset` is **clock-only**: it does not undo the
rows `advance` wrote, and `advance` runs the real pipeline (`packages/core/src/pipeline/index.ts:66` —
visits, sales, insights, briefs). So clicking the same bookmark twice does **not** land in the same
state, contradicting the contract stated at `scenario-bookmarks.ts:7-9`.
**Demo risk: real.** Mid-demo recovery is the stated purpose of bookmarks. Jumping back to Beat 2 after
Beat 4 rewinds to day zero and re-runs the pipeline over already-settled campaigns.

### 14. The Presenter Panel shows a stale "STUB" and a greyed-out "Fire push (M2)" — on stage — ~10min
`PresenterPanel.tsx:215` says theme is a stub *"until step 8's ThemeProvider lands"* — but
`ThemeProvider` is wired at `apps/web/src/app/layout.tsx:57`, and the panel still drives its own
`applyTheme` DOM write (`apps/web/src/lib/demo-scope.ts:68`). Two systems writing `data-theme` can
fight during the Act 2 dark flip. Lines 220-227 render a "Wired later" section from
`packages/api/src/routers/demo.ts:90-92`.
**Demo risk: real and reputational.** Beat 4's payoff is *"the presenter fired the push"* and the panel
visibly shows that button disabled. The panel is on screen whenever a bookmark is used.

### 15. Three salon resolvers — and `/insights` ignores `?salon=` — ~half-day
`apps/web/src/lib/salon-scope.ts:51` (`resolveSalonScope`), `packages/api/src/context.ts:86` (same
logic, same UUID guard — the comment at `salon-scope.ts:48-49` says outright "carries the same shape;
flagged to that owner rather than edited from this lane"), and `apps/web/src/server/salon.ts:35`
(`getDemoSalon`, hard-pinned to `HERO_SALON_ID`, no `?salon=` support). `readVirtualToday` exists twice
(`salon-scope.ts:73`, `server/salon.ts:31`).
**Demo risk: real.** `/insights` uses `getDemoSalon()` (`insights/page.tsx:16`) so it ignores `?salon=`
while Today honours it — a `?salon=` deep link shows two different salons on two screens. This is the
same class of bug already fixed once in `e426f3d`.

### 16. `formatHour` exists three times and the three disagree — ~1hr
`packages/core/src/insights/detectors.ts:734` returns `"2pm"`; `packages/api/src/routers/marketing.ts:813`
returns `"2 pm"` (with a space); `apps/web/src/app/(bask)/floor/components/SchedulePanel.tsx:259`
returns `"2pm"`. Also duplicated: `formatHourRange` (`detectors.ts:740` / `marketing.ts:809`),
`weekdayNameFor` vs `weekdayNameFromIndex`, `numberWord` (`detectors.ts:752` / `ai/daybreak.ts:389`,
**different array lengths** — six vs five).
**Demo risk: real, and on the pitch path.** Beat 1 goes insight → campaign: the insight card reads
`2pm–5pm`, the campaign copy generated from that same slot reads `2 pm–5 pm`. Both on screen inside
thirty seconds.

### 17. Compass is a fifth page shell and never reads the gutter token — ~10min
`apps/web/src/app/compass/compass.css:113` — `.cp-main { padding: var(--space-8) var(--space-10); }`
hardcodes 40px instead of `var(--page-gutter)`. The "one gutter, one decision" claim in
`packages/tokens/src/tokens.css:44-53` is currently 4/5 true.
**Demo risk:** Act 2 is entirely Compass. On a narrow projector or a low-res mirrored laptop, Compass
keeps 40px down to 320px while Bask narrows to 16px — a visible inconsistency across the second half.

### 18. Ten orphaned components — a verdict for each — ~1hr
`bash scripts/qa/orphan-check.sh` → 10 unexplained orphans of 40 exports. Barrel lines
`packages/ui/src/index.ts:70,125,126,128,130,134,138,165,167,171`.
- **DELETE (5):** `SmsPreviewCard` / `EmailPreviewCard` — superseded, `StudioBuilder.tsx:776-845` has its
  own phone-frame preview and that's the one on the pitch path. `CustomerHealthSection` /
  `ScoreboardSection` — dead second compositions of a live screen (`CustomersSurface.tsx:15` composes
  the parts directly). `NetworkOutcomeCard` — **unless you pick #7**, in which case wire it.
- **WIRE (1):** `CoachAnswer` (`:165`) — the only surface for the transcript corpus.
- **ALLOWLIST WITH A REASON (4):** `StaffTaskCard`, `FrontDeskScriptCard`, `StaffChallengeCard`,
  `HandleItPlanCard` — a coherent staff/delegation family with no screen yet. **Unless you pick #1**,
  which wires all four.
**Note the interaction:** #1 and #7 consume six of these ten. Pick order matters.
**Demo risk:** internal, one exception — the two preview cards are a live trap for anyone "fixing" the
Studio preview in the wrong file this week.

### 19. Three page-shell rules that are now byte-identical → one `PageContainer` — ~1hr
`apps/web/src/components/lane4/lane4.css:10` (`.l4`), `customers/customers.css:10` (`.cu-shell`),
`marketing/studio.css:60` (`.st-shell`) — all three are exactly
`max-width:1180px; margin:0 auto; padding: var(--space-8) var(--page-gutter) var(--space-12)`.
**Demo risk:** none now — the `--page-gutter` token already fixed the visible symptom. This removes
three names for one decision and stops the next divergence.

### 20. An unused Anthropic SDK, and the comment that keeps regenerating the false story — ~10min
`packages/core/package.json:15` declares `@anthropic-ai/sdk` with **zero imports anywhere** (verified).
`package.json:36` duplicates `openai` at the monorepo root against `packages/core/package.json:16`. And
`packages/core/src/index.ts:5` still documents *"The Anthropic SDK is imported lazily inside
`ai/client.ts`"*.
**Demo risk:** internal — but that comment is the source that keeps re-seeding the
"Anthropic key is out of credits" story CLAUDE.md already tells sessions to stop repeating. Deleting it
costs one diagnosis-from-scratch less, every time a surface reads `fallback`.

---

## Grounded, but didn't make the twenty

Pull any of these in by name if you'd rather swap one out.

**Features:** cited coaching answers over the 1,007-row `knowledge_claim` corpus (`CoachAnswer.tsx:10`,
orphan — but `knowledge_chunk`/`knowledge_doc` are both **0 rows**, so vector retrieval returns nothing;
a category filter is the honest path this week) · Monitor on real mined transcripts instead of one
hand-written fixture (`monitor/page.tsx:35` renders `DEMO_MONITOR`; the file's own comment admits "no
audio is processed anywhere") · camera barcode scan (`floor/lib/use-wedge-scanner.ts:8` is HID-only;
`BarcodeDetector` is native in Chrome, and `bask.barcode` already has 46 rows) · Community posts that
survive a refresh (`community/page.tsx:47-52` — `useState`; **no `community_post` table** in the 43-table
`bask` schema, no storage bucket).

**Streamlines:** `/dev/floor` — 544 lines of superseded M0 harness that **creates a phantom salon** in
the shared DB (`dev/floor/page.tsx:24-28` → `server/floor/engine.ts:70-78`), which the Presenter Panel
then counts (`demo.ts:41`) · a git-tracked
`apps/web/src/components/compass/knowledge/ClaimFilterBar.tsx.rejected` (confirmed in `git ls-files`)
plus two `.bak` files · four copy dictionaries, three of which self-document as temporary until a merge
protocol that is now over (`marketing/copy.ts:8-14`).

**Also worth knowing:** the hunt for `TODO`/`FIXME`/`HACK`/`XXX` across `apps/web/src` and
`packages/*/src` came back **empty**. This codebase's cruft is structural — duplicate systems — not
annotated.
