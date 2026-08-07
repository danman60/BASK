# CURRENT_WORK — uvalux-platform

## Deployed
- **Live:** https://bask-lub8r3iau-danman60s-projects.vercel.app (public, no auth — it is a demo)
- **Repo:** https://github.com/danman60/BASK (public)
- Vercel project `bask` (team danman60s-projects), Root Directory `apps/web`, deploys on push to master.
- **The URL is NOT bask.vercel.app** — that belongs to somebody else's project. Always read the real
  deployment URL back from `vercel ls`; never construct it from the project name.
- Env on Vercel: DATABASE_URL, DIRECT_DATABASE_URL, OPENAI_API_KEY, LOG_TOKEN, NEXT_PUBLIC_LOG_TOKEN,
  NEXT_PUBLIC_APP_URL. Logs: `curl "<url>/api/_logs?token=$LOG_TOKEN&since=0" | jq`
- Deployment Protection is OFF (public demo). Turn back on:
  `curl -X PATCH .../projects/bask -d '{"ssoProtection":{"deploymentType":"prod_deployment_urls_and_all_previews"}}'`

## Active Task
M1 web demo build COMPLETE (2026-08-07) — all six surfaces + public booking merged; `pnpm demo:verify` 12/12 on a fresh reset. Next: fund the AI key, tune fixture volume for the demo script, then M2 (mobile + barcode).

## Recent Changes
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
- **Anthropic API credits exhausted** — blocks verifying the AI success path for Daybreak/Studio generation. Not blocking M1 build (fallback briefs work); blocking the pitch.

## Next Steps
1. Write M1 plan file (`docs/plans/YYYY-MM-DD-m1-web-demo.md`) — the five loops, per IMPLEMENTATION_SPEC M1 scope, mockups in `mockups/` as the visual acceptance bar.
2. Execute M1 in lanes (same worktree pattern; assign per-lane dev PORTs — every lane defaulted to 3417 and collided).
3. Fund the Anthropic key, re-run `pnpm demo:advance --days 0`, confirm real generated briefs.
4. Tune fixture volume/seasonality so day-zero Daybreak reads "8% above" per the demo script.
5. Then M2 (mobile + barcode). Nick meeting prep — PITCH.md + PRODUCT_SPEC §25 questions.

## Context for Next Session
Working app at `~/projects/uvalux-platform` — `pnpm dev` (PORT env overridable, default 3417). Harnesses: `/dev/api` (tRPC+roles), `/dev/floor` (room board), `/dev/design` (tokens+guidance), `/compass/dev/tokens` (forced theme). Presenter Panel: ⌘⇧D. DB commands: `pnpm demo:reset` / `demo:advance --days N`. Brief + specs in `docs/`. Spec Part IX = Opus handoff with P0/P1/P2 and hard constraints. Existing `~/projects/uvalux-proposals/` is unrelated (video-business event proposals).
