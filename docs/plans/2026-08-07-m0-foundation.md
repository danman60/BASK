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

- **2026-08-07 · Step 2 · Prisma 7 moved datasource URLs out of `schema.prisma`.**
  `url`/`directUrl` are no longer valid datasource properties; they now live in
  `prisma.config.ts`. The datasource block keeps only `provider` + `schemas = ["bask"]`.
  Prisma 7 also renamed `migrate diff --to-schema-datamodel` to `--to-schema`, and no
  longer auto-loads `.env` (the config calls `process.loadEnvFile()` itself).

- **2026-08-07 · Step 2 · TWO Prisma config files instead of one.** With `?schema=bask`
  in the connection URL, Prisma treats `bask` as the implicit default schema and emits
  **unqualified** DDL (`CREATE TABLE "org"`). On the shared CC&SS database that would
  have created all 34 tables in `public` alongside 574 other apps' tables. Verified by
  generating both ways: with the param, 199/199 DDL statements were unqualified; without
  it, 0. Resolution: `prisma.config.ts` (keeps the param — which is what keeps
  `_prisma_migrations` inside `bask` rather than leaking it to `public`) is used to
  *apply*; `prisma.config.migrations.ts` (strips the param) is used to *generate*.
  Only fully-qualified SQL may be committed, enforced by
  `packages/db/scripts/assert-bask-scoped.mjs` (`pnpm db:check`, wired into `db:deploy`).

- **2026-08-07 · Step 2 · `prisma migrate deploy` cannot use the pgbouncer pooler.**
  Migrate takes a session-level advisory lock before every command; transaction-mode
  pooling can't hold one, so `migrate deploy`/`status` hang indefinitely with no error
  against `:6543` (hung past 120s) and return instantly against the `:5432` session
  pooler. `prisma.config.ts` is a CLI-only config, so its `datasource.url` now points at
  `DIRECT_DATABASE_URL`; `DATABASE_URL` (6543) is reserved for runtime queries.

- **2026-08-07 · Step 2 · initial migration applied with `psql`, then
  `migrate resolve --applied`.** The hang above was diagnosed after the SQL was already
  authored, so `20260807000000_init_bask` was applied via `psql --single-transaction`
  (safe: the SQL is fully schema-qualified) and recorded in the ledger. The RLS migration
  `20260807000001_bask_rls` was applied normally through `prisma migrate deploy`, which
  is now clean and reports "Database schema is up to date!".

- **2026-08-07 · Step 2 · RLS covers 29 of 35 tables, not "every table".** Six hold
  global reference or demo-harness data with no tenant rows and are deliberately
  excluded: `room_type`, `segment`, `playbook`, `uvalux_catalog_item`, `demo_state`,
  `_prisma_migrations`. `salon` and `org` are scoped by identity rather than a
  `salon_id` column, and `draft_order_line` through its parent `draft_order`. Nullable
  `salon_id` on `staff`/`product`/`barcode` means "global", so those policies admit
  `salon_id IS NULL`.

- **2026-08-07 · Step 2 · turbo `generate` task added.** `build` and `typecheck` now
  depend on it so `prisma generate` runs before anything consumes the client — removes a
  clean-clone foot-gun for step 3, since `packages/db/generated/` is gitignored.

- **2026-08-07 · Step 8 · `--*-on-wash` tokens added on top of the verbatim copy.**
  `packages/tokens/src/tokens.css` is byte-identical to `mockups/tokens.css` (asserted by
  test) and Dusk/Compass are additive `[data-theme]` blocks. But the obvious reading of
  the token set — "put the semantic colour on its own wash" — fails AA: `--success` on
  `--success-wash` is 3.36:1 for an 11px chip. Mockup 02 shows the designer already hit
  this and solved it with hardcoded literals (`.chip.clean { color: oklch(58% .13 70) }`,
  `.flag { color: oklch(45% .1 70) }`). Those literals are the missing token, so
  `semantic.css` names them (`--success-on-wash`, `--warn-on-wash`, `--risk-on-wash`,
  `--accent-on-wash`) rather than letting every component re-hardcode and drift. The
  Sunset `--warn-on-wash` value is mockup 02's literal verbatim. `--accent-on-wash` is
  per-theme because Sunset puts `--primary-deep` on the accent wash (mockup 01 `.impact`)
  while Compass puts the BRIGHT amber there (mockup 04 `.sig.watch`).

- **2026-08-07 · Step 8 · contrast gate ships 6 documented waivers, not a clean 100%.**
  The locked mockup palette does not clear AA everywhere: white `--on-primary` on
  terracotta `--primary` is 4.18:1 for a 13px/600 button label, `--ink-faint` on `--paper`
  is 4.45:1, and the Compass `--c-ink-faint` / `--c-risk` pairs are similar. These are
  values in the source-of-truth file, which this package may not edit, so they are
  waivered in `contrast.ts` WITH a recorded regression floor — the gate still fails if a
  token edit makes a known-marginal pair worse — and each waiver names the remedy. Two
  self-imposed rules keep this honest: a test fails on any waiver that has started
  passing (dead excuses get deleted), and nothing derived by US may be waived. Dusk hit
  the same risk-on-wash problem and was FIXED (wash base decoupled to 58% L) rather than
  waived. **Open decision for M1: the terracotta button-label contrast needs a design
  call.**

- **2026-08-07 · Step 8 · `--line` pairs are audited as `decorative`, not gated at 3:1.**
  Hairlines measure ~1.3:1 in every theme by design; WCAG 1.4.11 exempts pure decoration
  and cards are delineated by fill + the two-layer shadow. They stay in the report so the
  number is visible, but gating them would force a heavier border and break the look.

- **2026-08-07 · Step 8 · contrast module is a subpath export, not a root export.**
  It reads the CSS off disk (`node:fs`); re-exporting it from `@bask/tokens` dragged Node
  built-ins into the browser bundle and Turbopack failed the build outright. It lives at
  `@bask/tokens/contrast` (build-time/CI only). Internal package imports are also
  extensionless — `.js` specifiers typecheck but Next could not resolve them to `.tsx`.

- **2026-08-07 · Step 8 · ThemeProvider is stylesheet-only, unlike CompPortal's.**
  CompPortal writes ~40 branding vars inline on `:root` and then has to selectively CLEAR
  them per appearance mode, because inline styles out-specify stylesheet rules. That split
  caused their documented day-mode bug (clearing the canvas vars also cleared the brand
  BUTTON vars, so every primary button in 66 files fell back to stock purple). Bask avoids
  the class entirely: a theme switch sets ONE attribute (`data-theme`) and the
  `[data-theme]` blocks do the work. The only inline vars ever written are the per-salon
  brand colour and its WCAG-derived partners — values no stylesheet declares, so there is
  nothing to out-specify and nothing to clear. Feature-flag gating dropped per spec §4.1.

- **2026-08-07 · Step 9 · guidance primitives are in-house, not shadcn/radix.**
  IMPLEMENTATION_SPEC §3.1 says "wrapping shadcn Tooltip/Popover". Not done, because
  packages/ui has no Tailwind pipeline (Tailwind v4 content-scanning across workspace
  packages is unwired) and shadcn components are Tailwind-class-based, so adopting them
  would have meant standing that up plus overriding their palette to reach the token set.
  The primitives are token-CSS-driven with the a11y contract kept explicitly (real button
  triggers, `aria-expanded`/`aria-controls`, `role=dialog`/`tooltip`, Escape + outside
  click, arrow keys in the tour). The `<Guided>` API is key-only, so a later swap to radix
  is internal. Tour driver is in-house rather than driver.js — the spec left that to the
  implementer.

- **2026-08-07 · Step 9 · tour targets are passed by the caller, not stored in the
  dictionary.** Copy and DOM structure change for different reasons; binding selectors
  into `guidance.ts` means a markup refactor silently breaks the copy review.

- **2026-08-07 · Step 8/9 · HANDOFF to the app-shell lane: webfonts are not loaded.**
  `mockups/*.html` pull Fraunces + Inter from Google Fonts; the token file only DECLARES
  the families, so the app currently falls back to Georgia/system-ui. Wiring `next/font`
  belongs in the root layout, which this lane does not own (its only shell edit is the
  one-line `@bask/tokens/index.css` import). Display type will look wrong until that lands.

- **2026-08-07 · Step 8 · `pnpm-workspace.yaml` `allowBuilds.esbuild` was a placeholder.**
  It literally read `esbuild: set this to true or false`, which made every `pnpm install`
  exit 1 once vitest (→ esbuild) entered the tree. Set to `true`.
- **2026-08-07 · Step 3 · Prisma 7 requires a driver adapter; `datasourceUrl` is gone.**
  `new PrismaClient({ datasourceUrl })` does not typecheck — `PrismaClientOptions` is now
  `WithAdapter | WithAccelerateUrl`. Runtime client uses `@prisma/adapter-pg` (added to
  `packages/db`) against `DATABASE_URL` (:6543 pooler), pool capped at 10. Migrations are
  untouched — they still go through `prisma.config.ts` on `DIRECT_DATABASE_URL` (:5432).

- **2026-08-07 · Step 3 · one `.env`, found by walking up from `cwd`.** Prisma 7 does not
  auto-load `.env` and Next only loads env files beside the app it serves, so `apps/web`
  would have needed a second copy of the database credentials. `packages/db/src/client.ts`
  walks up from `process.cwd()` to the workspace's single `packages/db/.env` when
  `DATABASE_URL` is absent. No-op in CI/Vercel, and it never overrides an ambient value.

- **2026-08-07 · Step 3 · `@bask/api` has client-safe subpath exports.** The package root
  reaches the Prisma client, so it is server-only. `@bask/api/roles` and
  `@bask/api/surfaces` exist for the browser (role list, labels, header names, domain
  list). Client code imports `AppRouter` type-only.

- **2026-08-07 · Step 3 · `declaration: false` in `apps/web/tsconfig.json`.** The base
  config sets `declaration: true`; under `noEmit` tsc still validates declaration emit,
  which trips TS2742 on the inferred tRPC React client type because pnpm does not hoist
  `@trpc/react-query`'s internal `.d.mts`. An app never emits declarations, so turning it
  off is the correct scope for the fix rather than annotating around it.

- **2026-08-07 · Step 3 · `demo.state` creates the `demo_state` singleton if missing.**
  Step 4 (fixtures) had not landed, so the table was empty and the acceptance round-trip
  had nothing to read. `ensureDemoState` upserts `id='default'` at day-zero, idempotently.
  Step 4's `demo:reset` overwrites it — this is a floor, not a fixture.

- **2026-08-07 · Step 3 · salon scope falls back to the first salon in the database.**
  Nothing selects a salon yet (no auth until M3, no fixtures until step 4). Resolution is
  `x-bask-salon` header → `?salon=` param → first salon by `created_at` → null. With zero
  salons, `salonProcedure` returns PRECONDITION_FAILED with a plain-language message
  rather than silently returning empty data.

- **2026-08-07 · Step 3 · RLS is wired but not yet enforcing.** `ctx.runScoped()` opens a
  transaction and sets `app.salon_id` via `set_config(..., true)` (`SET LOCAL` — the only
  safe form on a transaction pooler). Verified end to end by `settings.scopeProbe`, which
  reads the GUC back out of Postgres. The demo connects as `postgres`, which carries
  BYPASSRLS, so policies do not gate queries yet; M3's switch to a restricted role is
  then a config change rather than an audit of every query.

- **2026-08-07 · Step 10 · `runAdvancePipeline` is a STUB in this lane.**
  `packages/core/src/demo/pipeline.ts` did not exist (step 4 owns it), so the interface is
  defined here: `runAdvancePipeline({ store, days })` / `runResetPipeline({ store })` over
  a `DemoClockStore` port, returning `{ virtualToday, stagesRun, stubbed: true }`. It moves
  the clock and runs zero stages. The Prisma implementation of the port is the single
  merge seam — `packages/api/src/demo/clock.ts`.

- **2026-08-07 · Step 10 · day-zero is "today in Eastern", also a stub.** The real
  day-zero belongs to the fixture generator (it has to line up with 90 days of seeded
  visits/sales, PRODUCT_SPEC §20). `stubDayZero()` in `packages/api/src/demo/clock.ts`
  is the placeholder.

- **2026-08-07 · Step 10 · `floor-live` bookmark points at `/dev/api`, not `/dev/floor`.**
  The room-board harness (step 7) does not exist in this lane. Marked TARGET FOR MERGE in
  `apps/web/src/lib/scenario-bookmarks.ts`; repointing is a one-line change.

- **2026-08-07 · Step 10 · theme switch is a stub that sets `data-theme` only.**
  `packages/tokens` has no ThemeProvider yet (step 8). The switch reads the theme LIST
  from `@bask/tokens` (`THEMES`, `DEFAULT_THEME`) rather than redefining one, carries the
  choice in the URL, and stamps `data-theme` on `<html>` — which is the hook step 8's
  provider is expected to drive anyway.

- **2026-08-07 · Step 10 · role invalidation must happen AFTER the URL commits.** The
  role travels as an HTTP header read from `window.location` at request time, not as a
  query key. Invalidating alongside `router.push` refetches under the OLD URL, so the
  panel reported the previous role — caught in browser verification. Fixed with an effect
  keyed on the role param.

- **2026-08-07 · Step 3/10 · pre-existing, NOT fixed (outside this lane):** `pnpm lint`
  fails with 7 `no-undef` errors on `console`/`process` in
  `packages/db/scripts/assert-bask-scoped.mjs` — the root ESLint flat config declares no
  Node globals for `.mjs` scripts. Untouched by this lane; `eslint.config.mjs` (step 1)
  and that script (step 2) own it.
- **2026-08-07 · Step 7 · harness talks to the DB directly, not through tRPC.**
  Step 3 (`packages/api`) is owned by a parallel lane and was not landed when this
  step ran. The `/dev/floor` harness therefore uses Next server actions plus two
  route handlers under `apps/web/src/app/dev/floor/`, with its own `PrismaClient`
  in `dev/floor/lib/prisma.ts`. The engine API (`startSession`, `cancelSession`,
  `setMaintenance`, `getState`) is already the shape a `floor` router needs, so
  wiring it to tRPC later is a wrapper, not a rewrite.

- **2026-08-07 · Step 7 · Prisma 7 needs a driver adapter at runtime.** There is no
  built-in engine connection any more: `new PrismaClient({ adapter: new PrismaPg({
  connectionString }) })`. `@prisma/adapter-pg@7.9.1` added to `packages/db` and
  `apps/web`. Also added `packages/db` export `"./client": "./generated/prisma/client.ts"`
  and `packages/core` export `"./sessions"` — without an exports entry Node/TS refuse
  the subpath. Runtime uses `DATABASE_URL` (:6543 pooler), never the migrate URL.

- **2026-08-07 · Step 7 · Realtime uses broadcast, not `postgres_changes`.**
  `postgres_changes` would need `bask.room`/`bask.session` added to the
  `supabase_realtime` publication — a migration on a database shared with 574
  other apps' tables, for a harness. The engine POSTs the derived floor state to
  `/realtime/v1/api/broadcast` instead, and the board also polls the state route
  every 2s. Realtime is the fast path; the poll and the absolute `ends_at`
  timestamps are the correctness path.

- **2026-08-07 · Step 7 · relative imports inside `packages/core/src/sessions` are
  extensionless.** Turbopack does not resolve the `./types.js` → `types.ts` mapping
  for workspace TS source and fails the build with "The module has no exports at
  all". `moduleResolution: "Bundler"` makes extensionless correct for TS.

- **2026-08-07 · Step 7 · harness fixture is a throwaway salon, not step 4's.**
  `TEST-LANE-C Salon` + 8 rooms + one simulated `equipment_device` per room, all
  upserted on stable slugs so the page heals itself after a `demo:reset` wipes
  `bask` data mid-run (button, or `curl -X POST /dev/floor/api/reseed`). Room types
  go in with `skipDuplicates` so the fixtures lane's global `room_type` rows win.
  Timings are deliberately compressed for observability — `cleaning_minutes = 1`
  and simulated manual starts of 2–5 min — so a full ready → in_session → cleaning
  → ready lap is watchable in two minutes rather than seventeen. Production
  cleaning stays 5 min (the schema default).

- **2026-08-07 · Step 7 · two independent reconcilers, on purpose.** Driver events
  AND a timestamp sweep both drive state, and the sweep alone is sufficient. This
  is what makes the acceptance criterion hold under a full server restart, not
  just an F5: a session started by one process is carried through `cleaning` →
  `ready` by the next one, from rows alone, with an empty driver. Verified by
  killing and restarting the dev server mid-session.
