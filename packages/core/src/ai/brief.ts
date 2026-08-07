/**
 * The Daybreak brief JSON — the shape the Today surface renders (DESIGN_SPEC
 * §3.1) and the mobile Daybreak reuses (§3.5).
 *
 * Stored, versioned, and cached. The UI never calls a model; it reads one of
 * these. That is the demo-safe rule (IMPLEMENTATION_SPEC §0.1) expressed as a
 * data shape rather than a promise.
 */

import { z } from 'zod';

export const BRIEF_VERSION = 1 as const;

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** "The letter" — the top-left block nothing else competes with. */
export const briefGreetingSchema = z.object({
  /** Gold eyebrow: `Daybreak · Thursday, August 6`. */
  eyebrow: z.string().min(1),
  /**
   * Fraunces display headline, ≤3 lines. Talks to the owner by name and states
   * the finding, never the feature (DESIGN_SPEC §5).
   */
  headline: z.string().min(1).max(220),
  /**
   * The single italic terracotta emphasis inside `headline`. Must appear
   * verbatim in `headline` — the renderer highlights by substring match.
   */
  emphasis: z.string().min(1).max(80),
  /** 1–2 sentences, 58ch measure. */
  subProse: z.string().min(1).max(400),
});
export type BriefGreeting = z.infer<typeof briefGreetingSchema>;

export const briefActionSchema = z.object({
  /** Fixed order: primary / quiet / ghost. Buttons never move between cards. */
  kind: z.enum(['primary', 'quiet', 'ghost']),
  /** States the outcome. Banned: Submit, OK, Confirm, Execute. */
  label: z.string().min(1).max(48),
  actionType: z.string().min(1),
});
export type BriefAction = z.infer<typeof briefActionSchema>;

/** One attention-queue card (DESIGN_SPEC §3.1 anatomy). */
export const briefCardSchema = z.object({
  insightId: z.string().min(1),
  dedupeKey: z.string().min(1),
  rank: z.number().int().nonnegative(),
  insightType: z.string().min(1),
  severity: z.enum(['info', 'low', 'medium', 'high', 'critical']),
  /** 4px severity rail: amber for attention, green for opportunity. */
  rail: z.enum(['warn', 'good', 'neutral']),
  title: z.string().min(1).max(120),
  /** Evidence sentence with **bold facts**. */
  evidenceSentence: z.string().min(1).max(400),
  impactChip: z.object({
    label: z.string().min(1).max(60),
    tone: z.enum(['cost', 'opportunity']),
  }),
  /** Sparkline values, already ordered oldest → newest. Null = no sparkline. */
  sparkline: z.array(z.number()).min(2).nullable().default(null),
  actions: z.array(briefActionSchema).min(1).max(3),
});
export type BriefCard = z.infer<typeof briefCardSchema>;

/** "Today so far" rail card — label/value rows with hairline dividers. */
export const briefPulseSchema = z.object({
  rows: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().min(1),
        /** Green "on pace" whisper. */
        whisper: z.string().nullable().default(null),
      }),
    )
    .default([]),
});
export type BriefPulse = z.infer<typeof briefPulseSchema>;

export const daybreakBriefSchema = z.object({
  version: z.literal(BRIEF_VERSION),
  salonId: z.string().min(1),
  forDate: dateOnly,
  greeting: briefGreetingSchema,
  /** Longer prose for the mobile card stack and the weekly story. */
  narrative: z.string().min(1).max(1200),
  cards: z.array(briefCardSchema).max(5),
  pulse: briefPulseSchema,
  /** Provenance — which path produced this brief. */
  source: z.enum(['ai', 'cache', 'fallback']),
  model: z.string().nullable().default(null),
  /** Hash of the generation context. Cache key and change detector. */
  promptHash: z.string().min(1),
  /** Virtual-clock instant, never wall clock — keeps reruns byte-stable. */
  generatedAt: z.string().min(1),
  guardrailWarnings: z
    .array(z.object({ code: z.string(), message: z.string(), path: z.string() }))
    .default([]),
});
export type DaybreakBrief = z.infer<typeof daybreakBriefSchema>;

export function parseBrief(value: unknown): DaybreakBrief {
  return daybreakBriefSchema.parse(value);
}

export function safeParseBrief(value: unknown): DaybreakBrief | null {
  const result = daybreakBriefSchema.safeParse(value);
  return result.success ? result.data : null;
}

/**
 * The narrow slice the model is allowed to write. Everything else — ids, ranks,
 * evidence sentences, impact chips, action labels — is assembled from the
 * insight rows in code, so a model can never invent a number that isn't in the
 * database. This is the whole reason the brief doesn't hallucinate.
 */
export const generatedNarrativeSchema = z.object({
  headline: z.string().min(1).max(220),
  emphasis: z.string().min(1).max(80),
  subProse: z.string().min(1).max(400),
  narrative: z.string().min(1).max(1200),
});
export type GeneratedNarrative = z.infer<typeof generatedNarrativeSchema>;

/** JSON Schema mirror of `generatedNarrativeSchema` for structured outputs. */
export const GENERATED_NARRATIVE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    headline: {
      type: 'string',
      description:
        "One or two sentences. Greets the owner by first name and states the single most important thing about yesterday. No more than 220 characters.",
    },
    emphasis: {
      type: 'string',
      description:
        'A short phrase copied VERBATIM from headline, to be italicised. Usually the number or the finding.',
    },
    subProse: {
      type: 'string',
      description:
        'One or two sentences of context under the headline. Plain language. No more than 400 characters.',
    },
    narrative: {
      type: 'string',
      description:
        'Two to four sentences summarising the day for the mobile card stack. Plain language.',
    },
  },
  required: ['headline', 'emphasis', 'subProse', 'narrative'],
  additionalProperties: false,
} as const;
