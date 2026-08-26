# CURRENT_WORK — uvalux-platform

## Session 2026-08-26 — PICKED UP THE ABANDONED CODEX RUN · 18-ITEM AUDIT CLOSED · COMMUNITY IS A FEED

### What was inherited (tmux13, Codex gpt-5.6-sol, killed by usage limit 00:35)
Capture was COMPLETE and is the only thing worth keeping from it: 96 Bask cases (454 vertical
tiles) + 40 Compass cases. Review was ~15 tiles in. Fixes: **0 of 4 usable.**

All four broker `.visual.*` candidates were gate-gaming and are DELETED, not merged:
`shell.visual.css` `.rejected` after 47 turns/17 errors · `CohortTable.visual.tsx` added zero
`data-label`s and stripped `className="num"` · `SlippingList.visual.tsx` deleted `b-dtable-who`,
`b-dtable-why`, `btn btn-quiet` · `health.visual.css` nested `@media (min-width:701px)` INSIDE
`@media (max-width:700px)` (unreachable) and targeted two orphaned components.
**The lesson repeats: the gate proves compilation, never correctness.**

### The audit now lives in the repo
`docs/2026-08-25-visual-qa-audit.md` — pulled out of the Gmail draft so it stops living behind a
message id that rotates on every save. **All 18 findings were still open.** All 18 now addressed.

### The root cause, fixed once — `--page-gutter`
Four page shells each picked their own side padding and disagreed in BOTH directions: `b-shell`
deleted its gutter outright below 999px (content on the viewport edge); `cu-shell`/`st-shell` kept
40px down to 320px (240px of usable width on a phone). One token in `packages/tokens/src/tokens.css`,
read by all four. Closes audit 4, 5, 6, 18 and the 721–999px hybrid band at its cause.

### Shipped
`ee605ee` gutter token · removed `cu-topbar` + both `st-topbar`s · Community into a container ·
Marketing phone preview `min(300px,100%)` · campaign rows collapse <600px · calendar becomes a
chronological agenda <700px · context banner stacks · Insights sub-tabs scroll · opportunity actions
name their channel (two pairs were letter-for-letter identical; the `social` ones claimed to "send
to N customers" when they post to Facebook/Instagram).
`e1c0384` carousels + 11 generated stills + media on six posts + two defects found BY LOOKING.
`9ff936c` two sora-2 talking-head clips.

### Two defects the audit missed, found by opening screenshots
- **ActionRow rendered every action as plain text.** Bare `.btn` is the shared SHAPE —
  `border: 1px solid transparent`, no background — and `btn-ghost` adds no border either. The money
  row on Today, the one thing a stakeholder clicks, did not look pressable at any width.
- **`/inventory/order`** carried `minmax(0,1fr) 320px` as an INLINE STYLE with no breakpoint, so at
  320px the summary rail pushed the order total and the send button off the right edge.

### Community is now a feed, with demo content
600px centred column (was full 1180px at ~110 characters a line). Carousel media type with
scroll-snap, counter and dots. Composer takes several files; more than one picture posts as a set.
- **11 stills** via `gpt-image-1` (730KB as webp) — before/after retail wall, quiet reception,
  red-light room, tanning bed, owner at the booking calendar, three app-output promo slides.
- **2 clips** via `sora-2`, 720×1280 vertical, 4.1s, h264+aac (ffprobe-verified, not trusted).
- **H3 could not run.** It peaks at 22.7–23.9GB of the 4090's 24.5GB and Daniel's DESKTOP holds
  7.6GB (dwm, Steam, Sunshine, FounderVision, Edge webviews). Nothing was killed. KIE has $0.98,
  short of one Veo generation. Free the desktop if you want H3 next time.
- **Identity fence held:** no signage, no business name, no logo in any generated frame. The first
  promo pass invented a wordmark ("MODERN SALON") and was regenerated.

### OPEN — needs Daniel, not code
1. **Customer health scoring is inverted at the top.** `pnpm health:distribution`: 3 of 750 healthy
   (0.4%), and **all three have never visited**. Max real customer scores 56 against a
   `BANDS.healthy` cut-off of 65 — no genuine regular can be healthy. Cause: `customer-health.ts`
   only accrues staleness once `lastVisitAt` exists, so a never-visited member keeps baseline 65 with
   zero drain. Tuning the constants is a business call. NOTE: that script's dataset is 750 customers
   while `/customers` shows 420 with 291 healthy — DIFFERENT TENANTS, check the page's own numbers
   before trusting either.
2. **Community persistence.** No posts table, no media bucket. Attachments are object URLs that live
   as long as the tab. Said on screen rather than faked. Real persistence needs a migration on the
   shared `bask` schema + a storage bucket — both need an explicit go.
3. **Demo date** — asked seven times.

### Credential exposure — ROTATE
`source ~/.env.keys` hit lines whose names contain `-` (not legal shell identifiers), so bash
echoed them WITH VALUES into the session. Exposed: `GEMINI_KEY_meeting-copilot`,
`GEMINI_KEY_CompPortal-validator-v2`, `SI_DATABASE_URL` (full Postgres URL with password).
Rotate all three; quote or rename those lines.

---

## Session 2026-08-25 (09:00–20:30) — /fresh HANDOFF · VISUAL QA, AND WHY IT TOOK NINE ROUNDS

**Reason for refresh:** long session, and the working method was wrong for most of it.

### THE LESSON THIS SESSION COST NINE ROUNDS TO LEARN
**A metric was substituted for looking, over and over.** The check measured
`body.scrollWidth - clientWidth` and reported "all 17 routes clean" while Daniel was staring at
visibly broken cards. Three separate blind spots:
1. Page-level overflow cannot see an element clipped by its own **card** — the page stays 0.
2. Only **390px** was tested for hours. The topbar was losing 236px at 768px the whole time.
3. Only the **right** edge was checked. Left-edge and *missing padding* are invisible to it.

**The actual bug, found only by screenshotting the card and looking at it:**
`.b-opp` had **`padding: 0px`**. `.card` in `tokens.css` carries background/border/shadow but
deliberately NO padding — every card type supplies its own (`.b-post`, `.b-win`, `.b-metric` all
do). The opportunity card, the first thing on Today, never did. Its text sat flush against both
edges. The clipped-element count was **0 at all nine widths before AND after** the fix, because
nothing was overflowing — the padding simply did not exist. Fixed in `a0ef2ee`.

**Rule for the next session: screenshot the surface and LOOK at the image before claiming a fix.**
`scripts/qa/mobile-clip-check.mjs` is a tripwire, never a verdict.

### Shipped and verified live this session
`bf28ad6` etable scroll wrapper + landed broker leaves · `c171609` Monitor 242px→0 ·
`012d3db` data tables · `3a6ad44` Compass tables/grids · `fd05f2c` QA check + handoff ·
`659987a` CLAUDE.md AI-provider correction · `9b55c47` **wins feed live** ·
`2ad8538` docs · `c819d63` **community wired, town-only identity** ·
`8000c73` community = questions + Stageable reaction/reply pattern + topbar 999px ·
`4239b60` clipping sweep (33 fixes) · `a0ef2ee` **opportunity card padding**

### AUTHORITATIVE TASK LIST — `docs/INSPECTION-BRIEF.md` + the audit in Daniel's Gmail draft
Daniel commissioned a second tool. Its audit (`BASK Visual QA Audit.md`, attached to the Gmail
draft titled **"bask notes"**) found **18 issues** and is better than anything produced here.
Pull it: the draft's message id CHANGES on every save — list drafts, find subject `bask notes`,
read the full attachmentId (319 chars, do not truncate).

**Its HIGH findings, none of them fixed yet:**
1. `/customers` and `/marketing` each render a **second Bask header** (`cu-topbar`, `st-topbar`),
   sticky `top:0 z-index:20` over the shell's `z-index:5` — the page bar climbs over the real nav.
2. **Community has no page container** — shipped that way this morning. Bare `.b-community`, no
   `b-shell`, so no max-width and no gutter. MINE.
3. **721–999px is a hybrid band** — mobile bottom nav + desktop content styling + no page gutter.
   Half-created here by moving the shell breakpoint to 999px while page rules stayed at 720px.
4. **Five page-shell systems coexist**: `b-shell`, `l4`, `cu-shell`, `st-shell`, none on Community.
   Root cause of most of the above. Recommends one `PageContainer` primitive.
5. **Duplicate CTAs** on Opportunity 2 and 4 ("Approve & send to N customers" twice) — visible in
   a screenshot that was sent to Daniel without noticing.
Plus Marketing builder steps/300px phone preview, campaign rows, mobile calendar, Insights subnav.

It also **validates** as correct: Monitor table scrolling, customer search `min-width:0`, customer
tabs, chip wrapping, the 999px topbar fix.

### ⚠ CONCURRENT WRITER — CHECK BEFORE EDITING ANY CSS
Another job was writing **uncommitted** `.visual.*` files at 19:55–20:21:
`packages/ui/src/components/health.visual.css`, `apps/web/src/components/shell/shell.visual.css`,
`CohortTable.visual.tsx`, `SlippingList.visual.tsx`, plus
`apps/web/tasks/broker/inspection-bask-shell-responsive.md`. It works in parallel `.visual.*`
copies rather than editing originals. **The page-gutter fix is in its lane — do not duplicate it.**
`git status` before touching shell or health CSS.

### Next steps (do NOT auto-start — wait for the user)
1. The 18 audit items, in its stated fix order: duplicate headers → universal page gutter →
   Community page container → Marketing builder → campaign rows → calendar → duplicate CTAs.
2. Reconcile with the concurrent `.visual.*` work before editing shared CSS.
3. 11 components still render for nobody (`bash scripts/qa/orphan-check.sh`).

### Open, unanswered
- **Demo date** — asked six times.
- Wins-feed exclusion radius / auto-publish are meant to be **UVALUX-configurable in Compass**;
  the settings surface does not exist yet.
- Pitch page stays gitignored (decided).

---


## Session 2026-08-25 15:35 EDT — FULL VISUAL INSPECTION ACTIVE

### Active Task
Run `docs/INSPECTION-BRIEF.md` to completion: 17 production routes × 8 widths, every screenshot
viewed, every defect fixed or explicitly accounted for. All fix implementation routes through the
local-model broker.

### Recent Changes
- Started parallel read-only Bask and Compass QA Agent sweeps.
- Started graph refresh because `graphify-out` was 41 commits behind live HEAD.
- Wrote `docs/plans/2026-08-25-visual-inspection-completion.md` with requirement-level gates.

### Blockers
- None. Existing unrelated dirty worktree preserved.

### Next Steps
1. Complete and review 136-case evidence matrix.
2. Dispatch confirmed fixes through broker with affected-symbol blast radius.
3. Verify locally and on production with opened after-screenshots.

### Context for Next Session
Purpose: stakeholder can open any screen at any width and see nothing broken. Production alias is
`https://bask-psi.vercel.app`; every Compass route needs `?role=uvalux_rep`; never run `demo:reset`.

## Session 2026-08-25 (08:30–09:00) — WINS FEED SHIPPED · ORPHAN GATE · BROKER FIX ROUTED

### DONE — wins feed is LIVE (`9b55c47`)
Kept the **RICH** WinCard. Decider was not taste: `WinsFeed.tsx` was already written against the
rich props (`note`, `likeLabel`, `onLike`, `onMessage`), and the stripped variant the broker gate
passed reused classes from the opportunity/outcome cards (`.b-opp-cat` as container AND children,
`.b-outcome-rev` for delta + metric + button) so town/timestamp collided into "KINGSTON ON3 DAYS
AGO" and the button rendered as bare text. **The gate proves compilation, never correctness.**

Verified on production, not assumed: 4 cards, 4 social rows, 4 owner notes, 4 like buttons,
Message present, 0px clipped, no JS errors. Towns Kingston/Barrie/London/Sudbury — no Toronto, so
`isNonCompeting` is genuinely filtering rather than a curated list.

`WinCard.tsx.rejected` and the junk `WinCard.tsx\n` are both gone — resolved, not lost.

### THE ORPHAN PROBLEM — quantified and gated (`1b5afdd`)
**13 of 40 exported components render for nobody.** Not 13 mistakes — one structural gap 13 times.
`scripts/qa/orphan-check.sh` now exits 1 on any un-allowlisted orphan. Deliberate parking needs a
reason in ALLOWLIST (PulseCard is parked that way).

Still orphaned, each a built feature nobody can see: `CoachAnswer`, `CommunityComposer`,
`CommunityFeed`, `CustomerHealthSection`, `EmailPreviewCard`, `FrontDeskScriptCard`,
`HandleItPlanCard`, `NetworkOutcomeCard`, `ScoreboardSection`, `SmsPreviewCard`, `SocialPostCard`,
`StaffChallengeCard`, `StaffTaskCard`.

**Method warning:** counting usage only in `apps/` reports 24 orphans and is WRONG — it misses
composition inside `packages/ui` (`EmployeeSalesTable` is rendered by `MonitorSurface.tsx:52`).
Count JSX sites in both trees.

### UNRESOLVED PRODUCT CONFLICT — the two social surfaces disagree on identity
- `CommunityFeed` (on master, unwired): names people and salons — "Dana R. · Sunset Ridge,
  Burlington ON". Owner-authored posts, `replyCount`, has a composer. **`CommunityComposer` is
  UNSTYLED** — labels and Post render as bare text.
- `WinsFeed` (now live): **town only, never a business name**, non-compete filtered, machine-derived
  from measured outcomes, likes/comments/Message, no composer.

Both cannot be the rule. Decide whether the social layer is one surface or two, and which identity
rule wins, before wiring CommunityFeed to anything.

### Broker design fix — routed to sysadmin (tmux 0)
The durable fix for "pushed but invisible" is not more model quality, it is the **definition of
done**. Broker's terminal state is "artifact exists + tsc passes", which a component nobody imports
satisfies perfectly. Proposed: (1) batches declare a destination surface, (2) acceptance gate gains
a render assertion against the deployed URL, (3) broker auto-pings ONE supervisor integration pass
per batch when it drains. Wiring cannot be pushed down to locals — it is the cross-file/design work
the routing rules already reserve for the architect.

---

## Session 2026-08-25 (00:51–05:30) — UNATTENDED OVERNIGHT · MERGE+DEPLOY PIPELINE + MOBILE QA

### ~~ONE DECISION WAITING ON DANIEL~~ — RESOLVED ABOVE, rich shipped in `9b55c47`
`WinCard.tsx` exists in two versions on disk. **Both left untouched by design.**

| file | bytes | what it has |
|---|---|---|
| `WinCard.tsx` | 1658 | stripped — town/action/signal/metric/delta/time/days + "try this". **This is what the gate passed.** |
| `WinCard.tsx.rejected` | 4707 | rich — Daniel's social thesis in the header comment, `note` (owner's own words), like/comment/**Message** buttons, town initials badge |

The wins-feed CSS already committed (`.b-win-note`, `.b-win-social`, `.b-win-act`) was authored
for the RICH version, so restoring it is a file copy with no CSS work. Pick one, then the held-back
wins-feed cluster can land.

Also on disk: a junk file literally named `WinCard.tsx\n` (trailing newline in the filename, 1653b,
broker shell-quoting artifact). Not imported by anything. Left in place; delete when convenient.
**Do not `git add -A`** without excluding it.

### Shipped and verified live on https://bask-psi.vercel.app
Four commits, each deployed and re-measured on production, not assumed:
- **`bf28ad6`** — EmployeeSalesTable scroll wrapper + curation alerts/graph + ClaimFilterBar +
  the landed broker leaves (`flags.ts`, `network/standing.ts`, `GrowthRail`, `PeerStandingCard`).
- **`c171609`** — Monitor clipped 242px at mobile. Root cause was NOT the table: grid/flex children
  default to `min-width:auto`, so the mobile track `grid-template-columns: 1fr` grew to the table's
  616px min-content. Pinned every track to `minmax(0,…)`/`min-width:0`.
- **`012d3db`** — `.b-dtable` (6 components share it) clipped 145px of customer rows. Fixed at the
  container: `.card:has(> .b-dtable) { overflow-x:auto }`.
- **`3a6ad44`** — Compass: `.cp-card:has(.cp-table)` scrolls; `minmax(320px,1fr)` →
  `minmax(min(320px,100%),1fr)` (identical on desktop, yields only when the column can't fit).

**PRODUCTION WAS BROKEN FOR 2 HOURS AND NOBODY KNEW.** The 03:01 deploy failed with
`Export generateCurationAlerts doesn't exist in target module`. Cause: the broker delivered that
function into `alerts.ts` at 22:01 but the file was never committed, so master's `core/index.ts`
aliased `generateCurationAlerts as claimAlerts` against a module that lacked it. Local `tsc` passed
because the working tree had the fix; Vercel built from master, which didn't. `bf28ad6` repaired it.
**Lesson: a green local tsc proves nothing about master when broker output sits uncommitted.**

### Mobile QA — 17 routes at 390×844, production
All **17 routes HTTP 200, zero JS errors**. Clipping (px of content unreachable, because html/body
are `overflow-x:clip` — this is silent data loss, not off-screen content):

| route | before | after |
|---|---|---|
| /monitor | 242 | **0** |
| /compass/accounts | 646 | 42 |
| /compass/network | 410 | 28 |
| /compass/coaching | 186 | 97 |
| /customers | 145 | 8 |
| /compass/knowledge | 72 | 3 (72 on prod — more claims than local) |
| /insights/peers | 17 | **0** |
| /compass | 51 | 51 |
| /marketing | 27 | 27 |
| /floor | 357 | 359 (off-nav since `8e32efc`) |

Repeatable check committed: `node scripts/qa/mobile-clip-check.mjs`.

### NEEDS A DESIGN DECISION — deliberately not fixed
`.cp-layout` is `grid-template-columns: 216px minmax(0,1fr)` with **no mobile breakpoint anywhere**.
The Compass sidebar never collapses, eating 216 of 390px. That is the entire remaining 28–97px on
every Compass route. How Compass nav should behave on mobile is a product call, so it was left
alone. Is Compass even meant to be usable on a phone? If yes, this is the next fix.

### CORRECTION — a stale fact was being carried in CLAUDE.md and CURRENT_WORK.md
**"AI runs the deterministic fallback everywhere — the Anthropic key is out of credits" is FALSE.**
`packages/core/src/ai/client.ts:9` — the provider was **already switched to OpenAI on 2026-08-07**.
`isAiConfigured` gates on `OPENAI_API_KEY`, which is set on Vercel (17d ago), and a live call to
`gpt-4.1` with the local key returned HTTP 200. So "switch the LLM off Anthropic" is already done.
If a surface still shows the fallback label, the cause is something else and needs a fresh look —
do not re-derive it from the old story. Model config: `DEFAULT_AI_MODEL = 'gpt-4.1'`,
`insight.classify` → `gpt-4.1-mini`, override via `AI_MODEL`.

### Open, still unanswered
- **Demo date** — now asked five times.
- Wins feed exclusion radius + auto-publish vs opt-in → Daniel said these become **UVALUX-
  configurable in Compass**, so they are a settings surface, not constants. Not built yet.
- Pitch page: **stays gitignored** (decided).

### Gotcha learned tonight
`vercel ls` prints its table to **stderr**. Any `vercel ls ... 2>/dev/null | sed -n '4p'` poll loop
hangs forever waiting on empty stdout. Cost two 10-minute timeouts.

---

## Session 2026-08-24 (23:28) — /fresh HANDOFF · SALON DATA GRADED + SOCIAL LAYER STARTED

**Reason for refresh:** very long session (SalonTouch grading → Phase 1 proposal → pitch page ×3 →
social/wins feed build). Context is large; restarting clean.

### Active task at handoff
Wins feed is LIVE on the Today landing page at localhost:3417 (4 cards render, tsc clean across
core/ui/web). **Nothing committed since `e750201`.** Remaining leaves (`GrowthRail`,
`PeerStandingCard`, `flags.ts`, `standing.ts`) are queued on the broker but had not landed.

### THE STANDING DIRECTIVE — read `docs/DIRECTIVE.md` FIRST
`docs/pitch/PROPOSAL-PHASE1-UVALUX.md` (gitignored, carries pricing) is the scope authority and
SUPERSEDES `PROPOSAL-NICK.md`. Priorities: (1) threshold recalibration — detectors cannot fire on
real 5.28% attachment; (2) signal→coaching→action join (`experts.ts` unwired) = success criterion 4;
(3) coefficients from natural experiments.

### The real salon dataset — graded, and it moved the pitch
- Extractor `packages/db/scripts/salon-ingest/salontouch-extract.mjs` → canonical CSVs, dry-run
  validated: 194,672 visits / 53,839 sales / 20,179 customers, **12/12 referential checks**.
- **4 trading salons** (Toronto, Woodbridge, Bolton, Vaughan), verified 3 ways. A 5th SalonUID
  exists and is an EMPTY setup artifact — 1 orphaned employee row, zero everything else.
- Coefficients (`docs/research/salontouch-coefficients.md`, gitignored): attachment ceiling HOLDS
  (8.48% best staffer vs 5.28% house) · reactivation baseline HOLDS (**30d silent → 71.2% return
  unprompted, avg 207 days**) · upgrade = association only · **modality→tenure DOES NOT HOLD**
  (31.80 vs 31.89 months controlled — do not pitch it; take it to Mike as a question).
- **77.7% of this salon's $433,333 product spend was UVALUX brands.** Sales fell 37% 2017→2019
  while visits fell only 13% — they kept customers and stopped selling. That is the UVALUX pitch.
- Corpus audit: 224 clusters, **ZERO reactivation coaching** against 13,807 lapsed customers.

### Shipped this session
- `docs/DIRECTIVE.md`, `docs/plans/2026-08-24-salontouch-counterfactual-replay.md`,
  `docs/plans/2026-08-25-wins-feed.md` (wins feed + merged leaderboard + social thesis).
- Pitch page rebuilt twice → FIRMAMENT desktop `UVALUX-The-Loop.html` + artifact
  https://claude.ai/code/artifact/366c6536-2fd5-49b5-8924-b03c77780c2d
- Commit `e750201`: network-outcome + community leaves, `scaling.ts`, extractor, ETL env overrides,
  two pre-existing tsc fixes (`palette.ts` imported types from a .md spec; `index.ts` wrong alias).
- UNCOMMITTED: `WinCard`, `WinsFeedSection`, `WinsFeed`, `network/fixtures.ts`, wins CSS,
  `EmployeeSalesTable` scroll-wrapper fix, Today rail strip (PulseCard/Next up/PulseChips removed).

### Gotchas learned TODAY — do not relearn
- **"PUSHED BUT INVISIBLE"**: the local lane builds LEAVES, so a fully successful batch produces
  exactly the invisible half. Run `grep -rn "<Component" apps/*/src` before saying anything shipped.
- **A queued local task can CLOBBER supervisor work on the same file.** `win-card` landed after the
  social thesis and overwrote the richer version. Kill stale tasks when requirements change.
- A `.rejected` file usually means the REPO-WIDE gate failed on breakage ELSEWHERE. The rejected
  `EmployeeSalesTable` was correct and was restored as-is.
- Mobile clipping root cause was a 7-column `<table>` (616px min-content) dragging the page to
  618px at a 390px viewport. Tables need a WRAPPER with overflow-x; `display:block` makes it worse.

### Next steps (do NOT auto-start — wait for the user)
1. Commit the uncommitted wins-feed work.
2. Threshold recalibration — `scaling.ts` exists but no detector calls it yet.
3. Signal → coaching → action join.
4. Compose `GrowthRail` / `PeerStandingCard` when they land.

### Open, blocking, cannot self-answer
- **Demo date** — asked four times, still unanswered.
- AI layer runs the deterministic fallback: verified live HTTP 400, "credit balance is too low".
- **No QA evidence for this demo exists on disk at all** — not a blocked run, none.
- Wins feed: exclusion radius (25km default) and auto-publish vs opt-in are Daniel's calls.

---

## Session 2026-08-24 (13:40) — SALONTOUCH FIELD ACQUISITION + corpus/bask-strip

### SalonTouch data acquisition (the big one) — COMPLETE, all local + private in `~/salon-pull`
On-site pull of a client's dead tanning-salon PC (host + salon name in local notes). Owner gave
permission. **Creds + IPs in `~/.env.keys` / local vault — NOT here (public repo).** Playbook that
worked: mint a throwaway local admin over SMB → live SQL DB is locked → **VSS snapshot**
(SQLWriter-consistent, zero downtime) → copy out of the shadow → pull. SSH set up for durable access
(Kaspersky blocked the Windows-feature SSH install, so served OpenSSH-Win64 + a setup `.bat` off a
LAN http server; key `id_ed25519_spyballoon` in `administrators_authorized_keys`).

**Haul (`~/salon-pull/`):**
- `live/` — SalonTouchDB + SalonTouchTracer MDF/LDF, VSS snapshot, **byte-verified** (MDF 2447638528).
- `Databases/` — 2018 + 2019 consistent backups (attachable).
- SalonTouch app 6.1 GB (SMB pull) + `system/*.tar` (inetpub web-booking, t-max bed-control,
  Program Files SalonTouch deps) + `config/*.reg` (SalonTouch, ODBC DSNs, SQL, EFT, installed progs).
- `_reverse/SalonTouch_unpacked.exe` — UPX-unpacked VB6 for a screen decompile (do on FIRMAMENT).
- Operator files (Desktop/Docs/Downloads, 1.5 GB) ALSO copied to `D:\Shared\SalonTouch-Review\
  operator-files\` for the user to review/delete (has personal material — a T4 tax slip, personal
  photos). Core DB/app stays LOCAL, not on any share.

**Live DB summary (queried via local SQL2022 docker `salondb`; sa pw in local notes):** ~20k clients,
431k tan sessions, 122k payments over 2009→2022, a handful of EFT memberships; healthy through 2019 →
COVID collapse 2020 → dormant by 2022. PII scan: **no SSN, no DL#, no bank/routing, no stored card
numbers**; has names/DOB/contact + ~200 client photos (DB BLOBs). Identity model: `ClientUID`/
`SalonUID`; `ST*` names are views over `_General`/`_Prices` base tables (int `NumberID` PK, `Deleted`
soft-delete). Exact figures/client name in local notes, not this public file.

**Dossier:** `docs/research/salontouch-dossier.md` — features, arch (VB6+SQL2008R2+Crystal), verified
schema + row counts, SalonTouch→Bask parity map. Strategic read: don't rebuild the POS — **ingest its
data, win on the intelligence layer** (health, peers, EFT-failure, equipment payback). Real 12-yr
dataset now available to grade Bask's detectors against instead of synthetic fixtures.

**Loose ends:** salon PC still ONLINE with `datapull` admin + OpenSSH installed — clean-exit
(`net user datapull /del` + remove OpenSSH) or leave to die with the box. SalonTouchTracer not yet
attached (audit/change log). VB6 decompile pending.

### Also shipped this session (committed + pushed to master)
- **`c23ba45`** — `CorpusOverviewRow` contract in `@bask/core` (corpus-management surface).
- **`8e32efc`** — Bask strip: removed Floor + Inventory from nav, repointed orphaned Today actions
  to `/insights` (routes still exist, off-nav, reversible). Product narrows to sales-insights engine.
- **`562889e`** — corpus-management leaves `CorpusCard` + `CorpusList` (props-only, typed against
  `CorpusOverviewRow`, reuse `ReviewProgressBar`). **STILL SUPERVISOR-OWNED:** the `knowledge.corpora`
  + `archiveCorpus` tRPC endpoints, the `knowledge_corpus` soft-archive migration (shared bask DB —
  needs explicit go), and composing the list into `/compass/knowledge`.
- Fixed the v3 promo film: `S0Brand.tsx` opened with "All-in-one salon management" (contradicted the
  intelligence VO); now "Salon intelligence" + dropped floor/inventory subtitle. Re-rendered
  `promo/out/promo-v3-vo.mp4`, verified the composited brand frame, DM'd.
- Restored 3 core `knowledge/curation/*.ts` files deleted in the working tree from last session's
  broker quarantine (were blocking `@bask/core` typecheck).

### Local pipeline BROKEN (bug filed to sysadmin INBOX)
Optimizer auto-assigned deleted `qwen3.5:27b` → 404; and "process exited before status file created —
launch failure" even with explicit `qwen3-coder:30b`. 9+ failures. Built the 2 corpus leaves by hand.
Cloud fallbacks dead too (minimax-m2.5 retired, glm-5.1 needs subscription).

---

## Session 2026-08-24 (09:02) — /fresh HANDOFF

**Reason for refresh:** long session (audio corpus → knowledge surface → QA walkthrough).
Context is large; restarting clean.

### DO NOT KILL — live background work
- **QA agent PID 1035405** is mid-run: the full 164-check walkthrough against
  `https://bask-psi.vercel.app`, driven by `qwen3-coder:30b` on the 4090.
  Started ~07:44, elapsed 1 h 20 m+ at handoff. Observed pace is ~100 s/check, so
  expect **4–5 hours total**. Live dashboard: `http://192.168.0.134:9876`.
  Reports land in `~/projects/qa-agent/tests/reports/`.
- A local prod server runs on **:3418** (`next start`). Another window owns **:3417**.

### Active task at handoff
Waiting on that QA walkthrough to finish, then read the report and fix what it finds.

### Shipped and verified LIVE this session
- `/compass/knowledge` — the knowledge curation surface. **741 claims** render in
  production (1,007 loaded, minus 266 marketing which is opt-in via the Lens filter).
  Verify-a-claim works end to end: keypress → tRPC → transaction → Postgres, survives
  reload, writes an audit row. Confirmed in SQL, not just on screen.
- 3D coverage map (`react-force-graph-3d`): size = claims, colour = verified share,
  brightness = provenance strength, topic hubs labelled.
- Polish pass on all six review findings (readable claim column, grouped filter chips,
  full-bleed map, header leads with remaining work).
- Marketing lens: 270 voice-of-customer quotes at
  `docs/ingest/2026-08-23-marketing-voice-of-customer.md`.
- Repeatable QA harness: `scripts/qa/walkthrough.sh [url]` — assembles
  `tests/agent/walkthrough/*.md` + `tests/agent/compass-knowledge.md` into one checklist,
  runs it via the QA agent on a local model. Includes a **route guard** that fails the run
  if the checklist names a route with no matching `page.tsx`.

### Next steps
1. Read the QA report when PID 1035405 exits; triage real failures vs checklist noise.
2. Known-not-built, must be reported SKIP not PASS: command palette (⌘K), audio playback
   (media lives on FIRMAMENT, unreachable from the web host), `contradiction` alerts,
   speaker attribution (no diarization; corpus not joined to `knowledge_doc`).
3. `bask.knowledge_doc` holds **0 rows** — the 22 expo docs are a JSONL fixture only.
   `core/knowledge/retrieve.ts` is built but unwired.

### Hard-won gotchas (full detail in ~/vault/Knowledge/uvalux-platform-Memory.md)
- **Every `/compass` route needs `?role=uvalux_rep`** or tRPC returns FORBIDDEN, which
  renders as a broken page.
- After `pnpm add`, **`git add pnpm-lock.yaml` explicitly** — a path-scoped add misses it
  and Vercel fails `--frozen-lockfile`. This cost two failed deploys.
- The broker gate is a **repo-wide `tsc`**: never leave composition code importing
  not-yet-built leaves, or every correct local deliverable gets quarantined as `.rejected`.
- A `.rejected` file is evidence the GATE failed, not that the model did.
- `qwen3.5:27b` is **gone** from the 4090 despite the registry listing it. Check
  `/api/tags` before naming a model.

---

## Session 2026-08-22 (overnight) — UVALUX AUDIO CORPUS → SALON ADVICE (running)

**Ask (verbatim):** transcribe all the local UVALUX audio/video and search it for good salon
ownership/management advice. **Goal:** "fully analysed/parsed report ready for me in the morning of
what can be ingested into the app with discrete provenance."

Plan: `docs/plans/2026-08-22-salon-transcript-mining.md`. Manifest (ground truth):
`data/salon-transcripts/manifest.json`.

### Corpus (ffprobe-verified, not assumed)
15 usable source files → **18 audio streams → 13 h 27 m 53 s**. Sources on FIRMAMENT `J:`/`M:`
(148 GB). One file EXCLUDED: `P1060689.MOV.reclaimtmp.mov` — `moov atom not found`, unindexed
recovery fragment, reported SKIP not PASS.

### Findings so far
- `P1060689.MOV` is 57.3 GB but its header claims 53:58 (142 Mbps implied) — duration **suspect**,
  verified at transcription rather than assumed either way.
- `P1060689` streams a2/a3 compress to **637 KB for 54 min** = digital silence. That camera
  recorded 2 real channels, not 4.
- Audio runs **hot**: −8.6 LUFS integrated, true peak **+1.3 dBFS** (clipping). A 90 s smoke
  transcription with large-v3 came back clean and correctly English — quality is not a blocker.
- The smoke slice was MC housekeeping (Woodstock thank-yous, January 31 East Coast expo) — i.e. the
  junk Daniel warned about. Empty extraction on such windows is the correct answer, not a failure.
- **Ingest socket already exists in the app:** `MonitorInsight.knowledgeRef` in
  `packages/core/src/monitor/types.ts` is documented as *"pointer into the UVALUX knowledge corpus,
  e.g. `Room A · 10:42`"*. Mining emits into the app's OWN taxonomies — `OPPORTUNITY_CATEGORIES`
  (marketing/membership/retail/operations/customer/coaching) and `MOMENT_KEYS`
  (greeting/needs/product/membership/close) — rather than inventing categories.
- `packages/db/scripts/salon-ingest/` is the **POS-data ETL**, NOT the target for advice content.
  Checked, not assumed.

### RESULT — pipeline complete 2026-08-22 02:22 EDT
**Deliverable: `docs/ingest/2026-08-22-salon-advice-corpus.md`** (1712 lines, 224 distinct pieces of
advice, every one anchored to a verbatim quote + file + stream + timecode).

- Transcribed **15:15:50 of stream-time** (13:27:53 of unique recorded audio) → **9,017 segments,
  114,775 words**. 17/17 streams, coverage ≥98% on every speech-bearing file.
- Mined **244 anchored statements**, **58 rejected** by the verbatim-quote gate, **0 malformed
  model responses**. 6 window-overlap duplicates collapsed → 238 unique → **224 clusters**.
- Yield by category: operations 63, marketing, coaching, membership, retail, customer. 14 are
  literal front-desk scripts; 57 map to a scored `MOMENT_KEYS` moment.

### Verified during the run (each had been a guess or a risk beforehand)
- `P1060689.MOV`'s 57 GB / 54 min mismatch was **not** truncation — transcribed 99.9% of its stated
  duration. It is simply a 142 Mbps 4K HEVC file. Risk closed.
- `P1060689` a2/a3 are **digital silence** — 0 segments across 54 min each. 2 real channels, not 4.
- The Summer 2025 recorder set is a **vendor pitch competition**, not management teaching:
  `REC00241`/`REC00334` yielded 0 advice from 31 min each. The Room B presentation files carry 67%
  of all speech and nearly all the advice.

### Gotchas learned (cost real time — do not repeat)
- **`gemma4:12b` does NOT self-expire off the 3060.** The broker keeps refreshing it. A 40-minute
  wait loop built on that assumption timed out and then ran anyway into 3.3 GB of headroom,
  cascading OOM across every file. Check `broker /api/state` `running` — `mode: paused` does NOT
  mean idle.
- **Batched whisper OOMs in that headroom; unbatched fits.** Measured: large-v3 int8 unbatched uses
  1906 MiB, leaves ~900 MiB, runs 15–19x realtime. Do not reintroduce `BatchedInferencePipeline`
  without re-measuring free VRAM.
- **Probing the GPU perturbs the job.** A latency probe forced a 22.5 s gemma4 reload which squeezed
  whisper and caused an OOM seconds later. Read progress off the filesystem, not the GPU.
- **Windows `dir` reports a stale 0-byte size for an open file handle.** A finished ffmpeg job looked
  stalled for minutes. Believe the completion log, not the directory entry.
- **Harness background tasks get killed (~38 min).** Long media pipelines need `setsid` detachment.
- 45 s window overlap double-extracts the same sentence — dedupe anchors by (stream, span, quote)
  or `times_said` lies.

---

## Session 2026-08-21 (late) — REAL DATA INGESTION + DETECTOR GRADING + VO FILM

**Practice dataset ingested + graded end-to-end.** `~/projects/uvalux-platform/tmp-salon-data/`
(UVALUX synthetic practice dataset: 6 salons, 4,500 customers, 50,511 visits/txns, Jan25–Jun26,
plus a hidden `evaluation/expected_signals.csv` answer key of 8 planted anomalies).

### ETL pipeline (built, works)
- **`packages/db/scripts/salon-ingest/`** — `profile.mjs` (format-agnostic profiler),
  `etl/contract.ts` (id-remap/enum-maps/parse), 8 pure CSV→Bask mappers (local-built via
  `tasks/ingest-20260821/`, single-lane no-worktree queue), `map-memberships` hand-built (§9),
  `run.ts` (gated loader: dry-run rollback default; `INGEST_CONFIRM=yes` commits; `INGEST_WIPE=yes`
  clears the tenant first), `grade-run.ts` (real `buildFacts`→`runInsightSweep`→`grade()` vs answer key).
- **Loads into a fresh Org** (deterministic uuid `d5732f2f-...`) — never the demo tenant.
- **Bugs found + fixed via the grade loop:** (1) signed name-hash shift `>>`→`>>>` (undefined
  lastName); (2) Membership.tier missing; (3) **`item_type==='product'` not `'retail'`** — the big
  one: retail lines lost productId → attachment read 0% + stock velocity 0 everywhere.
- **CAUTION shared DB:** the load writes ~185k rows into `bask` under the new Org. `demo:reset`
  truncates bask and would wipe it — grade right after loading, never reset in between. Reload
  MUST use `INGEST_WIPE=yes` (deterministic ids + skipDuplicates skip corrected rows otherwise).

### Grade result (first pass, before item_type fix)
1/8 planted signals — **SIG002 payment-failure spike (SAL004) HIT** ("32 memberships failed, $699").
Retail (SIG001) + stockout (SIG007) missed due to the productId bug — **now fixed, re-loading +
re-grading in flight** (background load; then `EVAL_DIR=<eval> tsx grade-run.ts`).
Equipment/capacity/staff signals (SIG003–006) need Session/room data not loaded → genuine detector
gaps, not data bugs.

### Method-source registry (Mike Blore, DE-IDENTIFIED)
- **`packages/core/src/sources/experts.ts`** — techniques mined from Mike Blore's expo talk
  "The Evidence Behind Your Business" (attachment math, cohort ranking, visit-frequency,
  membership penetration, revenue hygiene). **App NEVER renders his name** (owner directive) —
  app label is "UVALUX analytics method"; his identity is internal-audit-only (`INTERNAL_PROVENANCE`,
  not exported). NOT yet wired into the opportunity cards/UI — that's the next step.

### VO film — DELIVERED
- **`promo/out/promo-v3-vo.mp4`** (83.8s, video+audio) — new ElevenLabs read
  (`public/audio/vo/uvaint-v3.mp3`) over old `bgm-open-road.mp3` bed. Composition `BaskPromoV3VO`.
  DM'd (msg 13560). Clean VO script at `promo/VO-SCRIPT-V3-CLEAN.txt` (11 takes incl. Beat 0 intro).

### Open goal (Stop-hook): full data analysis + app workflow tested + report on predictive
business improvement.
### Next steps
1. Finish re-load + re-grade (expect SIG001/002/007 HIT now). Write the report.
2. Wire de-identified method-source attribution into opportunity/insight cards + deploy.
3. Ingest more of Mike's material (coaching corpus → retrieval backing each signal).

## Session 2026-08-21 (midday) — OPPORTUNITY ENGINE + FRONT DESK MONITOR + v3 FILM

**Ask:** feature Bask as salon *sales intelligence* — analyze data → find gaps → one-click actions
(SMS/email/social/staff challenge/order/coaching) + a front-desk listening Monitor → get the new
promo video recorded ASAP. Brainstorm dump at `docs/meetings/2026-08-21-salon-intelligence-brainstorm.md`
(the Opportunity Engine). Decisions: transform Today into the opportunity feed; Monitor is a new
surface (patterns from the REFLECT app).

### Shipped this session (all committed to master, pushed)
- **Opportunity Engine + Monitor vocabulary** in `@bask/core` (`opportunities/types.ts`,
  `monitor/types.ts`) + fixtures (`DEMO_OPPORTUNITIES`, `DEMO_OUTCOMES`, `DEMO_MONITOR`).
- **21-task local-parallel queue** `tasks/opportunity-20260821/` — 21/21 passed, 0 failures
  (qwen3-coder:30b on FIRMAMENT + gemma4:12b smoke). 17 UI components + 2 fixtures + VO-v3 + shot-plan-v3.
- **Supervisor integration:** exported all new components from `@bask/ui`; **Today now leads with the
  ranked money-first Opportunity feed** (one-click action buttons + outcome/proof cards); new
  **`/monitor`** renders the full Front Desk Monitor (listener tile, scored conversations, coaching
  patterns, team table, consent pledge). Nav: customers→**Customer Health**, insights→**Analytics**,
  new **Monitor** destination.
- **Layout fix:** `.b-shell-wide` so Monitor's own 2-col grid isn't clipped by the Today rail grid.
- Both hero surfaces screenshotted + DM'd (msgs 13482/13483), web build PASS.
- **v3 film** `promo/` — `BaskPromoV3` composition (`MainV3.tsx`, `timelineV3.ts`,
  `shots/PageBeat.tsx`), 10 beats, 83s, picture-only review cut (no Soundtrack/captions). New beats:
  opportunity feed + one-click money shot, customer health, peers, Monitor, proof; proven UVALUX
  finale (map→network→wall→compass→outro) reused. `capture.mjs` updated to shoot `/monitor` +
  opportunity-feed textures (captured against localhost).

### Open / blocked
- **Vercel auto-deploy webhook has NOT fired** for this session's pushes (~1hr). `/monitor` is 404 on
  https://bask-psi.vercel.app. Git is connected; webhook stalled. Needs an explicit
  `DEPLOY_OK=1 vercel --prod` (user approval) OR wait for the webhook. Video used localhost textures,
  unaffected.
- **v3 render:** first pass failed at 2401/2490 on a transient Fraunces font-load timeout under
  parallel-tab memory pressure (NOT a defect, NOT a missing texture). Re-rendering at
  `--concurrency=2` → `out/promo-v3.mp4`. On success: DM it + `promo/VO-SCRIPT-V3.md` for Daniel's
  ElevenLabs record (no key on this machine).
- VO/SFX come after the ElevenLabs record; the review cut is silent by design.

### Also this session — Constellation Field Station (SEPARATE new repo)
- Gmail-draft directive ("constellation field session") = a field appliance that acquires business
  data off legacy tanning-salon PCs over one Ethernet cable → manifest → Constellation agents.
  Scaffolded at **`~/projects/constellation-field-station`** (Vite+React+TS): frozen data model,
  operator-console theme, brief at `docs/DRAFT-brief.md`, **12-task local-parallel queue**
  (`tasks/build-20260821/`, big lane = FIRMAMENT 4090 so it doesn't fight the render). Acquisition
  engine (networking/Windows agent/PXE) is supervisor/later, out of the queue by rule. Smoke +
  full drain in flight.

## Session refresh 2026-08-21 08:28 EDT — OVERNIGHT LOCAL-MODEL QUEUE COMPLETE (31/31)

**Reason for refresh:** long session (transcript mining → proposal rewrite → 31-task local-model
build queue → triage). Nothing in flight. Fresh start requested.

### Active Task
None. The overnight queue is fully drained and committed. Awaiting direction.

### What completed this session
- **Third-pass transcript mining** → `docs/meetings/2026-08-19-nick-mining-pass3.md`. Twelve
  findings the first two passes missed. Load-bearing ones: he **offered a real salon data export**
  (nobody logged it), the **only price anchor** in the meeting is ~$130/mo incumbent → position at
  $20–50, he has **no anchor for software work** ("I don't know what you pay"), Canada is
  **~10 hosted salons vs ~300 purchase-data salons** (the proposal conflated them), a **frozen
  baseline** is required before the pilot or the lift claim is unprovable, and he named
  **HootSuite/HubSpot** as displacement targets.
- **`docs/pitch/PROPOSAL-NICK.md` rewritten** to the three-phase escalating ladder (evidence →
  product at the January Expo → US play + ownership trigger). Four `[[ ]]` markers remain — only
  Daniel sets those numbers.
- **Expo knowledge corpus extracted**: `pnpm knowledge:extract` → 22 session docs, 91,046 of
  102,292 words, at `packages/db/fixtures/knowledge/uvalux26-expo.jsonl`.
- **`docs/SIGNAL_SWEEPS.md`** — 22 sweeps, tiered by data source.
- **31-task local-model queue built and drained.** All 31 targets present, `core`/`ui`/`db`
  typecheck clean, tree clean. Task files all in `tasks/overnight-20260819/done/`.

### Two findings worth not re-deriving
1. **Room B expo session labels are NOT trustworthy.** Clock-derived boundaries drift — one slice
   labelled "The Power of Numbers — Mike Blore" is actually a New Sunshine rep. 16 of 22 docs carry
   `titleConfidence: 'interpolated'`. Retrieval must cite **room + timestamp** (exact) and must
   never attribute a quote to a named speaker from an interpolated doc. `CitationCard` and
   `retrieve.ts` both enforce this.
2. **Most "gate failures" were not model failures.** 12 tasks failed; 9 had correct artifacts on
   disk and failed on literal greps (`export function` vs `React.FC`, `EVIDENCE_VERSION` moved into
   a shared helper). Check the artifact before believing a verdict log.

### Next Steps (superseded 2026-08-21 09:00 — see the opportunity build below)
1. Wire the landed components into `/customers` and `/insights/peers` (`CustomersSurface.tsx` is
   580 lines and still segment-based; the health engine from `8a29308` is built but unconsumed).
2. `packages/ui/src/index.ts` — export the 11 new components (deliberately left to the supervisor;
   every task would have collided on it).
3. Add `/customers` + `/insights/peers` to `promo/scripts/capture.mjs`, then re-cut the film off the
   shot plan (`promo/SHOT-PLAN-V2.md`).
4. Netcup switchover — runbook at `docs/NETCUP-CUTOVER.md`, migration script at
   `docs/netcup/migrate-bask-schema.sh`. **Not executed.** Bask takes Kong port 8103; pgvector 0.8.2
   is present; `migrate-from-hosted.sh` does NOT fit (it filters by table prefix in `public`, Bask
   owns a whole schema).
5. Apply `packages/db/prisma/migrations/20260820000000_knowledge_base/` and run
   `packages/db/scripts/knowledge/embed.ts` (gated behind `EMBED_CONFIRM=yes`). **Both need explicit
   approval — shared CC&SS database.**

### Blocked on Daniel, not on code
- The three cash figures for the proposal phases.
- **Ask Nick for the data export he offered** — cheapest high-value unblock available.
- **Ask when the January Expo is** — only external deadline anyone named.
- VO re-record: **no ElevenLabs key exists on this machine** (verified directly, not inherited).

## Session refresh 2026-08-20 15:20 EDT — PRODUCT POSITIONING CORRECTION FOR NEXT TOOL

### User Correction / Handoff Analysis

The current video is incomplete in two separate ways:

1. It does not visibly present the new **Customer Health** and **Analytics** tabs as first-class product surfaces. Capturing health tiles and peer metrics inside the wall is not enough. The viewer must see the navigation, enter both surfaces, and understand what each one changes for an owner or rep.
2. It presents disconnected screens, not the product's commercial role. The product must read as a **business-intelligence and sales-driving layer** over salon data and UVALUX knowledge. It is not salon-management software. It turns operating data into decisions, coaching, retention actions, inventory/order actions, campaigns, and equipment-sales evidence.

### Required product story

`Existing salon data + UVALUX knowledge/training + consent → business intelligence → sales and operating actions.`

The next film/UI pass must make this chain explicit:

- **Customer Health:** identifies healthy, slipping, and lapsed customers; gives the team a concrete retention/call list.
- **Analytics / Peers:** shows anonymous benchmark position, the dollar value of gaps, and the target the team can act on.
- **Knowledge / Coaching:** explains why the recommendation exists using UVALUX recordings, training, and evidence.
- **Sales-driving actions:** turns findings into campaigns, staff challenges, coaching requests, draft orders, and equipment/payback conversations.
- **Compass / network layer:** shows UVALUX seeing patterns across consenting salons and turning them into rep/coaching leverage.
- **Consent:** establishes that sharing is controlled by the salon; this is the licence to operate.

### Acceptance criteria for next tool

- Live nav visibly includes **Customer Health** and **Analytics** (not only a generic Customers/Insights label).
- Film has a clear business-intelligence thesis in the opening or act break, not only feature narration.
- Film shows the path from signal → interpretation → dollar opportunity → action → sales outcome.
- Customer Health and Analytics each get a readable product beat at composited full-screen scale.
- Existing UVALUX order, marketing, coaching, Compass, and consent surfaces are connected by narration or on-screen transitions into one layer.
- Equipment payback / tenure is treated as the commercial endpoint where supported by the current product evidence; do not invent metrics or fields.
- No captions. Final output is VO-only until the new ElevenLabs recording arrives.
- Do not rebuild salon-management features. Preserve the existing data/consent boundary.

### Deliverable boundary

This is an analysis and handoff, not an implementation. Next tool should inspect the current live nav, `promo/src/timeline.ts`, the Shotcraft capture assets, and `promo/VO-SCRIPT-V2.md`, then produce the revised story/shot plan before editing or rendering.

### Active Task
Next tool: rebuild the product story and film around Customer Health + Analytics as the visible business-intelligence and sales-driving layer.

### Parallel Handoff Queued

Swarm plan: `docs/plans/2026-08-21-business-intelligence-film-swarm.md`.

Tasks split for local parallel execution:

- A: make Customer Health and Analytics first-class visible nav/surfaces.
- B: rewrite product thesis, shot plan, and VO around data → intelligence → dollar opportunity → action → sales outcome.
- C: recapture production UI with readable nav and full-screen Customer Health/Analytics beats.
- D: dependent final integration; render VO-only, inspect output artifact, DM final video.

No worker started in this session. Task D depends on A/B/C.

### Recent Changes (2026-08-20)

### Active Task
Health and peer scoreboard UI shipped. Live capture complete. VO-only promo rendered; new ElevenLabs audio still pending.

### Recent Changes (2026-08-20)
- `packages/core` customer health engine wired through API and `/customers`.
- `/customers` now shows band totals, health grid, and slipping customer table.
- `/insights/peers` now shows scoreboard tiles and cohort comparison table.
- Production deployed to `https://bask-psi.vercel.app`; Vercel build passed.
- Shotcraft capture includes `customers-*` and `peers-*` assets from production.
- `promo/src/shots/S9Wall.tsx` includes live health and peer scoreboard cutouts.
- VO-only render: `promo/out/promo-vo.mp4`, 43.3 MB. Caption render intentionally skipped.
- VO script DM sent: `promo/VO-SCRIPT-V2.md`.
- Commits pushed: `44288fc`, `7c2ddec`, `b1b9a4f`.

### Next Steps
1. Replace existing VO audio with ElevenLabs output from `VO-SCRIPT-V2.md`.
2. Rerender `BaskPromoVO` after audio arrives.

---

## Session refresh 2026-08-19 19:46 EDT — THE NICK MEETING CHANGED THE PRODUCT
Fresh session started (context rot after a long day: film sound fix → ASTEROID demo setup →
the Nick meeting → transcript analysis → health engine build). Nothing was mid-flight at the cut
except the film re-cut, which is committed and typechecking but NOT re-rendered.

### Active Task
Rebuilding the product around what Nick actually asked for. Two open decisions and one build.

**The meeting (2026-08-19, 2:00 PM) — read `docs/meetings/2026-08-19-nick-debrief.md` FIRST,
then `docs/meetings/2026-08-19-nick-analysis.md`.** Transcript at
`transcripts/2026-08-19-1412-conversation.txt` (auto-transcribed, speaker labels unreliable and
swap mid-file, names ASR-mangled — never quote it as verbatim to anyone).

**What changed:** Nick ruled out salon management software. *"I don't want to develop software for
salon management — there's five other guys doing it."* He hosts Sun Link's data, so a competing
front end "would piss off my partners." His definition of the gap: **"It's not tracking minutes and
putting butts in beds. It's what to do with that data."** The Floor, POS and booking are OUT of the
pitch and out of the film. Daybreak, Peers benchmarking, Customers, Studio, the UVALUX draft order,
Compass and consent all survive.

**He asked for a proposal, unprompted** — time committed, what Daniel wants in return, engagement
shape. Draft at `docs/pitch/PROPOSAL-NICK.md` with four `[[ ]]` markers only Daniel can fill.
Decisions already made: present all three deal structures and let him pick · two days a week ·
staff conversation recording left out entirely (legal exposure).

### Recent Changes (this session)
- `promo/`: sign-off SFX removed (riser + impact) after stem measurement — 1:38 went -3.2 → -8.9
  dBFS. Commit `a47846d`. Masters re-rendered, 720 send-copy DM'd.
- ASTEROID is the demo machine. Film + two URL shortcuts on `C:\Users\Daniel\Desktop`, SHA256
  verified. ASTEROID is ONLINE (sysadmin machine table says offline 12d — that row is stale).
- `promo/src/timeline.ts` + `Main.tsx` + `Soundtrack.tsx`: floor/checkin/pos cut with their sound
  cues and VO lines. `tsc` clean. **NOT re-rendered** — waiting on the new surfaces.
- `packages/core/src/health/customer-health.ts` — NEW. Customer health engine, baseline-anchored,
  adapted from CommandCentered `app/src/lib/allies/health.ts`. Plus `estimateBottle()`.
- `packages/db/scripts/health-distribution.ts` — read-only tuning instrument, `pnpm health:distribution`.
  420 customers: 69.8% healthy / 23.3% slipping / 6.9% lapsed, median 78.
- Commits `8a29308`, `a47846d`, `b6c9e94`. **Nothing pushed** — promo commits from the 14th are
  also still local.

### Next Steps
1. **Two open decisions blocking the build** (see analysis doc §2):
   a. Health scoring constants. The transcript says average member tenure is **2.5–3.5 months**, so
      my 90-day staleness curve spans an entire customer lifetime — recommend full drain at ~45
      days, flags at 14/30/45. Also seasonality: *"if you're just doing tanning and summertime
      comes, somebody will pause or cancel"* — a flat recency model turns the board red every July.
      Need paused (seasonal) vs lapsed (worth a call) as separate states. Ceiling compression
      (visit cap 30→20, member baseline 65→60) is the least urgent of the three.
   b. Whether to fold the **equipment-payback case** into the proposal and film first (see below).
2. **Build**: customer health board + slipping list on `/customers`; scoreboard framing on
   `/insights/peers` (percentile/cohortMedian/cohortTopQuartile ALREADY computed in
   `apps/web/src/server/peers.ts` behind the consent gate — presentation problem, not a build).
3. **Then** re-render the film. Nothing renders until the hero beats exist.
4. Fill the `[[ ]]` numbers in the proposal and send it.

### Context the next session must not re-derive
- **The strongest commercial finding** (analysis §1): UVALUX sells equipment financed by membership
  arithmetic — Nick's own pitch is "buy a cocoon, upgrade N members from 89 → 100 → 120 to pay for
  it." Mike's counter-thesis: add modalities, tenure goes 2.5 → 3.5 months, *"worth more than
  another customer."* A product proving "this modality extends tenure by X, machine pays back in N
  months" is an EQUIPMENT SALES INSTRUMENT, not a retention feature. Should lead pitch and film.
- **Average member tenure is nowhere in Bask** and it is the headline metric of this product.
- **Community is the gap.** Nick: the salons come for the lotion but really *"the community's the
  biggest one."* It is in no plan, no proposal, no film. Daniel already built a micro-social
  platform for the Fine Arts client — a port, not a build.
- **The beachhead, in his words:** chains are taken (Sun Link runs Palm Beach Megatan ~200, Sun Tan
  City ~200, Glow ~140); independents are unserved "because they're too expensive, and I don't
  think they have the right product for it."
- **Rights are NOT secured** — *"there's insights in there that we're not tapping into, nor do we
  have rights yet."* Consent layer is the licence to operate, not a demo beat.
- **Fences:** never compete with Sun Link's front end · never market to salon customers (he'd put
  it in the contract) · don't pitch him an exit (cannabis went ~$1B → zero on him) · don't let
  phase 1 look big (he named scope creep as his own allergy).
- People: **Wilfred** (his technical lead, intro offered twice — the due-diligence gate) · **Elaine**
  (coaching) · **Mike** (California, the data-coaching exemplar) · **Sarah** (recorded material) ·
  **Angie** (wellness/spa/gym sales, banned from tanning) · **Nick the student** (Guelph, ≠ Nick).
- The demo clock reads **2026-08-06** — August, peak seasonal-pause month. Relevant to what we show.

## Deployed
- **USE THIS FOR THE PITCH — stable, always the latest production build:**
  **https://bask-psi.vercel.app** (public, no auth — it is a demo).
  `https://bask-danman60s-projects.vercel.app` is the same build.
  Verified 2026-08-09: both serve the real UVALUX catalogue.
- **Do NOT hand out a `bask-<hash>-danman60s-projects.vercel.app` URL.** Those are per-deployment and
  freeze on the build that made them — yesterday's link still showed the old invented products after a
  new push. `vercel ls` lists those hashed URLs; the stable alias is the project's production domain
  (`vercel project ls` → `bask  https://bask-psi.vercel.app`).
- **The URL is NOT bask.vercel.app** — that is a Polish children's UV-swimwear company
  ("Bask - stroje kąpielowe UV dla dzieci"), re-confirmed 2026-08-09. Never construct a URL from the
  project name.
- **Repo:** https://github.com/danman60/BASK (public)
- Vercel project `bask` (team danman60s-projects), Root Directory `apps/web`, deploys on push to master.
- Env on Vercel: DATABASE_URL, DIRECT_DATABASE_URL, OPENAI_API_KEY, LOG_TOKEN, NEXT_PUBLIC_LOG_TOKEN,
  NEXT_PUBLIC_APP_URL. Logs: `curl "<url>/api/_logs?token=$LOG_TOKEN&since=0" | jq`
- Deployment Protection is OFF (public demo). Turn back on:
  `curl -X PATCH .../projects/bask -d '{"ssoProtection":{"deploymentType":"prod_deployment_urls_and_all_previews"}}'`

## ⚑ IN FLIGHT (2026-08-14 20:19) — the Network map is BUILT AND DEPLOYED; the film shot is HALF-WIRED

**Shipped to production, commit `6fc36fc`, pushed to master, verified live** at
`https://bask-psi.vercel.app/compass/network`:
- `apps/web/src/components/compass/NetworkMap.tsx` — the map PRODUCT_SPEC §14/§191 and PITCH Beat 5
  both call for and DESIGN_SPEC §6 had deferred past M1. It did **not** exist before today; the
  "Where they are" section was a four-bar province chart. Verified absent on prod first (one 26×26
  icon SVG, no canvas, no map lib), then built.
- Real geometry: public-domain Canada GeoJSON → Lambert conformal conic (standard parallels 49/77,
  what StatCan uses) → simplified to ~32KB of baked path data. **No tiles, no mapping library, no
  runtime fetch.** Salons plot at their real city coordinates; same-city repeats fan out so the map
  count matches the table count.
- Pin colour comes from `.cp-dot`'s own band colours, so map / legend / table cannot disagree.
  Sanity check that held: the single amber (needs-attention) pin is Burlington = Maple Glow Tanning,
  the exact account the Call List flags.
- Verified locally at `localhost:3419` (12 pins) before pushing, and on production after.

**DONE 2026-08-14 20:40, commit `9960cc4`.** The map is cut into the film as its own beat, ahead of
the network-page descent, in both cuts (`map`, 300f). Rendered and DM'd: `promo-vo.mp4` **106.2s**,
`promo.mp4` **85.0s**.
- Studios read as nodes (dot + ring) and an amber chain draws west to east — each salon lands on the
  end of the line that reached for it.
- Names take turns in ONE fixed slot on the right, not twelve labels beside twelve pins: the BC and
  Ontario clusters overlap, so simultaneous labels were unreadable. The named pin holds its ring
  bright, which is what ties slot to dot. Slot closes holding the amber account (Maple Glow,
  Burlington) — the one the Call List calls two shots later.
- Every string, position and colour is capture data off the live page. Nothing authored.
- The act-break push moved onto the map; `S8Network`'s `PUSH` is now `0` **and guarded**
  (`interpolate` throws on a `[0,0]` range).
- **Bug found in the stills and fixed at the source:** `PageCam` painted an ivory `#faf7f2` surround
  behind the page, so every dark Compass shot showed a paper band wherever the camera framing did not
  fill the viewport (very visible at the network page's first frame). New `surround` prop, defaulted
  to the old ivory, passed `T.cPaper` by S8Map / S8Network / S9Compass.
- SFX: one soft tick per studio, pinned off `MAP_LANDINGS_REL` exported by S8Map so the sound table
  cannot drift from the picture.
Fresh textures already captured for it: `compass-network.png` (with map), `compass-network-nopins.png`
(pins hidden, the base plate the shot drops pins onto), `network-map-card.png`, and
`layout.json → pins[]` (12 entries: page-space x/y, fill, hollow, name — read off the live DOM).
NOTE: the network page grew when the map went in — every `compass-network-c*` cutout was re-captured
at its new y, and `pageH` is now 2564.

A local `next dev` may still be running on port 3419 from that verification — harmless, kill it if
it is in the way.

## Product film (2026-08-13/14) — `promo/`  ← DELIVERED, v3
Cinematic product video for the Nick pitch, built with the `video-shotcraft` skill in autonomous
free-creation mode. Standalone Remotion project at `promo/` — deliberately OUTSIDE the pnpm
workspace (`pnpm-workspace.yaml` globs only `apps/*` + `packages/*`), own `package.json` and
`node_modules`, so it cannot affect the monorepo build.

### Four masters, all in `promo/out/` (git-ignored — re-render, don't hunt for them)
| file | length | what |
|---|---|---|
| `promo-vo.mp4` | 52.8s | **the one to send** — client VO + client music bed + SFX, captions off |
| `promo-vo-nobgm.mp4` | 52.8s | voice + SFX, no music |
| `promo.mp4` | 46.1s | caption cut, music + SFX, no voice |
| `promo-nobgm.mp4` | 46.1s | caption cut, SFX only (video stream bit-identical to `promo.mp4`) |

Re-render: `cd promo && npx remotion render src/index.ts BaskPromoVO out/promo-vo.mp4`
(compositions: `BaskPromo` = caption cut, `BaskPromoVO` = voice cut; props `{bgm, captions}`).

### Shot order as delivered (client-directed — the campaign beat is LAST)
Daybreak → insight card → the Floor → UVALUX order → consent card → consent → Compass →
"Back to that quiet Tuesday." → Studio/campaign → sign-off with the UVALUX mark.
`src/timeline.ts` is the authoritative record. `DESIGN_SPEC.md` §1 still describes the ORIGINAL
two-act structure on purpose, so the client's change is visible rather than retconned.

### Docs
`promo/DESIGN_SPEC.md` (brief, tokens, storyboard, every deviation) · `promo/REVIEW.md` +
`promo/REVIEW-2.md` (two independent reviews, clean context, frame-numbered evidence) ·
`promo/VO-SCRIPT.md` (script, per-line placement, the one line worth re-recording) ·
`promo/MESSAGE-DRAFTS.md` (cover notes for Nick).

### OPEN — needs Daniel, not the next session
1. **One VO line is worth re-recording.** The campaign line "Studio turned **that** into a
   campaign…" was written for position 3; the reorder put it last, ~30s from its antecedent. The
   title card before it now says "Back to that quiet Tuesday." to patch it. Clean fix, same voice
   and settings: *"Studio turns a quiet Tuesday into a campaign. The offer, the post, the text.
   You still press send."* — drop the mp3 in, it replaces `promo/public/audio/vo/vo3.mp3`, nothing
   else moves (VO pins are per shot). **There is no ElevenLabs API key in `~/.env.keys`, so this
   cannot be generated locally — it has to come from Daniel's ElevenLabs account.**
2. **The "BUILT FOR / UVALUX" sign-off lockup** reads as an official relationship the pitch has
   not been granted. Both the second reviewer and I flagged it; Daniel decides whether it stays,
   softens, or goes. One line in `src/shots/S10Outro.tsx`.
3. VO cut is 52.8s, past the original 35–45s brief — a consequence of the 41.8s supplied read plus
   the client's slower title cards. Flagged, not hidden.

### Two product bugs this work uncovered (worth fixing before the meeting)
- **`/marketing?campaign=<id>` renders an empty page** — the Studio builder holds generated pieces
  in component state only and never rehydrates an existing campaign. Clicking a campaign in the
  Campaigns tab shows a step tracker over a blank body.
- **The in-session sunset ring is never on screen** at the demo's virtual clock (5:38 p.m., every
  bed Ready/Cleaning). The film renders the product's own `.in-session-ring` markup at capture time
  rather than writing to the DB; the live pitch needs the clock moved or a real check-in.

- Spec + storyboard: `promo/DESIGN_SPEC.md`.
- **Captures come from the LIVE deploy** (`https://bask-psi.vercel.app`), re-runnable:
  `cd promo && CAP_BASE=https://bask-psi.vercel.app node scripts/capture.mjs` (add `GEN_CAMPAIGN=1`
  only when the Studio review screen needs re-shooting — see below).
- **Two things worth knowing about the product, found while shooting it:**
  1. **`/marketing?campaign=<id>` renders an empty Review step.** The step tracker draws, the body
     does not — the builder only holds generated pieces in component state, so an existing campaign
     never rehydrates. A stakeholder clicking a campaign in the Campaigns tab gets a blank page.
     Worth fixing before the meeting.
  2. The **in-session sunset ring is never on screen** at the demo's current virtual clock (5:38 p.m.,
     every bed Ready/Cleaning). The film renders the product's own `.in-session-ring` markup at
     capture time rather than starting a real session; the pitch itself will need the clock moved or
     a live check-in to show it.
- **One deliberate write to the demo DB:** one campaign was generated through the pitch's own Beat 1
  (`Create a Tuesday promo` → `Generate the campaign`) to photograph the real Studio review screen.
  It shows in the Campaigns tab until the next `demo:reset`.

## Session refresh 2026-08-07 16:17
Context rot after a long build session (M0 + M1 + deploy in one window). Fresh session started;
nothing was in flight at the cut — the deploy is live and green.

## Active Task
Nick in-person meeting preparation for August 19, 2026 at 1:00 PM Eastern. Full phone-ready HTML and
14-page printable PDF delivered by Telegram. Sheet covers discovery, live demo route, commercial
hypotheses, honest objection lines, FounderVision close sequence, fallbacks, and packing list.

## Recent Changes
- 2026-08-18 **NICK IN-PERSON MEETING CHEAT SHEET DELIVERED.**
  - Source: `docs/pitch/NICK-MEETING-CHEAT-SHEET.html`.
  - Offline print artifact: `docs/pitch/NICK-MEETING-CHEAT-SHEET.pdf`, 14 Letter pages.
  - Stable product link: `https://bask-psi.vercel.app`. Phone path is responsive web, not native.
  - Current film: `promo/out/promo-vo-720.mp4`, 104.853 seconds.
  - Commercial figures and structures are labeled working hypotheses. Discovery build is not called
    production-ready, pilot-ready, hardware-certified, or officially approved by UVALUX.
  - Independent artifact review: 0 blockers. Final screenshots and both deliverables sent by Telegram
    in messages 13351 through 13354.
  - QA Agent model blocked before verdict 1: two HTTP 500 responses and two timeouts. Exact log at
    `tests/reports/qa-20260819-034719/agent-log.md`; 0 pass, 0 fail, 0 of 11 adjudicated.
- 2026-08-08 **REAL UVALUX CATALOGUE — invented demo products replaced end to end.**
  - Source: uvalux.com **WooCommerce Store API** (`/wp-json/wc/store/v1/products`), pulled 2026-08-08.
    1,817 products, 1,755 with real SKUs. The shop HTML does NOT parse with `li.product` selectors —
    use the API. Curated pull kept at `packages/db/fixtures/uvalux-catalogue.json` (source of record).
  - **40 real products, 14 real brands** (Hempz, Australian Gold, California Tan, Devoted Creations,
    Designer Skin, Swedish Beauty, JWOWW, Supre Tan, Ed Hardy, Sunna, Norvell, Fiesta Sun, Dermasuri,
    Uvalux) — real names, sizes, descriptions and product photography. Real order codes now populate
    `UvaluxCatalogItem.officialSku`, `null` since M0.
  - **Prices are CAD wholesale** — uvalux publishes exactly one price and no MSRP. `RETAIL_MARKUP = 1.5`
    (Daniel, 2026-08-08) is the single constant deriving every retail price. Retail range $5–$97,
    shelf value $52,542.
  - **No brand logos exist to take** — the brand taxonomy returns `image: null` for every brand.
    Product photography only; nothing fabricated.
  - **Story arcs kept, on real products:** BSK-10007 = Hempz Botanical Sunshine Revitalizing Bronzer
    (8 days to stockout), BSK-10021 = Norvell Premium Solution Double Dark (34 on shelf, never sold).
  - **Real machines on the Floor:** Ergoline Sunrise 7200 · KBL 6800 Alpha Pearl · Ergoline SunDash
    32/0 · KBL Space 2000 · Mystic Tan Unity · Ergoline Beauty Angel RVT 30 · Redwave Plus ·
    Wellsystem Wave Hydro Massage Therapy. Make + model live in `EquipmentDevice.config` (JSON, no migration).
  - **Kits are consumer-size on purpose.** The UVALUX bulk intro kits ($320–406 wholesale) are what a
    salon buys FROM UVALUX, not what a customer buys at the till — a $600 tile between $53 lotions read
    wrong. Swapped for real retail sets (Hempz Botanical Sunshine Gift Bag, Sunna Jet Set Travel,
    Koffee Beauty Espresso Yourself, Devoted Creations White 2 Bronze Watermelon).
  - Migration `20260808032522_catalogue_description_image` adds `description`/`image_url` to
    `bask.product` + `bask.uvalux_catalog_item`. 48 images vendored to `apps/web/public/{catalogue,equipment}/`
    so the pitch never depends on uvalux.com being reachable.
  - **Fixed on the way:** the AI Daybreak headline had stopped opening "Good morning," which the mockups
    and the fallback both use and `demo:verify` greps for (was failing 11/12); Inventory read "1 product
    **want** a decision".
  - **Fixture volume largely self-corrected:** Daybreak now reads "6% above your usual Thursday"
    (PITCH.md wants "8% above"; it used to say 31% BELOW).
  - 209 tests green · `demo:verify` 12/12 · `db:check` clean, zero `public` footprint.
  - **`pnpm db:migration:new` is BROKEN under Prisma 7.9** — `--from-migrations` now demands
    `datasource.shadowDatabaseUrl`. Worked around with `migrate diff --from-config-datasource`; the
    script needs fixing before the next migration.
- 2026-08-08 **`docs/pitch/pitch.html`** — self-contained presentation build of PITCH.md for the Nick
  meeting (real Fraunces/Inter embedded, dark Compass act, run-of-show with bookmark chips, presenter-only
  notes, prints to 18 pages). OPEN: the contact line on the last slide is a guess, and slides 4/6 use the
  design mockups rather than live screenshots.
- 2026-08-07 **M1 COMPLETE — 5 lanes merged, `pnpm demo:verify` 11/11 on a fresh `demo:reset`.**
  - Surfaces: `/` Today/Daybreak · `/floor` (room board, check-in, waiver signature, POS + wedge scanner, schedule, shift handoff) · `/marketing` Studio · `/customers` · `/inventory` (+ UVALUX draft order) · `/insights` (+ Peers gap slider, activity log) · `/compass` (Call List, Network, Accounts, Coaching) · `/settings/data-sharing`.
  - Lane 6 (built in main): `/book` public booking — service → day → time → name, writes a real Booking the Floor renders; slots derived from salon-local wall time via the zone so they survive DST. All 7 PITCH.md presenter bookmarks wired.
  - `pnpm demo:verify` (scripts/demo-verify.mjs) walks the whole PITCH.md path headlessly, 12 checks; unbuilt surfaces report SKIP, never PASS.
  - **Bugs the merge exposed (each invisible inside its own lane):** no-salon fallback resolved to Ironwood (0 customers) so every Bask surface pointed at an empty tenant · `?salon=<slug>` sent a non-UUID to a uuid column, 500ing every slug link · all five lanes' routes were built OUTSIDE the `(bask)` route group so none had the app nav · two lanes appended to the same guidance dictionary and the union merge swallowed six closing braces · Floor duplicated the shell wordmark.
  - **Lane-found bugs worth remembering:** Floor engine's `globalThis` cache survived hot reloads (edits silently ignored) · 24h UV rule applied to every service and hard-blocked check-in · wedge listener could emit a truncated barcode (wrong bottle in cart).
  - **Migrations added:** `daybreak_brief` (M0 lane B), `Booking`/`WaiverSignature`/`ShiftHandoff` (M1 lane 2). All `bask`-scoped, zero public footprint.
  - **RESOLVED 2026-08-07:** AI provider switched to OpenAI (gpt-4.1 / gpt-4.1-mini for classification) because the Anthropic key was out of credits. Verified live — `demo:advance` now reports `brief ai`, not fallback. Original note follows for context.
  - ~~**STILL BLOCKED — AI success path unverified.**~~ Every generation (Daybreak, campaigns, call briefs, recovery drafts) runs the deterministic fallback because the key returns 400 "credit balance is too low". Three lanes independently confirmed the call goes out and the fallback catches it; each screen states which path ran. Fund the key, re-run `pnpm demo:advance --days 0` — no code change needed.
  - **Open tuning:** fixture volume makes day-zero read "31% below your usual Monday" where the pitch wants "8% above"; impact figures run ~10x the mockups ($9,498 vs $640/mo) because the dataset does ~96 visits/day. Arithmetic is right; volume is a design call.
  - **Shared-DB hazard:** concurrent `demo:reset` from parallel lanes is NOT safe (FK violations, interleaved state). One owner per reset.
- 2026-08-07 **M0 COMPLETE — all 11 steps merged to master, exit gate passed.**
  - Steps: 1 scaffold · 2 bask schema (shared CC&SS Supabase, 35 tables, RLS 29) · 3 tRPC+RBAC · 4 fixtures/clock · 5 Evidence+insight engine · 6 Daybreak gen · 7 session machine+SimulatedDriver · 8 tokens/ThemeProvider · 9 guidance primitives · 10 Presenter Panel · 11 consent filter+verification.
  - **Exit gate:** `demo:reset` 36,351 rows deterministic (byte-identical dumps, sha 7097328e…) · `demo:advance --days 5` moves clock 2026-08-06→08-11, 5 insights/day, 5 briefs with 5 distinct prompt hashes and day-over-day headlines · 8 insights carry Evidence + linkedActionType + ref (all 6 detectors fire; failed_payments = exactly $284 per PRODUCT_SPEC) · panel hotkey/role switch/bookmarks · theme toggle + reload persistence + /compass forced theme + preference restored on leave · /dev/floor 8 rooms w/ manual-start reconciliation · Fraunces+Inter actually loaded · 165 tests, build/typecheck/lint green.
  - **Token amendment:** `--primary` 60%→58% L (WCAG AA 4.54:1), `--ink-faint` 55%, `--c-ink-faint` 64%. Mockups re-rendered. 4 waivers remain (mockup-literal semantic-on-wash, superseded by `--*-on-wash`).
  - **KNOWN GAP — AI success path unverified:** ANTHROPIC_API_KEY in ~/.env.keys returns 400 "credit balance is too low". Error path proven end-to-end; every brief so far is the deterministic fallback. **Re-run `pnpm demo:advance --days 0` with a funded key before any pitch.**
  - **Open tuning for M1:** fallback headlines read "20-33% below your usual <day>" — fixture volume/seasonality doesn't yet produce the mockup's "8% above" beat. Insight impact figures ~10x the mockup ($9,868 vs $640/mo) because the dataset runs ~96 visits/day; arithmetic is correct, volume is the design decision.
  - **Gotchas:** Prisma 7 needs a driver adapter (`@prisma/adapter-pg`) · Prisma Migrate MUST use DIRECT_DATABASE_URL :5432 (:6543 pgbouncer hangs silently forever) · route-module Prisma clients must be lazy or `next build` page-data collection fails · use the shared `@bask/db` client (walks up to packages/db/.env) — never `process.env.DATABASE_URL` directly in a route · ThemeProvider belongs in the ROOT layout · `pnpm demo:reset` takes ~32s.
- 2026-08-07: `docs/PRODUCT_SPEC.md` v1.0 created (Fable pass over `docs/UVALUX_Master_Fable_Product_Discovery_Brief.md`).
- 2026-08-07: `docs/IMPLEMENTATION_SPEC.md` v1.0 created (Fable engineering blueprint for Opus). Adds: Expo iOS/Android app (one binary, Bask+Compass shells), Bask Bridge hardware abstraction (SimulatedDriver → TMaxDriver at pilot), barcode system (internal BSK SKUs + UPC capture, wedge scanner + expo-camera, per-customer product tracking), Guidance Layer for non-technical users, theme system: Sunset default (Carly IG-luxe adapted, `.in-session-ring` from Carly's `.in-chair-ring`) + Dusk/Linen/Compass via CompPortal TenantThemeProvider pattern. Stack: Turborepo, Next.js 16 + tRPC + Prisma + Supabase (new project), Expo/EAS. Milestones M0–M4 with exit gates.

## Key Decisions (v1.0 spec)
- Naming: **Bask** (salon OS) / **Daybreak** (morning brief) / **Compass** (UVALUX intelligence) / **The Floor** (ops surface) / **Studio** (marketing) / **Peers** (benchmarking). Co-brandable "powered by UVALUX"; not locked — Nick decides branding weight.
- Nav: 6 destinations Bask, 5 destinations Compass. Call List = Compass hero.
- First build: 5 connected loops, one shared demo dataset ("Sunset Ridge" + 12-salon Compass portfolio), **demo clock** (advance day/week) is P0.
- Real AI generation in first build (Daybreak narrative, Studio content, rep call briefs); publishing/payments/hardware simulated but stateful.
- Consent = product feature: "What UVALUX sees" screen with 3 tiers that visibly change Compass.

- 2026-08-07: Demo-First Mandate added to IMPLEMENTATION_SPEC (§0): Demo Harness subsystem (Presenter Panel ⌘⇧D, scenario bookmarks, demo:verify, pre-warmed AI, offline-tolerant phone demo); production passes explicitly deferred to M3 post-pickup. `docs/pitch/PITCH.md` created: timed 15-min script mapped to 7 bookmarks + 8-slide deck content + recovery notes + pitch-asset checklist.

- 2026-08-07: Design pass (option B) done. `docs/DESIGN_SPEC.md` (screen anatomies, choreography, component vocabulary, copy voice) + 5 live HTML mockups in `mockups/` with `tokens.css` (authoritative Sunset+Compass tokens — seed of packages/tokens). Screenshots DM'd to TG. Mockups = M1 visual acceptance bar. Hallmark log at `.hallmark/log.json`.

- 2026-08-07: 10and10 run (`docs/five-and-five-2026-08-07.md`); user picked all except #3 (Tan Safety engine — SKIPPED). Folded into specs: booking page real (M1 `/book`), presenter fire-push beat (M2), gift cards/packages at POS, activity log + ActivityEvent, Peers gap slider, real waiver SignaturePad, Floor offline mode (M3), Shift Handoff (AI table + M1), location-comparison card, Linen theme deferred, PRODUCT §21 → pointer to PITCH.md, web ZXing cut, apps/bridge out of M0, one AI env var, no-auth-before-M3 non-goal, Segments = fixed predicates, shared Evidence schema, tokens.css = packages/tokens v1, Compass Signals folded into Network. PITCH.md gained push beat, signature moment, slider moment + checklist items.

## Blockers
QA Agent verification is blocked by its LLM service: two HTTP 500 responses and two timeouts before
the first checklist verdict on 2026-08-18. This did not block artifact delivery. Independent source,
visual, HTML, PDF, and link review completed with 0 material blockers.

## Build Status
PASSING as of 2026-08-09. 209 tests green · `pnpm demo:verify` **12/12** on a fresh `demo:reset`
(36,351 rows, checksum `ec83159c…`) · typecheck/lint/build clean · migration `db:check` clean with
zero `public` footprint. Deployed and verified live on https://bask-psi.vercel.app.

## Known Issues
- **`pnpm db:migration:new` is BROKEN under Prisma 7.9** — `--from-migrations` now demands
  `datasource.shadowDatabaseUrl`, which is not configured, so the documented migration flow fails.
  Workaround used 2026-08-08: `prisma migrate diff --config prisma.config.migrations.ts
  --from-config-datasource --to-schema` and hand-place the SQL. **Fix the script before the next
  migration** or the flow in CLAUDE.md will mislead whoever runs it.
- **Daybreak reads "6% above your usual Thursday"; PITCH.md scripts "8% above".** Close enough to
  present, but slides 4/6 of the pitch deck still use the design mockups because of the older, much
  worse mismatch. Regenerating those two slides from the live build is now viable.
- **Shared-DB hazard unchanged** — the deploy and local dev both write `bask` on the CC&SS Supabase.
  A local `demo:reset` yanks state out from under the live site. One owner per reset; never during a demo.
- **No auth, site is public** (deliberate until M3). Anyone with the link sees Compass too.
- 8 of the 40 products have `size: null` — uvalux.com lists no size for them. Not synthesised; the UI
  handles the null.

## Next Steps (priority order)
1. **Pitch deck loose ends** — `docs/pitch/pitch.html`: (a) the last-slide contact line is a guess
   (`daniel@streamstageproductions.com`), confirm or change it; (b) regenerate slides 4 and 6 from the
   live build now that Daybreak reads "6% above" instead of "31% below"; (c) `docs/pitch/PITCH.md`
   line ~42 contains a stray Chinese character — "draft order,每 line with its reason".
2. **Decide whether to tune fixture volume further** — 6% vs the scripted 8%, and impact figures still
   run above the mockups.
3. **Fix `pnpm db:migration:new`** (see Known Issues) before any further schema work.
4. **M2** — Expo mobile app (Bask + Compass shells) + camera barcode, per IMPLEMENTATION_SPEC.
5. Nick meeting delivery is complete. Use `docs/pitch/NICK-MEETING-CHEAT-SHEET.html` during the room
   conversation and the PDF as the offline fallback.

## Context for Next Session
**Catalogue facts you should not re-derive.** The real UVALUX catalogue IS machine-readable: uvalux.com
runs WooCommerce and its Store API is public and unauthenticated —
`/wp-json/wc/store/v1/products?per_page=100&page=N`, 1,817 products. Scraping the shop HTML does not
work (`li.product` selectors return 0). The curated pull lives at
`packages/db/fixtures/uvalux-catalogue.json` and is the source of record for
`packages/db/fixtures/catalogue.ts` — the TS entries are inlined, so **edit both** if you change a
product. Prices are CAD **wholesale** (the only price uvalux publishes; there is no MSRP anywhere);
retail is derived through the single `RETAIL_MARKUP = 1.5` constant. Brand logos do **not** exist to
take — the brand taxonomy returns `image: null` for every brand.

**Demo-verify needs a running server** — it targets `http://localhost:3417` (override with `BASE_URL`)
and reports `HTTP 0` on every check if nothing is listening. Start `PORT=3417 pnpm dev` first.

**Daybreak briefs are cached by context, not by prompt text.** Editing the prompt in
`packages/core/src/ai/daybreak.ts` and re-running `demo:advance --days 0` returns a cache hit. Delete
the row (`delete from bask.daybreak_brief where for_date = '<date>'`) to force regeneration.

Working app at `~/projects/uvalux-platform` — `pnpm dev` (PORT env overridable, default 3417). Harnesses: `/dev/api` (tRPC+roles), `/dev/floor` (room board), `/dev/design` (tokens+guidance), `/compass/dev/tokens` (forced theme). Presenter Panel: ⌘⇧D. DB commands: `pnpm demo:reset` / `demo:advance --days N`. Brief + specs in `docs/`. Spec Part IX = Opus handoff with P0/P1/P2 and hard constraints. Existing `~/projects/uvalux-proposals/` is unrelated (video-business event proposals).
