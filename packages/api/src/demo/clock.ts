/**
 * Prisma-backed `DemoClockStore` — the adapter between `packages/core`'s pure
 * pipeline port and the `bask.demo_state` singleton.
 *
 * MERGE NOTE: this is the ONE file that touches the step 4 lane's pipeline
 * signature. If `runAdvancePipeline` lands with a different shape, fix it here and
 * nothing else in step 3 / step 10 has to move.
 */

import type { DemoClockStore } from '@bask/core';
import type { PrismaClient } from '@bask/db';

/** `demo_state` is a singleton; the row id is fixed. */
export const DEMO_STATE_ID = 'default';

/**
 * Day-zero for the demo clock. STUB until M0 step 4 — the fixture generator owns
 * the real day-zero (it must line up with the 90 days of seeded visits/sales in
 * PRODUCT_SPEC §20), so this resets to the real current date in Eastern, which is
 * the closest honest answer before fixtures exist.
 */
export function stubDayZero(now: Date = new Date()): Date {
  const eastern = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return new Date(`${eastern}T00:00:00.000Z`);
}

export function createPrismaDemoClockStore(db: PrismaClient): DemoClockStore {
  return {
    async getVirtualToday() {
      const row = await db.demoState.findUnique({
        where: { id: DEMO_STATE_ID },
        select: { virtualToday: true },
      });
      return row?.virtualToday ?? null;
    },

    async setVirtualToday(next, meta) {
      await db.demoState.upsert({
        where: { id: DEMO_STATE_ID },
        update: {
          virtualToday: next,
          lastAdvancedAt: meta.advancedAt,
          lastPipelineRunAt: meta.pipelineRunAt,
        },
        create: {
          id: DEMO_STATE_ID,
          virtualToday: next,
          lastAdvancedAt: meta.advancedAt,
          lastPipelineRunAt: meta.pipelineRunAt,
        },
      });
    },

    async resetToDayZero() {
      const dayZero = stubDayZero();
      await db.demoState.upsert({
        where: { id: DEMO_STATE_ID },
        update: { virtualToday: dayZero, lastAdvancedAt: null, lastPipelineRunAt: null },
        create: { id: DEMO_STATE_ID, virtualToday: dayZero },
      });
      return dayZero;
    },
  };
}

/**
 * Reads the singleton, creating it at day-zero if a fixture reset has never run.
 * Idempotent — safe for `demo.state` to call on every request, which is what lets
 * the /dev/api harness prove a real round-trip before the fixture lane lands.
 */
export async function ensureDemoState(db: PrismaClient) {
  const existing = await db.demoState.findUnique({ where: { id: DEMO_STATE_ID } });
  if (existing) return existing;

  return db.demoState.upsert({
    where: { id: DEMO_STATE_ID },
    update: {},
    create: {
      id: DEMO_STATE_ID,
      virtualToday: stubDayZero(),
      notes: 'Created by demo.state (M0 step 3) — replaced by the step 4 fixture reset.',
    },
  });
}
