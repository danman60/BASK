/**
 * Test helpers — run the real rollup + sweep against the generated bundle,
 * with no database in the loop.
 *
 * This is the whole point of keeping `buildFacts` over plain rows: the arcs can
 * be asserted in milliseconds, and a broken arc fails in CI rather than in a
 * pitch meeting.
 */

import { runInsightSweep, type InsightDraft, type SalonFacts } from '@bask/core';

import {
  DAY_ZERO,
  HERO_SALON_ID,
  generateFixtures,
  type FixtureBundle,
} from '../fixtures/index';
import { HERO_SALON, OPEN_HOURS, SLOTS_PER_ROOM_HOUR } from '../fixtures/constants';
import { buildFacts } from '../src/facts';

let cachedBundle: FixtureBundle | null = null;

/** Generating 36k rows takes ~2s — do it once per test process. */
export function bundle(): FixtureBundle {
  cachedBundle ??= generateFixtures();
  return cachedBundle;
}

export function heroFacts(today = DAY_ZERO, source: FixtureBundle = bundle()): SalonFacts {
  return buildFacts({
    salonId: HERO_SALON_ID,
    salonName: HERO_SALON.name,
    today,
    currency: 'CAD',
    timezone: HERO_SALON.timezone,
    openHours: OPEN_HOURS,
    slotsPerRoomHour: SLOTS_PER_ROOM_HOUR,
    visits: source.visits,
    sessions: source.sessions,
    sales: source.sales,
    saleLines: source.saleLines,
    staff: source.staff.filter((s) => s.salonId === HERO_SALON_ID),
    customers: source.customers,
    memberships: source.memberships,
    products: source.products,
    inventory: source.inventoryLevels,
    services: source.services,
    rooms: source.rooms,
    stockEvents: source.stockEvents,
  });
}

export function heroSweep(today = DAY_ZERO): InsightDraft[] {
  return runInsightSweep(heroFacts(today), { maxInsights: 20 }).allDrafts;
}

export function draftOfType(drafts: InsightDraft[], type: string): InsightDraft | undefined {
  return drafts.find((d) => d.type === type);
}
