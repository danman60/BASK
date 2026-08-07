/**
 * The rep call brief (PRODUCT_SPEC §16, "Rep call brief (Compass)").
 *
 * Same three properties as `daybreak.ts`, for the same reasons — this is the
 * Daybreak module's sibling, not a second AI stack:
 *
 *  1. **Cannot invent numbers.** The model writes four prose fields. Every
 *     figure on the brief — the evidence tiles, the account facts, the peer
 *     cohort n — is assembled in code from rows that already passed the consent
 *     filter. There is no path by which a model sees a number Compass may not.
 *  2. **Offline-safe.** No key, no credit, a refusal, a timeout — all land on
 *     the deterministic brief, which is built from the same facts and is duller
 *     rather than absent. `source` records which path ran, and the UI shows it.
 *  3. **Consent-bounded.** The input is a `CompassAccountView`, i.e. already
 *     filtered. A private-tier account cannot produce a brief at all, and that
 *     is expressed as a return value rather than a rule to remember.
 */

import { z } from 'zod';

import { repMaySeeSignals } from '../consent';
import {
  CALL_STATUS_LABELS,
  HEALTH_BAND_LABELS,
  type CallStatus,
  type CompassAccountRecord,
  type CompassAccountView,
  type EvidenceTile,
  type Suggestion,
} from '../compass/derive';
import {
  AiUnavailableError,
  generateJson,
  hashContext,
  isAiConfigured,
  type AiGenerationLog,
} from './client';
import { runGuardrails, type GuardrailOptions } from './guardrails';

export const CALL_BRIEF_VERSION = 1 as const;

export const callBriefSchema = z.object({
  version: z.literal(CALL_BRIEF_VERSION),
  accountId: z.string().min(1),
  salonName: z.string().min(1),
  region: z.string().min(1),
  status: z.string().min(1),
  /** Fraunces headline for the sheet. One sentence, states the situation. */
  headline: z.string().min(1).max(220),
  /** Two to four sentences: where this account is and why now. */
  situation: z.string().min(1).max(1200),
  /** What to open with. Not a script — a first move. */
  opener: z.string().min(1).max(600),
  /** Three to five talking points, each grounded in a fact below. */
  talkingPoints: z.array(z.string().min(1).max(300)).min(1).max(6),
  /** Things not to do. Lifted from the playbook, never generated. */
  avoid: z.array(z.string().min(1).max(200)).default([]),
  /** The numbers, verbatim from the filtered account. */
  facts: z
    .array(z.object({ label: z.string().min(1), value: z.string().min(1) }))
    .default([]),
  playbookTitle: z.string().nullable().default(null),
  /** Provenance — which path produced this brief. Rendered on the sheet. */
  source: z.enum(['ai', 'fallback']),
  model: z.string().nullable().default(null),
  promptHash: z.string().min(1),
  guardrailWarnings: z
    .array(z.object({ code: z.string(), message: z.string(), path: z.string() }))
    .default([]),
});
export type CallBrief = z.infer<typeof callBriefSchema>;

/** The narrow slice the model may write. Everything else is assembled in code. */
export const generatedCallBriefSchema = z.object({
  headline: z.string().min(1).max(220),
  situation: z.string().min(1).max(1200),
  opener: z.string().min(1).max(600),
  talkingPoints: z.array(z.string().min(1).max(300)).min(3).max(5),
});
export type GeneratedCallBrief = z.infer<typeof generatedCallBriefSchema>;

export const GENERATED_CALL_BRIEF_JSON_SCHEMA = {
  type: 'object',
  properties: {
    headline: {
      type: 'string',
      description:
        'One sentence naming the salon and the single reason this call is worth making today. No more than 220 characters.',
    },
    situation: {
      type: 'string',
      description:
        'Two to four sentences on where this account stands and why now. Third person, respectful. Plain language.',
    },
    opener: {
      type: 'string',
      description:
        'How to open the call. One or two sentences. A first move, not a script to read aloud.',
    },
    talkingPoints: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Three to five short talking points. Each one must rest on a fact given in the context. No new numbers.',
    },
  },
  required: ['headline', 'situation', 'opener', 'talkingPoints'],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You prepare a one-page pre-call brief for a UVALUX territory rep before they phone a salon they supply.

Voice:
- Speak about the salon in the third person, with respect. They are a business owner, not a lead.
- State the finding, never the feature. Plain language, about a grade 7 reading level.
- Direct and useful. No hype, no exclamation marks, no emoji.
- When the salon asked for help themselves, say so — that is their request, not just our signal.

Hard rules:
- Use ONLY the facts given to you. Never invent, re-round, or extrapolate a figure.
- You are looking at DERIVED, banded figures. Never claim to know the salon's customers, their contacts, individual sales, or actual dollar revenue — the rep does not have that and must not imply otherwise.
- Never make a medical or health claim. Nothing cures, treats, heals, or boosts anything in the body.
- Never offer a discount, a free product, or a guarantee.`;

// ---------------------------------------------------------------------------

export interface CallBriefInput {
  view: CompassAccountView;
  status: CallStatus;
  suggestion: Suggestion | null;
  /** Playbook content, when the signal maps to one. Never model-generated. */
  playbook: {
    title: string;
    opener: string;
    steps: string[];
    avoid: string[];
  } | null;
  /** How many days since the rep last logged a contact. */
  daysSinceContact: number | null;
  repName: string | null;
}

export interface CallBriefDeps {
  logGeneration?: (log: AiGenerationLog) => Promise<void>;
  guardrails?: GuardrailOptions;
  env?: NodeJS.ProcessEnv;
  /** Force the deterministic path. Used by tests and by an offline demo. */
  offline?: boolean;
}

export interface CallBriefResult {
  brief: CallBrief;
  /** True when this run made a network call. */
  calledApi: boolean;
  /** Which path produced the prose. Logged so the demo can prove it. */
  path: 'ai' | 'fallback';
  /** Populated when the AI path was attempted and failed. */
  failureReason: string | null;
}

/**
 * A private-tier account has nothing to brief on. Returning null rather than a
 * thin brief keeps the trust beat legible: Compass does not pretend.
 */
export function canBrief(view: CompassAccountView): boolean {
  return repMaySeeSignals(view.consentTier);
}

export async function generateCallBrief(
  input: CallBriefInput,
  deps: CallBriefDeps = {},
): Promise<CallBriefResult> {
  const account = input.view.account as Partial<CompassAccountRecord>;
  const context = buildCallBriefContext(input);
  const promptHash = hashContext(context);

  let generated: GeneratedCallBrief | null = null;
  let model: string | null = null;
  let calledApi = false;
  let failureReason: string | null = null;

  const canCallApi = !deps.offline && isAiConfigured(deps.env ?? process.env);
  if (!canCallApi) {
    failureReason = deps.offline ? 'offline requested' : 'ANTHROPIC_API_KEY is not set';
  } else {
    calledApi = true;
    try {
      const result = await generateJson<GeneratedCallBrief>({
        call: 'compass.callBrief',
        system: SYSTEM_PROMPT,
        prompt: buildPrompt(input, context),
        jsonSchema: GENERATED_CALL_BRIEF_JSON_SCHEMA as unknown as Record<string, unknown>,
        validate: (value) => generatedCallBriefSchema.parse(value),
        env: deps.env,
      });
      generated = result.value;
      model = result.model;
      await deps.logGeneration?.(result.log);
    } catch (error) {
      const log = (error as { aiLog?: AiGenerationLog }).aiLog;
      if (log) await deps.logGeneration?.(log);
      failureReason = error instanceof Error ? error.message : String(error);
      if (!(error instanceof AiUnavailableError)) {
        console.warn('[compass] call brief generation failed, using deterministic brief:', failureReason);
      }
      generated = null;
    }
  }

  let guardrailWarnings: CallBrief['guardrailWarnings'] = [];
  if (generated) {
    const verdict = runGuardrails(generated, deps.guardrails);
    if (!verdict.ok) {
      console.warn(
        '[compass] generated call brief blocked by guardrails:',
        verdict.blocking.map((v) => `${v.code} @ ${v.path}: "${v.match}"`).join('; '),
      );
      failureReason = `blocked by guardrails: ${verdict.blocking.map((v) => v.code).join(', ')}`;
      generated = null;
      model = null;
    } else {
      guardrailWarnings = verdict.warnings.map((v) => ({
        code: v.code,
        message: v.message,
        path: v.path,
      }));
    }
  }

  const resolved = generated ?? buildFallbackCallBrief(input);

  const brief = callBriefSchema.parse({
    version: CALL_BRIEF_VERSION,
    accountId: input.view.envelope.accountId,
    salonName: account.salonName ?? 'This account',
    region: account.region ?? '—',
    status: CALL_STATUS_LABELS[input.status],
    headline: resolved.headline,
    situation: resolved.situation,
    opener: resolved.opener,
    talkingPoints: resolved.talkingPoints,
    avoid: input.playbook?.avoid ?? [],
    facts: buildFacts(input),
    playbookTitle: input.playbook?.title ?? null,
    source: generated ? 'ai' : 'fallback',
    model,
    promptHash,
    guardrailWarnings,
  } satisfies CallBrief);

  return {
    brief,
    calledApi,
    path: generated ? 'ai' : 'fallback',
    failureReason: generated ? null : failureReason,
  };
}

// ---------------------------------------------------------------------------
// Deterministic assembly — runs with or without a model
// ---------------------------------------------------------------------------

/**
 * The facts panel. Verbatim from the filtered account — this is the "signals
 * listed with data" column PRODUCT_SPEC §16 requires, and it is identical on
 * both paths, which is why the fallback brief is still worth reading.
 */
export function buildFacts(input: CallBriefInput): Array<{ label: string; value: string }> {
  const account = input.view.account as Partial<CompassAccountRecord>;
  const facts: Array<{ label: string; value: string }> = [];

  for (const tile of (account.evidenceTiles ?? []) as EvidenceTile[]) {
    facts.push({ label: tile.caption, value: tile.value });
  }
  // The band is often ALREADY one of the tiles (it backfills a short row). Listing
  // it twice makes the rep look for a difference that is not there.
  const bandAlreadyShown = facts.some((fact) => fact.label.startsWith('Health band'));
  if (account.healthBand && !bandAlreadyShown) {
    facts.push({ label: 'Health band', value: HEALTH_BAND_LABELS[account.healthBand] });
  }
  for (const gap of account.peerGaps ?? []) {
    if (gap.suppressed) continue;
    facts.push({
      label: `${gap.label} (${gap.cohortN} salons)`,
      value: PEER_BAND_LABELS[gap.band],
    });
  }
  if (account.roomCount) {
    facts.push({ label: 'Rooms', value: String(account.roomCount) });
  }
  if (input.daysSinceContact !== null) {
    facts.push({ label: 'Since you last spoke', value: `${input.daysSinceContact} days` });
  }
  const open = (account.coachingRequests ?? []).filter((r) => r.state === 'open').length;
  if (open > 0) {
    facts.push({ label: 'Coaching they asked for', value: `${open} open` });
  }
  return facts;
}

const PEER_BAND_LABELS: Record<string, string> = {
  ahead: 'Ahead of the cohort',
  in_line: 'In line with the cohort',
  behind: 'Behind the cohort',
  unknown: 'Not comparable',
};

/**
 * The brief we ship when there is no model: same facts, plainer sentences,
 * assembled from the playbook and the account. It must read like something a rep
 * would actually take into a call — not like a degraded state.
 */
export function buildFallbackCallBrief(input: CallBriefInput): GeneratedCallBrief {
  const account = input.view.account as Partial<CompassAccountRecord>;
  const name = account.salonName ?? 'This account';
  const tiles = (account.evidenceTiles ?? []) as EvidenceTile[];
  const openRequest = (account.coachingRequests ?? []).find((r) => r.state === 'open');

  const headline = account.signalHeadline
    ? `${name} — ${lowerFirst(account.signalHeadline)}.`
    : `${name} — ${CALL_STATUS_LABELS[input.status].toLowerCase()}.`;

  const situationParts: string[] = [];
  if (account.signalHeadline) situationParts.push(`${account.signalHeadline}.`);
  if (tiles.length > 0) {
    situationParts.push(
      `The numbers behind that: ${tiles.map((t) => `${t.value} ${lowerFirst(t.caption)}`).join('; ')}.`,
    );
  }
  if (openRequest) {
    situationParts.push(
      `They asked for coaching themselves — "${openRequest.topic}". Their request, not just our signal.`,
    );
  }
  if (input.daysSinceContact !== null) {
    situationParts.push(`It has been ${input.daysSinceContact} days since anyone from UVALUX spoke to them.`);
  }
  if (situationParts.length === 0) {
    situationParts.push(`${name} is steady. This is a relationship call, not a rescue.`);
  }

  const opener =
    input.playbook?.opener ??
    input.suggestion?.body ??
    'Open by asking how the month has gone before bringing up anything you have seen.';

  const talkingPoints: string[] = [];
  for (const step of input.playbook?.steps ?? []) talkingPoints.push(step);
  if (openRequest) {
    talkingPoints.push(`Answer their coaching request first: "${openRequest.topic}".`);
  }
  for (const tile of tiles) {
    if (talkingPoints.length >= 5) break;
    talkingPoints.push(`Have ${tile.value} ${lowerFirst(tile.caption)} ready if they ask where it came from.`);
  }
  if (talkingPoints.length === 0) {
    talkingPoints.push('Ask what has changed on the floor since you last spoke.');
    talkingPoints.push('Confirm the equipment is running the way they expect.');
    talkingPoints.push('Ask what would make the next order easier to place.');
  }

  return {
    headline,
    situation: situationParts.join(' ').slice(0, 1200),
    opener: opener.slice(0, 600),
    talkingPoints: talkingPoints.slice(0, 5).map((point) => point.slice(0, 300)),
  };
}

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

/**
 * The exact facts the model may use. Built from the FILTERED account, so a
 * private-tier salon's facts are structurally absent rather than withheld by
 * instruction — a prompt rule is not a security boundary; the filter is.
 */
export function buildCallBriefContext(input: CallBriefInput): Record<string, unknown> {
  const account = input.view.account as Partial<CompassAccountRecord>;
  return {
    salonName: account.salonName ?? null,
    region: account.region ?? null,
    roomCount: account.roomCount ?? null,
    softwareAdoption: account.softwareAdoption ?? null,
    status: CALL_STATUS_LABELS[input.status],
    healthBand: account.healthBand ? HEALTH_BAND_LABELS[account.healthBand] : null,
    signal: account.signalHeadline ?? null,
    evidence: ((account.evidenceTiles ?? []) as EvidenceTile[]).map((tile) => ({
      value: tile.value,
      caption: tile.caption,
    })),
    peerComparison: (account.peerGaps ?? [])
      .filter((gap) => !gap.suppressed)
      .map((gap) => ({ what: gap.label, where: PEER_BAND_LABELS[gap.band], cohortSize: gap.cohortN })),
    orderRecencyDays: account.orderRecencyDays ?? null,
    daysSinceContact: input.daysSinceContact,
    theyAskedForCoaching: (account.coachingRequests ?? [])
      .filter((request) => request.state === 'open')
      .map((request) => request.topic),
    ordersTheySent: (account.draftOrders ?? []).map((order) => ({
      state: order.state,
      lines: order.lineCount,
    })),
    suggestedConversation: input.suggestion?.body ?? null,
    playbook: input.playbook
      ? { title: input.playbook.title, steps: input.playbook.steps, avoid: input.playbook.avoid }
      : null,
  };
}

function buildPrompt(input: CallBriefInput, context: Record<string, unknown>): string {
  const rep = input.repName ? `${input.repName} is the rep on this account.` : '';
  return [
    `Prepare the pre-call brief for ${context.salonName ?? 'this account'}. ${rep}`.trim(),
    '',
    'These are the only facts you may use:',
    JSON.stringify(context, null, 2),
    '',
    'Write four fields:',
    '- headline: one sentence naming the salon and the single reason this call is worth making.',
    '- situation: two to four sentences on where they stand and why now.',
    '- opener: how to open the call, in one or two sentences.',
    '- talkingPoints: three to five short points, each resting on a fact above.',
    '',
    'Do not restate the fact list — the brief shows it separately.',
  ].join('\n');
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
