/**
 * The ONE typed Evidence schema (IMPLEMENTATION_SPEC §2, DESIGN_SPEC §4).
 *
 * `Insight.evidence` is an unenforced Json column in Postgres, so *this* zod
 * schema is the contract. Everything that reads or writes evidence —
 * the rules engine, Daybreak generation, `InsightCard`, `EvidenceTile`,
 * Compass `SignalSnapshot` — parses through here. The data model and the UI
 * props are not allowed to drift into two shapes.
 */

import { z } from 'zod';

export const EVIDENCE_VERSION = 1 as const;

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

/** How a metric is rendered. Formatting lives with the value, not the view. */
export const metricUnitSchema = z.enum([
  'percent',
  'currency',
  'count',
  'days',
  'ratio',
  'minutes',
]);
export type MetricUnit = z.infer<typeof metricUnitSchema>;

/** A single measured number, already formatted for display. */
export const evidenceMetricSchema = z.object({
  /** Stable machine key, e.g. `retail_attachment_rate`. */
  key: z.string().min(1),
  /** Plain-language label (grade-7 register — IMPLEMENTATION_SPEC §3). */
  label: z.string().min(1),
  unit: metricUnitSchema,
  value: z.number(),
  /** Pre-rendered for the UI: `21%`, `$640`, `8 days`. */
  formatted: z.string().min(1),
});
export type EvidenceMetric = z.infer<typeof evidenceMetricSchema>;

/** The observation window a metric was measured over. */
export const evidenceWindowSchema = z.object({
  label: z.string().min(1),
  start: dateOnly,
  end: dateOnly,
  days: z.number().int().positive(),
});
export type EvidenceWindow = z.infer<typeof evidenceWindowSchema>;

export const evidenceDirectionSchema = z.enum(['up', 'down', 'flat']);
export type EvidenceDirection = z.infer<typeof evidenceDirectionSchema>;

/** Whether the direction is good or bad *for this metric* — down is not always bad. */
export const evidenceSentimentSchema = z.enum(['good', 'bad', 'neutral']);
export type EvidenceSentiment = z.infer<typeof evidenceSentimentSchema>;

/** Current vs baseline, with the deltas precomputed. */
export const evidenceComparisonSchema = z.object({
  baseline: evidenceMetricSchema,
  baselineWindow: evidenceWindowSchema,
  current: evidenceMetricSchema,
  currentWindow: evidenceWindowSchema,
  deltaAbsolute: z.number(),
  /** Percent change vs baseline; null when the baseline is zero. */
  deltaPercent: z.number().nullable(),
  direction: evidenceDirectionSchema,
  sentiment: evidenceSentimentSchema,
});
export type EvidenceComparison = z.infer<typeof evidenceComparisonSchema>;

export const impactCadenceSchema = z.enum([
  'one_time',
  'per_week',
  'per_month',
  'per_year',
]);
export type ImpactCadence = z.infer<typeof impactCadenceSchema>;

/**
 * Money at stake. `basis` must state in plain language how the number was
 * derived — the owner is allowed to disbelieve it, so it has to be checkable.
 */
export const evidenceImpactSchema = z.object({
  amount: z.number(),
  currency: z.string().length(3).default('CAD'),
  cadence: impactCadenceSchema,
  basis: z.string().min(1),
  confidence: z.enum(['low', 'medium', 'high']),
  /** `≈ $640/mo if it holds` — the ImpactChip label (DESIGN_SPEC §3.1). */
  chipLabel: z.string().min(1),
  /** Opportunity chips render green, cost chips terracotta. */
  tone: z.enum(['cost', 'opportunity']),
});
export type EvidenceImpact = z.infer<typeof evidenceImpactSchema>;

/** "mostly on Tuesday and Thursday evening shifts" — the *why* behind the what. */
export const contributingFactorSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  detail: z.string().min(1),
  /** Fraction of the total movement this factor explains, when known. */
  share: z.number().min(0).max(1).nullable().default(null),
  direction: evidenceDirectionSchema.nullable().default(null),
});
export type ContributingFactor = z.infer<typeof contributingFactorSchema>;

/** Sparkline source — amber stroke, no axes (DESIGN_SPEC §3.1). */
export const evidenceSeriesSchema = z.object({
  label: z.string().min(1),
  unit: metricUnitSchema,
  points: z
    .array(z.object({ at: dateOnly, value: z.number() }))
    .min(2),
});
export type EvidenceSeries = z.infer<typeof evidenceSeriesSchema>;

/**
 * The whole shape. Anything stored in `Insight.evidence` parses as this.
 */
export const evidenceSchema = z.object({
  version: z.literal(EVIDENCE_VERSION),
  /** Primary metric this insight is about. */
  metric: evidenceMetricSchema,
  /** Window the primary metric was measured over. */
  window: evidenceWindowSchema,
  comparison: evidenceComparisonSchema.nullable().default(null),
  impact: evidenceImpactSchema,
  contributingFactors: z.array(contributingFactorSchema).default([]),
  series: evidenceSeriesSchema.nullable().default(null),
  /**
   * The evidence sentence, numbers wrapped in `**` for bolding
   * (DESIGN_SPEC §5). One or two sentences, plain prose.
   */
  sentence: z.string().min(1),
});
export type Evidence = z.infer<typeof evidenceSchema>;

/** Parse a Json column into typed Evidence. Throws with a useful path on drift. */
export function parseEvidence(value: unknown): Evidence {
  return evidenceSchema.parse(value);
}

/** Non-throwing variant for read paths that must survive legacy rows. */
export function safeParseEvidence(value: unknown): Evidence | null {
  const result = evidenceSchema.safeParse(value);
  return result.success ? result.data : null;
}

// ---------------------------------------------------------------------------
// Formatting helpers — kept here so a metric and its rendering never diverge.
// ---------------------------------------------------------------------------

export function formatMetricValue(value: number, unit: MetricUnit): string {
  switch (unit) {
    case 'percent':
      return `${round(value, 1)}%`;
    case 'currency':
      return formatCurrency(value);
    case 'count':
      return String(Math.round(value));
    case 'days':
      return `${round(value, 1)} ${round(value, 1) === 1 ? 'day' : 'days'}`;
    case 'minutes':
      return `${Math.round(value)} min`;
    case 'ratio':
      return round(value, 2).toFixed(2);
  }
}

export function formatCurrency(amount: number, currency = 'CAD'): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const body = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return currency === 'CAD' || currency === 'USD' ? `${sign}$${body}` : `${sign}${body} ${currency}`;
}

export function buildMetric(
  key: string,
  label: string,
  unit: MetricUnit,
  value: number,
): EvidenceMetric {
  return { key, label, unit, value, formatted: formatMetricValue(value, unit) };
}

export function buildWindow(
  label: string,
  start: string,
  end: string,
  days: number,
): EvidenceWindow {
  return { label, start, end, days };
}

export function directionOf(delta: number, epsilon = 1e-9): EvidenceDirection {
  if (delta > epsilon) return 'up';
  if (delta < -epsilon) return 'down';
  return 'flat';
}

/** Build a comparison, deriving deltas so callers can't get them inconsistent. */
export function buildComparison(args: {
  baseline: EvidenceMetric;
  baselineWindow: EvidenceWindow;
  current: EvidenceMetric;
  currentWindow: EvidenceWindow;
  /** Which direction is good for this metric. */
  goodDirection: EvidenceDirection;
}): EvidenceComparison {
  const deltaAbsolute = round(args.current.value - args.baseline.value, 4);
  const deltaPercent =
    args.baseline.value === 0 ? null : round((deltaAbsolute / Math.abs(args.baseline.value)) * 100, 2);
  const direction = directionOf(deltaAbsolute);
  const sentiment: EvidenceSentiment =
    direction === 'flat' ? 'neutral' : direction === args.goodDirection ? 'good' : 'bad';
  return {
    baseline: args.baseline,
    baselineWindow: args.baselineWindow,
    current: args.current,
    currentWindow: args.currentWindow,
    deltaAbsolute,
    deltaPercent,
    direction,
    sentiment,
  };
}

export function round(value: number, places = 2): number {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
