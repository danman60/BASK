/**
 * Demo clock (IMPLEMENTATION_SPEC §1.4).
 *
 * A *virtual* clock, never timestamp rewriting. `demo_state.virtual_today` holds
 * the demo's "today"; every query in this package takes `today` from a clock
 * provider so the same code runs against a virtual clock in demo mode and a real
 * one in production.
 *
 * Rules this file exists to enforce:
 *   - Nothing downstream of the clock may call `Date.now()` or `new Date()` with
 *     no argument. Fixture generation and the insight engine are deterministic;
 *     a stray wall-clock read breaks `demo:reset` reproducibility.
 *   - A calendar day is a `DateOnly` string (`YYYY-MM-DD`), not a `Date`. Date
 *     objects are instants; "August 6th at Sunset Ridge" is not.
 */

/** `YYYY-MM-DD`. The only representation of a calendar day in this codebase. */
export type DateOnly = string;

/** Salon-local zone for Sunset Ridge (Kelowna, BC). */
export const SALON_TIMEZONE = 'America/Vancouver';

export interface Clock {
  /** The demo's (or the real) current calendar day, in `zone`. */
  today(): DateOnly;
  /** Current instant. Virtual clocks pin this to noon of `today` in `zone`. */
  now(): Date;
  /** IANA zone the calendar day is resolved in. */
  readonly zone: string;
  readonly kind: 'virtual' | 'real';
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function assertDateOnly(value: string): DateOnly {
  if (!DATE_ONLY.test(value)) {
    throw new Error(`Not a YYYY-MM-DD date: ${JSON.stringify(value)}`);
  }
  return value;
}

/** Split a `DateOnly` into its numeric parts. */
export function dateParts(date: DateOnly): { year: number; month: number; day: number } {
  assertDateOnly(date);
  return {
    year: Number(date.slice(0, 4)),
    month: Number(date.slice(5, 7)),
    day: Number(date.slice(8, 10)),
  };
}

/** UTC midnight of a calendar day — the anchor all date arithmetic runs on. */
export function dateOnlyToUtcMidnight(date: DateOnly): Date {
  const { year, month, day } = dateParts(date);
  return new Date(Date.UTC(year, month - 1, day));
}

/** The calendar day an instant falls on, in `zone`. */
export function toDateOnly(instant: Date, zone: string = SALON_TIMEZONE): DateOnly {
  const parts = zonedParts(instant, zone);
  return `${pad(parts.year, 4)}-${pad(parts.month, 2)}-${pad(parts.day, 2)}`;
}

export function addDays(date: DateOnly, days: number): DateOnly {
  const base = dateOnlyToUtcMidnight(date);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative when `to` precedes `from`). */
export function diffDays(from: DateOnly, to: DateOnly): number {
  const ms = dateOnlyToUtcMidnight(to).getTime() - dateOnlyToUtcMidnight(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** 0 = Sunday … 6 = Saturday. Stable regardless of the runtime's local zone. */
export function dayOfWeek(date: DateOnly): number {
  return dateOnlyToUtcMidnight(date).getUTCDay();
}

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function weekdayName(date: DateOnly): string {
  return WEEKDAY_NAMES[dayOfWeek(date)]!;
}

/** `Thursday, August 6` — the Daybreak eyebrow format (DESIGN_SPEC §3.1). */
export function formatLongDate(date: DateOnly): string {
  const { month, day } = dateParts(date);
  return `${weekdayName(date)}, ${MONTH_NAMES[month - 1]} ${day}`;
}

/** Inclusive list of days from `start` to `end`. */
export function eachDay(start: DateOnly, end: DateOnly): DateOnly[] {
  const out: DateOnly[] = [];
  const total = diffDays(start, end);
  for (let i = 0; i <= total; i += 1) out.push(addDays(start, i));
  return out;
}

/**
 * The UTC instant for a wall-clock time on a calendar day in `zone`.
 *
 * Deterministic: the IANA rules are data, not the runtime's local settings, so
 * this returns the same instant on every machine — which is what lets fixture
 * timestamps survive a `demo:reset` byte-for-byte.
 */
export function zonedToUtc(
  date: DateOnly,
  hour: number,
  minute = 0,
  zone: string = SALON_TIMEZONE,
): Date {
  const { year, month, day } = dateParts(date);
  const naive = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  // Two passes: the offset can change between the guess and the real instant
  // (DST boundaries). Converging twice is enough for every real-world rule.
  let instant = naive - offsetMinutes(new Date(naive), zone) * 60_000;
  instant = naive - offsetMinutes(new Date(instant), zone) * 60_000;
  return new Date(instant);
}

/** Minutes `zone` is ahead of UTC at `instant` (negative west of Greenwich). */
export function offsetMinutes(instant: Date, zone: string): number {
  const p = zonedParts(instant, zone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function zonedParts(instant: Date, zone: string): ZonedParts {
  let fmt = formatterCache.get(zone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatterCache.set(zone, fmt);
  }
  const out: Record<string, number> = {};
  for (const part of fmt.formatToParts(instant)) {
    if (part.type !== 'literal') out[part.type] = Number(part.value);
  }
  return {
    year: out.year!,
    month: out.month!,
    day: out.day!,
    hour: out.hour! % 24,
    minute: out.minute!,
    second: out.second!,
  };
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, '0');
}

/**
 * Demo clock: `today` is whatever `demo_state.virtual_today` says. `now()` is
 * pinned to noon salon-local so "is this timestamp today?" comparisons behave
 * the same no matter when the demo is actually run.
 */
export function createVirtualClock(virtualToday: DateOnly, zone: string = SALON_TIMEZONE): Clock {
  const day = assertDateOnly(virtualToday);
  const noon = zonedToUtc(day, 12, 0, zone);
  return {
    kind: 'virtual',
    zone,
    today: () => day,
    now: () => new Date(noon.getTime()),
  };
}

/** Production fallback — real wall clock, calendar day resolved in `zone`. */
export function createRealClock(zone: string = SALON_TIMEZONE): Clock {
  return {
    kind: 'real',
    zone,
    today: () => toDateOnly(new Date(), zone),
    now: () => new Date(),
  };
}

/** Shape of the `demo_state` row the clock cares about. */
export interface DemoStateLike {
  virtualToday: Date | DateOnly | null | undefined;
}

/**
 * Virtual clock when a `demo_state` row carries a `virtual_today`, real clock
 * otherwise. This is the only place the two modes are chosen between.
 */
export function resolveClock(
  demoState: DemoStateLike | null | undefined,
  zone: string = SALON_TIMEZONE,
): Clock {
  const raw = demoState?.virtualToday;
  if (raw == null) return createRealClock(zone);
  const day = typeof raw === 'string' ? raw : raw.toISOString().slice(0, 10);
  return createVirtualClock(assertDateOnly(day), zone);
}
