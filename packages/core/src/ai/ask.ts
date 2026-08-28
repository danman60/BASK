import { z } from 'zod';

import { generateJson, isAiConfigured, AiUnavailableError } from './client';

/**
 * "Ask it anything" — a typed question about the salon's own numbers.
 *
 * THE ONE DESIGN DECISION THAT MATTERS: the model never touches the database.
 * It is handed a fixed bundle of already-computed facts and answers from those
 * alone. It writes no SQL, picks no tables, and cannot reach anything that was
 * not put in front of it.
 *
 * That is not caution for its own sake. A text-to-SQL box demoed live is the
 * classic way this feature dies on stage: it is slow, it fails in front of the
 * room, and when it succeeds nobody can tell whether the answer is right. A
 * bounded bundle answers in one call, always returns the same answer to the same
 * question, and — because every number in the bundle came from the same pipeline
 * the rest of the product uses — cannot quietly disagree with the screen behind
 * it.
 *
 * The cost is real and is stated on screen rather than hidden: questions outside
 * the bundle get "I don't have that", not a guess. `answered: false` is a
 * first-class outcome and the UI renders it plainly. An assistant that always
 * has an answer teaches the owner to distrust all of them.
 */

export const AskAnswerSchema = z.object({
  /** False when the bundle cannot support an answer. Then `answer` says why. */
  answered: z.boolean(),
  /** Two or three sentences, grade-7, no jargon. */
  answer: z.string().min(1).max(700),
  /** The fact keys leaned on, so the UI can show its working. */
  usedFacts: z.array(z.string()).max(6),
});

export type AskAnswer = z.infer<typeof AskAnswerSchema>;

const SYSTEM = `You answer a salon owner's question about their own business.

You are given a FACTS object. It is everything you know.

Hard rules:
- Use ONLY numbers that appear in FACTS. Never estimate, extrapolate or invent one.
- If FACTS cannot answer the question, set answered=false and say plainly what you
  do not have. Do not guess, and do not answer a nearby question instead.
- Plain language, about a grade 7 reading level. No jargon: say "money coming in
  monthly from memberships", never "MRR". No percentages the FACTS do not contain.
- Two or three sentences. Lead with the answer, then the number it rests on.
- Never make a medical or health claim. Never promise a discount or a guarantee.
- "usedFacts" lists the FACTS keys you actually used.`;

const JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['answered', 'answer', 'usedFacts'],
  properties: {
    answered: { type: 'boolean' },
    answer: { type: 'string' },
    usedFacts: { type: 'array', items: { type: 'string' } },
  },
} as const;

export interface AskInput {
  question: string;
  /** Already-computed, already-formatted. The model sees nothing else. */
  facts: Record<string, unknown>;
  env?: NodeJS.ProcessEnv;
}

export interface AskResult extends AskAnswer {
  model: string | null;
  /** True when the deterministic path answered because no model was available. */
  offline: boolean;
}

/**
 * The offline answer. Not an error message dressed up as one — it says what it
 * is, so a demo without a key degrades into something honest rather than
 * something that looks broken.
 */
function offlineAnswer(): AskResult {
  return {
    answered: false,
    answer:
      'The question box needs its language model, and it is not switched on right now. Every number on the rest of these screens is computed without it and is unaffected.',
    usedFacts: [],
    model: null,
    offline: true,
  };
}

export async function askAboutSalon(input: AskInput): Promise<AskResult> {
  const question = input.question.trim();
  if (!question) {
    return { answered: false, answer: 'Ask a question and I will look it up.', usedFacts: [], model: null, offline: false };
  }
  if (!isAiConfigured(input.env)) return offlineAnswer();

  try {
    const result = await generateJson<AskAnswer>({
      call: 'ask.answer',
      system: SYSTEM,
      prompt: `FACTS:\n${JSON.stringify(input.facts, null, 2)}\n\nQUESTION: ${question}`,
      jsonSchema: JSON_SCHEMA,
      validate: (value) => AskAnswerSchema.parse(value),
      env: input.env,
    });
    return { ...result.value, model: result.model, offline: false };
  } catch (error) {
    /* A failure here must never look like an answer. The demo is allowed to say
       the assistant fell over; it is not allowed to make something up. */
    if (error instanceof AiUnavailableError) return offlineAnswer();
    return {
      answered: false,
      answer: 'That did not come back cleanly. Nothing else on these screens depends on it.',
      usedFacts: [],
      model: null,
      offline: false,
    };
  }
}
