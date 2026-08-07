# @bask/db

Prisma schema and migrations for Bask/Compass.

## The one rule

Everything lives in the dedicated Postgres schema **`bask`** on the **shared CC&SS
Supabase project** (`netbsyvxrhrqxyzqflmd`). That database also hosts CommandCentered,
StudioSync, CoverWise, Ink&Oracle, Libretto, PoolParty and 574 `public` tables belonging
to other live apps. Nothing here may create, alter, or reference anything outside `bask`,
and no foreign key crosses out of it.

`pnpm db:check` enforces this — it fails if any committed migration contains DDL that
is not explicitly qualified to `"bask"`, or that names a foreign schema. It runs as
part of `pnpm db:deploy`.

## Two connection URLs, and why

| var | port | mode | used for |
|---|---|---|---|
| `DATABASE_URL` | 6543 | pgbouncer, transaction pooling | runtime queries only |
| `DIRECT_DATABASE_URL` | 5432 | session pooling | **all** DDL / migrations / introspection |

**Prisma Migrate must never see the 6543 URL.** It takes a session-level advisory lock
before every command, and transaction-mode pooling cannot hold one, so `prisma migrate
deploy` / `status` hang forever with no error and no timeout. Verified 2026-08-07: 6543
hung past 120s, 5432 returned instantly. This is why `prisma.config.ts` — which is a
**CLI-only** config, not a runtime one — points `datasource.url` at `DIRECT_DATABASE_URL`.

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

## RLS

29 of 35 tables have RLS enabled with a `salon_isolation` policy. Scope comes from the
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
