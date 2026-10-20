import { describe, expect, it } from 'vitest';

import { projectWeekly, type WeekRevenue } from '../src/insights/projection';

const weeks = (values: number[]): WeekRevenue[] =>
  values.map((revenue, i) => ({
    weekStart: new Date(Date.UTC(2026, 4, 4) + i * 7 * 86_400_000).toISOString().slice(0, 10),
    revenue,
  }));

describe('projectWeekly', () => {
  it('refuses to project from too few weeks', () => {
    expect(projectWeekly(weeks([1000, 1000, 1000])).verdict).toBe('too_little_data');
  });

  it('calls a steady decline a slide and recovers the slope', () => {
    const p = projectWeekly(weeks([10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5].map((v) => v * 1000 + (v % 1 ? 30 : -30))));
    expect(p.verdict).toBe('slide');
    expect(p.slopePerWeek).toBeCloseTo(-500, -1);
    expect(p.projected).toHaveLength(8);
    expect(p.projected[0]!.weekStart).toBe('2026-07-13');
    expect(p.changeAtHorizon).toBeLessThan(0);
  });

  it('reads noise around a flat line as steady, not as a warning', () => {
    const p = projectWeekly(weeks([1000, 1400, 800, 1300, 900, 1250, 950, 1100, 1000, 1200]));
    expect(p.verdict).toBe('steady');
    for (const w of p.projected) expect(w.low).toBeLessThanOrEqual(w.mid);
  });

  it('calls a steady rise a climb', () => {
    expect(projectWeekly(weeks([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => v * 100 + (v % 2 ? 5 : -5)))).verdict).toBe('climb');
  });
});
