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

- **2026-08-07 · Steps 4–6 · one new migration after all: `daybreak_brief`.**
  The step brief expected no new migrations. Step 6 requires briefs to be *stored* and
  *cached by prompt hash*, and there was no table that could hold day-over-day brief
  history plus a cache key. Squeezing it into an existing Json column would have made the
  cache unqueryable. New table, 30th RLS-enabled table, zero footprint outside `bask`
  (verified: `information_schema` shows it in `bask` only).

- **2026-08-07 · Steps 4–6 · `prisma/migrations/migration_lock.toml` was missing.**
  `db:migration:new` fails with "Could not determine the connector from the migrations
  directory" without it. It was never written because step 2 applied the initial
  migration via `psql` + `migrate resolve --applied`, a path that skips it. Added.

- **2026-08-07 · Step 6 · the `daybreak_brief` migration is hand-authored.**
  Even with the lock file, Prisma 7's `migrate diff --from-migrations` requires
  `datasource.shadowDatabaseUrl`, and this project has no shadow database. The SQL is
  written by hand against the conventions in the init migration, fully qualified to
  `"bask"`, and `pnpm db:check` enforces the qualification.

- **2026-08-07 · Steps 4–6 · Prisma 7 needs a driver adapter, not a datasource URL.**
  `new PrismaClient({ datasources: { db: { url } } })` no longer typechecks. Added
  `@prisma/adapter-pg` and construct with `{ adapter: new PrismaPg({ connectionString }) }`.

- **2026-08-07 · Step 4 · Sunday opens 11–17, not 9–21.**
  Modelled as "open all day but empty", Sunday afternoon became the softest window in the
  dataset and the `soft_capacity` detector picked it over Tuesday, stealing the beat. A
  salon that simply opens later carries the same real-world truth without the false
  finding.

- **2026-08-07 · Step 5 · `soft_capacity` compares a slot to the same hour on other
  days, not to an absolute threshold.** An absolute test finds 9 a.m., which is quiet
  every day and is therefore not news. The relative test finds a Tuesday afternoon
  running well under every other afternoon, which is something an owner can act on.

- **2026-08-07 · Step 4 · the spray-tan arc is extra bookings, not a heavier draw
  weight.** The weighted service draw runs against fixed room capacity, so raising
  spray's weight mostly reshuffles which services get clipped at peak hours. Measured
  against the generated rows, a 60% weight lift moved the 14-day spray count by *zero*.
  Extra visits move it by exactly what they are — and a service trending up does mean
  more bookings, not the same people redistributing across the menu.

- **2026-08-07 · Step 4 · `visitsPerDay` is 105, higher than a first guess.**
  Room-hour utilisation is what makes the soft-capacity finding meaningful. Below roughly
  this volume every hour of the week reads as "soft capacity" and the one window that is
  actually a finding is drowned.

- **2026-08-07 · Steps 5–6 · impact figures are larger than the mockup's `$640/mo`.**
  Mockup 01 is a design comp with illustrative numbers. The attachment card computes
  ≈$8.9k/mo because the dataset genuinely runs ~96 visits/day at ~$50 per attached sale,
  and a 6-point attachment drop on that base really is that much money. Every figure on
  every card is derived from the rows; none is written into a template.

- **2026-08-07 · Step 6 · the Daybreak headline is about *yesterday*, so `PulseFacts`
  gained `revenueYesterday` + `revenueTypicalForYesterdayWeekday`.** "Today so far" is a
  partial morning number (cut at 11:00 salon-local) and comparing a half-morning against
  a full day would never light up "on pace". Caught a real bug in passing: the fallback
  headline named *today's* weekday next to yesterday's number.

- **2026-08-07 · Step 6 · the live AI path is wired and exercised, but unverified
  against a 200.** The configured `ANTHROPIC_API_KEY` returns
  `400 invalid_request_error: credit balance is too low`. The request was really made and
  the failure handled: the deterministic fallback produced a valid brief and the run
  completed. So the error path is proven end-to-end; the success path's response parsing
  is not. Mitigated with tolerant JSON extraction so the code does not depend on
  `output_config.format` engaging. **Re-run `demo:advance --days 0` with a funded key
  before the pitch** to confirm generated prose.

- **2026-08-07 · Step 6 · `AI_MODEL` defaults to `claude-sonnet-5`.**
  Per IMPLEMENTATION_SPEC §1.2 ("sonnet-class default"), with `claude-haiku-4-5` as the
  in-code override for short classification work.

- **2026-08-07 · Steps 4–6 · `pulse.inSalonNow` and `pulse.roomsInUse` are 0.**
  Both are live-floor numbers owned by the session state machine (step 7). The brief
  renders the rows; the values fill in when that lands.
