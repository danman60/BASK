import 'server-only';

import { ensureDemoState } from '@bask/api';
import { toDateOnly, type ConsentTier, type DateOnly } from '@bask/core';
import { db } from '@bask/db';
import { HERO_SALON_ID } from '@bask/db/fixtures';

/**
 * Who "we" are on a salon-facing surface, and what day it is.
 *
 * No auth until M3 (IMPLEMENTATION_SPEC §7 non-goal), so the salon is the hero
 * fixture id and the date is the demo clock's `virtual_today`. Both come from
 * code that already exists — `ensureDemoState` (packages/api/demo/clock) and
 * `HERO_SALON_ID` (packages/db/fixtures) — so Lane 4 cannot drift from the
 * clock the Presenter Panel drives.
 */

export interface DemoSalonContext {
  salonId: string;
  salonName: string;
  timezone: string;
  currency: string;
  region: string | null;
  /** Demo-clock today, `YYYY-MM-DD`. */
  today: DateOnly;
  /** Consent tier — Peers is only offered to salons that take part. */
  consentTier: ConsentTier;
}

/** Demo-clock today. The column is a bare `date`; Prisma returns UTC midnight. */
export async function readVirtualToday(): Promise<DateOnly> {
  const state = await ensureDemoState(db);
  return toDateOnly(state.virtualToday, 'UTC');
}

export async function getDemoSalon(): Promise<DemoSalonContext> {
  const [salon, today] = await Promise.all([
    db.salon.findUnique({
      where: { id: HERO_SALON_ID },
      include: { consentProfile: true },
    }),
    readVirtualToday(),
  ]);

  if (!salon) {
    throw new Error(
      'The demo salon is missing. Run `pnpm demo:reset` before opening this screen.',
    );
  }

  return {
    salonId: salon.id,
    salonName: salon.name,
    timezone: salon.timezone,
    currency: 'CAD',
    region: salon.region,
    today,
    consentTier: (salon.consentProfile?.tier ?? 'benchmarks') as ConsentTier,
  };
}
