/**
 * Prisma access for the `bask` schema on the shared CC&SS project.
 *
 * Two consumers with different needs, so this file exports both shapes:
 *   `db`                  — the app singleton, HMR-safe, pooled runtime queries
 *   `createPrismaClient`  — a factory for scripts, which can ask for the direct URL
 *
 * Two URLs, and the choice matters (see packages/db/README.md):
 *   DATABASE_URL         :6543 pgbouncer, transaction pooling — runtime queries
 *   DIRECT_DATABASE_URL  :5432 session pooling — DDL, migrations, bulk seeding
 *
 * Demo/seed scripts must pass `{ direct: true }`: they run thousands of inserts
 * inside long transactions, which transaction-mode pooling handles badly.
 *
 * Migrations are configured entirely in `prisma.config.ts` — nothing in this file
 * may be used by the Prisma CLI. The generated client is schema-qualified
 * (`multiSchema` with `schemas = ["bask"]`), so queries name `"bask"."…"` and do
 * not depend on `search_path`.
 */

import path from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client';

export type { PrismaClient } from '../generated/prisma/client';

/**
 * Prisma 7 no longer auto-loads `.env`, and Next.js only loads env files sitting
 * beside the app it is serving — so `apps/web` would otherwise need its own copy of
 * the database credentials. Walking up from the working directory to the
 * workspace's single `packages/db/.env` keeps `pnpm dev` and the demo scripts
 * working from any package with the secret stored exactly once.
 *
 * Local development only: in CI and on Vercel the vars are already in the
 * environment, so this returns immediately and never overrides an ambient value.
 */
export function loadDbEnv(): void {
  if (process.env.DATABASE_URL && process.env.DIRECT_DATABASE_URL) return;
  if (typeof process.loadEnvFile !== 'function') return;

  let dir = process.cwd();
  for (let depth = 0; depth < 6; depth += 1) {
    try {
      process.loadEnvFile(path.join(dir, 'packages', 'db', '.env'));
      return;
    } catch {
      const parent = path.dirname(dir);
      if (parent === dir) return;
      dir = parent;
    }
  }
}

export interface ClientOptions {
  /** Use the session pooler (:5432). Required for seeding and bulk writes. */
  direct?: boolean;
  log?: boolean;
}

export function createPrismaClient(options: ClientOptions = {}): PrismaClient {
  loadDbEnv();

  const url = options.direct
    ? process.env.DIRECT_DATABASE_URL
    : (process.env.DATABASE_URL ?? process.env.DIRECT_DATABASE_URL);

  if (!url) {
    throw new Error(
      options.direct
        ? 'DIRECT_DATABASE_URL is not set. Seeding needs the :5432 session pooler.'
        : 'DATABASE_URL is not set. Copy packages/db/.env.example to packages/db/.env (values in ~/.env.keys).',
    );
  }

  // Prisma 7 connects through a driver adapter — `datasourceUrl` is gone. The
  // runtime pool sits behind pgbouncer's transaction pooler, so it stays small and
  // must never issue named prepared statements (node-postgres does not by default).
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url, ...(options.direct ? {} : { max: 10 }) }),
    log: options.log ?? process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

// Next.js dev server re-evaluates modules on every HMR pass; without the global
// cache each edit leaks a connection pool against the shared pooler.
const globalForPrisma = globalThis as unknown as { __baskPrisma?: PrismaClient };

export const db: PrismaClient = globalForPrisma.__baskPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__baskPrisma = db;
}
