# CURRENT_WORK — uvalux-platform

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
