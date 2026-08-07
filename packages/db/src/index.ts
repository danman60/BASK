/**
 * @bask/db — Prisma schema, migrations, fixture generators, demo pipeline ports.
 *
 * Every object lives in the dedicated Postgres schema `bask` on the shared CC&SS
 * Supabase project. Nothing this package owns may touch `public` or any other
 * app's schema (IMPLEMENTATION_SPEC §1.2).
 */

/** Postgres schema that owns every table in this product. */
export const DB_SCHEMA = 'bask';

export { createPrismaClient, loadDbEnv, type ClientOptions, type PrismaClient } from './client';
export { WINDOWS, buildFacts, type FactsInput } from './facts';
export { createPrismaPipelinePorts } from './ports';
