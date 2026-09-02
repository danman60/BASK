# bask-scaling-unit-tests-v2

## What to build

Write a vitest unit-test suite for the scale-invariant threshold helpers in the contract. There are no tests for this module today and it is the arithmetic the whole insight engine is about to depend on. Use the same import style, describe and it structure, and assertion style as the existing suites in this test directory.

CRITICAL: every case below states its expected result. Use exactly the stated result. Do not reason about the arithmetic yourself, do not recompute it, and never write two cases that call the helper with the same arguments and the same rule but expect different results. If you believe a stated result is wrong, still use the stated result.

Both helpers take a reference value, a candidate value, and a rule with an absolute-points arm and a relative-share arm. They return true when EITHER arm clears. When the reference is zero or negative only the absolute arm is consulted, so the relative arm is skipped entirely and no division happens.

For the drop helper, use one rule throughout with an absolute arm of 3 points and a relative arm of 0.40, and cover exactly these cases. Baseline 5.28 falling to 6.0 expects false, because a rise is never a drop. Baseline 21.0 falling to 22.0 expects false, same reason. Baseline 21.0 falling to 18.0 expects true, a 3-point move that clears the absolute arm on a large base. Baseline 5.28 falling to 2.0 expects true, a 3.28-point move that clears the absolute arm. Baseline 5.28 falling to 2.9 expects true, and this is the anchor case for the whole design: it moved only 2.38 points so it fails the absolute arm, but it lost about 45 percent of the baseline so it clears the relative arm. Baseline 5.28 falling to 4.5 expects false, because 0.78 points fails the absolute arm and about 15 percent fails the relative arm. Baseline 0 falling to minus 1.0 expects false. Baseline 0 falling to minus 5.0 expects true, because with a non-positive baseline only the absolute arm applies and the fall measures 5 points. Baseline minus 1.0 falling to minus 5.0 expects true, a 4-point fall on the absolute arm. Baseline minus 2.0 falling to minus 6.0 expects true, also a 4-point fall.

For the gap helper, use the same 3-point and 0.40 rule and cover these cases. Reference 5.28 with candidate 6.0 expects false, because a candidate above the reference is never a gap. Reference 8.48 with candidate 5.28 expects true, a 3.2-point gap on the absolute arm. Reference 21.0 with candidate 18.0 expects true, a 3-point gap. Reference 5.28 with candidate 2.9 expects true, a 2.38-point gap that fails the absolute arm but clears the relative arm. Reference 5.28 with candidate 4.5 expects false, failing both arms. Reference 0 with candidate minus 5.0 expects true, absolute arm only. Reference minus 1.0 with candidate minus 5.0 expects true, absolute arm only.

Then add the staff-gap anchor with a separate rule whose absolute arm is 6 points and whose relative arm is 0.30. Reference 5.28 with candidate 3.37 expects true: that is the measured 2019 spread against the measured house rate, a shortfall of about 0.362, so the relative arm names that staffer while a 6-point absolute arm arithmetically never could. Then with a rule whose absolute arm is 10 points and whose relative arm is 0.50, the same reference 5.28 and candidate 3.37 expects false, because 0.362 does not reach a 0.50 relative arm either.

For the shortfall helper, which returns how far a value fell as a share of its baseline: baseline 0 with value 1.0 expects exactly 0. Baseline minus 1.0 with value 1.0 expects exactly 0. Baseline 5.28 with value 6.0 expects exactly 0, because the value rose. Baseline 10.0 with value 10.0 expects exactly 0, no change. Baseline 10.0 with value 5.0 expects exactly 0.5. Baseline 5.28 with value 0.0 expects exactly 1. Baseline 5.28 with value 2.9 is approximately 0.4508 and must be asserted with a closeness tolerance of three decimal places rather than an exact float comparison. Baseline 21.0 with value 18.0 is approximately 0.1429, asserted the same way. Also assert that the result for baseline 5.28 with value 2.9 is strictly greater than 0 and strictly less than 1.

Tests only. Do not modify the module under test. Do not add helpers or fixtures beyond what these cases need. Every assertion must be one of the results stated above.

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
