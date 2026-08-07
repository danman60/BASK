/**
 * Pipeline ports.
 *
 * `packages/core` must stay Prisma-free — it runs unchanged on the server, in
 * the browser, and in React Native (IMPLEMENTATION_SPEC §1.1). So the pipeline
 * describes *what* it needs from a datastore and `packages/db` supplies the
 * Prisma implementation. That split is also what lets the whole pipeline run
 * against an in-memory fake in tests.
 */

import type { DateOnly } from '../clock';
import type { SalonFacts } from '../insights/facts';
import type { InsightDraft } from '../insights/types';
import type { BriefInsightInput } from '../ai/daybreak';
import type { DaybreakBrief } from '../ai/brief';
import type { AiGenerationLog } from '../ai/client';

export interface PipelineSalon {
  id: string;
  name: string;
  ownerFirstName: string;
  currency: string;
  timezone: string;
  /** Only the hero salon gets the full owner-facing pipeline in M0. */
  isHero: boolean;
}

export interface CampaignOutcome {
  campaignId: string;
  campaignName: string;
  /** Visits the campaign actually produced — real rows, not a results blob. */
  bookings: number;
  revenue: number;
  recipients: number;
}

export interface InsightUpsertResult {
  created: number;
  updated: number;
  /** Standing insights the sweep no longer produces. */
  resolved: number;
  /** Persisted rows, in rank order, ready for Daybreak. */
  insights: BriefInsightInput[];
}

export interface PipelinePorts {
  /** Current virtual day. Null when the demo state row is missing. */
  loadVirtualToday(): Promise<DateOnly | null>;
  /** Advance the clock. The ONLY writer of `demo_state.virtual_today`. */
  setVirtualToday(date: DateOnly, meta: { lastPipelineRunAt: Date }): Promise<void>;

  listSalons(): Promise<PipelineSalon[]>;

  /**
   * Generate a day of activity for salons that need it — visits, sessions,
   * sales. Simulated systems still change real state: advancing the clock adds
   * rows, it does not reveal pre-baked ones (IMPLEMENTATION_SPEC §0.1).
   */
  materialiseDay(date: DateOnly): Promise<{ visits: number; sales: number }>;

  /** Stage 1: settle campaigns whose send date the clock has now passed. */
  simulateCampaignOutcomes(date: DateOnly): Promise<CampaignOutcome[]>;

  /** Stage 2: roll up the numbers the detectors reason over. */
  buildSalonFacts(salon: PipelineSalon, today: DateOnly): Promise<SalonFacts>;

  /** Stage 3: persist the sweep, preserving state on standing insights. */
  upsertInsights(
    salon: PipelineSalon,
    today: DateOnly,
    drafts: InsightDraft[],
  ): Promise<InsightUpsertResult>;

  /** Stage 4 support. */
  loadCachedBrief(salonId: string, forDate: DateOnly, promptHash: string): Promise<unknown | null>;
  saveBrief(brief: DaybreakBrief): Promise<void>;
  logAiGeneration?(log: AiGenerationLog): Promise<void>;

  /** Owner-facing activity log entry for the run. */
  recordActivity?(salonId: string, action: string, metadata: Record<string, unknown>): Promise<void>;
}
