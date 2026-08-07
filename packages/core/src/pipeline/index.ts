/**
 * The demo pipeline (IMPLEMENTATION_SPEC §1.4).
 *
 * `demo:advance --days N` moves the clock one day at a time and runs, for each
 * day, in this order:
 *
 *   materialise day → campaign outcomes → metric rollups → insight sweep → brief
 *
 * The order matters. Campaign outcomes write visits and sales, so they must
 * land before the rollups that count them; the sweep reads those rollups; the
 * brief ranks the sweep's output. Run them out of order and the "best Tuesday
 * ever" payoff reports yesterday's numbers.
 *
 * In production the same stages run as scheduled functions against the real
 * clock. The demo clock just calls them synchronously.
 */

import { addDays, type DateOnly } from '../clock';
import { runInsightSweep } from '../insights/engine';
import { generateDaybreak, type DaybreakDeps } from '../ai/daybreak';
import type { DaybreakBrief } from '../ai/brief';
import type { GuardrailOptions } from '../ai/guardrails';
import type { SalonFacts } from '../insights/facts';
import type { BriefInsightInput } from '../ai/daybreak';
import type { CampaignOutcome, PipelinePorts, PipelineSalon } from './ports';

export interface PipelineDayReport {
  date: DateOnly;
  materialised: { visits: number; sales: number };
  campaignOutcomes: CampaignOutcome[];
  salons: SalonDayReport[];
}

export interface SalonDayReport {
  salonId: string;
  salonName: string;
  insights: { created: number; updated: number; resolved: number; total: number };
  countsByType: Record<string, number>;
  brief: {
    generated: boolean;
    source: DaybreakBrief['source'];
    calledApi: boolean;
    cacheHit: boolean;
    promptHash: string;
    headline: string;
  } | null;
}

export interface RunPipelineOptions {
  /** Days to advance. 0 reruns the pipeline for the current day. */
  days?: number;
  /** Skip Daybreak generation (rollups + sweep only). */
  skipBrief?: boolean;
  /** Force the deterministic brief — no API call even when a key is present. */
  offline?: boolean;
  guardrails?: GuardrailOptions;
  env?: NodeJS.ProcessEnv;
  /** Progress reporting for the CLI. */
  onStage?: (stage: string, detail: string) => void;
}

export interface PipelineReport {
  startedFrom: DateOnly;
  virtualToday: DateOnly;
  days: PipelineDayReport[];
}

export async function runPipeline(
  ports: PipelinePorts,
  options: RunPipelineOptions = {},
): Promise<PipelineReport> {
  const days = options.days ?? 0;
  if (days < 0) throw new Error('demo:advance cannot run the clock backwards — use demo:reset');

  const startedFrom = await ports.loadVirtualToday();
  if (!startedFrom) {
    throw new Error('No demo_state row. Run `pnpm demo:reset` first.');
  }

  const log = options.onStage ?? (() => {});
  const reports: PipelineDayReport[] = [];
  let current = startedFrom;

  // days = 0 still runs one pass, on today. days = N runs N passes, one per
  // new day, so a five-day jump doesn't skip four days of campaign settlement.
  const passes = Math.max(days, 1);
  for (let i = 0; i < passes; i += 1) {
    if (days > 0) {
      current = addDays(current, 1);
      await ports.setVirtualToday(current, { lastPipelineRunAt: new Date() });
      log('clock', `virtual_today → ${current}`);
    }
    reports.push(await runDay(ports, current, options, log));
  }

  return { startedFrom, virtualToday: current, days: reports };
}

async function runDay(
  ports: PipelinePorts,
  date: DateOnly,
  options: RunPipelineOptions,
  log: (stage: string, detail: string) => void,
): Promise<PipelineDayReport> {
  // Stage 0 — the day actually happens. Without this, advancing the clock
  // would move a pointer over pre-baked data, which is exactly the static
  // fakery the spec forbids.
  const materialised = await ports.materialiseDay(date);
  log('materialise', `${date}: ${materialised.visits} visits, ${materialised.sales} sales`);

  // Stage 1 — campaigns whose send date has now passed produce real bookings.
  const campaignOutcomes = await ports.simulateCampaignOutcomes(date);
  for (const outcome of campaignOutcomes) {
    log(
      'campaign',
      `${outcome.campaignName}: ${outcome.bookings} bookings, $${Math.round(outcome.revenue)}`,
    );
  }

  const salons = await ports.listSalons();
  const salonReports: SalonDayReport[] = [];

  for (const salon of salons) {
    // Stage 2 — metric rollups. Computed, never stored as truth.
    const facts = await ports.buildSalonFacts(salon, date);

    // Stage 3 — insight sweep.
    const sweep = runInsightSweep(facts);
    const upsert = await ports.upsertInsights(salon, date, sweep.drafts);
    log(
      'insights',
      `${salon.name}: ${upsert.created} new, ${upsert.updated} updated, ${upsert.resolved} resolved`,
    );

    // Stage 4 — Daybreak. Owner-facing salons only; the Compass portfolio
    // gets signal snapshots, not morning letters.
    let briefReport: SalonDayReport['brief'] = null;
    if (!options.skipBrief && salon.isHero) {
      briefReport = await generateBriefFor(ports, salon, date, facts, upsert.insights, options);
      log('daybreak', `${salon.name}: ${briefReport.source} — "${briefReport.headline}"`);
    }

    salonReports.push({
      salonId: salon.id,
      salonName: salon.name,
      insights: {
        created: upsert.created,
        updated: upsert.updated,
        resolved: upsert.resolved,
        total: upsert.insights.length,
      },
      countsByType: sweep.countsByType,
      brief: briefReport,
    });
  }

  await ports.recordActivity?.(salons.find((s) => s.isHero)?.id ?? salons[0]!.id, 'pipeline_run', {
    date,
    campaigns: campaignOutcomes.length,
  });

  return { date, materialised, campaignOutcomes, salons: salonReports };
}

async function generateBriefFor(
  ports: PipelinePorts,
  salon: PipelineSalon,
  date: DateOnly,
  facts: SalonFacts,
  insights: BriefInsightInput[],
  options: RunPipelineOptions,
): Promise<NonNullable<SalonDayReport['brief']>> {
  const deps: DaybreakDeps = {
    loadCached: (salonId, forDate, promptHash) => ports.loadCachedBrief(salonId, forDate, promptHash),
    save: (brief) => ports.saveBrief(brief),
    logGeneration: ports.logAiGeneration?.bind(ports),
    guardrails: options.guardrails,
    env: options.env,
    offline: options.offline,
  };

  // The headline is about yesterday, not about a day that started an hour ago.
  const typical = facts.pulse.revenueTypicalForYesterdayWeekday;
  const result = await generateDaybreak(
    {
      salonId: salon.id,
      salonName: salon.name,
      ownerFirstName: salon.ownerFirstName,
      forDate: date,
      insights,
      pulse: facts.pulse,
      yesterdayVsTypicalPercent:
        typical > 0 ? ((facts.pulse.revenueYesterday - typical) / typical) * 100 : null,
      currency: salon.currency,
    },
    deps,
  );

  return {
    generated: true,
    source: result.brief.source,
    calledApi: result.calledApi,
    cacheHit: result.cacheHit,
    promptHash: result.brief.promptHash,
    headline: result.brief.greeting.headline,
  };
}
