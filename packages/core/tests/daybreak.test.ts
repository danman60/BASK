/**
 * Daybreak generation — the demo-safe contract (IMPLEMENTATION_SPEC §0.1).
 *
 * Three properties, all asserted without a network call:
 *   1. a brief is always produced, even with no API
 *   2. a cached brief is served without calling out
 *   3. a brief that trips a guardrail is discarded, not shown
 */

import { describe, expect, it, vi } from 'vitest';

import { EVIDENCE_VERSION, type Evidence } from '../src/evidence';
import { daybreakBriefSchema, type DaybreakBrief } from '../src/ai/brief';
import {
  buildFallbackNarrative,
  buildPromptContext,
  generateDaybreak,
  type DaybreakInput,
} from '../src/ai/daybreak';
import { resolveModel } from '../src/ai/model';

function evidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    version: EVIDENCE_VERSION,
    metric: {
      key: 'retail_attachment_rate',
      label: 'Visits that included a product',
      unit: 'percent',
      value: 15,
      formatted: '15%',
    },
    window: { label: 'last 14 days', start: '2026-07-23', end: '2026-08-05', days: 14 },
    comparison: null,
    impact: {
      amount: 640,
      currency: 'CAD',
      cadence: 'per_month',
      basis: 'Six fewer product sales a day at $50 each.',
      confidence: 'high',
      chipLabel: '≈ $640/mo if it holds',
      tone: 'cost',
    },
    contributingFactors: [],
    series: null,
    sentence: 'Lotion sales per visit fell from **21% to 15%** over three weeks.',
    ...overrides,
  };
}

function input(overrides: Partial<DaybreakInput> = {}): DaybreakInput {
  return {
    salonId: 'salon-1',
    salonName: 'Sunset Ridge Tanning & Wellness',
    ownerFirstName: 'Dana',
    forDate: '2026-08-06',
    currency: 'CAD',
    yesterdayVsTypicalPercent: 8,
    insights: [
      {
        id: 'insight-1',
        dedupeKey: 'salon-1:retail_attachment_slip',
        type: 'retail_attachment_slip',
        severity: 'high',
        title: 'Retail attachment is slipping',
        summary: 'Attachment fell six points.',
        impactEstimate: 640,
        impactCurrency: 'CAD',
        linkedActionType: 'create_campaign',
        primaryActionLabel: 'Fix this',
        evidence: evidence(),
      },
    ],
    pulse: {
      revenueToday: 412,
      revenueTypicalForWeekday: 400,
      revenueYesterday: 2100,
      revenueTypicalForYesterdayWeekday: 1944,
      bookingsToday: 23,
      inSalonNow: 4,
      roomsInUse: 3,
      roomsTotal: 8,
      activeMembers: 108,
      membershipRevenueMonthly: 8042,
    },
    ...overrides,
  };
}

const NO_API = { OPENAI_API_KEY: '' } as NodeJS.ProcessEnv;

describe('offline generation', () => {
  it('produces a valid brief with no API key', async () => {
    const result = await generateDaybreak(input(), { env: NO_API });
    expect(result.calledApi).toBe(false);
    expect(result.brief.source).toBe('fallback');
    expect(() => daybreakBriefSchema.parse(result.brief)).not.toThrow();
  });

  it('states yesterday against its own weekday, not today\'s', async () => {
    // forDate 2026-08-06 is a Thursday, so "yesterday" is a Wednesday. Naming
    // Thursday here would pair the right number with the wrong day.
    const { brief } = await generateDaybreak(input(), { env: NO_API });
    expect(brief.greeting.headline).toContain('Dana');
    expect(brief.greeting.headline).toContain('8% above');
    expect(brief.greeting.headline).toContain('Wednesday');
    expect(brief.greeting.headline).not.toContain('Thursday');
  });

  it('the emphasis appears verbatim inside the headline', async () => {
    const { brief } = await generateDaybreak(input(), { env: NO_API });
    expect(brief.greeting.headline).toContain(brief.greeting.emphasis);
  });

  it('builds the Daybreak eyebrow from the virtual date', async () => {
    const { brief } = await generateDaybreak(input(), { env: NO_API });
    expect(brief.greeting.eyebrow).toBe('Daybreak · Thursday, August 6');
  });

  it('never emits a wall-clock timestamp', async () => {
    const a = await generateDaybreak(input(), { env: NO_API });
    await new Promise((r) => setTimeout(r, 5));
    const b = await generateDaybreak(input(), { env: NO_API });
    expect(a.brief.generatedAt).toBe(b.brief.generatedAt);
    expect(a.brief.generatedAt.startsWith('2026-08-06')).toBe(true);
  });

  it('handles a morning with nothing to report', async () => {
    const { brief } = await generateDaybreak(
      input({ insights: [], yesterdayVsTypicalPercent: 0 }),
      { env: NO_API },
    );
    expect(brief.cards).toHaveLength(0);
    expect(brief.greeting.subProse.length).toBeGreaterThan(10);
  });
});

describe('card assembly', () => {
  it('mirrors the mockup 01 anatomy', async () => {
    const { brief } = await generateDaybreak(input(), { env: NO_API });
    const card = brief.cards[0]!;
    expect(card.rail).toBe('warn');
    expect(card.title).toBe('Retail attachment is slipping');
    expect(card.evidenceSentence).toContain('**21% to 15%**');
    expect(card.impactChip.label).toBe('≈ $640/mo if it holds');
    expect(card.actions.map((a) => a.kind)).toEqual(['primary', 'quiet', 'ghost']);
    expect(card.actions[0]!.label).toBe('Fix this');
  });

  it('renders an opportunity with a green rail', async () => {
    const opportunity = input({
      insights: [
        {
          ...input().insights[0]!,
          evidence: evidence({
            impact: { ...evidence().impact, tone: 'opportunity', chipLabel: 'Opportunity' },
          }),
        },
      ],
    });
    const { brief } = await generateDaybreak(opportunity, { env: NO_API });
    expect(brief.cards[0]!.rail).toBe('good');
  });

  it('caps the attention queue at five', async () => {
    const many = input({
      insights: Array.from({ length: 9 }, (_, i) => ({
        ...input().insights[0]!,
        id: `insight-${i}`,
        dedupeKey: `salon-1:type-${i}`,
      })),
    });
    const { brief } = await generateDaybreak(many, { env: NO_API });
    expect(brief.cards).toHaveLength(5);
  });

  it('builds the "Today so far" pulse rows', async () => {
    const { brief } = await generateDaybreak(input(), { env: NO_API });
    expect(brief.pulse.rows.map((r) => r.label)).toEqual([
      'Revenue',
      'Bookings today',
      'In the salon now',
      'Rooms in use',
    ]);
    expect(brief.pulse.rows[0]!.whisper).toBe('on pace');
  });
});

describe('caching (demo-safe rule)', () => {
  it('serves a stored brief without calling the API', async () => {
    const first = await generateDaybreak(input(), { env: NO_API });
    const loadCached = vi.fn().mockResolvedValue(first.brief);

    const second = await generateDaybreak(input(), {
      env: { OPENAI_API_KEY: 'sk-should-never-be-used' } as NodeJS.ProcessEnv,
      loadCached,
    });

    expect(loadCached).toHaveBeenCalledOnce();
    expect(second.cacheHit).toBe(true);
    expect(second.calledApi).toBe(false);
    expect(second.brief.source).toBe('cache');
  });

  it('keys the cache on the facts, so a changed day misses', async () => {
    const a = await generateDaybreak(input(), { env: NO_API });
    const b = await generateDaybreak(input({ yesterdayVsTypicalPercent: -4 }), { env: NO_API });
    expect(a.brief.promptHash).not.toBe(b.brief.promptHash);
  });

  it('regenerates rather than serving a brief the UI can no longer render', async () => {
    const loadCached = vi.fn().mockResolvedValue({ version: 999, nonsense: true });
    const result = await generateDaybreak(input(), { env: NO_API, loadCached });
    expect(result.cacheHit).toBe(false);
    expect(result.brief.source).toBe('fallback');
  });

  it('persists every generated brief', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    await generateDaybreak(input(), { env: NO_API, save });
    expect(save).toHaveBeenCalledOnce();
    const saved = save.mock.calls[0]![0] as DaybreakBrief;
    expect(saved.forDate).toBe('2026-08-06');
  });
});

describe('prompt context', () => {
  it('carries the facts and no identifiers', () => {
    const context = buildPromptContext(input());
    expect(context.owner).toBe('Dana');
    expect(context.weekday).toBe('Thursday');
    expect(JSON.stringify(context)).not.toContain('salon-1');
    expect(JSON.stringify(context)).not.toContain('insight-1');
  });

  it('strips the bold markers the model should not copy', () => {
    const context = buildPromptContext(input()) as { insights: Array<{ sentence: string }> };
    expect(context.insights[0]!.sentence).not.toContain('**');
  });
});

describe('fallback narrative', () => {
  it('reports a decline honestly', () => {
    const narrative = buildFallbackNarrative(input({ yesterdayVsTypicalPercent: -12 }));
    expect(narrative.headline).toContain('12% below');
  });

  it('does not invent a delta it does not have', () => {
    const narrative = buildFallbackNarrative(input({ yesterdayVsTypicalPercent: null }));
    expect(narrative.emphasis).toBe('steady');
  });

  it('counts attention items and wins separately, in lower case mid-sentence', () => {
    const narrative = buildFallbackNarrative(input());
    expect(narrative.subProse).toMatch(/^One thing needs attention/);
    expect(narrative.subProse).not.toMatch(/, and Two/);
  });
});

describe('model selection', () => {
  it('defaults to the configured mid-tier model per IMPLEMENTATION_SPEC §1.2', () => {
    expect(resolveModel(undefined, {} as NodeJS.ProcessEnv)).toEqual({
      model: 'gpt-4.1',
      source: 'default',
    });
  });

  it('honours the single AI_MODEL env var', () => {
    expect(resolveModel('daybreak.brief', { AI_MODEL: 'claude-opus-5' } as NodeJS.ProcessEnv)).toEqual(
      { model: 'claude-opus-5', source: 'env' },
    );
  });

  it('applies the in-code per-call override for short classification work', () => {
    expect(
      resolveModel('insight.classify', { AI_MODEL: 'claude-opus-5' } as NodeJS.ProcessEnv),
    ).toEqual({ model: 'gpt-4.1-mini', source: 'override' });
  });
});
