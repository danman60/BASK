/**
 * Runtime Prisma client for the `bask` schema on the shared CC&SS project.
 *
 * Connection: `DATABASE_URL` (pgbouncer transaction pooler, :6543). Migrations use
 * `DIRECT_DATABASE_URL` and are configured entirely in `prisma.config.ts` — nothing
 * in this file may be used by the CLI (see packages/db/README.md).
 *
 * The generated client is schema-qualified (`multiSchema` with `schemas = ["bask"]`),
 * so every query names `"bask"."…"` explicitly and does not depend on `search_path`.
 */

import path from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client';

export type { PrismaClient } from '../generated/prisma/client';

/**
 * Prisma 7 no longer auto-loads `.env`, and Next.js only loads env files sitting
 * beside the app it is serving — so `apps/web` would otherwise need its own copy of
 * the database credentials. Walking up from the working directory to the
 * workspace's single `packages/db/.env` keeps `pnpm dev` working from any package
 * with the secret stored exactly once.
 *
 * Local development only: in CI and on Vercel `DATABASE_URL` is already in the
 * environment, so this returns immediately and never overrides an ambient value.
 */
function loadLocalEnv(): void {
  if (process.env.DATABASE_URL) return;
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

function createClient(): PrismaClient {
  loadLocalEnv();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy packages/db/.env.example to packages/db/.env (values in ~/.env.keys).',
    );
  }

  // Prisma 7 connects through a driver adapter — `datasourceUrl` is gone. The pool
  // sits behind Supabase's pgbouncer transaction pooler, so it stays small and must
  // never issue named prepared statements (node-postgres does not by default).
  const adapter = new PrismaPg({ connectionString, max: 10 });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

// Next.js dev server re-evaluates modules on every HMR pass; without the global
// cache each edit leaks a connection pool against the shared pooler.
const globalForPrisma = globalThis as unknown as { __baskPrisma?: PrismaClient };

export const db: PrismaClient = globalForPrisma.__baskPrisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__baskPrisma = db;
}
