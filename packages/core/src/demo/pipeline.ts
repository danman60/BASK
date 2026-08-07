/**
 * ============================== STUB — FOR MERGE ==============================
 * Demo-clock advance pipeline (IMPLEMENTATION_SPEC §1.4, M0 step 4).
 *
 * Step 4 owns the real implementation (campaign-outcome simulation → metric
 * rollups → insight sweep → Daybreak regeneration) and is being built in a
 * parallel lane. This file exists so M0 step 10's Presenter Panel has something
 * real to call today: it moves `DemoState.virtual_today` through the injected
 * store and reports which stages ran. Every stage is currently a no-op.
 *
 * MERGE CONTRACT — the step 4 lane owns the body, this lane owns the callers:
 *   - keep `runAdvancePipeline` / `runResetPipeline` names and their
 *     `{ store, days }` / `{ store }` option shapes, or update the single
 *     adapter at `packages/api/src/demo/clock.ts`;
 *   - `stagesRun` should list stages that actually did work;
 *   - flip `stubbed` to `false` once the stages are real.
 * `DemoClockStore` is a port, not a Prisma dependency — packages/core stays
 * pure TS with zero db/UI imports (IMPLEMENTATION_SPEC §1.1).
 * ============================================================================
 */

/** Ordered pipeline stages a clock advance runs synchronously. */
export const ADVANCE_PIPELINE_STAGES = [
  'campaign-outcomes',
  'metric-rollups',
  'insight-sweep',
  'daybreak-regen',
] as const;

export type AdvancePipelineStage = (typeof ADVANCE_PIPELINE_STAGES)[number];

/**
 * Persistence port for the virtual clock. The Prisma-backed implementation lives
 * in `packages/api/src/demo/clock.ts`; tests pass an in-memory one.
 */
export interface DemoClockStore {
  /** Current `virtual_today`, or null when the singleton row does not exist yet. */
  getVirtualToday(): Promise<Date | null>;
  /** Persists a new `virtual_today` and the advance/pipeline timestamps. */
  setVirtualToday(next: Date, meta: { advancedAt: Date; pipelineRunAt: Date }): Promise<void>;
  /** Returns the fixture generator's day-zero date and rewinds the clock to it. */
  resetToDayZero(): Promise<Date>;
}

export interface AdvancePipelineOptions {
  store: DemoClockStore;
  /** Days to move forward. Must be >= 1. */
  days: number;
  /** Injected for determinism in tests. */
  now?: Date;
}

export interface ResetPipelineOptions {
  store: DemoClockStore;
  now?: Date;
}

export interface DemoPipelineResult {
  previousToday: Date | null;
  virtualToday: Date;
  daysAdvanced: number;
  stagesRun: AdvancePipelineStage[];
  /** True while this file is still the stub — step 4 flips it. */
  stubbed: boolean;
}

/** Date-only arithmetic; the clock is a `date` column, never a timestamp. */
function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/**
 * Moves the demo clock forward `days` and runs the (currently no-op) pipeline.
 * When the singleton row is missing, day-zero is established first.
 */
export async function runAdvancePipeline(
  options: AdvancePipelineOptions,
): Promise<DemoPipelineResult> {
  const { store, days, now = new Date() } = options;
  if (!Number.isInteger(days) || days < 1) {
    throw new RangeError(`runAdvancePipeline: days must be a positive integer, got ${days}`);
  }

  const previousToday = (await store.getVirtualToday()) ?? (await store.resetToDayZero());
  const virtualToday = addDays(previousToday, days);

  // STUB: step 4 replaces this with the four real stages.
  const stagesRun: AdvancePipelineStage[] = [];

  await store.setVirtualToday(virtualToday, { advancedAt: now, pipelineRunAt: now });

  return { previousToday, virtualToday, daysAdvanced: days, stagesRun, stubbed: true };
}

/**
 * Rewinds the demo clock to day-zero. The real `demo:reset` (step 4) also
 * regenerates the fixture dataset; this stub only moves the clock.
 */
export async function runResetPipeline(
  options: ResetPipelineOptions,
): Promise<DemoPipelineResult> {
  const { store, now = new Date() } = options;

  const previousToday = await store.getVirtualToday();
  const virtualToday = await store.resetToDayZero();
  await store.setVirtualToday(virtualToday, { advancedAt: now, pipelineRunAt: now });

  return { previousToday, virtualToday, daysAdvanced: 0, stagesRun: [], stubbed: true };
}
