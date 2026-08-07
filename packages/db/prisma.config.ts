import path from 'node:path';

import { defineConfig, env } from 'prisma/config';

// Prisma 7 no longer auto-loads `.env`. Node 20.12+ can do it natively; the file
// is absent in CI (vars come from the environment), so a miss is not fatal.
try {
  process.loadEnvFile(path.join(import.meta.dirname, '.env'));
} catch {
  // no local .env — rely on the ambient environment
}

/**
 * Prisma CLI config for the SHARED CC&SS Supabase project (`migrate deploy`,
 * `migrate status`, `generate`). This file configures the CLI only — the runtime
 * PrismaClient gets its own connection, so `DATABASE_URL` is deliberately not
 * used here.
 *
 * Every object this package owns lives in the dedicated `bask` Postgres schema,
 * never `public` (IMPLEMENTATION_SPEC §1.2).
 *
 * Why DIRECT_DATABASE_URL (session pooler, :5432) and never DATABASE_URL
 * (pgbouncer transaction pooler, :6543): Prisma Migrate takes a session-level
 * advisory lock before every command. Transaction-mode pooling cannot hold one,
 * so `migrate deploy`/`status` hang forever against :6543 with no error. Verified
 * 2026-08-07 — :6543 hung past 120s, :5432 returned instantly.
 *
 * The `?schema=bask` param pins the connection search_path to `bask`, which is
 * what keeps Prisma's `_prisma_migrations` bookkeeping table inside `bask`
 * instead of leaking it into the shared `public` schema.
 *
 * IMPORTANT: that same param makes Prisma treat `bask` as the implicit default
 * schema, so SQL *generated* through this config comes out UNQUALIFIED
 * (`CREATE TABLE "org"`) and would land wherever search_path happens to point.
 * On a shared database that is unacceptable. Author new migrations with
 * `prisma.config.migrations.ts` (`pnpm db:migration:new`), which omits the param
 * and emits fully-qualified `"bask"."org"` DDL.
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  datasource: {
    url: env('DIRECT_DATABASE_URL'),
  },
});
