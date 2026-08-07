/**
 * Demo Harness router — the Presenter Panel's whole backend (IMPLEMENTATION_SPEC
 * §0.1, §1.4). Public procedures on purpose: the panel is hidden behind a hotkey,
 * not behind a role, and the presenter may be switched to any role when they use it.
 */

import { runAdvancePipeline, runResetPipeline } from '@bask/core';
import { z } from 'zod';

import { createPrismaDemoClockStore, ensureDemoState } from '../demo/clock';
import { DEMO_ROLES } from '../roles';
import { publicProcedure, router } from '../trpc';

/** Serialised clock state — one shape for `state`, `advance` and `reset`. */
function clockPayload(state: {
  id: string;
  virtualToday: Date;
  seed: string;
  lastAdvancedAt: Date | null;
  lastPipelineRunAt: Date | null;
  notes: string | null;
}) {
  return {
    id: state.id,
    virtualToday: state.virtualToday,
    seed: state.seed,
    lastAdvancedAt: state.lastAdvancedAt,
    lastPipelineRunAt: state.lastPipelineRunAt,
    notes: state.notes,
  };
}

export const demoRouter = router({
  /**
   * THE step 3 acceptance round-trip: reads `bask.demo_state` and reports the
   * request's resolved scope alongside it.
   */
  state: publicProcedure.query(async ({ ctx }) => {
    const state = await ensureDemoState(ctx.db);
    const salonCount = await ctx.db.salon.count();

    return {
      clock: clockPayload(state),
      scope: {
        role: ctx.role,
        salonId: ctx.salonId,
        salonSlug: ctx.salonSlug,
        availableRoles: DEMO_ROLES,
      },
      dataset: {
        salonCount,
        /** No fixtures until M0 step 4 — the panel says so rather than looking broken. */
        seeded: salonCount > 0,
      },
    };
  }),

  /** Moves the virtual clock forward and runs the (stubbed) advance pipeline. */
  advance: publicProcedure
    .input(z.object({ days: z.int().min(1).max(90).default(1) }))
    .mutation(async ({ ctx, input }) => {
      const result = await runAdvancePipeline({
        store: createPrismaDemoClockStore(ctx.db),
        days: input.days,
      });
      const state = await ensureDemoState(ctx.db);
      return { clock: clockPayload(state), pipeline: result };
    }),

  /** Rewinds the clock to day-zero. Fixture regeneration lands in M0 step 4. */
  reset: publicProcedure.mutation(async ({ ctx }) => {
    const result = await runResetPipeline({ store: createPrismaDemoClockStore(ctx.db) });
    const state = await ensureDemoState(ctx.db);
    return { clock: clockPayload(state), pipeline: result };
  }),
});
