import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@bask/db/client';

/**
 * Runtime Prisma client for the M0 step 7 dev harness.
 *
 * Deliberately local to `/dev/floor` so this lane does not collide with the
 * shared context wiring in `packages/api` (lane A, step 3). When that lands,
 * this file collapses into an import of it.
 *
 * `DATABASE_URL` is the pgbouncer pooler on :6543 — correct for runtime queries.
 * Migrations must never use it (`packages/db/README.md`); nothing here migrates.
 *
 * The client is cached on `globalThis` because Turbopack re-evaluates server
 * modules on every edit in dev, and a fresh pool per edit exhausts the pooler
 * within a few saves.
 */

const GLOBAL_KEY = Symbol.for('bask.dev.floor.prisma');

type Cache = { client: PrismaClient };
const store = globalThis as unknown as Record<symbol, Cache | undefined>;

function create(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy the repo .env.example to apps/web/.env.local and fill it in.',
    );
  }
  // Prisma 7 requires a driver adapter; there is no built-in engine connection.
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

function client(): PrismaClient {
  return (store[GLOBAL_KEY] ??= { client: create() }).client;
}

/**
 * Lazy on purpose, via a Proxy so every existing `prisma.model.find…` call site
 * stays unchanged.
 *
 * Eagerly calling `create()` at module scope throws during `next build`'s page-data
 * collection: the build imports route modules with no runtime env, so a missing
 * DATABASE_URL failed the whole build even though nothing was querying. Deferring
 * to first property access keeps the throw where it belongs — at request time, in a
 * handler that can report it.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get: (_t, prop, receiver) => Reflect.get(client(), prop, receiver),
  has: (_t, prop) => Reflect.has(client(), prop),
});
