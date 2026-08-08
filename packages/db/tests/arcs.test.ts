/**
 * Arc tests — every seeded story in PRODUCT_SPEC §20 must produce its insight.
 *
 * These run the *real* rollup and the *real* detectors over the *real*
 * generated bundle, with no database and no mocks. If a fixture dial drifts or
 * a threshold moves, the demo beat it supports fails here rather than in front
 * of Nick.
 */

import { describe, expect, it } from 'vitest';

import { runInsightSweep } from '@bask/core';

import { ARCS } from '../fixtures/constants';
import { draftOfType, heroFacts, heroSweep } from './helpers';

const drafts = heroSweep();
const facts = heroFacts();

describe('story arcs (PRODUCT_SPEC §20)', () => {
  it('produces at least five insights', () => {
    expect(drafts.length).toBeGreaterThanOrEqual(5);
  });

  it('every insight carries populated Evidence and a linked action', () => {
    for (const draft of drafts) {
      expect(draft.evidence.version).toBe(1);
      expect(draft.evidence.sentence.length).toBeGreaterThan(10);
      expect(draft.evidence.metric.formatted).toBeTruthy();
      expect(draft.evidence.impact.chipLabel).toBeTruthy();
      expect(draft.linkedActionType).toBeTruthy();
      expect(draft.primaryActionLabel).toBeTruthy();
    }
  });

  it('a card never offers the same action twice', () => {
    for (const draft of drafts) {
      // The quiet button is always "Show me why", so the primary must not be.
      expect(draft.primaryActionLabel).not.toBe('Show me why');
    }
  });

  describe('retail attachment 21% → 15% over three weeks', () => {
    const draft = draftOfType(drafts, 'retail_attachment_slip');

    it('fires', () => {
      expect(draft).toBeDefined();
    });

    it('measures the baseline at 21% and the current rate at 15%', () => {
      expect(Math.round(facts.attachment.baselineRate)).toBe(21);
      expect(Math.round(facts.attachment.currentRate)).toBe(15);
    });

    it('names the two staffers the decline sits on', () => {
      const named = draft!.evidence.contributingFactors
        .filter((f) => f.key.startsWith('staff:'))
        .map((f) => f.label.toLowerCase());
      // Tamsin and Reece are the seeded laggards; at least one must surface.
      expect(named.length).toBeGreaterThan(0);
      const laggards = ARCS.attachment.laggardStaffKeys as readonly string[];
      expect(named.some((n) => laggards.includes(n))).toBe(true);
    });

    it('the seeded laggards really are the worst two on the floor', () => {
      const ranked = [...facts.attachment.byStaff].sort((a, b) => a.currentRate - b.currentRate);
      const worstTwo = ranked.slice(0, 2).map((s) => s.name.toLowerCase());
      for (const key of ARCS.attachment.laggardStaffKeys) {
        expect(worstTwo).toContain(key);
      }
    });

    it('carries a sparkline', () => {
      expect(draft!.evidence.series?.points.length).toBeGreaterThan(5);
    });
  });

  describe('7 failed payments, 4 recoverable', () => {
    const draft = draftOfType(drafts, 'failed_payments');

    it('fires with exactly seven failures', () => {
      expect(draft).toBeDefined();
      expect(facts.failedPayments.memberships).toHaveLength(ARCS.failedPayments.total);
    });

    it('four are recoverable and worth exactly $284 a month', () => {
      expect(draft!.impactEstimate).toBe(284);
      const ids = (draft!.linkedActionRef as { membershipIds: string[] }).membershipIds;
      expect(ids).toHaveLength(ARCS.failedPayments.recoverable);
    });

    it('offers to send recovery messages', () => {
      expect(draft!.linkedActionType).toBe('recover_payment');
    });
  });

  describe('Tuesday 1–5 pm chronically soft', () => {
    const draft = draftOfType(drafts, 'soft_capacity');

    it('fires', () => {
      expect(draft).toBeDefined();
    });

    it('picks Tuesday afternoon, not the quiet-everywhere morning', () => {
      const ref = draft!.linkedActionRef as { weekday: number; startHour: number };
      expect(ref.weekday).toBe(ARCS.softWindow.weekday);
      expect(ref.startHour).toBeGreaterThanOrEqual(ARCS.softWindow.startHour);
      expect(ref.startHour).toBeLessThan(ARCS.softWindow.endHour);
    });

    it('reads as an opportunity, not a cost', () => {
      expect(draft!.evidence.impact.tone).toBe('opportunity');
    });

    it('links to a campaign for the next occurrence', () => {
      expect(draft!.linkedActionType).toBe('create_campaign');
      expect((draft!.linkedActionRef as { targetDate: string }).targetDate).toBeTruthy();
    });
  });

  describe('Botanical Sunshine Revitalizing Bronzer ~8 days from stockout', () => {
    const draft = draftOfType(drafts, 'low_stock');

    it('fires on the Hempz bronzer', () => {
      expect(draft).toBeDefined();
      expect((draft!.linkedActionRef as { sku: string }).sku).toBe(ARCS.lowStock.sku);
    });

    it('computes days of cover from real sell-through, near the seeded target', () => {
      const product = facts.stock.find((p) => p.sku === ARCS.lowStock.sku)!;
      expect(product.daysRemaining).not.toBeNull();
      expect(product.daysRemaining!).toBeGreaterThan(5);
      expect(product.daysRemaining!).toBeLessThan(12);
      expect(product.dailyVelocity).toBeGreaterThan(0);
    });

    it('offers to add it to a UVALUX order, with a reason', () => {
      expect(draft!.linkedActionType).toBe('draft_order');
      expect((draft!.linkedActionRef as { reason: string }).reason).toBeTruthy();
    });
  });

  describe('Premium Solution Double Dark overstocked', () => {
    const draft = draftOfType(drafts, 'overstock');

    it('fires on the Norvell solution and nothing else', () => {
      expect(draft).toBeDefined();
      expect((draft!.linkedActionRef as { sku: string }).sku).toBe(ARCS.overstock.sku);
      const all = drafts.filter((d) => d.type === 'overstock');
      expect(all).toHaveLength(1);
    });

    it('does not flag back-bar solutions that are consumed in-session', () => {
      // The Sunna back-bar solutions never ring through a till but are used weekly.
      // Counting only sale lines would call all three of them dead stock.
      for (const sku of ['BSK-10018', 'BSK-10019', 'BSK-10020']) {
        const product = facts.stock.find((p) => p.sku === sku)!;
        expect(product.unitsSoldInWindow).toBeGreaterThan(0);
      }
    });
  });

  describe('spray tans trending up', () => {
    const draft = draftOfType(drafts, 'anomaly_band');

    it('fires on spray tans, rising', () => {
      expect(draft).toBeDefined();
      expect((draft!.linkedActionRef as { category: string }).category).toBe('spray');
      expect((draft!.linkedActionRef as { direction: string }).direction).toBe('up');
    });

    it('measures a lift of at least 20%', () => {
      const spray = facts.categoryTrends.find((t) => t.key === 'spray')!;
      const change = ((spray.currentCount - spray.baselineCount) / spray.baselineCount) * 100;
      expect(change).toBeGreaterThanOrEqual(20);
    });
  });
});

describe('sweep ranking', () => {
  it('caps the attention queue at five and ranks by money', () => {
    const sweep = runInsightSweep(facts);
    expect(sweep.drafts.length).toBeLessThanOrEqual(5);
    expect(sweep.drafts[0]!.type).toBe('retail_attachment_slip');
  });

  it('is stable across runs on identical facts', () => {
    const a = runInsightSweep(facts).drafts.map((d) => d.dedupeKey);
    const b = runInsightSweep(facts).drafts.map((d) => d.dedupeKey);
    expect(a).toEqual(b);
  });
});
