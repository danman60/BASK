/**
 * Studio campaign generation (PRODUCT_SPEC §16 "Campaign generator" row).
 *
 * This is a *caller* of the one AI module in `@bask/core` — `generateJson`,
 * `runGuardrails`, `hashContext`. It deliberately does not open its own
 * Anthropic client; there is one wrapper in this product and this file uses it.
 *
 * The same three properties Daybreak guarantees hold here:
 *
 *  1. **The model writes prose, never numbers.** Audience size, discount
 *     percent, dates and channel counts are assembled in code from real rows.
 *     The model is handed them as facts and told to use them verbatim.
 *  2. **Guardrails are enforcement, not a prompt ask.** Every generated string
 *     goes through `runGuardrails` before it can be stored or shown. A blocked
 *     generation falls back rather than reaching the owner.
 *  3. **A dead key is not a dead demo.** The deterministic path produces a
 *     complete, on-voice content set from templates. Which path ran is recorded
 *     on the content itself (`provenance.source`) and logged, because "is the
 *     AI real?" is a question the pitch has to be able to answer honestly.
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

export const CAMPAIGN_CONTENT_VERSION = 1 as const;

export const CAMPAIGN_TONES = ['warm', 'fun', 'straight'] as const;
export type CampaignTone = (typeof CAMPAIGN_TONES)[number];

export const TONE_LABELS: Record<CampaignTone, string> = {
  warm: 'Warm',
  fun: 'Fun',
  straight: 'Straight-talk',
};

/** How each tone should sound, in the model's own instructions. */
const TONE_DIRECTION: Record<CampaignTone, string> = {
  warm: 'Warm and personal, like the owner writing to someone she knows by name. Unhurried.',
  fun: 'Light and playful. A little cheeky. Still never breathless, still no exclamation-mark spam.',
  straight: 'Plain and direct. Says the offer and the time, gets out of the way. No flourish.',
};

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

export const campaignOfferSchema = z.object({
  /** Short offer line — becomes the badge on the graphic. */
  headline: z.string().min(1).max(60),
  discountPercent: z.number().int().min(0).max(100).nullable().default(null),
  discountAmount: z.number().min(0).max(10_000).nullable().default(null),
  /** When the offer is good for, in plain language. */
  validity: z.string().min(1).max(80),
});
export type CampaignOffer = z.infer<typeof campaignOfferSchema>;

/** The fields a model is allowed to write. Nothing here is a number we rely on. */
export const generatedCampaignSchema = z.object({
  graphicHeadline: z.string().min(1).max(40),
  instagramCaption: z.string().min(1).max(500),
  facebookPost: z.string().min(1).max(600),
  smsBody: z.string().min(1).max(320),
  emailSubject: z.string().min(1).max(120),
  emailBody: z.string().min(1).max(900),
});
export type GeneratedCampaign = z.infer<typeof generatedCampaignSchema>;

export const campaignContentSchema = z.object({
  version: z.literal(CAMPAIGN_CONTENT_VERSION),
  tone: z.enum(CAMPAIGN_TONES),
  goal: z.string().min(1).max(140),
  offer: campaignOfferSchema,
  graphic: z.object({
    headline: z.string().min(1).max(40),
    badge: z.string().min(1).max(60),
  }),
  instagram: z.object({ handle: z.string().min(1), caption: z.string().min(1) }),
  facebook: z.object({ body: z.string().min(1) }),
  sms: z.object({ body: z.string().min(1) }),
  email: z.object({ subject: z.string().min(1), body: z.string().min(1) }),
  provenance: z.object({
    source: z.enum(['ai', 'fallback']),
    model: z.string().nullable().default(null),
    promptHash: z.string().min(1),
    generatedAt: z.string().min(1),
    /** Why the deterministic path ran, when it did. Shown to nobody but us. */
    fallbackReason: z.string().nullable().default(null),
    guardrailWarnings: z
      .array(z.object({ code: z.string(), message: z.string(), path: z.string() }))
      .default([]),
  }),
});
export type CampaignContent = z.infer<typeof campaignContentSchema>;

export function safeParseCampaignContent(value: unknown): CampaignContent | null {
  const result = campaignContentSchema.safeParse(value);
  return result.success ? result.data : null;
}

/** JSON Schema mirror of `generatedCampaignSchema` for structured outputs. */
const GENERATED_CAMPAIGN_JSON_SCHEMA = {
  type: 'object',
  properties: {
    graphicHeadline: {
      type: 'string',
      description:
        'The headline printed on the square graphic. At most 34 characters and at most 4 words on a line — it is set large in a serif face. No emoji.',
    },
    instagramCaption: {
      type: 'string',
      description:
        'Instagram caption. Two or three short sentences, ending with how to book. One emoji at most.',
    },
    facebookPost: {
      type: 'string',
      description:
        'Facebook post. Slightly longer and more conversational than the Instagram caption. No hashtags.',
    },
    smsBody: {
      type: 'string',
      description:
        'Text message under 160 characters INCLUDING the trailing "Reply STOP to opt out." Starts with "Hi {{first name}}".',
    },
    emailSubject: { type: 'string', description: 'Email subject line, under 60 characters.' },
    emailBody: {
      type: 'string',
      description: 'Email body, three or four short sentences. Plain text, no markdown headers.',
    },
  },
  required: [
    'graphicHeadline',
    'instagramCaption',
    'facebookPost',
    'smsBody',
    'emailSubject',
    'emailBody',
  ],
  additionalProperties: false,
} as const;

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface CampaignGenerationInput {
  salonName: string;
  /** Social handle — bolded in front of the caption, exactly as in mockup 03. */
  handle: string;
  goal: string;
  tone: CampaignTone;
  offer: CampaignOffer;
  audience: {
    label: string;
    description: string;
    /** People the campaign will actually reach, after consent. */
    count: number;
  };
  channels: string[];
  /** Provenance from the insight this campaign is fixing. Null when from scratch. */
  fixing: { title: string; evidenceSentence: string } | null;
  /** Human-readable send time, e.g. "Sunday 6:00 pm". */
  sendLabel: string;
  /**
   * Bumped on every regenerate. It goes into the prompt hash so the model is
   * asked afresh, and it selects an alternate deterministic template so
   * "↻ Regenerate" visibly changes the words on the offline path too.
   */
  variant?: number;
}

export interface CampaignGenerationDeps {
  guardrails?: GuardrailOptions;
  env?: NodeJS.ProcessEnv;
  /** Force the deterministic path. */
  offline?: boolean;
  logGeneration?: (log: AiGenerationLog) => void | Promise<void>;
}

export interface CampaignGenerationResult {
  content: CampaignContent;
  /** True when this run made a network call, whether or not it succeeded. */
  calledApi: boolean;
}

const SYSTEM_PROMPT = `You write marketing for a tanning and wellness salon. The salon owner will read every word before anything is sent, and will edit whatever you get wrong.

Voice:
- Talk to one customer, not to a list.
- Plain language, about a grade 7 reading level. No marketing jargon, no "elevate your glow journey".
- Warm and direct. No exclamation-mark spam. At most one emoji per piece, and only where it fits.
- Never invent a testimonial, a statistic, or a name.

Hard rules:
- Use ONLY the offer, dates and times you are given. Never invent a different discount, a different day, or a different time window.
- Never make a medical or health claim. Nothing cures, treats, heals, prevents, or boosts anything in the body. Do not mention vitamin D, immunity, mood, skin conditions, or pain.
- Never promise a guaranteed result.
- Never offer anything free unless the offer you were given says free.`;

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export async function generateCampaignContent(
  input: CampaignGenerationInput,
  deps: CampaignGenerationDeps = {},
): Promise<CampaignGenerationResult> {
  const context = buildPromptContext(input);
  const promptHash = hashContext(context);
  const generatedAt = new Date().toISOString();

  let generated: GeneratedCampaign | null = null;
  let model: string | null = null;
  let calledApi = false;
  let fallbackReason: string | null = null;
  let guardrailWarnings: CampaignContent['provenance']['guardrailWarnings'] = [];

  const env = deps.env ?? process.env;
  if (deps.offline) {
    fallbackReason = 'offline requested';
  } else if (!isAiConfigured(env)) {
    fallbackReason = 'OPENAI_API_KEY is not set';
  } else {
    calledApi = true;
    try {
      const result = await generateJson<GeneratedCampaign>({
        call: 'campaign.draft',
        system: SYSTEM_PROMPT,
        prompt: buildPrompt(input, context),
        jsonSchema: GENERATED_CAMPAIGN_JSON_SCHEMA as unknown as Record<string, unknown>,
        validate: (value) => generatedCampaignSchema.parse(value),
        env: deps.env,
      });
      generated = result.value;
      model = result.model;
      await deps.logGeneration?.(result.log);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const log = (error as { aiLog?: AiGenerationLog }).aiLog;
      if (log) await deps.logGeneration?.(log);
      fallbackReason = err.message;
      if (!(err instanceof AiUnavailableError)) {
        console.warn('[studio] campaign generation failed, using deterministic set:', err.message);
      }
      generated = null;
    }
  }

  // Guardrails are the gate between "a model said it" and "an owner sees it".
  if (generated) {
    const verdict = runGuardrails(generated, deps.guardrails);
    if (!verdict.ok) {
      fallbackReason = `guardrails: ${verdict.blocking
        .map((v) => `${v.code} @ ${v.path} ("${v.match}")`)
        .join('; ')}`;
      console.warn('[studio] generated campaign blocked by guardrails:', fallbackReason);
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

  const resolved = generated ?? buildFallbackCampaign(input);
  const source = generated ? 'ai' : 'fallback';

  // The one line that answers "was that real?" from a terminal.
  console.info(
    `[studio] campaign generated · path=${source} · model=${model ?? 'none'} · tone=${input.tone} · promptHash=${promptHash}` +
      (fallbackReason ? ` · reason=${fallbackReason}` : ''),
  );

  const content = campaignContentSchema.parse({
    version: CAMPAIGN_CONTENT_VERSION,
    tone: input.tone,
    goal: input.goal,
    offer: input.offer,
    graphic: { headline: resolved.graphicHeadline, badge: badgeText(input.offer) },
    instagram: { handle: input.handle, caption: resolved.instagramCaption },
    facebook: { body: resolved.facebookPost },
    sms: { body: resolved.smsBody },
    email: { subject: resolved.emailSubject, body: resolved.emailBody },
    provenance: {
      source,
      model,
      promptHash,
      generatedAt,
      fallbackReason,
      guardrailWarnings,
    },
  } satisfies CampaignContent);

  return { content, calledApi };
}

/** The badge on the graphic: the offer and when it is good for. Assembled, never generated. */
export function badgeText(offer: CampaignOffer): string {
  return `${offer.headline} · ${offer.validity}`;
}

// ---------------------------------------------------------------------------
// Offer suggestion — also guardrailed, because the cap applies to us too
// ---------------------------------------------------------------------------

export interface OfferSuggestionInput {
  goal: string;
  audienceLabel: string;
  /** What the insight says is wrong, when there is one. */
  fixing: string | null;
  /** The window the offer should cover, e.g. "this Tuesday 1–5 pm". */
  validity: string;
  maxDiscountPercent: number;
}

/**
 * The suggested opening offer. Deterministic on purpose: an offer is a
 * commercial decision with a hard cap, and it is the one field the owner is
 * most likely to change. Suggesting it in code means the number is always
 * inside the cap by construction rather than by validation.
 */
export function suggestOffer(input: OfferSuggestionInput): CampaignOffer {
  // Twenty percent is the conventional "worth leaving the house" midweek offer
  // and sits under the default 25% cap. Clamped anyway — a salon can lower the
  // cap below 20 and the suggestion must follow it down.
  const percent = Math.min(20, input.maxDiscountPercent);
  return {
    headline: `${percent}% off`,
    discountPercent: percent,
    discountAmount: null,
    validity: input.validity,
  };
}

export interface OfferVerdict {
  ok: boolean;
  /** Amber inline note, grade-7 register. Never a blocking dialog. */
  message: string | null;
  /** What the offer becomes if the owner takes the one-tap fix. */
  suggestion: CampaignOffer | null;
}

/**
 * Checks an owner-edited offer against the salon's caps. Returns a fix rather
 * than just a complaint — DESIGN_SPEC §3.3: "amber inline note with a one-tap
 * fix, never a blocking dialog".
 */
export function checkOffer(offer: CampaignOffer, options: GuardrailOptions = {}): OfferVerdict {
  const maxPercent = options.maxDiscountPercent ?? 25;
  const maxAmount = options.maxDiscountAmount ?? 50;

  if (offer.discountPercent !== null && offer.discountPercent > maxPercent) {
    return {
      ok: false,
      message: `That's ${offer.discountPercent}% off. Your cap is ${maxPercent}%.`,
      suggestion: {
        ...offer,
        headline: offer.headline.replace(/\d{1,3}\s?%/, `${maxPercent}%`),
        discountPercent: maxPercent,
      },
    };
  }

  if (offer.discountAmount !== null && offer.discountAmount > maxAmount) {
    return {
      ok: false,
      message: `That's $${offer.discountAmount} off. Your cap is $${maxAmount}.`,
      suggestion: {
        ...offer,
        headline: offer.headline.replace(/\$\s?\d{1,4}(\.\d{2})?/, `$${maxAmount}`),
        discountAmount: maxAmount,
      },
    };
  }

  const verdict = runGuardrails({ headline: offer.headline, validity: offer.validity }, options);
  if (!verdict.ok) {
    return { ok: false, message: verdict.blocking[0]!.message, suggestion: null };
  }
  if (verdict.warnings.length > 0) {
    return { ok: true, message: verdict.warnings[0]!.message, suggestion: null };
  }
  return { ok: true, message: null, suggestion: null };
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildPromptContext(input: CampaignGenerationInput): Record<string, unknown> {
  return {
    salonName: input.salonName,
    handle: input.handle,
    goal: input.goal,
    tone: input.tone,
    offer: {
      headline: input.offer.headline,
      validity: input.offer.validity,
      discountPercent: input.offer.discountPercent,
      discountAmount: input.offer.discountAmount,
    },
    audience: input.audience,
    channels: [...input.channels].sort(),
    fixing: input.fixing,
    sendLabel: input.sendLabel,
    variant: input.variant ?? 0,
  };
}

function buildPrompt(input: CampaignGenerationInput, context: Record<string, unknown>): string {
  return [
    `Write a campaign for ${input.salonName}.`,
    '',
    `Goal: ${input.goal}`,
    input.fixing
      ? `This campaign exists to fix: ${input.fixing.title}. ${stripBold(input.fixing.evidenceSentence)}`
      : 'This campaign was started from scratch, not from a problem.',
    '',
    `Tone: ${TONE_LABELS[input.tone]}. ${TONE_DIRECTION[input.tone]}`,
    '',
    'These are the only facts you may use:',
    JSON.stringify(context, null, 2),
    '',
    `The offer is exactly "${input.offer.headline}", good for ${input.offer.validity}. Say it that way in every piece. Do not round it, sweeten it, or add a second offer.`,
    '',
    'Write six fields: graphicHeadline, instagramCaption, facebookPost, smsBody, emailSubject, emailBody.',
    'The text message must stay under 160 characters including "Reply STOP to opt out." at the end.',
    'Do not mention how many people are receiving this.',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Deterministic fallback — the offline demo path
// ---------------------------------------------------------------------------

/**
 * A complete content set built from templates and the real offer.
 *
 * This is what the owner sees when the key is unfunded, the network is gone, or
 * the model said something the guardrails refused. It has to read like a
 * campaign somebody would actually send, not like an error message — the
 * offline demo runs on this path (IMPLEMENTATION_SPEC §0.1).
 */
export function buildFallbackCampaign(input: CampaignGenerationInput): GeneratedCampaign {
  const { offer, salonName, tone } = input;
  const offerLine = offer.headline.toLowerCase();
  const when = offer.validity;

  // Two sets per tone so "↻ Regenerate" actually changes the words when the
  // model is unreachable. A regenerate that returns byte-identical copy reads
  // as a broken button, and the offline path is a demo path, not a stub.
  const byTone: Record<CampaignTone, GeneratedCampaign[]> = {
    warm: [
      {
        graphicHeadline: 'Come back to your usual spot.',
        instagramCaption: `We have kept your favourite bed warm. ${capitalise(offerLine)} ${when} — book at the desk or from the link in bio.`,
        facebookPost: `It has been a while since we have seen some of you, so here is a reason to come back. ${capitalise(offerLine)} ${when} at ${salonName}. Same beds, same people, no wait. Book ahead or just walk in.`,
        smsBody: `Hi {{first name}} — it's ${salonName}. ${capitalise(offerLine)} ${when}. Want your usual bed? Reply YES. Reply STOP to opt out.`,
        emailSubject: `${capitalise(offerLine)} ${when}`,
        emailBody: `Hi {{first name}},\n\nIt has been a little while. We are running ${offerLine} ${when} — your usual bed, none of the wait.\n\nReply to this email or call the desk and we will hold a time for you.\n\n— The team at ${salonName}`,
      },
      {
        graphicHeadline: 'A quieter hour, kept for you.',
        instagramCaption: `The calm stretch of the week is the best one. ${capitalise(offerLine)} ${when} at ${salonName} — no queue, no rush. Book from the link in bio.`,
        facebookPost: `Some of our favourite people have not been in for a while, so we are holding ${when} for them. ${capitalise(offerLine)}, every bed, nobody waiting. Call the desk or book online.`,
        smsBody: `Hi {{first name}} — ${salonName} here. We are running ${offerLine} ${when}. Reply YES and your bed is held. Reply STOP to opt out.`,
        emailSubject: `We kept ${when} quiet for you`,
        emailBody: `Hi {{first name}},\n\nWe have not seen you in a bit, and ${when} is the calmest stretch of our week. ${capitalise(offerLine)}, your pick of the beds.\n\nReply here and we will put your name on one.\n\n— The team at ${salonName}`,
      },
    ],
    fun: [
      {
        graphicHeadline: 'Your glow called. It misses you.',
        instagramCaption: `Consider this your sign. ${capitalise(offerLine)} ${when} — grab a slot before your favourite bed gets claimed. Link in bio ☀️`,
        facebookPost: `Plot twist: the best time to come in is ${when}, when nobody else has thought of it. ${capitalise(offerLine)}, no queue, no rush. Book from the link or wander in — we will sort you out.`,
        smsBody: `Hi {{first name}} — ${salonName} here ☀️ ${capitalise(offerLine)} ${when}. Reply YES and we'll hold your bed. Reply STOP to opt out.`,
        emailSubject: `${capitalise(offerLine)} — ${when}`,
        emailBody: `Hi {{first name}},\n\nWe are doing ${offerLine} ${when}. That is the quiet stretch, which means your pick of the beds and nobody hovering.\n\nReply and we will hold one for you.\n\n— ${salonName}`,
      },
      {
        graphicHeadline: 'The quiet hour is the good hour.',
        instagramCaption: `Everyone books the busy times. Be smarter than everyone. ${capitalise(offerLine)} ${when} at ${salonName} — link in bio ☀️`,
        facebookPost: `Here is a small secret: ${when} is the best slot of the week and almost nobody takes it. ${capitalise(offerLine)}, your pick of the beds, in and out. Book online or just turn up.`,
        smsBody: `Hi {{first name}} — the quiet slot is back. ${capitalise(offerLine)} ${when} at ${salonName}. Reply YES to grab it. Reply STOP to opt out.`,
        emailSubject: `The good slot nobody books`,
        emailBody: `Hi {{first name}},\n\n${capitalise(offerLine)} ${when}. It is the quietest stretch we have, which is exactly why it is the best one.\n\nReply and it is yours.\n\n— ${salonName}`,
      },
    ],
    straight: [
      {
        graphicHeadline: `${capitalise(offerLine)}, ${when}.`,
        instagramCaption: `${capitalise(offerLine)} ${when} at ${salonName}. Book at the desk, by phone, or from the link in bio.`,
        facebookPost: `${capitalise(offerLine)} ${when} at ${salonName}. Every bed, no minimum, no catch. Walk in or book ahead — whichever suits.`,
        smsBody: `Hi {{first name}} — ${salonName}: ${offerLine} ${when}. Reply YES to book. Reply STOP to opt out.`,
        emailSubject: `${capitalise(offerLine)}, ${when}`,
        emailBody: `Hi {{first name}},\n\n${capitalise(offerLine)} ${when} at ${salonName}. Any bed, no minimum.\n\nReply to book a time, or come in when it suits.\n\n— ${salonName}`,
      },
      {
        graphicHeadline: `${when}. ${capitalise(offerLine)}.`,
        instagramCaption: `One day only: ${offerLine} ${when} at ${salonName}. Every bed included. Book from the link in bio.`,
        facebookPost: `${capitalise(offerLine)} ${when}. That is the whole offer — every bed, no minimum spend, no sign-up. Book online, call the desk, or walk in.`,
        smsBody: `Hi {{first name}} — ${offerLine} ${when} at ${salonName}. Every bed. Reply YES to book. Reply STOP to opt out.`,
        emailSubject: `${when}: ${offerLine}`,
        emailBody: `Hi {{first name}},\n\n${capitalise(offerLine)} ${when}. Every bed, no minimum.\n\nReply with a time and we will book it in.\n\n— ${salonName}`,
      },
    ],
  };

  const options = byTone[tone];
  return options[Math.abs(input.variant ?? 0) % options.length]!;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function stripBold(text: string): string {
  return text.replace(/\*\*/g, '');
}
