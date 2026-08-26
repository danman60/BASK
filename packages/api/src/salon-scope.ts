/**
 * Salon scope — the ONE place a `?salon=` value becomes a salon.
 *
 * WHY IT LIVES IN `packages/api` AND NOT `apps/web`:
 * the dependency arrow only points one way. `apps/web/package.json` lists
 * `@bask/api` as a dependency; nothing in `packages/api` may import from
 * `apps/web` without inverting that and breaking the package build. tRPC's
 * request context needs this resolution too, so the shared home has to be the
 * package both sides can already see — which is this one. It needs only
 * `@bask/db` + `@bask/db/fixtures`, both of which `packages/api` already
 * depends on, so nothing new enters the graph.
 *
 * WHAT IT REPLACES (three copies of the same logic, M1):
 *   - `apps/web/src/lib/salon-scope.ts:51`  `resolveSalonScope`
 *   - `packages/api/src/context.ts:86`       inline, same UUID guard
 *   - `apps/web/src/server/salon.ts:36`      `getDemoSalon`, hero-pinned, no `?salon=`
 *
 * The third one is why this matters and not just tidiness. `getDemoSalon` was
 * hard-pinned to `HERO_SALON_ID` and ignored `?salon=` entirely, so a deep link
 * like `/insights?salon=aurora-westside` rendered Today as Aurora and Insights
 * as Sunset Ridge — two different salons on two screens of one session. That is
 * the same class of bug as commit `e426f3d` ("the salon switcher moved the
 * chrome but never the data"), and the reason it came back is that the fix
 * landed in one copy of the resolver while two others carried on regardless.
 * One resolver, so there is nowhere for the next one to hide.
 *
 * Resolution order, most explicit first:
 *   `?salon=<slug|id>` → the hero salon (Sunset Ridge) → the oldest salon → null
 *
 * The hero fallback is deliberate and is NOT "first row by createdAt". M0 seeded
 * the 12-salon Compass portfolio alongside Sunset Ridge, and the oldest of those
 * is Ironwood — a portfolio account with zero customers. Falling back to it
 * pointed every Bask surface at an empty tenant (found in M1 Lane 3: segments
 * returned 0 of 420 customers). "Oldest row" survives only as a last resort for
 * a database seeded some other way.
 *
 * No auth. Scope comes from the URL, exactly as the Presenter Panel drives it
 * (IMPLEMENTATION_SPEC §1.2 — auth is an explicit non-goal until M3).
 */

import { resolveConsentTier, toDateOnly, type ConsentTier, type DateOnly } from '@bask/core';
import { db as defaultDb, type PrismaClient } from '@bask/db';
import { HERO_SALON_ID } from '@bask/db/fixtures';

import { ensureDemoState } from './demo/clock';

/** The query-string key the Presenter Panel and every deep link use. */
export const SALON_PARAM = 'salon';

/**
 * One salon, resolved. The select is the union of what the three former
 * resolvers each needed, so both the tRPC context and the app shell can be built
 * from a single round trip rather than each re-querying the salon they already
 * have.
 */
export interface ResolvedSalon {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  orgId: string;
  region: string | null;
  /**
   * Consent tier, read through `@bask/core/consent`. A salon with no
   * `consent_profile` row resolves to the CLOSED tier (`private`) — never to a
   * sharing tier. See `DEFAULT_CONSENT_TIER` for why.
   */
  consentTier: ConsentTier;
}

const SELECT = {
  id: true,
  slug: true,
  name: true,
  timezone: true,
  orgId: true,
  region: true,
  consentProfile: { select: { tier: true } },
} as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A `where` that matches a slug OR an id — but only asks Postgres about `id`
 * when the value could actually BE one.
 *
 * `salon.id` is `@db.Uuid`, and Postgres does not shrug at a non-UUID compared
 * against it: it aborts the whole query with `invalid input syntax for type
 * uuid`. An unguarded `{ OR: [{ slug }, { id }] }` therefore 500'd every
 * `?salon=<slug>` link, including the ones the consent demo depends on. The OR
 * was right; the unguarded cast was not. (Fixed once in M1 lane 5 — in one copy
 * of the resolver. Hence this file.)
 */
export function salonWhere(value: string) {
  return UUID.test(value) ? { OR: [{ slug: value }, { id: value }] } : { slug: value };
}

type SalonRow = {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  orgId: string;
  region: string | null;
  consentProfile: { tier: ConsentTier } | null;
};

function shape(row: SalonRow): ResolvedSalon {
  const { consentProfile, ...rest } = row;
  return { ...rest, consentTier: resolveConsentTier(consentProfile) };
}

/**
 * Resolve `?salon=<slug|id>`, else the hero salon, else whatever exists, else
 * null (a database with no salons seeded yet).
 */
export async function resolveSalon(
  salonParam?: string | null,
  client: PrismaClient = defaultDb,
): Promise<ResolvedSalon | null> {
  const row =
    (salonParam
      ? await client.salon.findFirst({ where: salonWhere(salonParam), select: SELECT })
      : await client.salon.findUnique({ where: { id: HERO_SALON_ID }, select: SELECT })) ??
    (await client.salon.findFirst({ orderBy: { createdAt: 'asc' }, select: SELECT }));

  return row ? shape(row as SalonRow) : null;
}

/**
 * Salons sharing an org — >1 turns on the app shell's comparison card.
 *
 * Deliberately NOT folded into `resolveSalon`: the tRPC context resolves a salon
 * on every single request and has no use for siblings, so making it pay for a
 * second query would be a tax on the whole API to serve one piece of chrome.
 * The thing that was duplicated is the RESOLUTION ORDER, and that is what this
 * module owns.
 */
export async function loadSalonSiblings(
  orgId: string,
  client: PrismaClient = defaultDb,
): Promise<Array<{ id: string; name: string; city: string | null }>> {
  return client.salon.findMany({
    where: { orgId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, city: true },
  });
}

/**
 * The demo clock's virtual today, as `YYYY-MM-DD`.
 *
 * Also formerly duplicated (`apps/web/src/lib/salon-scope.ts:73` read
 * `demo_state` directly; `apps/web/src/server/salon.ts:31` went through
 * `ensureDemoState`). The `ensureDemoState` path wins because it CREATES the row
 * when it is missing, so a fresh database renders instead of silently falling
 * back to the wall clock and showing a date the fixtures know nothing about.
 *
 * The column is a bare `date`, so Prisma hands it back as UTC midnight — it is
 * already calendar-local and converting it would shift the day.
 */
export async function readVirtualToday(client: PrismaClient = defaultDb): Promise<DateOnly> {
  const state = await ensureDemoState(client);
  return toDateOnly(state.virtualToday, 'UTC');
}
