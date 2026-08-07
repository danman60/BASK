/**
 * Prisma client for scripts and the server.
 *
 * Two URLs, and the choice matters (see packages/db/README.md):
 *   DATABASE_URL         :6543 pgbouncer, transaction pooling — runtime queries
 *   DIRECT_DATABASE_URL  :5432 session pooling — DDL, migrations, bulk seeding
 *
 * The demo scripts use the direct URL: they run thousands of inserts inside
 * long transactions, which transaction-mode pooling handles badly.
 */

import path from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client';

/** Prisma 7 no longer auto-loads `.env`; CI supplies vars via the environment. */
export function loadDbEnv(): void {
  try {
    process.loadEnvFile(path.join(import.meta.dirname, '..', '.env'));
  } catch {
    // No local .env — rely on the ambient environment.
  }
}

export interface ClientOptions {
  /** Use the session pooler (:5432). Required for seeding and migrations. */
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
        : 'DATABASE_URL is not set.',
    );
  }

  // Prisma 7 connects through a driver adapter rather than a datasource URL.
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
    log: options.log ? ['warn', 'error'] : ['error'],
  });
}

export type { PrismaClient };
