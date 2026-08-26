/**
 * Demo Harness router — the Presenter Panel's whole backend (IMPLEMENTATION_SPEC
 * §0.1, §1.4). Public procedures on purpose: the panel is hidden behind a hotkey,
 * not behind a role, and the presenter may be switched to any role when they use it.
 */

import { runPipeline } from '@bask/core';
import { createPrismaPipelinePorts } from '@bask/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { DEMO_STATE_ID, ensureDemoState, fixtureDayZero } from '../demo/clock';
import { DEMO_ROLES } from '../roles';
import { publicProcedure, router } from '../trpc';

const DAY_MS = 86_400_000;

/**
 * How many whole days past fixture day-zero the clock currently sits at.
 *
 * `virtual_today` is a DATE column stored at UTC midnight and `fixtureDayZero()`
 * builds the same, so the subtraction is exact — no timezone rounding to guess at.
 */
export function demoDayIndex(virtualToday: Date): number {
  return Math.round((virtualToday.getTime() - fixtureDayZero().getTime()) / DAY_MS);
}

/** Serialised clock state — one shape for `state`, `advance`, `jumpTo` and `rewindClock`. */
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
    /** Day 0 = fixture day-zero. What a scenario bookmark's `clockDays` counts. */
    dayIndex: demoDayIndex(state.virtualToday),
  };
}

/**
 * `bask.app_log` tag the presenter's push rides on.
 *
 * A push event is a row in the EXISTING log table, not a new one: it needs an
 * ordered id, a timestamp and a JSON body, which `app_log` already has. No DDL
 * against a database shared with 574 other tables for a demo affordance.
 */
export const PUSH_LOG_TAG = 'presenter_push';

interface PushBody {
  title: string;
  body: string;
  href: string;
}

function readPushBody(row: { msg: string; data: unknown }): PushBody {
  const data = (row.data ?? {}) as Record<string, unknown>;
  return {
    title: typeof data.title === 'string' ? data.title : row.msg,
    body: typeof data.body === 'string' ? data.body : '',
    href: typeof data.href === 'string' ? data.href : '/',
  };
}

/** Formats a settled campaign's REAL results into the Beat 4 notification line. */
function pushCopyFor(campaign: {
  name: string;
  results: unknown;
}): { title: string; body: string } | null {
  const results = (campaign.results ?? null) as Record<string, unknown> | null;
  if (!results) return null;
  const bookings = Number(results.bookings ?? NaN);
  const revenue = Number(results.revenue ?? NaN);
  if (!Number.isFinite(bookings) || !Number.isFinite(revenue)) return null;
  return {
    title: 'Campaign results are in',
    body: `${campaign.name} — ${bookings} booking${bookings === 1 ? '' : 's'}, ~$${Math.round(
      revenue,
    )}.`,
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
   * Moves the POINTER back to fixture day-zero and NOTHING ELSE.
   *
   * Read that literally, because the panel used to call this before every
   * scenario-bookmark jump on the assumption that it undid a run. It does not.
   * `advance` runs the real pipeline — it materialises visits and sales, settles
   * campaigns, sweeps insights and regenerates briefs, all as durable rows. Those
   * rows survive this mutation. Rewinding the pointer and advancing again
   * therefore re-runs the pipeline OVER a world that has already lived those
   * days: campaigns settle twice, days get a second helping of visits.
   *
   * Undoing a run means deleting rows out of a `bask` schema shared with 574
   * tables belonging to other live products, which is not a thing that should
   * happen behind a panel button four days before a pitch. The full rebuild is
   * `pnpm demo:reset` on the command line (~32s, 36,351 deterministic rows) and
   * that remains the ONLY honest way back to day zero.
   *
   * Kept, unrenamed at the wire, for the panel's explicit "rewind the pointer"
   * control — where the UI now says exactly this in one line.
   */
  reset: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.db.demoState.update({
      where: { id: DEMO_STATE_ID },
      data: { virtualToday: fixtureDayZero(), lastAdvancedAt: null, lastPipelineRunAt: null },
    });
    const state = await ensureDemoState(ctx.db);
    return { clock: clockPayload(state), pipeline: { clockOnly: true } };
  }),

  /**
   * Move the clock to a scenario bookmark's day — FORWARD ONLY.
   *
   * This is what a bookmark jump calls, and it is deliberately not "reset then
   * advance". Because the pipeline's writes are durable (see `reset` above), the
   * only jump that can be repeated without corrupting state is one that never
   * replays a day. So:
   *
   *   target > today  → advance by exactly the difference, once.
   *   target <= today → the clock does not move at all.
   *
   * That makes a bookmark idempotent in the way that actually matters on stage:
   * pressing the same one twice runs the pipeline the first time and is a pure
   * navigation the second. It also means jumping BACK to an earlier beat is a
   * navigation, not a time machine — the caller is told so via `rewindRefused`
   * and the panel says it out loud rather than quietly rewinding.
   */
  jumpTo: publicProcedure
    .input(z.object({ day: z.int().min(0).max(90) }))
    .mutation(async ({ ctx, input }) => {
      const state = await ensureDemoState(ctx.db);
      const today = demoDayIndex(state.virtualToday);
      const delta = input.day - today;

      if (delta <= 0) {
        return {
          clock: clockPayload(state),
          movedDays: 0,
          rewindRefused: delta < 0,
          pipeline: null,
        };
      }

      const ports = createPrismaPipelinePorts(ctx.db, { seed: state.seed });
      const report = await runPipeline(ports, { days: delta, offline: true });
      const next = await ensureDemoState(ctx.db);
      return {
        clock: clockPayload(next),
        movedDays: delta,
        rewindRefused: false,
        pipeline: report,
      };
    }),

  /**
   * Beat 4's push (PITCH.md:47). Writes ONE `bask.app_log` row describing the
   * notification; every open Bask page picks it up and raises it locally.
   *
   * The copy is read off the campaign the pipeline actually settled — real
   * bookings, real revenue — so the phone reports the demo's own numbers rather
   * than a line typed into a script.
   */
  firePush: publicProcedure
    .input(z.object({ href: z.string().max(200).default('/') }).default({ href: '/' }))
    .mutation(async ({ ctx, input }) => {
      /**
       * Newest-first, then the first row whose `results` blob is actually
       * usable. Deliberately NOT a `results: { not: DbNull }` filter — a JSON
       * negation on a nullable column silently fails to distinguish "key absent"
       * from "explicitly null", and `pushCopyFor` has to validate the shape
       * anyway.
       */
      const candidates = await ctx.db.campaign.findMany({
        where: {
          ...(ctx.salonId ? { salonId: ctx.salonId } : {}),
          measuredAt: { not: null },
        },
        orderBy: { measuredAt: 'desc' },
        take: 5,
        select: { id: true, name: true, results: true },
      });

      const campaign = candidates.find((row) => pushCopyFor(row) !== null);
      const copy = campaign ? pushCopyFor(campaign) : null;
      if (!copy) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message:
            'No settled campaign to report yet. Send a campaign, then advance the clock past its measure date.',
        });
      }

      const row = await ctx.db.appLog.create({
        data: {
          level: 'info',
          tag: PUSH_LOG_TAG,
          msg: copy.title,
          data: { ...copy, href: input.href, campaignId: campaign?.id ?? null },
        },
        select: { id: true, ts: true },
      });

      return { id: row.id.toString(), ts: row.ts, ...copy, href: input.href };
    }),

  /**
   * The newest push, or null. Polled by every open page — see
   * `apps/web/src/components/presenter/usePresenterPush.ts` for why this is a
   * poll rather than a socket in this deployment.
   *
   * `id` is stringified because it is a bigint; superjson would carry it, but the
   * client only ever compares it for equality and a string is the honest shape
   * for that.
   */
  latestPush: publicProcedure.query(async ({ ctx }) => {
    const row = await ctx.db.appLog.findFirst({
      where: { tag: PUSH_LOG_TAG },
      orderBy: { id: 'desc' },
      select: { id: true, ts: true, msg: true, data: true },
    });
    if (!row) return null;
    return { id: row.id.toString(), ts: row.ts, ...readPushBody(row) };
  }),
});
