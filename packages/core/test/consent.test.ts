/**
 * The consent filter is the trust story in code (PRODUCT_SPEC §15, §38). These
 * tests are deliberately adversarial: several assert what must NEVER happen at any
 * tier, because a leak here is not a bug, it is a breach of the promise the product
 * makes to salons on screen.
 */

import { describe, expect, it } from 'vitest';

import {
  CONSENT_TIERS,
  COMPASS_FIELDS,
  MIN_COHORT_SIZE,
  allowedFields,
  allowedGroups,
  canSee,
  contributesToCohorts,
  describeConsent,
  filterAccount,
  filterCohort,
  receivesBenchmarks,
  repMaySeeSignals,
  type ConsentTier,
} from '../src/consent';

/** A record carrying one field from every group plus data that must never escape. */
const FULL_ACCOUNT = {
  // identity
  salonName: 'Maple Glow Tanning',
  region: 'BC',
  roomCount: 6,
  equipmentProfile: 'uv+red_light',
  softwareAdoption: 'active',
  // participation
  consentTier: 'coaching',
  benchmarkParticipant: true,
  lastActiveAt: '2026-08-07',
  // signals
  healthBand: 'needs_attention',
  revenueTrendDirection: 'down',
  membershipTrendDirection: 'flat',
  retailAttachmentBand: 'below_peers',
  peerGaps: [{ metric: 'retail_attachment', gap: 'below' }],
  utilizationBand: 'high',
  orderRecencyDays: 42,
  churnRiskBand: 'moderate',
  // requests
  coachingRequests: [{ id: 'cr-1', topic: 'retail' }],
  draftOrders: [{ id: 'do-1' }],
  // NEVER — present in the source record precisely to prove it gets dropped
  customerNames: ['Sarah Mitchell'],
  customerContacts: ['sarah@example.com'],
  individualTransactions: [{ id: 'sale-1', amount: 64.5 }],
  rawRevenueAmounts: { august: 41_233.19 },
  staffPersonalRecords: [{ id: 'st-1', sin: '000-000-000' }],
} as const;

const FORBIDDEN_KEYS = [
  'customerNames',
  'customerContacts',
  'individualTransactions',
  'rawRevenueAmounts',
  'staffPersonalRecords',
] as const;

describe('tier ladder', () => {
  it('exposes exactly three tiers, narrowest first', () => {
    expect(CONSENT_TIERS).toEqual(['private', 'benchmarks', 'coaching']);
  });

  it('is strictly monotonic — each tier is a superset of the one below', () => {
    const priv = new Set(allowedFields('private'));
    const bench = new Set(allowedFields('benchmarks'));
    const coach = new Set(allowedFields('coaching'));

    for (const f of priv) expect(bench.has(f)).toBe(true);
    for (const f of bench) expect(coach.has(f)).toBe(true);
    expect(bench.size).toBeGreaterThan(priv.size);
    expect(coach.size).toBeGreaterThan(bench.size);
  });

  it('gives private only the facts UVALUX already holds as a supplier', () => {
    expect(allowedGroups('private')).toEqual(['identity']);
    expect(canSee('private', 'salonName')).toBe(true);
    expect(canSee('private', 'healthBand')).toBe(false);
    expect(canSee('private', 'benchmarkParticipant')).toBe(false);
  });

  it('lets benchmarks participate without exposing per-salon figures', () => {
    expect(contributesToCohorts('benchmarks')).toBe(true);
    expect(receivesBenchmarks('benchmarks')).toBe(true);
    expect(repMaySeeSignals('benchmarks')).toBe(false);
    expect(canSee('benchmarks', 'revenueTrendDirection')).toBe(false);
  });

  it('unlocks derived signals only at coaching', () => {
    expect(repMaySeeSignals('coaching')).toBe(true);
    for (const field of COMPASS_FIELDS.signals) {
      expect(canSee('coaching', field)).toBe(true);
      expect(canSee('benchmarks', field)).toBe(false);
      expect(canSee('private', field)).toBe(false);
    }
  });

  it('keeps a private salon out of cohorts entirely', () => {
    expect(contributesToCohorts('private')).toBe(false);
    expect(receivesBenchmarks('private')).toBe(false);
    expect(describeConsent('private').youReceive).toEqual([]);
  });
});

describe('filterAccount', () => {
  it.each(CONSENT_TIERS)('never leaks customer-level data at tier %s', (tier) => {
    const filtered = filterAccount(tier, FULL_ACCOUNT);
    for (const key of FORBIDDEN_KEYS) {
      expect(filtered).not.toHaveProperty(key);
    }
  });

  it('drops unknown keys rather than passing them through', () => {
    const filtered = filterAccount('coaching', {
      ...FULL_ACCOUNT,
      someFieldAddedUpstreamLater: 'should not appear',
    });
    expect(filtered).not.toHaveProperty('someFieldAddedUpstreamLater');
  });

  it('returns only identity for a private salon — the Compass trust beat', () => {
    const filtered = filterAccount('private', FULL_ACCOUNT);
    expect(Object.keys(filtered).sort()).toEqual([...COMPASS_FIELDS.identity].sort());
  });

  it('downgrading a tier immediately narrows what Compass gets', () => {
    const before = Object.keys(filterAccount('coaching', FULL_ACCOUNT));
    const after = Object.keys(filterAccount('benchmarks', FULL_ACCOUNT));
    expect(after.length).toBeLessThan(before.length);
    expect(after).not.toContain('healthBand');
  });

  it('passes the salon\'s own requests through at coaching tier', () => {
    const filtered = filterAccount('coaching', FULL_ACCOUNT);
    expect(filtered.coachingRequests).toBeDefined();
    expect(filtered.draftOrders).toBeDefined();
  });
});

describe('cohort suppression', () => {
  it('suppresses a cohort below the minimum contributor count', () => {
    const result = filterCohort({ value: 0.23, contributorCount: MIN_COHORT_SIZE - 1 });
    expect(result.suppressed).toBe(true);
    if (result.suppressed) {
      expect(result.reason).toBe('below-min-cohort');
      expect(result.minimum).toBe(MIN_COHORT_SIZE);
    }
  });

  it('releases a cohort at exactly the minimum', () => {
    const result = filterCohort({ value: 0.23, contributorCount: MIN_COHORT_SIZE });
    expect(result.suppressed).toBe(false);
    if (!result.suppressed) expect(result.value).toBe(0.23);
  });

  it('a two-salon cohort is never released', () => {
    expect(filterCohort({ value: 1, contributorCount: 2 }).suppressed).toBe(true);
  });
});

describe('describeConsent — what the salon is shown about itself', () => {
  it.each(CONSENT_TIERS)('lists the never-seen set at tier %s', (tier) => {
    const disclosure = describeConsent(tier);
    for (const key of FORBIDDEN_KEYS) {
      expect(disclosure.uvaluxNeverSees).toContain(key);
    }
  });

  it('matches the filter exactly — the screen cannot drift from the behaviour', () => {
    for (const tier of CONSENT_TIERS) {
      expect(describeConsent(tier).uvaluxSees).toEqual(allowedFields(tier));
    }
  });

  it('offers coaching support only at the coaching tier', () => {
    expect(describeConsent('coaching').youReceive).toContain('coachingSupport');
    expect(describeConsent('benchmarks').youReceive).not.toContain('coachingSupport');
  });
});

describe('schema alignment', () => {
  it('uses the same tier names as the bask.consent_tier enum', () => {
    // Mirrors packages/db/prisma/schema.prisma `enum ConsentTier`. packages/core
    // stays dependency-free, so this is asserted rather than imported — if the
    // enum changes, this test is the tripwire.
    const schemaTiers: ConsentTier[] = ['private', 'benchmarks', 'coaching'];
    expect([...CONSENT_TIERS]).toEqual(schemaTiers);
  });
});
