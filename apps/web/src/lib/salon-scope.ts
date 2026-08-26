/**
 * Salon scope for the Bask app shell. Server components only — it reaches the
 * shared Prisma client through `@bask/api`, so a client import fails the build.
 *
 * THIS FILE NO LONGER RESOLVES ANYTHING. It used to carry its own copy of the
 * `?salon=` fallback chain and its own UUID guard, one of three copies that had
 * already drifted apart (the third, `getDemoSalon`, ignored `?salon=` outright
 * and put two different salons on two screens of one session). The resolver now
 * lives once, in `packages/api/src/salon-scope.ts`, where both the tRPC context
 * and this shell can reach it — `apps/web` depends on `@bask/api`, never the
 * reverse, so that is the only package both sides can share.
 *
 * What survives here is shell-shaped and shell-only: the `SalonScope` view model
 * with its sibling list, which the app chrome needs and the API does not.
 *
 * No auth. Scope comes from the URL, exactly as the Presenter Panel drives it
 * (IMPLEMENTATION_SPEC §1.2 — auth is an explicit non-goal until M3).
 */

import { loadSalonSiblings, resolveSalon } from '@bask/api';

export { SALON_PARAM, readVirtualToday } from '@bask/api';

export interface SalonScope {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  orgId: string;
  /** Salons that share this salon's org — >1 turns on the comparison card. */
  siblings: Array<{ id: string; name: string; city: string | null }>;
}

/** Resolves `?salon=<slug|id>`, else the hero salon, else whatever exists. */
export async function resolveSalonScope(salonParam?: string): Promise<SalonScope | null> {
  const salon = await resolveSalon(salonParam);
  if (!salon) return null;

  const siblings = await loadSalonSiblings(salon.orgId);

  return {
    id: salon.id,
    slug: salon.slug,
    name: salon.name,
    timezone: salon.timezone,
    orgId: salon.orgId,
    siblings,
  };
}
