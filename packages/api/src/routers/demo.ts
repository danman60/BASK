/**
 * Demo Harness router — the Presenter Panel's whole backend (IMPLEMENTATION_SPEC
 * §0.1, §1.4). Public procedures on purpose: the panel is hidden behind a hotkey,
 * not behind a role, and the presenter may be switched to any role when they use it.
 */

import { runPipeline } from '@bask/core';
import { createPrismaPipelinePorts } from '@bask/db';
import { z } from 'zod';

import { DEMO_STATE_ID, ensureDemoState, fixtureDayZero } from '../demo/clock';
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

  /**
   * Moves the virtual clock forward and runs the real pipeline (campaign settle →
   * rollups → insight sweep → Daybreak regen). `offline: true` so a presenter
   * click never blocks on the AI API mid-demo — the scripted briefs are already
   * cached by `demo:advance` on the command line.
   */
  advance: publicProcedure
    .input(z.object({ days: z.int().min(1).max(90).default(1) }))
    .mutation(async ({ ctx, input }) => {
      const state = await ensureDemoState(ctx.db);
      const ports = createPrismaPipelinePorts(ctx.db, { seed: state.seed });
      const report = await runPipeline(ports, { days: input.days, offline: true });
      const next = await ensureDemoState(ctx.db);
      return { clock: clockPayload(next), pipeline: report };
    }),

  /**
   * Rewinds the clock to fixture day-zero. Full reseeding is `pnpm demo:reset` on
   * the command line — regenerating 36k rows is a 30-second job and does not
   * belong behind a panel button mid-pitch.
   */
  reset: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.db.demoState.update({
      where: { id: DEMO_STATE_ID },
      data: { virtualToday: fixtureDayZero(), lastAdvancedAt: null, lastPipelineRunAt: null },
    });
    const state = await ensureDemoState(ctx.db);
    return { clock: clockPayload(state), pipeline: { clockOnly: true } };
  }),

  /** Presenter Panel stubs, wired M1/M2. Named here so the panel can label them. */
  pendingControls: publicProcedure.query(() => [
    { id: 'seed-walk-in', label: 'Seed a walk-in', availableIn: 'M1' },
    { id: 'fire-push', label: 'Fire push', availableIn: 'M2' },
  ]),
});
