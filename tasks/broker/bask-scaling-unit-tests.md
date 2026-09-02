# bask-scaling-unit-tests

## What to build

Write a vitest unit-test suite for the scale-invariant threshold helpers in the contract. There are no tests for this module today and it is the arithmetic the whole insight engine is about to depend on, so cover its behaviour and its edge cases properly. Use the same import style, describe/it structure and assertion style as the two existing suites in this test directory. Cover isMaterialDrop: a rise is never a drop; a fall that clears only the absolute arm is material; a fall that clears only the relative arm is material; a fall that clears neither is not; a baseline of zero and a negative baseline fall back to the absolute test only and must never produce NaN or divide by zero. Anchor cases at both real bases, because the either-arm design exists for exactly this: on a 21 percent baseline a fall to 18 is a 3-point move that clears a 3-point absolute rule, while on a 5.28 percent baseline a fall to 2.9 lost about 45 percent of the baseline so it clears a 0.40 relative rule but moved only 2.38 points so it fails the 3-point absolute rule. Cover isMaterialGap with the same shape of cases, including the anchor that a 3.37 percent performer against a 5.28 percent reference is a shortfall of about 0.362, so it is named by a 0.30 relative rule and can never be named by a 6-point absolute rule. Cover relativeShortfall: it returns 0 when the baseline is zero or negative and when the value rose, it is clamped between 0 and 1, and it is always a finite number. Assert on computed values with a tolerance where the arithmetic is fractional rather than comparing exact floats. Tests only, no changes to the module under test, no new helpers or fixtures beyond what the cases need.

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/packages/core/test/scaling.test.ts`

## The API surface you may use

Everything below is REAL and already exists. Import from `../src/insights/scaling`.
Do NOT invent names, keys or props that are not in this list — inventing a key
on the shared style object is the single most common way this task fails.

```ts
CONTRACT API SURFACE — `@/lib/contract` exports EXACTLY these. Nothing else exists.
Do NOT reference any symbol or object key that is not on this list.

functions:
  relativeShortfall(baseline: number, current: number): number

interfaces: MaterialityRule
```
## Follow this exemplar exactly

This file is the approved reference for how this kind of component is written
and styled in this project. Match its structure, its class vocabulary and its
conventions. Deviating from its visual vocabulary is a failure even if the code
compiles.

```tsx
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

```

## Rules

- Write the target file. Do not create other files.
- Do not modify anything outside the target path.
- Import every symbol you use. Do not reference a symbol you have not imported.
- Use ONLY class names and style keys that appear in the surface or the exemplar.
- Do not leave TODOs, stubs, or placeholder values.
- Do not fix unrelated bugs you notice. Build only what is described above.

## Acceptance gate — you are DONE only when all of these are true

1. `/home/danman60/projects/uvalux-platform/packages/core/test/scaling.test.ts` exists and is complete.
2. It imports what it uses from `../src/insights/scaling`.
3. `pnpm --filter @bask/core test && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/packages/core/test/consent.test.ts /home/danman60/projects/uvalux-platform/packages/core/test/scaling.test.ts --contract /home/danman60/projects/uvalux-platform/packages/core/src/insights/scaling.ts` passes with exit code 0.
4. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
