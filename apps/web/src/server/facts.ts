import 'server-only';

import { ensureDemoState } from '@bask/api';
import type { DateOnly, SalonFacts } from '@bask/core';
import { createPrismaPipelinePorts, db } from '@bask/db';

import type { DemoSalonContext } from './salon';

/**
 * The M0 rollup, for a Lane 4 screen.
 *
 * This does not query anything itself — it calls the SAME
 * `createPrismaPipelinePorts(...).buildSalonFacts` the nightly insight sweep
 * uses. Inventory days-remaining, the utilisation heatmap and the staff
 * attachment table are therefore literally the arithmetic that produced the
 * insight cards. A screen that recomputed them its own way would eventually
 * disagree with the card that sent the owner there.
 *
 * Sell-through is computed, never stored (IMPLEMENTATION_SPEC §2):
 *   dailyVelocity  = (units sold in the trailing 30 days + back-bar use) / 30
 *   daysRemaining  = onHand / dailyVelocity
 * over real `sale_line` and `stock_event` rows.
 */
export async function loadSalonFacts(salon: DemoSalonContext): Promise<SalonFacts> {
  const state = await ensureDemoState(db);
  const ports = createPrismaPipelinePorts(db, { seed: state.seed });

  return ports.buildSalonFacts(
    {
      id: salon.salonId,
      name: salon.salonName,
      // Only used by narrative generation; facts never reads it.
      ownerFirstName: '',
      currency: salon.currency,
      timezone: salon.timezone,
      isHero: true,
    },
    salon.today as DateOnly,
  ) as Promise<SalonFacts>;
}
