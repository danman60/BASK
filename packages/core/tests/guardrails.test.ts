/**
 * Guardrails (IMPLEMENTATION_SPEC §1.2) — enforced as post-generation
 * validators, not prompt asks.
 *
 * The failing-input tests are the point: a validator that has only ever been
 * shown compliant text is not a validator.
 */

import { describe, expect, it } from 'vitest';

import { checkPayload, checkText, runGuardrails } from '../src/ai/guardrails';

describe('medical claims', () => {
  const offenders = [
    'Red light therapy cures acne in three sessions.',
    'A great treatment for psoriasis and eczema.',
    'Clinically proven to reduce fine lines.',
    'Our FDA-approved beds are the safest in town.',
    'Ten minutes boosts your vitamin D levels.',
    'Doctor-recommended for winter blues.',
    'A safe alternative to medication for low mood.',
    'Regular sessions help prevent skin cancer.',
  ];

  for (const text of offenders) {
    it(`blocks: ${text.slice(0, 46)}…`, () => {
      const verdict = runGuardrails({ body: text });
      expect(verdict.ok).toBe(false);
      expect(verdict.blocking[0]!.code).toBe('medical_claim');
      // The message is shown to the owner, so it has to say what to do.
      expect(verdict.blocking[0]!.message.length).toBeGreaterThan(10);
    });
  }

  const allowed = [
    'Tuesday afternoons are quiet — come in and enjoy the peace.',
    'Your skin will feel hydrated and looked after.',
    'Book a red light session and unwind for twenty minutes.',
    'Ask us about vitamin D at the front desk.',
    'A relaxing treatment room with hydromassage.',
  ];

  for (const text of allowed) {
    it(`allows: ${text.slice(0, 46)}…`, () => {
      expect(runGuardrails({ body: text }).ok).toBe(true);
    });
  }
});

describe('discount cap', () => {
  it('blocks a percentage over the salon cap', () => {
    const verdict = runGuardrails({ sms: 'Get 40% off all lotions this week.' });
    expect(verdict.ok).toBe(false);
    expect(verdict.blocking[0]!.code).toBe('discount_over_cap');
    expect(verdict.blocking[0]!.message).toContain('40%');
  });

  it('allows a percentage at or under the cap', () => {
    expect(runGuardrails({ sms: 'Take 20% off your next lotion.' }).ok).toBe(true);
    expect(runGuardrails({ sms: 'Take 25% off your next lotion.' }).ok).toBe(true);
  });

  it('respects a salon-specific cap', () => {
    const strict = { maxDiscountPercent: 10 };
    expect(runGuardrails({ sms: '15% off' }, strict).ok).toBe(false);
    expect(runGuardrails({ sms: '10% off' }, strict).ok).toBe(true);
  });

  it('blocks an absolute discount over the cap', () => {
    const verdict = runGuardrails({ sms: 'Here is $80 off your next package.' });
    expect(verdict.ok).toBe(false);
    expect(verdict.blocking[0]!.code).toBe('discount_over_cap');
  });

  it('catches the cap breach wherever it is nested', () => {
    const brief = {
      greeting: { headline: 'Good morning, Dana.' },
      cards: [{ actions: [{ label: 'Send 60% off to lapsed members' }] }],
    };
    const verdict = runGuardrails(brief);
    expect(verdict.ok).toBe(false);
    expect(verdict.blocking[0]!.path).toBe('$.cards[0].actions[0].label');
  });
});

describe('warnings', () => {
  it('flags giveaways without blocking', () => {
    const verdict = runGuardrails({ sms: 'Come in for a free tan on us.' });
    expect(verdict.ok).toBe(true);
    expect(verdict.warnings.some((v) => v.code === 'free_service_offer')).toBe(true);
  });

  it('does not flag a free consultation', () => {
    expect(runGuardrails({ sms: 'Book a free consultation.' }).warnings).toHaveLength(0);
  });

  it('flags guaranteed results', () => {
    const verdict = runGuardrails({ sms: 'Guaranteed results in one visit.' });
    expect(verdict.warnings.some((v) => v.code === 'unsupported_guarantee')).toBe(true);
  });

  it('allows giveaways when the salon opted in', () => {
    const verdict = runGuardrails({ sms: 'A free tan for members.' }, { allowFreeOffers: true });
    expect(verdict.warnings).toHaveLength(0);
  });
});

describe('traversal', () => {
  it('walks arrays and nested objects, reporting the path', () => {
    const violations = checkPayload({ a: [{ b: { c: 'This cures acne.' } }] });
    expect(violations).toHaveLength(1);
    expect(violations[0]!.path).toBe('$.a[0].b.c');
  });

  it('ignores non-string leaves', () => {
    expect(checkPayload({ n: 42, b: true, d: null, u: undefined })).toHaveLength(0);
  });

  it('handles empty input', () => {
    expect(checkText('', '$')).toHaveLength(0);
    expect(runGuardrails({}).ok).toBe(true);
  });
});
