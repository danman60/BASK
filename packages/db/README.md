# @bask/db

Prisma schema, migrations, and the demo harness fixtures.

## The one rule

Everything lives in the dedicated Postgres schema **`bask`** on the **shared CC&SS
Supabase project** (`netbsyvxrhrqxyzqflmd`). That database also hosts CommandCentered,
StudioSync, CoverWise, Ink&Oracle, Libretto, PoolParty and 574 `public` tables belonging
to other live apps. Nothing here may create, alter, or reference anything outside `bask`,
and no foreign key crosses out of it.

`pnpm db:check` enforces this — it fails if any committed migration contains DDL that
is not explicitly qualified to `"bask"`, or that names a foreign schema. It runs as
part of `pnpm db:deploy`.

**`demo:reset` deletes only `bask` rows**, through the Prisma client, model by model.
There is no raw SQL, no `TRUNCATE` and no `CASCADE` anywhere in that script — on a
shared database those are how you take down someone else's app.

## Two connection URLs, and why

| var | port | mode | used for |
|---|---|---|---|
| `DATABASE_URL` | 6543 | pgbouncer, transaction pooling | runtime queries only |
| `DIRECT_DATABASE_URL` | 5432 | session pooling | **all** DDL / migrations / seeding |

**Prisma Migrate must never see the 6543 URL.** It takes a session-level advisory lock
before every command, and transaction-mode pooling cannot hold one, so `prisma migrate
deploy` / `status` hang forever with no error and no timeout. Verified 2026-08-07: 6543
hung past 120s, 5432 returned instantly. This is why `prisma.config.ts` — which is a
**CLI-only** config, not a runtime one — points `datasource.url` at `DIRECT_DATABASE_URL`.

The demo scripts also use the direct URL: they run thousands of inserts inside long
transactions, which transaction-mode pooling handles badly.

## Two Prisma configs, and why

| file | used by | emits |
|---|---|---|
| `prisma.config.ts` | `migrate deploy`, `migrate status`, `generate` | — |
| `prisma.config.migrations.ts` | `db:migration:new` (SQL generation only) | fully-qualified DDL |

The URLs in `prisma.config.ts` carry `?schema=bask`. That param pins the connection
search_path to `bask`, which keeps Prisma's own `_prisma_migrations` bookkeeping table
inside `bask` instead of leaking it into shared `public`.

The catch: that same param also makes Prisma treat `bask` as the *implicit default
schema*, so SQL generated through it comes out **unqualified** — `CREATE TABLE "org"`
instead of `CREATE TABLE "bask"."org"`. On this database that lands 34 tables in
`public`. `prisma.config.migrations.ts` strips the param, which makes Prisma qualify
every statement. Only qualified SQL may be committed.

## Authoring a migration

```bash
pnpm db:migration:new > prisma/migrations/<timestamp>_<name>/migration.sql
pnpm db:check          # fails on unqualified or foreign-schema DDL
pnpm db:deploy         # runs db:check, then migrate deploy
```

Do not use `prisma migrate dev` — it regenerates SQL through the wrong config and would
need a shadow database this project does not have.

**`db:migration:new` needs `prisma/migrations/migration_lock.toml` to exist.** Without
it Prisma cannot tell which connector the directory targets and fails with "Could not
determine the connector from the migrations directory". It also requires a shadow
database for `--from-migrations`; where that is unavailable, hand-author the SQL (see
`20260807000002_daybreak_brief`) and let `db:check` police the qualification.

## RLS

30 of 36 tables have RLS enabled with a `salon_isolation` policy. Scope comes from the
`app.salon_id` session GUC, read by `bask.current_salon_id()`; it returns NULL when
unset, so an unscoped connection sees nothing rather than everything. The tRPC context
(M0 step 3) is responsible for setting that GUC per request.

The service role carries `BYPASSRLS`, so M0–M2 demo work is unaffected. Auth hardening
lands in M3.

Six tables intentionally have no RLS — they hold global reference or demo-harness data
with no tenant rows: `room_type`, `segment`, `playbook`, `uvalux_catalog_item`,
`demo_state`, `_prisma_migrations`.

Nullable `salon_id` on `staff`, `product` and `barcode` means "global" (UVALUX-side
staff, catalogue-wide products), so those policies admit `salon_id IS NULL`.

---

# The demo harness

## Commands

| command | what it does |
|---|---|
| `pnpm demo:reset` | Regenerate the whole dataset to day zero. Deletes and reseeds **bask only**. ~30s, ~36k rows. |
| `pnpm demo:advance --days N` | Move the virtual clock N days and rerun the pipeline for each day. |
| `pnpm demo:checksum` | Generate the bundle twice in-process and prove the two runs are identical. |
| `pnpm demo:dump` | Canonical JSON dump of every `bask` row, for determinism diffs. `--summary` for per-table hashes. |
| `tsx scripts/demo-arcs.ts` | Print what the rollups and detectors actually see. The tuning instrument for the story arcs. |

All four are also available from the repo root (`pnpm demo:reset`, etc.).

Useful flags:

```bash
pnpm demo:reset --seed my-seed   # a different dataset, same arcs
pnpm demo:reset --quiet          # summary only
pnpm demo:advance --days 5       # settles the staged Tuesday campaign
pnpm demo:advance --days 0       # rerun today's pipeline without moving the clock
pnpm demo:advance --offline      # never call the API; use the deterministic brief
```

## Determinism, and why it is non-negotiable

The demo has to be rehearsable. If `demo:reset` produced a slightly different dataset
each time, the numbers in the pitch would move between rehearsal and the meeting, and
`demo:verify` could not assert anything.

So the generator is deterministic from a seed. `Math.random()` and `Date.now()` are
banned everywhere under `fixtures/`:

- **IDs** are UUIDv5 over a fixed namespace and a readable name (`customer:0042`), not
  `gen_random_uuid()`.
- **Randomness** is sfc32 seeded through cyrb128 (`fixtures/rng.ts`), with named child
  streams so a tweak to staff shifts does not renumber every customer.
- **Timestamps** are all derived from `DAY_ZERO`. Every column the schema would default
  (`created_at`, `updated_at`) is set explicitly — a database-generated default is a
  non-deterministic value by definition.

Two levels of proof:

```bash
# 1. The generator (fast, ~2s)
pnpm demo:checksum

# 2. The database (the one that counts)
pnpm demo:reset --quiet && pnpm demo:dump > /tmp/a.json
pnpm demo:reset --quiet && pnpm demo:dump > /tmp/b.json
diff /tmp/a.json /tmp/b.json && echo IDENTICAL
```

The dump excludes `activity_event` and the `demo_state` columns that record *when the
pipeline last ran* — those describe the run, not the dataset.

## The pipeline

`demo:advance` moves the clock one day at a time — a five-day jump runs five passes, so
each day's campaigns settle rather than four being skipped. Per day, in this order:

```
materialise day → campaign outcomes → metric rollups → insight sweep → Daybreak
```

The order is load-bearing: campaign outcomes write visits and sales, the rollups count
them, the sweep reads the rollups, and the brief ranks the sweep.

**Simulated systems still change real state.** Advancing the clock *generates* a day of
visits, sessions and sales, and settling a campaign creates real bookings — it does not
reveal pre-baked rows. `materialiseDay` is idempotent, so rerunning a day is safe.

The pipeline's shape lives in `packages/core` (Prisma-free, so it also runs on web and
mobile); `src/ports.ts` is where that shape meets Postgres.

## The story arcs (PRODUCT_SPEC §20)

Every arc is **generated, not asserted** — the insight engine rediscovers each one from
the rows, so the numbers on the cards are arithmetic rather than copy.

| arc | how it is produced | what fires |
|---|---|---|
| Retail attachment 21% → 15% | Per-visit attachment probability ramps down over 14 days then holds at the floor for the 14 the detector measures. Two staffers (`tamsin`, `reece`) carry most of the drop. | `retail_attachment_slip` |
| Tuesday 1–5 pm soft | Hour weights damped inside the window; traffic redistributes rather than disappearing. | `soft_capacity` |
| 7 failed payments, 4 recoverable | Four memberships with one failed attempt and recent visits (gold + silver + 2×bronze = exactly **$284/mo**), three with 3–4 attempts. | `failed_payments` |
| Cabana Bronzer ~8 days out | Opening stock sized from the velocity the generated sales actually produced. | `low_stock` |
| Fiji Blend overstocked | Excluded from both retail attachment and booth consumption — no movement at all. | `overstock` |
| Spray tans +22% | Extra bookings ramped over 14 days. | `anomaly_band` |
| "Best Tuesday ever" | A campaign seeded in `scheduled` state for day zero + 5. `demo:advance --days 5` settles it into real bookings. | the day-after brief |

Tuning them: change a dial in `fixtures/constants.ts`, then run `tsx scripts/demo-arcs.ts`
to see what the detectors measure. The arc tests (`tests/arcs.test.ts`) assert each one.

Two arcs are worth understanding before touching:

- **Attachment holds a floor rather than ramping linearly.** A pure ramp would make the
  trailing 14-day average ~18%, not 15%, and the card would quote a number the owner
  could not find anywhere.
- **Spray demand is extra visits, not a heavier draw weight.** The weighted service draw
  runs against fixed room capacity, so raising spray's weight mostly reshuffles which
  services get clipped at peak hours — measured against the rows, a 60% weight lift moved
  the 14-day spray count by zero.

## Daybreak briefs

Pre-generated during `demo:advance` and stored in `daybreak_brief`. The Today surface
reads a row; it never waits on a model (IMPLEMENTATION_SPEC §0.1).

The model writes **four prose fields** and nothing else. Every figure — evidence
sentences, impact chips, pulse rows, action labels — is assembled in code from the
insight rows, so a model cannot invent a number that isn't in the database.

Three ways a brief can be produced, and all three are always valid:

- `ai` — generated, passed the guardrails.
- `cache` — `prompt_hash` matched a stored brief. **No API call at all.**
- `fallback` — no key, no network, an API error, or a guardrail violation. Deterministic,
  built from the same real numbers.

`prompt_hash` is a hash of the facts, so a day whose numbers have not changed re-serves
the stored row. That is what makes the demo airplane-mode tolerant.

## Environment

`packages/db/.env` (gitignored) needs `DATABASE_URL` and `DIRECT_DATABASE_URL`.
`ANTHROPIC_API_KEY` is optional — without it every brief takes the deterministic
fallback path and everything else works unchanged. `AI_MODEL` overrides the
sonnet-class default (IMPLEMENTATION_SPEC §1.2).

## Tests

```bash
pnpm --filter @bask/db test     # arcs + determinism (no database needed)
pnpm --filter @bask/core test   # clock, Evidence, guardrails, Daybreak
```

Both suites run against the real generator and the real detectors with no database and
no network, so a broken arc or a leaked guardrail fails in CI rather than in a meeting.
