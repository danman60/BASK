/**
 * Guardrails (IMPLEMENTATION_SPEC §1.2): "enforced as post-generation
 * validators, not just prompt asks."
 *
 * A prompt instruction is a request. These are the enforcement. Every string a
 * model produces passes through here before it can be stored, shown, or sent.
 *
 * Two rules for M0:
 *   1. No medical claims. A tanning salon that says UV "treats" anything has a
 *      regulatory problem, and we are not going to hand them one.
 *   2. Discount cap. Nothing may offer a bigger discount than the salon
 *      configured, no matter how persuasive the model finds it.
 */

export type GuardrailCode =
  | 'medical_claim'
  | 'discount_over_cap'
  | 'free_service_offer'
  | 'unsupported_guarantee';

export interface GuardrailViolation {
  code: GuardrailCode;
  /** Grade-7 register — this text is shown inline to the owner, amber wash. */
  message: string;
  /** The exact offending substring, for highlighting. */
  match: string;
  /** Where in the brief it was found, e.g. `cards[1].evidenceSentence`. */
  path: string;
  severity: 'block' | 'warn';
}

export interface GuardrailOptions {
  /** Largest percentage discount the salon allows. */
  maxDiscountPercent?: number;
  /** Largest absolute discount the salon allows, in dollars. */
  maxDiscountAmount?: number;
  /** Treat "free" offers as a violation. */
  allowFreeOffers?: boolean;
}

export const DEFAULT_GUARDRAILS: Required<GuardrailOptions> = {
  maxDiscountPercent: 25,
  maxDiscountAmount: 50,
  allowFreeOffers: false,
};

/**
 * Medical/therapeutic claim patterns.
 *
 * Written against the *claim*, not the noun: "vitamin D" is a fine word, and
 * "boosts your vitamin D levels" is a health claim. Matching bare nouns would
 * make the validator useless through false positives, and a validator people
 * switch off protects nobody.
 */
const MEDICAL_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /\b(cure|cures|curing|heal|heals|healing)\b/i,
    message: 'Says the service cures or heals something. Describe how it feels, not what it treats.',
  },
  {
    pattern: /\b(treat|treats|treating|treatment for|therapy for|remedy for)\s+(?:your\s+)?\b(acne|psoriasis|eczema|depression|sad|seasonal affective|arthritis|pain|inflammation|rosacea|dermatitis)\b/i,
    message: 'Names a medical condition the service treats. Remove the condition.',
  },
  {
    pattern: /\b(?:clinically|medically|scientifically)\s+(?:proven|shown|tested)\b/i,
    message: 'Claims medical proof. We cannot back that up.',
  },
  {
    pattern: /\bfda[-\s]?approved\b/i,
    message: 'Claims FDA approval.',
  },
  {
    pattern: /\b(?:boosts?|increases?|raises?|improves?)\s+(?:your\s+)?(?:vitamin\s?d|immune system|immunity|serotonin|circulation|metabolism)\b/i,
    message: 'Makes a health claim about the body. Keep it to how the service feels.',
  },
  {
    pattern: /\b(?:prevents?|reduces? the risk of|protects? against)\s+(?:\w+\s+){0,2}(?:cancer|disease|illness|infection)\b/i,
    message: 'Claims the service prevents disease.',
  },
  {
    pattern: /\bdoctor[-\s]?(?:recommended|approved)\b/i,
    message: 'Claims medical endorsement.',
  },
  {
    pattern: /\bsafe\s+(?:alternative\s+to|substitute\s+for)\s+(?:medication|medicine|treatment)\b/i,
    message: 'Positions the service against medical treatment.',
  },
];

const PERCENT_DISCOUNT = /(\d{1,3})\s?%\s*(?:off|discount|savings?)/gi;
const AMOUNT_DISCOUNT = /\$\s?(\d{1,4}(?:\.\d{2})?)\s*(?:off|discount)/gi;
const FREE_OFFER =
  /\b(?:free|complimentary|no charge|on the house|zero cost)\b(?!\s*(?:consultation|shipping|delivery|parking|wi-?fi|advice))/gi;
const GUARANTEE = /\b(?:guarantee[ds]?|guaranteed results|100%\s+(?:guaranteed|satisfaction))\b/gi;

/** Run every rule over one string. */
export function checkText(
  text: string,
  path: string,
  options: GuardrailOptions = {},
): GuardrailViolation[] {
  const opts = { ...DEFAULT_GUARDRAILS, ...options };
  const violations: GuardrailViolation[] = [];
  if (!text) return violations;

  for (const rule of MEDICAL_PATTERNS) {
    const match = rule.pattern.exec(text);
    if (match) {
      violations.push({
        code: 'medical_claim',
        message: rule.message,
        match: match[0],
        path,
        severity: 'block',
      });
    }
  }

  for (const match of text.matchAll(PERCENT_DISCOUNT)) {
    const percent = Number(match[1]);
    if (percent > opts.maxDiscountPercent) {
      violations.push({
        code: 'discount_over_cap',
        message: `Offers ${percent}% off. Your cap is ${opts.maxDiscountPercent}%.`,
        match: match[0],
        path,
        severity: 'block',
      });
    }
  }

  for (const match of text.matchAll(AMOUNT_DISCOUNT)) {
    const amount = Number(match[1]);
    if (amount > opts.maxDiscountAmount) {
      violations.push({
        code: 'discount_over_cap',
        message: `Offers $${amount} off. Your cap is $${opts.maxDiscountAmount}.`,
        match: match[0],
        path,
        severity: 'block',
      });
    }
  }

  if (!opts.allowFreeOffers) {
    for (const match of text.matchAll(FREE_OFFER)) {
      violations.push({
        code: 'free_service_offer',
        message: 'Gives something away for free. Turn this on in settings if you meant it.',
        match: match[0],
        path,
        severity: 'warn',
      });
    }
  }

  for (const match of text.matchAll(GUARANTEE)) {
    violations.push({
      code: 'unsupported_guarantee',
      message: 'Promises a guaranteed result.',
      match: match[0],
      path,
      severity: 'warn',
    });
  }

  return violations;
}

/**
 * Walk every string in a nested structure and validate it. Generated payloads
 * are shaped objects; checking only the fields we remembered to name is how a
 * claim reaches production through a field nobody thought about.
 */
export function checkPayload(
  value: unknown,
  options: GuardrailOptions = {},
  path = '$',
): GuardrailViolation[] {
  if (typeof value === 'string') return checkText(value, path, options);
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => checkPayload(item, options, `${path}[${index}]`));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      checkPayload(child, options, `${path}.${key}`),
    );
  }
  return [];
}

export interface GuardrailResult {
  ok: boolean;
  violations: GuardrailViolation[];
  blocking: GuardrailViolation[];
  warnings: GuardrailViolation[];
}

/**
 * `ok` is false only for blocking violations. Warnings surface as an amber
 * inline note with a one-tap fix (DESIGN_SPEC §3.3) — never a blocking dialog.
 */
export function runGuardrails(value: unknown, options: GuardrailOptions = {}): GuardrailResult {
  const violations = checkPayload(value, options);
  const blocking = violations.filter((v) => v.severity === 'block');
  const warnings = violations.filter((v) => v.severity === 'warn');
  return { ok: blocking.length === 0, violations, blocking, warnings };
}
