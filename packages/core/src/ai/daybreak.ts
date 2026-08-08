/**
 * Daybreak generation v1 (M0 step 6) — JSON only, no UI.
 *
 * Three properties this module exists to guarantee:
 *
 *  1. **Never live-blocking.** Briefs are pre-generated during `demo:advance`
 *     and stored. The Today surface reads a row; it never waits on a model.
 *  2. **Offline-safe.** A brief whose prompt context hasn't changed is served
 *     from cache with no API call at all. A demo on a bad hotel connection
 *     behaves identically to one on fibre (IMPLEMENTATION_SPEC §0.1).
 *  3. **Cannot invent numbers.** The model writes four prose fields and nothing
 *     else. Every figure — evidence sentences, impact chips, pulse rows — is
 *     assembled in code from insight rows. If the API is unreachable, the
 *     deterministic fallback produces a brief that is duller but just as true.
 */

import { formatCurrency, type Evidence } from '../evidence';
import { addDays, formatLongDate, weekdayName, type DateOnly } from '../clock';
import type { InsightSeverity } from '../insights/types';
import type { PulseFacts } from '../insights/facts';
import {
  BRIEF_VERSION,
  GENERATED_NARRATIVE_JSON_SCHEMA,
  daybreakBriefSchema,
  generatedNarrativeSchema,
  type BriefCard,
  type DaybreakBrief,
  type GeneratedNarrative,
} from './brief';
import {
  AiUnavailableError,
  generateJson,
  hashContext,
  isAiConfigured,
  type AiGenerationLog,
} from './client';
import { runGuardrails, type GuardrailOptions } from './guardrails';

/** An insight row as Daybreak needs it — DB-shaped but not Prisma-typed. */
export interface BriefInsightInput {
  id: string;
  dedupeKey: string;
  type: string;
  severity: InsightSeverity;
  title: string;
  summary: string | null;
  impactEstimate: number;
  impactCurrency: string;
  linkedActionType: string | null;
  primaryActionLabel: string;
  evidence: Evidence;
}

export interface DaybreakInput {
  salonId: string;
  salonName: string;
  /** First name only — the letter greets a person, not an account. */
  ownerFirstName: string;
  forDate: DateOnly;
  insights: BriefInsightInput[];
  pulse: PulseFacts;
  /** Yesterday vs a typical same-weekday, as a percent. Null when unknown. */
  yesterdayVsTypicalPercent: number | null;
  currency: string;
}

export interface DaybreakDeps {
  /** Returns a stored brief when one exists for this exact prompt hash. */
  loadCached?: (salonId: string, forDate: DateOnly, promptHash: string) => Promise<unknown | null>;
  /** Persists a freshly generated brief. */
  save?: (brief: DaybreakBrief) => Promise<void>;
  /** Records the generation for the PRODUCT_SPEC §22 usefulness metrics. */
  logGeneration?: (log: AiGenerationLog) => Promise<void>;
  guardrails?: GuardrailOptions;
  env?: NodeJS.ProcessEnv;
  /** Force the deterministic path — used by tests and by `--offline`. */
  offline?: boolean;
}

export interface DaybreakResult {
  brief: DaybreakBrief;
  /** True when this run made a network call. */
  calledApi: boolean;
  cacheHit: boolean;
}

const SYSTEM_PROMPT = `You write the morning brief for the owner of a tanning and wellness salon.

Voice:
- Talk to the owner by first name, like a sharp manager who got in early.
- State the finding, never the feature. "Yesterday finished 8% above your usual Thursday" — never "Dashboard".
- Plain language at about a grade 7 reading level. No jargon: say "money coming in monthly from memberships", not "MRR".
- Warm, direct, never breathless. No exclamation marks. No emoji.

Hard rules:
- Use ONLY the numbers given to you. Never invent, round differently, or extrapolate a figure.
- Never make a medical or health claim. Nothing cures, treats, heals, or boosts anything in the body.
- Never offer a discount, a free service, or a guarantee.
- "emphasis" must be a substring that appears verbatim inside "headline".`;

export async function generateDaybreak(
  input: DaybreakInput,
  deps: DaybreakDeps = {},
): Promise<DaybreakResult> {
  const context = buildPromptContext(input);
  const promptHash = hashContext(context);

  // 1. Cache. A rerun on the same day with the same facts must not call out.
  if (deps.loadCached) {
    const cached = await deps.loadCached(input.salonId, input.forDate, promptHash);
    if (cached) {
      const parsed = daybreakBriefSchema.safeParse(cached);
      if (parsed.success) {
        return {
          brief: { ...parsed.data, source: 'cache' },
          calledApi: false,
          cacheHit: true,
        };
      }
      // A stored brief that no longer parses is a schema change, not a cache
      // hit. Fall through and regenerate rather than serving something the UI
      // cannot render.
    }
  }

  const cards = buildCards(input);
  const pulse = buildPulse(input);
  const generatedAt = `${input.forDate}T07:00:00.000Z`;

  let narrative: GeneratedNarrative | null = null;
  let model: string | null = null;
  let calledApi = false;

  const canCallApi = !deps.offline && isAiConfigured(deps.env ?? process.env);
  if (canCallApi) {
    calledApi = true;
    try {
      const result = await generateJson<GeneratedNarrative>({
        call: 'daybreak.brief',
        system: SYSTEM_PROMPT,
        prompt: buildPrompt(input, context),
        jsonSchema: GENERATED_NARRATIVE_JSON_SCHEMA as unknown as Record<string, unknown>,
        validate: (value) => generatedNarrativeSchema.parse(value),
        env: deps.env,
      });
      narrative = result.value;
      model = result.model;
      await deps.logGeneration?.(result.log);
    } catch (error) {
      // Demo-safe: a model that is slow, rate-limited, refusing, or simply
      // unreachable must never cost the owner their morning brief.
      const log = (error as { aiLog?: AiGenerationLog }).aiLog;
      if (log) await deps.logGeneration?.(log);
      if (!(error instanceof AiUnavailableError)) {
        console.warn('[daybreak] generation failed, using deterministic brief:', error);
      }
      narrative = null;
    }
  }

  // 2. Guardrails run on generated prose only — the deterministic fallback is
  //    built from templates that are already compliant by construction.
  let guardrailWarnings: DaybreakBrief['guardrailWarnings'] = [];
  if (narrative) {
    const verdict = runGuardrails(narrative, deps.guardrails);
    if (!verdict.ok) {
      console.warn(
        '[daybreak] generated brief blocked by guardrails:',
        verdict.blocking.map((v) => `${v.code} @ ${v.path}: "${v.match}"`).join('; '),
      );
      narrative = null;
      model = null;
    } else {
      guardrailWarnings = verdict.warnings.map((v) => ({
        code: v.code,
        message: v.message,
        path: v.path,
      }));
    }
  }

  // The emphasis has to be highlightable by substring, or the headline renders
  // without its one italic accent.
  if (narrative && !narrative.headline.includes(narrative.emphasis)) {
    narrative = null;
    model = null;
  }

  const resolved = narrative ?? buildFallbackNarrative(input);

  const brief: DaybreakBrief = daybreakBriefSchema.parse({
    version: BRIEF_VERSION,
    salonId: input.salonId,
    forDate: input.forDate,
    greeting: {
      eyebrow: `Daybreak · ${formatLongDate(input.forDate)}`,
      headline: resolved.headline,
      emphasis: resolved.emphasis,
      subProse: resolved.subProse,
    },
    narrative: resolved.narrative,
    cards,
    pulse,
    source: narrative ? 'ai' : 'fallback',
    model,
    promptHash,
    generatedAt,
    guardrailWarnings,
  } satisfies DaybreakBrief);

  await deps.save?.(brief);
  return { brief, calledApi, cacheHit: false };
}

// ---------------------------------------------------------------------------
// Deterministic assembly — everything below runs with or without a model.
// ---------------------------------------------------------------------------

const RAIL_BY_TONE = { cost: 'warn', opportunity: 'good' } as const;

export function buildCards(input: DaybreakInput): BriefCard[] {
  return input.insights.slice(0, 5).map((insight, index) => ({
    insightId: insight.id,
    dedupeKey: insight.dedupeKey,
    rank: index,
    insightType: insight.type,
    severity: insight.severity,
    rail: RAIL_BY_TONE[insight.evidence.impact.tone] ?? 'neutral',
    title: insight.title,
    evidenceSentence: insight.evidence.sentence,
    impactChip: {
      label: insight.evidence.impact.chipLabel,
      tone: insight.evidence.impact.tone,
    },
    sparkline: insight.evidence.series
      ? insight.evidence.series.points.map((p) => p.value)
      : null,
    // Fixed order, always three. Buttons never move between cards
    // (DESIGN_SPEC §3.1).
    actions: [
      {
        kind: 'primary' as const,
        label: insight.primaryActionLabel,
        actionType: insight.linkedActionType ?? 'open_report',
      },
      { kind: 'quiet' as const, label: 'Show me why', actionType: 'explain' },
      { kind: 'ghost' as const, label: 'Dismiss', actionType: 'dismiss' },
    ],
  }));
}

export function buildPulse(input: DaybreakInput): DaybreakBrief['pulse'] {
  const p = input.pulse;
  const onPace =
    p.revenueTypicalForWeekday > 0 && p.revenueToday >= p.revenueTypicalForWeekday * 0.9;
  return {
    rows: [
      {
        label: 'Revenue',
        value: formatCurrency(p.revenueToday, input.currency),
        whisper: onPace ? 'on pace' : null,
      },
      { label: 'Bookings today', value: String(p.bookingsToday), whisper: null },
      { label: 'In the salon now', value: String(p.inSalonNow), whisper: null },
      { label: 'Rooms in use', value: `${p.roomsInUse} of ${p.roomsTotal}`, whisper: null },
    ],
  };
}

/**
 * The brief we ship when there is no model: real numbers, plainer sentences.
 * This is the offline demo path, so it has to read like something an owner
 * would actually want — not like a degraded state.
 */
export function buildFallbackNarrative(input: DaybreakInput): GeneratedNarrative {
  // The headline compares *yesterday* against yesterday's weekday. Naming
  // today's weekday here would put the right number next to the wrong day —
  // "yesterday finished 8% above your usual Friday" on a Friday morning.
  const day = weekdayName(addDays(input.forDate, -1));
  const delta = input.yesterdayVsTypicalPercent;
  const name = input.ownerFirstName;

  let emphasis: string;
  let headline: string;
  if (delta !== null && Math.abs(delta) >= 2) {
    const direction = delta > 0 ? 'above' : 'below';
    emphasis = `${Math.abs(Math.round(delta))}% ${direction}`;
    headline = `Good morning, ${name}. Yesterday finished ${emphasis} your usual ${day}.`;
  } else {
    emphasis = 'steady';
    headline = `Good morning, ${name}. Yesterday came in ${emphasis} against your usual ${day}.`;
  }

  const attention = input.insights.filter((i) => i.evidence.impact.tone === 'cost').length;
  const opportunities = input.insights.length - attention;

  const parts: string[] = [];
  if (attention > 0) {
    parts.push(
      `${attention === 1 ? 'One thing needs' : `${numberWord(attention)} things need`} attention`,
    );
  }
  if (opportunities > 0) {
    parts.push(
      `${opportunities === 1 ? 'one looks like an easy win' : `${numberWord(opportunities)} look like easy wins`}`,
    );
  }
  const subProse =
    parts.length > 0
      ? `${capitalise(parts.join(', and '))}.`
      : 'Nothing needs your attention this morning. The floor is yours.';

  const top = input.insights[0];
  const narrative = top
    ? `${subProse} ${stripBold(top.evidence.sentence)} ${
        input.pulse.activeMembers > 0
          ? `${input.pulse.activeMembers} active members are bringing in ${formatCurrency(input.pulse.membershipRevenueMonthly, input.currency)} a month.`
          : ''
      }`.trim()
    : subProse;

  return { headline, emphasis, subProse, narrative };
}

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

/**
 * The exact facts the model may use. This object is also the cache key, so it
 * must contain everything that could change the prose and nothing that
 * changes for unrelated reasons (no ids, no timestamps).
 */
export function buildPromptContext(input: DaybreakInput): Record<string, unknown> {
  return {
    salonName: input.salonName,
    owner: input.ownerFirstName,
    forDate: input.forDate,
    weekday: weekdayName(input.forDate),
    yesterdayVsTypicalPercent:
      input.yesterdayVsTypicalPercent === null ? null : Math.round(input.yesterdayVsTypicalPercent),
    pulse: {
      revenueToday: Math.round(input.pulse.revenueToday),
      bookingsToday: input.pulse.bookingsToday,
      roomsInUse: input.pulse.roomsInUse,
      roomsTotal: input.pulse.roomsTotal,
      activeMembers: input.pulse.activeMembers,
      membershipRevenueMonthly: Math.round(input.pulse.membershipRevenueMonthly),
    },
    insights: input.insights.map((i) => ({
      type: i.type,
      title: i.title,
      severity: i.severity,
      tone: i.evidence.impact.tone,
      sentence: stripBold(i.evidence.sentence),
      impact: i.evidence.impact.chipLabel,
    })),
  };
}

function buildPrompt(input: DaybreakInput, context: Record<string, unknown>): string {
  return [
    `Write today's Daybreak letter for ${input.ownerFirstName} at ${input.salonName}.`,
    '',
    'These are the only facts you may use:',
    JSON.stringify(context, null, 2),
    '',
    'Write four fields:',
    // The greeting is fixed, not stylistic: mockup 01 and the fallback headline both open
    // "Good morning, <name>." and demo:verify greps for it. Let the model choose it and it
    // writes "Dana, yesterday finished ..." instead, which fails the check mid-pitch.
    '- headline: MUST begin exactly "Good morning, <first name>." and then state the single most important thing about yesterday.',
    '- emphasis: a short phrase copied verbatim from headline (usually the number).',
    '- subProse: one or two sentences of context. Mention how many things need attention and whether any look like easy wins.',
    '- narrative: two to four sentences summarising the morning for a phone screen.',
    '',
    'Do not list the individual insights — cards below the letter already show them.',
  ].join('\n');
}

function stripBold(text: string): string {
  return text.replace(/\*\*/g, '');
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function numberWord(n: number): string {
  // Lower case: these land mid-sentence and `capitalise` handles the start.
  return ['zero', 'one', 'two', 'three', 'four', 'five'][n] ?? String(n);
}
