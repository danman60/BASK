/**
 * @bask/db — Prisma schema, migrations, fixture generators.
 *
 * Every object lives in the dedicated Postgres schema `bask` on the shared CC&SS
 * Supabase project. Nothing this package owns may touch `public` or any other
 * app's schema (IMPLEMENTATION_SPEC §1.2).
 *
 * Imports here are extensionless, matching the generated client's own style: these
 * packages ship TypeScript source and are always consumed through a bundler
 * (`transpilePackages` in apps/web), never by bare Node ESM.
 */

/** Postgres schema that owns every table in this product. */
export const DB_SCHEMA = 'bask';

export { db } from './client';
export type { PrismaClient } from './client';
export { withSalonScope, readSalonScope } from './scope';
export type { ScopedDb } from './scope';

/** Schema enums (StaffRole, InsightState, …) — the client-safe generated file. */
export * from '../generated/prisma/enums';
