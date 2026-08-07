/**
 * The ONE Evidence schema (IMPLEMENTATION_SPEC §2).
 *
 * `Insight.evidence` is an unenforced Json column, so these tests are the only
 * thing standing between the data model and the UI props drifting apart.
 */

import { describe, expect, it } from 'vitest';

import {
  EVIDENCE_VERSION,
  buildComparison,
  buildMetric,
  buildWindow,
  directionOf,
  evidenceSchema,
  formatCurrency,
  formatMetricValue,
  parseEvidence,
  safeParseEvidence,
} from '../src/evidence';

const valid = {
  version: EVIDENCE_VERSION,
  metric: buildMetric('retail_attachment_rate', 'Attachment', 'percent', 15),
  window: buildWindow('last 14 days', '2026-07-23', '2026-08-05', 14),
  comparison: null,
  impact: {
    amount: 640,
    currency: 'CAD',
    cadence: 'per_month' as const,
    basis: 'Six fewer sales a day.',
    confidence: 'high' as const,
    chipLabel: '≈ $640/mo',
    tone: 'cost' as const,
  },
  contributingFactors: [],
  series: null,
  sentence: 'Fell from **21% to 15%**.',
};

describe('schema', () => {
  it('accepts a complete Evidence object', () => {
    expect(() => parseEvidence(valid)).not.toThrow();
  });

  it('applies defaults for the optional parts', () => {
    const parsed = evidenceSchema.parse({ ...valid, contributingFactors: undefined });
    expect(parsed.contributingFactors).toEqual([]);
  });

  it('rejects a wrong version, so a schema change cannot pass silently', () => {
    expect(() => parseEvidence({ ...valid, version: 2 })).toThrow();
  });

  it('rejects a missing impact', () => {
    expect(() => parseEvidence({ ...valid, impact: undefined })).toThrow();
  });

  it('rejects a malformed window date', () => {
    expect(() =>
      parseEvidence({ ...valid, window: { ...valid.window, start: '23/07/2026' } }),
    ).toThrow();
  });

  it('rejects an empty evidence sentence', () => {
    expect(() => parseEvidence({ ...valid, sentence: '' })).toThrow();
  });

  it('safeParse returns null rather than throwing on legacy rows', () => {
    expect(safeParseEvidence({ nope: true })).toBeNull();
    expect(safeParseEvidence(valid)).not.toBeNull();
  });

  it('requires at least two points in a series, so a sparkline can render', () => {
    expect(() =>
      parseEvidence({
        ...valid,
        series: { label: 'x', unit: 'percent', points: [{ at: '2026-08-01', value: 1 }] },
      }),
    ).toThrow();
  });
});

describe('formatting', () => {
  it('formats each unit for display', () => {
    expect(formatMetricValue(15.25, 'percent')).toBe('15.3%');
    expect(formatMetricValue(1640, 'currency')).toBe('$1,640');
    expect(formatMetricValue(8, 'count')).toBe('8');
    expect(formatMetricValue(1, 'days')).toBe('1 day');
    expect(formatMetricValue(8.2, 'days')).toBe('8.2 days');
  });

  it('formats negative and large money', () => {
    expect(formatCurrency(-284)).toBe('-$284');
    expect(formatCurrency(1234567)).toBe('$1,234,567');
  });
});

describe('comparison', () => {
  it('derives deltas so a caller cannot make them inconsistent', () => {
    const comparison = buildComparison({
      baseline: buildMetric('r', 'Rate', 'percent', 21),
      baselineWindow: buildWindow('before', '2026-06-25', '2026-07-22', 28),
      current: buildMetric('r', 'Rate', 'percent', 15),
      currentWindow: buildWindow('now', '2026-07-23', '2026-08-05', 14),
      goodDirection: 'up',
    });
    expect(comparison.deltaAbsolute).toBe(-6);
    expect(comparison.deltaPercent).toBeCloseTo(-28.57, 1);
    expect(comparison.direction).toBe('down');
    // Down is bad for attachment...
    expect(comparison.sentiment).toBe('bad');
  });

  it('knows down is good for some metrics', () => {
    const comparison = buildComparison({
      baseline: buildMetric('c', 'Cancellations', 'count', 12),
      baselineWindow: buildWindow('before', '2026-06-25', '2026-07-22', 28),
      current: buildMetric('c', 'Cancellations', 'count', 5),
      currentWindow: buildWindow('now', '2026-07-23', '2026-08-05', 14),
      goodDirection: 'down',
    });
    expect(comparison.sentiment).toBe('good');
  });

  it('does not divide by a zero baseline', () => {
    const comparison = buildComparison({
      baseline: buildMetric('x', 'X', 'count', 0),
      baselineWindow: buildWindow('before', '2026-06-25', '2026-07-22', 28),
      current: buildMetric('x', 'X', 'count', 4),
      currentWindow: buildWindow('now', '2026-07-23', '2026-08-05', 14),
      goodDirection: 'up',
    });
    expect(comparison.deltaPercent).toBeNull();
  });

  it('classifies direction with an epsilon, not exact equality', () => {
    expect(directionOf(0)).toBe('flat');
    expect(directionOf(1e-12)).toBe('flat');
    expect(directionOf(0.5)).toBe('up');
    expect(directionOf(-0.5)).toBe('down');
  });
});
