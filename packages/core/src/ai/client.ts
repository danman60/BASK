/**
 * The one server-side Anthropic wrapper (IMPLEMENTATION_SPEC §1.2).
 *
 * Everything AI in this product goes through here. The SDK is imported lazily
 * so `packages/core` stays importable from the browser and from React Native —
 * pulling the Node SDK into a client bundle would break the "one brain, three
 * clients" shape the monorepo is built around.
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
  return Boolean(env.ANTHROPIC_API_KEY?.trim());
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
    throw new AiUnavailableError('ANTHROPIC_API_KEY is not set');
  }

  const { model } = resolveModel(args.call, env);
  const promptContextHash = hashContext({ system: args.system, prompt: args.prompt, model });

  // Lazy so the SDK never lands in a browser or React Native bundle.
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model,
      max_tokens: AI_MAX_TOKENS[args.call],
      system: args.system,
      messages: [{ role: 'user', content: args.prompt }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: args.jsonSchema as never,
        },
      },
    } as never);

    const message = response as {
      stop_reason?: string | null;
      content: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    // Refusals arrive as a successful HTTP 200 with an empty content array.
    // Reading content[0] unconditionally is how that becomes a crash.
    if (message.stop_reason === 'refusal') {
      throw new AiUnavailableError('Model declined the request');
    }

    const text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('')
      .trim();

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
              inputTokens: message.usage.input_tokens ?? 0,
              outputTokens: message.usage.output_tokens ?? 0,
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
