/**
 * Failed-payment recovery drafts (PRODUCT_SPEC §16 "Payment recovery" row).
 *
 * Same contract as the campaign generator: `@bask/core`'s `generateJson` is the
 * only client, guardrails are enforcement, and a dead key produces a
 * deterministic draft instead of a dead screen.
 *
 * The register here is deliberately different from marketing. A failed card is
 * an embarrassing thing to receive a message about, so the drafts are short,
 * unbothered, and never imply the person did something wrong. Nothing is sent
 * until the owner approves each message individually.
 */

import {
  AiUnavailableError,
  generateJson,
  hashContext,
  isAiConfigured,
  runGuardrails,
  type AiGenerationLog,
  type GuardrailOptions,
} from '@bask/core';
import { z } from 'zod';

export const recoveryDraftSchema = z.object({
  membershipId: z.string().min(1),
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  channel: z.enum(['sms', 'email']),
  body: z.string().min(1).max(600),
});
export type RecoveryDraft = z.infer<typeof recoveryDraftSchema>;

const generatedRecoverySchema = z.object({
  messages: z
    .array(z.object({ membershipId: z.string().min(1), body: z.string().min(1).max(400) }))
    .min(1),
});

const GENERATED_RECOVERY_JSON_SCHEMA = {
  type: 'object',
  properties: {
    messages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          membershipId: { type: 'string', description: 'Copied verbatim from the input.' },
          body: {
            type: 'string',
            description:
              'The message. Under 220 characters for a text. Starts with the customer\'s first name. Says the card did not go through, that their membership is still active, and how to fix it in one step.',
          },
        },
        required: ['membershipId', 'body'],
        additionalProperties: false,
      },
    },
  },
  required: ['messages'],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You write short, kind messages on behalf of a tanning and wellness salon to members whose monthly payment did not go through.

Voice:
- Say it plainly and move on. A declined card is usually an expired card, not a crisis.
- Never imply the person is late, delinquent, in arrears, or at fault.
- Never threaten to cancel, suspend, or charge a fee.
- No marketing. Do not upsell, do not mention offers, do not thank them for their loyalty.
- First name only. One sentence of context, one sentence of what to do.

Hard rules:
- Never make a medical or health claim.
- Never offer a discount, a free month, or a guarantee.
- Never state an amount other than the one you are given.`;

export interface RecoveryCandidate {
  membershipId: string;
  customerId: string;
  customerName: string;
  firstName: string;
  tier: string;
  monthlyPrice: number;
  failedAttempts: number;
  daysSinceLastVisit: number | null;
  channel: 'sms' | 'email';
}

export interface RecoveryGenerationInput {
  salonName: string;
  currency: string;
  candidates: RecoveryCandidate[];
}

export interface RecoveryGenerationDeps {
  guardrails?: GuardrailOptions;
  env?: NodeJS.ProcessEnv;
  offline?: boolean;
  logGeneration?: (log: AiGenerationLog) => void | Promise<void>;
}

export interface RecoveryGenerationResult {
  drafts: RecoveryDraft[];
  source: 'ai' | 'fallback';
  model: string | null;
  promptHash: string;
  fallbackReason: string | null;
  calledApi: boolean;
}

export async function generateRecoveryDrafts(
  input: RecoveryGenerationInput,
  deps: RecoveryGenerationDeps = {},
): Promise<RecoveryGenerationResult> {
  const context = {
    salonName: input.salonName,
    currency: input.currency,
    members: input.candidates.map((c) => ({
      membershipId: c.membershipId,
      firstName: c.firstName,
      tier: c.tier,
      monthlyPrice: c.monthlyPrice,
      channel: c.channel,
    })),
  };
  const promptHash = hashContext(context);

  let generated: Map<string, string> | null = null;
  let model: string | null = null;
  let calledApi = false;
  let fallbackReason: string | null = null;

  const env = deps.env ?? process.env;
  if (deps.offline) {
    fallbackReason = 'offline requested';
  } else if (!isAiConfigured(env)) {
    fallbackReason = 'OPENAI_API_KEY is not set';
  } else {
    calledApi = true;
    try {
      const result = await generateJson({
        // Recovery drafts are the same "short outbound message" job as a
        // campaign, so they share its call budget rather than inventing a new
        // config surface (`AI_CALL_OVERRIDES` in packages/core).
        call: 'campaign.draft',
        system: SYSTEM_PROMPT,
        prompt: buildPrompt(input, context),
        jsonSchema: GENERATED_RECOVERY_JSON_SCHEMA as unknown as Record<string, unknown>,
        validate: (value) => generatedRecoverySchema.parse(value),
        env: deps.env,
      });
      model = result.model;
      await deps.logGeneration?.(result.log);

      const verdict = runGuardrails(result.value, deps.guardrails);
      if (!verdict.ok) {
        fallbackReason = `guardrails: ${verdict.blocking.map((v) => v.code).join('; ')}`;
        console.warn('[recovery] drafts blocked by guardrails:', fallbackReason);
      } else {
        generated = new Map(result.value.messages.map((m) => [m.membershipId, m.body]));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const log = (error as { aiLog?: AiGenerationLog }).aiLog;
      if (log) await deps.logGeneration?.(log);
      fallbackReason = err.message;
      if (!(err instanceof AiUnavailableError)) {
        console.warn('[recovery] generation failed, using deterministic drafts:', err.message);
      }
    }
  }

  // A model that answered for four of five members is not a success. Any gap
  // falls the whole set back, so the owner never reviews a mixed-voice batch.
  const complete =
    generated !== null && input.candidates.every((c) => generated!.get(c.membershipId)?.trim());
  if (generated && !complete) {
    fallbackReason = fallbackReason ?? 'model skipped one or more members';
    generated = null;
  }

  const source = generated ? 'ai' : 'fallback';
  console.info(
    `[recovery] drafts generated · path=${source} · model=${model ?? 'none'} · n=${input.candidates.length} · promptHash=${promptHash}` +
      (fallbackReason ? ` · reason=${fallbackReason}` : ''),
  );

  const drafts = input.candidates.map((c) =>
    recoveryDraftSchema.parse({
      membershipId: c.membershipId,
      customerId: c.customerId,
      customerName: c.customerName,
      channel: c.channel,
      body: generated?.get(c.membershipId) ?? fallbackBody(c, input.salonName),
    }),
  );

  return {
    drafts,
    source,
    model: generated ? model : null,
    promptHash,
    fallbackReason,
    calledApi,
  };
}

function buildPrompt(input: RecoveryGenerationInput, context: Record<string, unknown>): string {
  return [
    `Write one message for each member below, on behalf of ${input.salonName}.`,
    '',
    JSON.stringify(context, null, 2),
    '',
    'Return one object per member, with the membershipId copied exactly.',
    'Each message: say the card on file did not go through, that their membership has not changed, and that they can update it at the desk or by replying.',
    'Do not mention the amount unless it reads naturally, and if you do, use the monthlyPrice given.',
  ].join('\n');
}

/** The draft we send when there is no model. Short, kind, and never wrong. */
export function fallbackBody(candidate: RecoveryCandidate, salonName: string): string {
  return (
    `Hi ${candidate.firstName} — it's ${salonName}. The card on file for your ${candidate.tier} membership didn't go through this month. ` +
    `Nothing has changed on your account. Pop in or reply here and we'll update it in a minute.`
  );
}
