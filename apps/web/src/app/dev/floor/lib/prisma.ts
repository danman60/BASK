import 'server-only';

/**
 * The floor harness now uses the shared client from `@bask/db`.
 *
 * This file used to build its own `PrismaClient` so M0 lane C could land without
 * touching lane A's package — its own note said it would "collapse into an import"
 * once that landed. It has. Keeping the local copy cost a real bug: it read
 * `process.env.DATABASE_URL` directly, and Next only loads env files sitting beside
 * the app it serves, so `/dev/floor` 500'd on a missing DATABASE_URL while every
 * other route worked. The shared client walks up to the workspace's single
 * `packages/db/.env`.
 *
 * Re-exported under the original name so no call site changed.
 */
export { db as prisma } from '@bask/db';
export type { PrismaClient } from '@bask/db';
