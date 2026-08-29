/**
 * The one server-side LLM wrapper (IMPLEMENTATION_SPEC §1.2).
 *
 * Everything AI in this product goes through here. The SDK is imported lazily
 * so `packages/core` stays importable from the browser and from React Native —
 * pulling the Node SDK into a client bundle would break the "one brain, three
 * clients" shape the monorepo is built around.
 *
 * Provider: OpenAI. Switched from Anthropic on 2026-08-07 because that key ran
 * out of credits mid-build and every generated surface was falling back. The
 * seam is deliberately narrow — `isAiConfigured`, the SDK import and the request
 * body — so swapping back is a small, reviewable diff rather than a rewrite.
 */

import { createHash } from 'node:crypto';

import { AI_MAX_TOKENS, resolveModel, type AiCall } from './model';

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface AiGenerationLog {
  call: AiCall;
  model: string;
  /** Hash of the prompt context — the usefulness metric in PRODUCT_SPEC §22. */
  promptContextHash: string;
  outputHash: string;
  usage: AiUsage | null;
  ok: boolean;
  error?: string;
}

export interface GenerateJsonArgs<T> {
  call: AiCall;
  system: string;
  prompt: string;
  /** JSON Schema the response is constrained to. */
  jsonSchema: Record<string, unknown>;
  /** Validates and narrows the parsed response. Throws on drift. */
  validate: (value: unknown) => T;
  /** Overrides `process.env` — used in tests. */
  env?: NodeJS.ProcessEnv;
}

export interface GenerateJsonResult<T> {
  value: T;
  model: string;
  log: AiGenerationLog;
}

/** Stable content hash. Used for cache keys and generation logging. */
export function hashContext(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex').slice(0, 32);
}

/**
 * Deterministic JSON: keys sorted, no incidental whitespace. Two structurally
 * equal objects must hash identically or the brief cache never hits.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

/**
 * Parse JSON that may be wrapped in prose or a fenced code block.
 *
 * `output_config.format` should make the response a bare JSON object, but that
 * is a server-side guarantee we cannot verify from here on every model and
 * every platform. Falling back to extracting the outermost braces costs three
 * lines and removes a whole class of "worked in testing" failure.
 */
export function parseJsonLoosely(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) {
      throw new AiUnavailableError('Model response was not JSON');
    }
    return JSON.parse(text.slice(start, end + 1));
  }
}

export class AiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiUnavailableError';
  }
}

export function isAiConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.OPENAI_API_KEY?.trim());
}

/**
 * The embedding model, named once.
 *
 * It MUST match whatever embedded the corpus, or every similarity score is
 * noise — a query vector from one model and a stored vector from another are
 * two different spaces, and the database will happily return the wrong rows
 * without erroring. Changing this means re-embedding
 * `bask.knowledge_claim` (`pnpm --filter @bask/db knowledge:embed-claims`,
 * after nulling the column) and `bask.knowledge_chunk` with it.
 */
export const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Embed one short piece of text for vector search.
 *
 * Same lazy SDK import as `generateJson`, for the same reason: `packages/core`
 * must stay importable from a browser bundle. Throws `AiUnavailableError` when
 * there is no key — callers that must not fail (retrieval is an enhancement,
 * never a dependency) catch it and carry on with no citations.
 */
export async function embedText(
  text: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<number[]> {
  if (!isAiConfigured(env)) {
    throw new AiUnavailableError('OPENAI_API_KEY is not set');
  }

  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  const vector = response.data?.[0]?.embedding;
  if (!vector || vector.length === 0) {
    throw new AiUnavailableError('Embedding response carried no vector');
  }
  return vector;
}

/**
 * Ask the model for a JSON object matching `jsonSchema`, then validate it.
 *
 * Structured outputs do the shape enforcement server-side; `validate` is the
 * belt to that suspenders, because a shape-valid brief can still be a brief we
 * refuse to show.
 */
export async function generateJson<T>(args: GenerateJsonArgs<T>): Promise<GenerateJsonResult<T>> {
  const env = args.env ?? process.env;
  if (!isAiConfigured(env)) {
    throw new AiUnavailableError('OPENAI_API_KEY is not set');
  }

  const { model } = resolveModel(args.call, env);
  const promptContextHash = hashContext({ system: args.system, prompt: args.prompt, model });

  // Lazy so the SDK never lands in a browser or React Native bundle.
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  try {
    const response = await client.chat.completions.create({
      model,
      max_completion_tokens: AI_MAX_TOKENS[args.call],
      messages: [
        { role: 'system', content: args.system },
        { role: 'user', content: args.prompt },
      ],
      // Structured Outputs: the schema is enforced server-side, so `validate`
      // is the belt to that suspenders rather than the only check.
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'bask_response',
          strict: false,
          schema: args.jsonSchema as never,
        },
      },
    } as never);

    const message = response as {
      choices: Array<{
        finish_reason?: string | null;
        message?: { content?: string | null; refusal?: string | null };
      }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const choice = message.choices?.[0];

    // A refusal arrives as a successful HTTP 200 with `refusal` set and content
    // null. Reading content unconditionally is how that becomes a crash.
    if (choice?.message?.refusal) {
      throw new AiUnavailableError('Model declined the request');
    }

    const text = (choice?.message?.content ?? '').trim();

    if (!text) throw new AiUnavailableError('Model returned no text');

    const value = args.validate(parseJsonLoosely(text));

    return {
      value,
      model,
      log: {
        call: args.call,
        model,
        promptContextHash,
        outputHash: hashContext(value),
        usage: message.usage
          ? {
              inputTokens: message.usage.prompt_tokens ?? 0,
              outputTokens: message.usage.completion_tokens ?? 0,
            }
          : null,
        ok: true,
      },
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    throw Object.assign(err, {
      aiLog: {
        call: args.call,
        model,
        promptContextHash,
        outputHash: '',
        usage: null,
        ok: false,
        error: err.message,
      } satisfies AiGenerationLog,
    });
  }
}
