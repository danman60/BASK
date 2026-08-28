/**
 * Model selection (IMPLEMENTATION_SPEC §1.2).
 *
 * ONE env var — `AI_MODEL` — plus an in-code per-call override map. Deliberately
 * not a per-capability config surface: that gets built when there is real cost
 * data to justify it, not before.
 */

/**
 * Mid-tier default, per IMPLEMENTATION_SPEC §1.2. Override with `AI_MODEL`.
 *
 * OpenAI since 2026-08-07 (the Anthropic key ran out of credits). Model names are
 * the only provider-specific thing in this file — the call sites below are
 * provider-agnostic on purpose.
 */
export const DEFAULT_AI_MODEL = 'gpt-4.1';

/** Named call sites. Adding one here is cheaper than adding a config surface. */
export type AiCall =
  | 'daybreak.brief'
  | 'daybreak.greeting'
  | 'campaign.draft'
  | 'insight.classify'
  | 'compass.callBrief'
  | 'ask.answer';

/**
 * Per-call overrides. `null` means "use the configured default".
 * A cheap small model for short classification work; everything narrative stays on the
 * default so the demo's voice is consistent.
 */
export const AI_CALL_OVERRIDES: Record<AiCall, string | null> = {
  'daybreak.brief': null,
  'daybreak.greeting': null,
  'campaign.draft': null,
  'insight.classify': 'gpt-4.1-mini',
  // Narrative, and a rep reads it before a real phone call — stays on the default
  // so Compass's voice matches Bask's.
  'compass.callBrief': null,
  /* Answers a typed question about the salon's own numbers, in front of the
     owner, from a fixed facts bundle. Stays on the default model: it is
     narrative, it is read aloud, and it is the one surface where a cheaper model
     sounding slightly off would be obvious. */
  'ask.answer': null,
};

export interface ModelResolution {
  model: string;
  source: 'override' | 'env' | 'default';
}

export function resolveModel(call?: AiCall, env: NodeJS.ProcessEnv = process.env): ModelResolution {
  const override = call ? AI_CALL_OVERRIDES[call] : null;
  if (override) return { model: override, source: 'override' };
  const configured = env.AI_MODEL?.trim();
  if (configured) return { model: configured, source: 'env' };
  return { model: DEFAULT_AI_MODEL, source: 'default' };
}

/** Max output tokens per call. Briefs are short; nothing here needs streaming. */
export const AI_MAX_TOKENS: Record<AiCall, number> = {
  'daybreak.brief': 4000,
  'daybreak.greeting': 1000,
  'campaign.draft': 2000,
  'insight.classify': 512,
  'compass.callBrief': 2000,
  'ask.answer': 900,
};
