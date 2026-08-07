# M0 — Foundation (spine)
## Execution plan. Parent specs: IMPLEMENTATION_SPEC.md (§0–§6, M0), DESIGN_SPEC.md, PRODUCT_SPEC.md §20.

**Goal:** the invisible machinery that makes every demo beat possible — monorepo, schema, fixtures with story arcs, demo clock, insight engine, tokens/theme, session state machine, presenter-panel skeleton. No polished UI in M0 (that's M1); a bare dev harness page proving each subsystem is enough.

**Executor notes:** deviations get logged in this file under `## Deviations`, not silently absorbed. Steps are intent + constraints — file layout, naming, and internal structure are executor's judgment within IMPLEMENTATION_SPEC's architecture. Each step ends with its acceptance check. Steps 1–3 are sequential; after step 3, streams A (data/engine) and B (tokens/UI primitives) can proceed in parallel.

---

### Step 1 — Monorepo scaffold
pnpm + Turborepo per IMPLEMENTATION_SPEC §1.1, **minus `apps/bridge`** (created M4). Apps: `web` (Next.js 16, App Router, TS, Tailwind v4). Packages: `core`, `api`, `db`, `tokens`, `ui`. `apps/mobile` = placeholder dir with README only (scaffolded at M2 — don't carry Expo deps before then). Baseline tooling: TS strict, ESLint, prettier config shared; `pnpm build` + `pnpm typecheck` turbo pipelines.
**Use the `bootstrap` skill's Build-Mode scaffold machinery** (`~/.claude/skills/bootstrap/SKILL.md`) for this step — the interview phase is already satisfied by the four spec docs (treat them as the completed brain-dump/plan); jump straight to its scaffold → build → verify loop with those specs as the plan input.
**Accept:** `pnpm install && pnpm build && pnpm typecheck` green from clean clone; `apps/web` serves a page.

### Step 2 — Supabase (shared project) + schema v1
**Use the SHARED CC&SS Supabase project** (`supabase-CCandSS` MCP — same project that hosts the cross-app feedback widget; per Daniel 2026-08-07, no new project). Isolation strategy: **dedicated Postgres schema `bask`** — every table for this product lives in `bask.*`, never `public.*`; Prisma `schemas = ["bask"]` multi-schema config; no FKs into other apps' tables; migrations scoped to the `bask` schema only so other tenants of the shared project are untouchable by ours. Prisma schema per IMPLEMENTATION_SPEC §2: Org→Salon→Room→Session; Customer→Membership/Package→Visit→SaleLine; Product↔Barcode↔UvaluxCatalogItem; InventoryLevel+StockEvent; Insight (typed `Evidence` — see step 5); Campaign; Segment (enum of fixed predicates, not AST); GiftCard; ActivityEvent; Staff; ConsentProfile(+audit); DraftOrder(+lines); Compass: Account, SignalSnapshot, CoachingRequest, ContactLog, Playbook; EquipmentDevice; `demo_state` (virtual_today). Every tenant-scoped table carries `salon_id`/`org_id`; **RLS policies written now** even though M0–M2 runs a single demo tenant. Migrations via Prisma; no seed data in this step.
**Accept:** `prisma migrate deploy` clean against CC&SS with ALL objects landing in the `bask` schema (verified: `select count(*) from information_schema.tables where table_schema='bask'` > 0 and zero new tables in `public`); RLS enabled on every tenant-scoped table (verified by query); typegen passes; pre-existing CC&SS tables untouched (table count in other schemas unchanged before/after).

### Step 3 — tRPC + Prisma wiring
`packages/api` skeleton: context (salon scope + role), routers stub per surface domain (today, floor, customers, marketing, inventory, insights, compass, settings, demo). RBAC middleware shape lifted from CompPortal conventions (read one of their routers first — anti-dup gate). `apps/web` consumes via the standard tRPC/Next integration.
**Accept:** one round-trip query (e.g. `demo.state`) renders in `apps/web` from the DB.

### Step 4 — Demo clock + fixture generator (Demo Harness core)
`packages/core`: clock provider (virtual `today` from `demo_state`; real-time fallback). `packages/db/fixtures`: deterministic generator (seeded PRNG — remember `Math.random`-style nondeterminism breaks resets) producing PRODUCT_SPEC §20 exactly: Sunset Ridge (8 rooms typed, ~420 customers, ~120 members/3 tiers, 90 days visits/sales, 12 staff-shift patterns, ~40 SKUs w/ real-looking UPCs incl. the physical demo bottle's UPC placeholder) + story arcs (retail attachment 21→15%, soft Tuesday PM, 7 failed payments/4 recoverable, bronzer 8-days-out, Fiji Blend overstock, spray +22%) + 12-salon Compass portfolio (Maple Glow decline arc, Northern Sun expansion arc, one Private-consent salon, one new-opening, one multi-location org). Commands: `pnpm demo:reset` (day-zero), `pnpm demo:advance --days N` (moves clock, runs pipeline: campaign-outcome sim → rollups → insight sweep → brief regen; pipeline stages may be stubs where later steps aren't done yet, but the orchestration runs).
**Accept:** reset twice → byte-identical fixture output (determinism proven); advance moves `virtual_today` and reruns pipeline; documented in README.

### Step 5 — Evidence schema + insight rules engine v1
`packages/core`: ONE typed `Evidence` schema (zod) shared by DB `Insight.evidence`, future `InsightCard`/`EvidenceTile` props, and Daybreak generation — metric, window, baseline, comparison, direction, $-impact estimate, contributing factors. Rules engine: threshold + trend-break detectors over fixture data (retail attachment slip, failed payments, soft capacity, low stock, overstock, anomaly band) producing stateful Insight rows (new/seen/actioned/dismissed+reason, linked_action type). Runs inside `demo:advance` pipeline. Unit tests on the arcs: each seeded story must yield its expected insight.
**Accept:** after `demo:reset && demo:advance`, DB contains ≥5 insights matching the story arcs, each with populated Evidence + linked action type; tests green.

### Step 6 — Daybreak generation v1 (JSON, not UI)
`ai/` module server-side: one `AI_MODEL` env var + per-call override map; guardrail validators (no medical claims, discount caps) as post-processors. Daybreak generator: insights + pulse + baselines → structured brief JSON (greeting, narrative, ranked cards) — **pre-generated during `demo:advance`**, stored, never live-blocking. Cache the scripted-beat outputs so demos never depend on a live API call (Demo Harness rule §0.1).
**Accept:** `demo:advance` writes a brief JSON that changes day-over-day; runs offline from cache on second invocation; guardrail validator has a failing-input test.

### Step 7 — Session state machine + SimulatedDriver
`packages/core`: session/room state machine (ready→in_session(countdown)→cleaning→ready; maintenance flag; manual-start event reconciliation) with server authority. `EquipmentDriver` interface per IMPLEMENTATION_SPEC §5.2; `SimulatedDriver` implements it fully (delay timers, cooldown, occasional manual events for realism). Realtime channel updates room state to subscribed clients.
**Accept:** dev harness page shows 8 rooms; starting a session counts down and auto-transitions through cleaning to ready; a simulated manual start reconciles into a Session row; state survives page reload (server-authoritative).

### Step 8 — Tokens + ThemeProvider
`packages/tokens` v1 = **copy of `mockups/tokens.css`** (it is the source of truth; no TS generation until M2). ThemeProvider modeled on CompPortal `TenantThemeProvider` (read its comments first) minus flag gating: CSS vars at root, WCAG-computed foreground pairs, per-salon persisted choice. Themes: Sunset (default), Dusk (derive dark companions for every Sunset token), Compass (fixed for `/compass` routes). Automated contrast check over all three token sets in CI.
**Accept:** dev page toggles Sunset↔Dusk live; `/compass` route renders Compass tokens regardless of user theme; contrast check green in CI.

### Step 9 — Guidance primitives
`packages/ui`: `<Guided>` (tooltip/popover wrapper, content from central `guidance.ts` dictionary), tour driver (spotlight steps, skippable/replayable), `WhisperNote`, teaching-empty-state component. Copy dictionary file seeded with ~10 real entries (grade-7 register per IMPLEMENTATION_SPEC §3).
**Accept:** dev page demonstrates a `<Guided>` metric popover, a 3-step tour, and an empty state; all copy resolves from the dictionary, none inline.

### Step 10 — Presenter Panel skeleton
Hidden hotkey (⌘⇧D) overlay in `apps/web`: clock advance/reset buttons · role switch (Owner/Front desk/Rep/Leadership via URL param — **no auth machinery, explicit non-goal until M3**) · ≥2 scenario bookmarks (named clock-position + deep-link: `morning-brief`, `floor-live`) · theme switch · stubs (disabled, labeled) for `seed a walk-in` and `fire push` (wired M1/M2).
**Accept:** hotkey opens panel; role switch changes rendered role; both bookmarks jump state correctly after `demo:reset`.

### Step 11 — Test rig + M0 exit verification
Vitest unit tests already accumulated (core engine, consent filter stub, clock, fixtures determinism); Playwright smoke: dev harness loads, theme toggles, presenter panel opens. Consent filter (`packages/core/consent.ts`) lands here as code + tests (tiers → derivable fields) even though Compass UI is M1 — Compass routers must never ship before it. `demo:verify` command stub created (full pitch-path coverage lands M1).
**Accept (M0 exit, from IMPLEMENTATION_SPEC):** `demo:reset && demo:advance` produces changing Daybreak JSON in tests · theme switch works · a seeded insight carries Evidence + action link · Presenter Panel skeleton (clock, role switch, ≥2 bookmarks) functional · consent filter unit-tested · full suite green in CI.

---

## Constraints carried from specs (do not re-decide)
- Demo-first: every step serves a pitch beat (IMPLEMENTATION_SPEC §0); production hardening deferred to M3.
- One dataset, two apps; Compass reads through the consent filter only.
- No static fakery — simulated systems still change real state.
- Nothing auto-sends; guardrails enforced as validators.
- Anti-dup gate per feature: inspect CompPortal + carly-hair-co before building any equivalent surface.
- Timestamps/timezone: Eastern for anything user-facing.

## Deviations
(log here — date · step · what changed · why)
