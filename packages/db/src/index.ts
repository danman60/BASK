/**
 * @bask/db — Prisma schema, migrations, fixture generators.
 *
 * Every object lives in the dedicated Postgres schema `bask` on the shared CC&SS
 * Supabase project. Nothing this package owns may touch `public` or any other
 * app's schema (IMPLEMENTATION_SPEC §1.2).
 */

/** Postgres schema that owns every table in this product. */
export const DB_SCHEMA = 'bask';
