import 'server-only';

import { readVirtualToday, resolveSalon } from '@bask/api';
import { type ConsentTier, type DateOnly } from '@bask/core';

export { readVirtualToday };

/**
 * Who "we" are on a salon-facing surface, and what day it is.
 *
 * No auth until M3 (IMPLEMENTATION_SPEC §7 non-goal), so the salon comes from
 * `?salon=` and the date from the demo clock's `virtual_today`.
 *
 * THE BUG THIS FILE USED TO BE: `getDemoSalon()` took no argument and was
 * hard-pinned to `HERO_SALON_ID`, while Today resolved `?salon=` properly. So
 * `/insights?salon=aurora-westside` rendered Insights for Sunset Ridge — two
 * different salons on two screens of one session, from one deep link. Same
 * class of bug as commit `e426f3d` ("the salon switcher moved the chrome but
 * never the data"); it recurred because that fix landed in one of three copies
 * of the resolver. There is now one copy (`packages/api/src/salon-scope.ts`)
 * and this is a thin shape over it.
 *
 * `salonParam` is optional and omitting it still resolves the hero salon, so the
 * server actions that have no URL to read keep working exactly as before.
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

export async function getDemoSalon(salonParam?: string | null): Promise<DemoSalonContext> {
  const [salon, today] = await Promise.all([resolveSalon(salonParam), readVirtualToday()]);

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
    /**
     * Already resolved through `@bask/core/consent` — a salon with no
     * `consent_profile` row lands on the CLOSED tier, not on `benchmarks`.
     */
    consentTier: salon.consentTier,
  };
}
