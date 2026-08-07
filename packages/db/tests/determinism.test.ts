/**
 * Determinism — the property the whole demo harness rests on.
 *
 * `demo:reset` has to reproduce PRODUCT_SPEC §20 exactly, every time, or the
 * pitch is not rehearsable and `demo:verify` cannot mean anything.
 */

import { describe, expect, it } from 'vitest';

import { addDays, zonedToUtc } from '@bask/core';

import { DAY_ZERO, HERO_SALON, HISTORY_DAYS, TARGETS } from '../fixtures/constants';
import { upcA, upcCheckDigit } from '../fixtures/catalogue';
import { checksumBundle, checksumByTable, generateFixtures } from '../fixtures/index';
import { Rng } from '../fixtures/rng';
import { bundle } from './helpers';

describe('fixture determinism', () => {
  it('two runs of the generator are byte-identical', () => {
    const a = generateFixtures();
    const b = generateFixtures();
    expect(checksumBundle(a)).toBe(checksumBundle(b));
  });

  it('every table matches row-for-row across runs', () => {
    const a = checksumByTable(generateFixtures());
    const b = checksumByTable(generateFixtures());
    expect(a).toEqual(b);
  });

  it('a different seed produces a different dataset', () => {
    const a = checksumBundle(generateFixtures({ seed: 'sunset-ridge-v1' }));
    const b = checksumBundle(generateFixtures({ seed: 'some-other-seed' }));
    expect(a).not.toBe(b);
  });

  it('contains no wall-clock timestamps', () => {
    // Everything is anchored to day zero, so nothing may be dated after it.
    // A stray `new Date()` would land today and trip this immediately.
    //
    // The cutoff is midnight *salon-local* on the day after day zero, not
    // midnight UTC: a 20:30 session in Kelowna is 03:30 UTC the next morning,
    // and a UTC cutoff would flag every evening visit as a wall-clock leak.
    const b = bundle();
    const cutoff = zonedToUtc(addDays(DAY_ZERO, 1), 0, 0, HERO_SALON.timezone);
    const late: string[] = [];
    for (const visit of b.visits) {
      if (visit.checkedInAt > cutoff) late.push(`visit ${visit.id}`);
    }
    for (const customer of b.customers) {
      if (customer.createdAt > cutoff) late.push(`customer ${customer.id}`);
    }
    expect(late).toEqual([]);
  });
});

describe('seeded PRNG', () => {
  it('is reproducible from a string seed', () => {
    const a = new Rng('x');
    const b = new Rng('x');
    expect(Array.from({ length: 20 }, () => a.float())).toEqual(
      Array.from({ length: 20 }, () => b.float()),
    );
  });

  it('child streams are independent of the parent', () => {
    const parent = new Rng('x');
    const first = parent.child('a').float();
    parent.float();
    parent.float();
    expect(new Rng('x').child('a').float()).toBe(first);
  });
});

describe('dataset shape (PRODUCT_SPEC §20)', () => {
  const b = bundle();

  it('has ~420 customers and ~120 members across three tiers', () => {
    expect(b.customers).toHaveLength(TARGETS.customers);
    expect(b.memberships).toHaveLength(TARGETS.members);
    expect(new Set(b.memberships.map((m) => m.tier)).size).toBe(3);
  });

  it('has 8 rooms and 12 staff-shift patterns', () => {
    expect(b.rooms).toHaveLength(8);
    const salonStaff = b.staff.filter((s) => s.salonId !== null);
    expect(salonStaff).toHaveLength(TARGETS.staff);
    for (const s of salonStaff) {
      expect((s.shiftPattern as { days?: number[] }).days?.length).toBeGreaterThan(0);
    }
  });

  it('room names and types match DESIGN mockup 02', () => {
    expect(b.rooms.map((r) => r.name)).toEqual([
      'Bed 1 — Solstice',
      'Bed 2 — Ember',
      'Bed 3 — Dawn',
      'Bed 4 — Zenith',
      'Booth — Velvet',
      'Studio A — Glow',
      'Studio B — Aura',
      'Wave Room',
    ]);
  });

  it('has ~40 SKUs, each with a valid UPC-A barcode', () => {
    expect(b.products).toHaveLength(TARGETS.skus);
    const upcs = b.barcodes.filter((c) => c.symbology === 'upc_a');
    expect(upcs).toHaveLength(TARGETS.skus);
    for (const code of upcs) {
      expect(code.value).toMatch(/^\d{12}$/);
      expect(upcCheckDigit(code.value.slice(0, 11))).toBe(Number(code.value[11]));
    }
  });

  it('has 90 days of visit history', () => {
    const days = new Set(b.visits.map((v) => v.checkedInAt.toISOString().slice(0, 10)));
    expect(days.size).toBeGreaterThanOrEqual(HISTORY_DAYS - 1);
  });

  it('has a 12-salon Compass portfolio including one multi-location org', () => {
    expect(b.accounts).toHaveLength(12);
    const salonsPerOrg = new Map<string, number>();
    for (const salon of b.salons) {
      salonsPerOrg.set(salon.orgId, (salonsPerOrg.get(salon.orgId) ?? 0) + 1);
    }
    expect([...salonsPerOrg.values()].some((n) => n > 1)).toBe(true);
  });

  it('includes a Private-tier salon that contributes no Compass signals', () => {
    const priv = b.consentProfiles.find((c) => c.tier === 'private');
    expect(priv).toBeDefined();
    expect(b.signalSnapshots.filter((s) => s.salonId === priv!.salonId)).toHaveLength(0);
  });

  it('includes a new opening and a retail-decline account', () => {
    expect(b.accounts.some((a) => a.lifecycle === 'new_opening')).toBe(true);
    expect(b.signalSnapshots.some((s) => s.signalType === 'retail_decline')).toBe(true);
    expect(b.signalSnapshots.some((s) => s.signalType === 'expansion_ready')).toBe(true);
  });

  it('stages a campaign for the demo-clock payoff', () => {
    const staged = b.campaigns.find((c) => c.state === 'scheduled');
    expect(staged).toBeDefined();
    expect(staged!.scheduledFor!.toISOString().slice(0, 10) > DAY_ZERO).toBe(true);
  });
});

describe('UPC-A check digits', () => {
  it('computes the documented example correctly', () => {
    // 03600029145 -> check digit 2 (a standard worked example).
    expect(upcA('03600029145')).toBe('036000291452');
  });

  it('rejects a body that is not 11 digits', () => {
    expect(() => upcA('123')).toThrow();
  });
});
