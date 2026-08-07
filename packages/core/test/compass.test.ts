/**
 * Compass derivation tests.
 *
 * The adversarial ones matter most: `deriveAccountView` is the only door into
 * the Compass UI, so anything it lets through at the wrong tier is a breach of
 * the promise the "What UVALUX sees" screen makes to a salon on the other
 * screen. These assert the door, not just the arithmetic.
 */

import { describe, expect, it } from 'vitest';

import { COMPASS_FIELDS, type ConsentTier } from '../src/consent';
import {
  CALL_STATUS_LABELS,
  bandForHealth,
  buildEvidenceTiles,
  buildHealthCohort,
  callPriorityScore,
  callStatusFor,
  deriveAccountView,
  healthBandFactors,
  healthDistribution,
  suggestionFor,
  type AccountSignalInput,
  type DeriveAccountInput,
} from '../src/compass/derive';
import { buildCallBriefContext, buildFallbackCallBrief, canBrief, generateCallBrief } from '../src/ai/call-brief';

// The two seeded arcs the Call List has to render (packages/db/fixtures/portfolio.ts).
const MAPLE_GLOW_SIGNAL: AccountSignalInput = {
  signalType: 'retail_decline',
  severity: 'high',
  headline: 'Retail is down 17% over eight weeks',
  metrics: { windowWeeks: 8, reorderGapDays: 62, retailChangePercent: -17 },
};

const NORTHERN_SUN_SIGNAL: AccountSignalInput = {
  signalType: 'expansion_ready',
  severity: 'info',
  headline: 'Booked solid four weeks running — ready for a second room',
  metrics: { waitlistCount: 34, utilisationPercent: 91, memberGrowthPercent: 19 },
};

/** A twelve-salon book of business, eleven of which contribute. */
const PORTFOLIO_CONTRIBUTORS = [
  { consentTier: 'coaching' as ConsentTier, healthScore: 83 },
  { consentTier: 'coaching' as ConsentTier, healthScore: 48 },
  { consentTier: 'coaching' as ConsentTier, healthScore: 88 },
  { consentTier: 'private' as ConsentTier, healthScore: 72 },
  { consentTier: 'benchmarks' as ConsentTier, healthScore: 62 },
  { consentTier: 'coaching' as ConsentTier, healthScore: 84 },
  { consentTier: 'coaching' as ConsentTier, healthScore: 69 },
  { consentTier: 'benchmarks' as ConsentTier, healthScore: 76 },
  { consentTier: 'coaching' as ConsentTier, healthScore: 81 },
  { consentTier: 'benchmarks' as ConsentTier, healthScore: 66 },
  { consentTier: 'coaching' as ConsentTier, healthScore: 79 },
  { consentTier: 'benchmarks' as ConsentTier, healthScore: 22 },
];

const COHORT = buildHealthCohort(PORTFOLIO_CONTRIBUTORS);

function input(overrides: Partial<DeriveAccountInput> = {}): DeriveAccountInput {
  return {
    envelope: {
      accountId: 'acct-1',
      salonId: 'salon-1',
      salonSlug: 'maple-glow',
      accountNumber: 'UVX-02101',
      territory: 'Ontario',
      repName: 'Fintan Halloran',
      lastContactAt: '2026-07-13T18:00:00.000Z',
      snoozedUntil: null,
    },
    consentTier: 'coaching',
    salonName: 'Maple Glow Tanning',
    city: 'Burlington',
    region: 'ON',
    salonStatus: 'active',
    healthScore: 48,
    lifecycle: 'at_risk',
    roomCount: 6,
    equipmentProfile: { roomTypes: ['UV Level 3', 'Red light'], deviceCount: 6 },
    lastActiveAt: '2026-08-06',
    signal: MAPLE_GLOW_SIGNAL,
    coachingRequests: [
      {
        id: 'cr-1',
        topic: 'Retail has stalled and I do not know why',
        state: 'open',
        requestedAt: '2026-08-04T20:30:00.000Z',
        message: 'Our lotion sales have been sliding since the spring.',
      },
    ],
    draftOrders: [],
    cohort: COHORT,
    ...overrides,
  };
}

describe('health bands', () => {
  it('turns a score into a band and never exposes the score itself', () => {
    expect(bandForHealth(88)).toBe('thriving');
    expect(bandForHealth(69)).toBe('steady');
    expect(bandForHealth(48)).toBe('needs_attention');
    expect(bandForHealth(null)).toBe('needs_attention');

    const view = deriveAccountView(input());
    expect(view.account.healthBand).toBe('needs_attention');
    // "no naked scores" — the number must not survive anywhere in the payload
    expect(JSON.stringify(view.account)).not.toContain('healthScore');
  });

  it('explains a band with factors rather than a number', () => {
    const factors = healthBandFactors({
      lifecycle: 'at_risk',
      salonStatus: 'active',
      orderRecencyDays: 62,
      signal: MAPLE_GLOW_SIGNAL,
    });
    expect(factors.length).toBeGreaterThanOrEqual(2);
    expect(factors.join(' ')).not.toMatch(/\d\d/);
  });

  it('counts a private salon as unknown in the network distribution', () => {
    const distribution = healthDistribution(PORTFOLIO_CONTRIBUTORS);
    const unknown = distribution.find((entry) => entry.band === 'unknown');
    // Four non-coaching salons: one private + three benchmarks. None is derivable.
    expect(unknown?.count).toBe(5);
    expect(distribution.reduce((sum, entry) => sum + entry.count, 0)).toBe(12);
  });
});

describe('cohort gating', () => {
  it('excludes private salons from the contributor count', () => {
    expect(COHORT.suppressed).toBe(false);
    expect(COHORT.contributorCount).toBe(11);
  });

  it('suppresses a cohort that is too small to anonymise', () => {
    const small = buildHealthCohort(PORTFOLIO_CONTRIBUTORS.slice(0, 4));
    expect(small.suppressed).toBe(true);
    expect(small.medianHealth).toBeNull();
  });

  it('drops the peer-gap tile entirely when the cohort is suppressed', () => {
    const view = deriveAccountView(
      input({ cohort: buildHealthCohort(PORTFOLIO_CONTRIBUTORS.slice(0, 3)) }),
    );
    expect(view.account.peerGaps).toEqual([]);
  });
});

describe('evidence tiles — the Maple Glow retail-decline arc', () => {
  it('reads the real seeded metrics, in the mockup 04 order', () => {
    const view = deriveAccountView(input());
    const tiles = view.account.evidenceTiles ?? [];
    expect(tiles).toHaveLength(3);
    expect(tiles[0]).toEqual({
      value: '−17%',
      caption: 'Retail sales, 8 weeks',
      direction: 'down',
    });
    expect(tiles[1]).toEqual({
      value: '62 days',
      caption: 'Since their last order',
      direction: 'down',
    });
    // Third tile backfills from the n-gated peer cohort, never from a guess.
    expect(tiles[2]?.caption).toContain('11 salons');
  });

  it('never pads the row with a figure it does not have', () => {
    const tiles = buildEvidenceTiles({
      signal: { signalType: 'retail_decline', severity: 'high', headline: 'x', metrics: {} },
      healthBand: 'steady',
      healthGap: {
        metric: 'account_health',
        label: 'Account health vs. peers',
        band: 'unknown',
        cohortN: 2,
        cohortValue: null,
        salonValue: null,
        suppressed: true,
      },
      orderRecencyDays: null,
    });
    expect(tiles).toEqual([]);
  });
});

describe('evidence tiles — the Northern Sun expansion arc', () => {
  it('reads all three seeded expansion metrics as up', () => {
    const view = deriveAccountView(
      input({
        salonName: 'Northern Sun Wellness',
        city: 'Grande Prairie',
        region: 'AB',
        healthScore: 88,
        lifecycle: 'expansion',
        signal: NORTHERN_SUN_SIGNAL,
        coachingRequests: [],
      }),
    );
    const tiles = view.account.evidenceTiles ?? [];
    expect(tiles.map((tile) => tile.value)).toEqual(['91%', '34', '+19%']);
    expect(tiles.every((tile) => tile.direction === 'up')).toBe(true);
  });

  it('reads as an opportunity, not a problem', () => {
    expect(
      callStatusFor({ signal: NORTHERN_SUN_SIGNAL, hasOpenDraftOrder: false, healthBand: 'thriving' }),
    ).toBe('ready_to_grow');
    expect(
      callStatusFor({ signal: MAPLE_GLOW_SIGNAL, hasOpenDraftOrder: false, healthBand: 'needs_attention' }),
    ).toBe('needs_attention');
    expect(callStatusFor({ signal: null, hasOpenDraftOrder: true, healthBand: 'thriving' })).toBe(
      'order_in',
    );
  });
});

describe('consent enforcement at the derivation door', () => {
  it('gives a private-tier salon identity and nothing else', () => {
    const view = deriveAccountView(input({ consentTier: 'private', salonName: 'Rivière Lumière' }));
    expect(Object.keys(view.account).sort()).toEqual([...COMPASS_FIELDS.identity].sort());
    expect(view.account.healthBand).toBeUndefined();
    expect(view.account.evidenceTiles).toBeUndefined();
    expect(view.account.signalHeadline).toBeUndefined();
    expect(view.account.coachingRequests).toBeUndefined();
  });

  it('gives a benchmarks-tier salon participation but no business signal', () => {
    const view = deriveAccountView(input({ consentTier: 'benchmarks' }));
    expect(view.account.benchmarkParticipant).toBe(true);
    expect(view.account.healthBand).toBeUndefined();
    expect(view.account.evidenceTiles).toBeUndefined();
  });

  it('narrows immediately when a tier is downgraded — the demo beat', () => {
    const coaching = Object.keys(deriveAccountView(input({ consentTier: 'coaching' })).account);
    const benchmarks = Object.keys(deriveAccountView(input({ consentTier: 'benchmarks' })).account);
    const priv = Object.keys(deriveAccountView(input({ consentTier: 'private' })).account);
    expect(coaching.length).toBeGreaterThan(benchmarks.length);
    expect(benchmarks.length).toBeGreaterThan(priv.length);
  });

  it('keeps routing facts out of the filtered payload', () => {
    const view = deriveAccountView(input());
    expect(view.account).not.toHaveProperty('accountId');
    expect(view.envelope.accountId).toBe('acct-1');
  });
});

describe('ranking and suggestions', () => {
  it('ranks their own request above our detection alone', () => {
    const withRequest = callPriorityScore({
      signal: MAPLE_GLOW_SIGNAL,
      hasOpenDraftOrder: false,
      hasOpenCoachingRequest: true,
      daysSinceContact: 25,
      annualWholesaleValue: 41_200,
      healthBand: 'needs_attention',
    });
    const withoutRequest = callPriorityScore({
      signal: MAPLE_GLOW_SIGNAL,
      hasOpenDraftOrder: false,
      hasOpenCoachingRequest: false,
      daysSinceContact: 25,
      annualWholesaleValue: 41_200,
      healthBand: 'needs_attention',
    });
    expect(withRequest).toBeGreaterThan(withoutRequest);
  });

  it('puts the retail-decline call above the expansion call', () => {
    const maple = callPriorityScore({
      signal: MAPLE_GLOW_SIGNAL,
      hasOpenDraftOrder: false,
      hasOpenCoachingRequest: true,
      daysSinceContact: 25,
      annualWholesaleValue: 41_200,
      healthBand: 'needs_attention',
    });
    const northern = callPriorityScore({
      signal: NORTHERN_SUN_SIGNAL,
      hasOpenDraftOrder: false,
      hasOpenCoachingRequest: false,
      daysSinceContact: 14,
      annualWholesaleValue: 78_400,
      healthBand: 'thriving',
    });
    expect(maple).toBeGreaterThan(northern);
  });

  it('maps a signal to a playbook-backed conversation', () => {
    expect(suggestionFor(MAPLE_GLOW_SIGNAL)?.playbookKey).toBe('retail-reset');
    expect(suggestionFor(NORTHERN_SUN_SIGNAL)?.playbookKey).toBe('expansion-conversation');
    expect(suggestionFor(null)).toBeNull();
    expect(suggestionFor(null, { hasOpenDraftOrder: true })?.lead).toBe('Draft order arrived');
  });
});

describe('call brief', () => {
  const briefInput = {
    view: deriveAccountView(input()),
    status: 'needs_attention' as const,
    suggestion: suggestionFor(MAPLE_GLOW_SIGNAL),
    playbook: {
      title: 'Retail reset conversation',
      opener: 'Their retail is down and they may not have noticed. Lead with the number, not the pitch.',
      steps: ['Name the trend and the window.', 'Ask what changed on the floor.'],
      avoid: ['Opening with a catalogue', 'Blaming their staff'],
    },
    daysSinceContact: 25,
    repName: 'Fintan Halloran',
  };

  it('refuses to brief on a private-tier account', () => {
    expect(canBrief(deriveAccountView(input({ consentTier: 'private' })))).toBe(false);
    expect(canBrief(deriveAccountView(input()))).toBe(true);
  });

  it('builds a usable brief with no model at all', async () => {
    const result = await generateCallBrief(briefInput, { offline: true });
    expect(result.path).toBe('fallback');
    expect(result.calledApi).toBe(false);
    expect(result.brief.source).toBe('fallback');
    expect(result.brief.talkingPoints.length).toBeGreaterThanOrEqual(1);
    expect(result.brief.avoid).toContain('Blaming their staff');
    // Facts come from the filtered account and are identical on both paths.
    expect(result.brief.facts.some((fact) => fact.value === '−17%')).toBe(true);
  });

  it('surfaces their own coaching request in the fallback prose', () => {
    const generated = buildFallbackCallBrief(briefInput);
    expect(generated.situation).toContain('Their request, not just our signal');
  });

  it('cannot put a figure in front of the model that the filter dropped', () => {
    const privateInput = { ...briefInput, view: deriveAccountView(input({ consentTier: 'private' })) };
    const context = buildCallBriefContext(privateInput);
    expect(context.evidence).toEqual([]);
    expect(context.signal).toBeNull();
    expect(context.healthBand).toBeNull();
    expect(context.theyAskedForCoaching).toEqual([]);
  });

  it('labels the status in the rep register', () => {
    expect(CALL_STATUS_LABELS.needs_attention).toBe('Needs attention');
    expect(CALL_STATUS_LABELS.ready_to_grow).toBe('Ready to grow');
    expect(CALL_STATUS_LABELS.order_in).toBe('Order in');
  });
});
