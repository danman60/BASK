# CURRENT_WORK — uvalux-platform

## Active Task
Product discovery complete. Fable spec written from master brief.

## Recent Changes
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
None. Spec awaits Daniel review before Opus implementation planning.

## Next Steps
1. Execute M0 plan: `docs/plans/2026-08-07-m0-foundation.md` (11 steps, acceptance checks each). DB = SHARED CC&SS Supabase project, dedicated `bask` Postgres schema (Daniel 2026-08-07). Scaffold via bootstrap skill Build-Mode machinery, specs as plan input. No user blockers remain.
2. Then M1 plan (web demo build, five loops) → M2 (mobile + barcode).
3. Nick meeting prep — PITCH.md + discovery questions PRODUCT_SPEC §25.

## Context for Next Session
Brief + spec both in `docs/`. Spec Part IX = Opus handoff with P0/P1/P2 and hard constraints. Existing `~/projects/uvalux-proposals/` is unrelated (video-business event proposals).
