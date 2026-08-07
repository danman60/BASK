/**
 * Prisma-backed demo-clock helpers — the adapter between `bask.demo_state` and the
 * router.
 *
 * The step-3 stub that used to live here (a `DemoClockStore` port plus a
 * `stubDayZero` guess) is gone: M0 step 4 landed the real fixture generator, so
 * day-zero is `DAY_ZERO` from `@bask/db/fixtures` — it must line up with the 90
 * days of seeded visits and sales, and a "today in Eastern" guess would not.
 */

import { DAY_ZERO, DEFAULT_SEED } from '@bask/db/fixtures';
import type { PrismaClient } from '@bask/db';

/** `demo_state` is a singleton; the row id is fixed. */
export const DEMO_STATE_ID = 'default';

/** Fixture day-zero as a UTC-midnight Date, which is how the column stores it. */
export function fixtureDayZero(): Date {
  return new Date(`${DAY_ZERO}T00:00:00.000Z`);
}

/**
 * Reads the singleton, creating it at fixture day-zero if `demo:reset` has never
 * run. Idempotent — safe for `demo.state` to call on every request.
 */
export async function ensureDemoState(db: PrismaClient) {
  const existing = await db.demoState.findUnique({ where: { id: DEMO_STATE_ID } });
  if (existing) return existing;

  return db.demoState.upsert({
    where: { id: DEMO_STATE_ID },
    update: {},
    create: {
      id: DEMO_STATE_ID,
      virtualToday: fixtureDayZero(),
      seed: DEFAULT_SEED,
      notes: 'Created on demand — run `pnpm demo:reset` to seed the full dataset.',
    },
  });
}
