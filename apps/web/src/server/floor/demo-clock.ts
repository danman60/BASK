import 'server-only';

import { resolveClock, toDateOnly, type Clock, type DateOnly } from '@bask/core';

import { prisma } from './prisma';

/**
 * The Floor runs on two clocks at once, and conflating them is the bug this file
 * exists to prevent.
 *
 * **Real time** drives countdowns. A session that started 90 seconds ago has 90
 * seconds fewer on it, and no demo convenience may change that — the timer on
 * the wall and the timer on the board have to agree.
 *
 * **Demo time** (`demo_state.virtual_today`) decides which calendar day the Floor
 * is looking at: which bookings are "today", which sales count toward the shift,
 * which day the handoff covers. `demo:advance` moves it; the countdowns do not
 * care.
 *
 * So live rows written from the Floor — Visits, Sales, SaleLines — get
 * `demoInstant()`: the demo's calendar day at the real wall-clock time of day.
 * That is what keeps "sell a lotion → today's attachment moves" true after the
 * clock has been advanced five days for the pitch.
 */

export interface FloorClock {
  /** The demo's calendar day. */
  today: DateOnly;
  /** Real wall clock — what the topbar shows and what countdowns run on. */
  realNow: Date;
  /**
   * The instant to stamp on rows the Floor writes now: the demo's day, at the
   * real time of day. Equal to `realNow` when the demo clock is not running.
   */
  demoNow: Date;
  kind: Clock['kind'];
  zone: string;
}

export async function readFloorClock(): Promise<FloorClock> {
  const demoState = await prisma.demoState.findUnique({
    where: { id: 'default' },
    select: { virtualToday: true },
  });
  const clock = resolveClock(demoState);
  const realNow = new Date();
  return {
    today: clock.today(),
    realNow,
    demoNow: shiftToDay(realNow, clock.today(), clock.zone),
    kind: clock.kind,
    zone: clock.zone,
  };
}

/**
 * Move an instant onto `day`, keeping its time of day.
 *
 * Done by whole-day arithmetic on the UTC instant rather than by rebuilding the
 * timestamp from parts, so it never invents a wall-clock time that does not
 * exist (spring-forward) or one that exists twice (fall-back).
 */
export function shiftToDay(instant: Date, day: DateOnly, zone: string): Date {
  const currentDay = toDateOnly(instant, zone);
  if (currentDay === day) return instant;
  const dayMs = 86_400_000;
  const from = Date.parse(`${currentDay}T00:00:00Z`);
  const to = Date.parse(`${day}T00:00:00Z`);
  return new Date(instant.getTime() + Math.round((to - from) / dayMs) * dayMs);
}
