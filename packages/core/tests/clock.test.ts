/**
 * Demo clock (IMPLEMENTATION_SPEC §1.4).
 */

import { describe, expect, it } from 'vitest';

import {
  addDays,
  createRealClock,
  createVirtualClock,
  dayOfWeek,
  diffDays,
  eachDay,
  formatLongDate,
  resolveClock,
  toDateOnly,
  weekdayName,
  zonedToUtc,
} from '../src/clock';

describe('date arithmetic', () => {
  it('adds and subtracts days across month and year boundaries', () => {
    expect(addDays('2026-08-06', 5)).toBe('2026-08-11');
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29'); // leap year
  });

  it('measures signed day differences', () => {
    expect(diffDays('2026-08-06', '2026-08-11')).toBe(5);
    expect(diffDays('2026-08-11', '2026-08-06')).toBe(-5);
  });

  it('resolves weekdays independently of the runtime timezone', () => {
    expect(weekdayName('2026-08-06')).toBe('Thursday');
    expect(dayOfWeek('2026-08-06')).toBe(4);
    expect(weekdayName('2026-08-11')).toBe('Tuesday');
  });

  it('formats the Daybreak eyebrow date', () => {
    expect(formatLongDate('2026-08-06')).toBe('Thursday, August 6');
  });

  it('enumerates inclusive ranges', () => {
    expect(eachDay('2026-08-06', '2026-08-09')).toEqual([
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
      '2026-08-09',
    ]);
  });

  it('rejects anything that is not YYYY-MM-DD', () => {
    expect(() => addDays('06/08/2026', 1)).toThrow();
  });
});

describe('zoned instants', () => {
  it('resolves a salon-local wall clock to the right UTC instant', () => {
    // Kelowna is UTC-7 in August (PDT).
    const instant = zonedToUtc('2026-08-06', 9, 0, 'America/Vancouver');
    expect(instant.toISOString()).toBe('2026-08-06T16:00:00.000Z');
  });

  it('handles the winter offset too', () => {
    // ...and UTC-8 in January (PST). A fixed offset would get this wrong.
    const instant = zonedToUtc('2026-01-15', 9, 0, 'America/Vancouver');
    expect(instant.toISOString()).toBe('2026-01-15T17:00:00.000Z');
  });

  it('round-trips back to the same calendar day', () => {
    for (const date of eachDay('2026-03-06', '2026-03-12')) {
      const instant = zonedToUtc(date, 12, 0, 'America/Vancouver');
      expect(toDateOnly(instant, 'America/Vancouver')).toBe(date);
    }
  });

  it('keeps late-evening instants on the correct local day', () => {
    // 20:30 local in August is 03:30 UTC the *next* day — the classic way a
    // salon's Friday evening gets filed under Saturday.
    const instant = zonedToUtc('2026-08-06', 20, 30, 'America/Vancouver');
    expect(instant.toISOString().slice(0, 10)).toBe('2026-08-07');
    expect(toDateOnly(instant, 'America/Vancouver')).toBe('2026-08-06');
  });
});

describe('clock providers', () => {
  it('a virtual clock reports the demo day, not the real one', () => {
    const clock = createVirtualClock('2026-08-06');
    expect(clock.today()).toBe('2026-08-06');
    expect(clock.kind).toBe('virtual');
  });

  it('a virtual clock pins `now` to local noon, so reruns are stable', () => {
    const clock = createVirtualClock('2026-08-06');
    expect(clock.now().toISOString()).toBe(clock.now().toISOString());
    expect(toDateOnly(clock.now(), clock.zone)).toBe('2026-08-06');
  });

  it('falls back to the real clock when demo_state has no virtual day', () => {
    expect(resolveClock(null).kind).toBe('real');
    expect(resolveClock({ virtualToday: null }).kind).toBe('real');
    expect(createRealClock().kind).toBe('real');
  });

  it('accepts either a Date or a string from the demo_state row', () => {
    expect(resolveClock({ virtualToday: new Date('2026-08-06T00:00:00Z') }).today()).toBe(
      '2026-08-06',
    );
    expect(resolveClock({ virtualToday: '2026-08-06' }).today()).toBe('2026-08-06');
  });
});
