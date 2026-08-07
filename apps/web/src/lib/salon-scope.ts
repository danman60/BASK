/**
 * Server-side salon scope for the Bask app shell. Server components only —
 * it imports the shared Prisma client, so a client import would fail the build.
 *
 * Mirrors the tRPC context's resolution order (`packages/api/src/context.ts`)
 * with ONE deliberate difference: the no-param fallback is the hero salon's
 * deterministic fixture id, not "first row by createdAt". The portfolio salons
 * seeded for Compass have no operational data, and whichever of them happens to
 * be inserted first would otherwise become the default Today page — an empty
 * screen at the top of a pitch. `HERO_SALON_ID` is stable across every
 * `demo:reset`, so this is deterministic rather than lucky.
 *
 * No auth. Scope comes from the URL, exactly as the Presenter Panel drives it
 * (IMPLEMENTATION_SPEC §1.2 — auth is an explicit non-goal until M3).
 */

import { db } from '@bask/db';
import { HERO_SALON_ID } from '@bask/db/fixtures';

export const SALON_PARAM = 'salon';

export interface SalonScope {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  orgId: string;
  /** Salons that share this salon's org — >1 turns on the comparison card. */
  siblings: Array<{ id: string; name: string; city: string | null }>;
}

const SELECT = {
  id: true,
  slug: true,
  name: true,
  timezone: true,
  orgId: true,
} as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves `?salon=<slug|id>`, else the hero salon, else whatever exists.
 *
 * The id clause is only added when the value actually looks like a UUID: `salon.id`
 * is `@db.Uuid`, and Postgres rejects `where id = 'aurora-westside'` with a type
 * error rather than returning no rows — an OR that reads as harmless takes the
 * whole page down. (`packages/api/src/context.ts` carries the same shape; flagged
 * to that owner rather than edited from this lane.)
 */
export async function resolveSalonScope(salonParam?: string): Promise<SalonScope | null> {
  const salon =
    (salonParam
      ? await db.salon.findFirst({
          where: UUID.test(salonParam) ? { id: salonParam } : { slug: salonParam },
          select: SELECT,
        })
      : await db.salon.findUnique({ where: { id: HERO_SALON_ID }, select: SELECT })) ??
    (await db.salon.findFirst({ orderBy: { createdAt: 'asc' }, select: SELECT }));

  if (!salon) return null;

  const siblings = await db.salon.findMany({
    where: { orgId: salon.orgId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, city: true },
  });

  return { ...salon, siblings };
}

/** The demo clock's virtual today, as a `YYYY-MM-DD` string. */
export async function readVirtualToday(): Promise<string> {
  const state = await db.demoState.findUnique({ where: { id: 'default' } });
  // A `@db.Date` column comes back as UTC midnight — it is already calendar-local,
  // so slicing the ISO string is correct and converting it would shift the day.
  return (state?.virtualToday ?? new Date()).toISOString().slice(0, 10);
}
