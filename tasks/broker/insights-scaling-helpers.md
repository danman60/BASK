# insights-scaling-helpers

## What to build

A small PURE module of scale-invariant threshold helpers for the insights rules engine. No imports from anywhere except types; no I/O, no clock reads, no randomness.

WHY THIS EXISTS (put this reasoning in the file header): the detectors currently judge a change using ABSOLUTE percentage points — a rule like 'flag a retail attachment drop of 3 or more points'. That was tuned against synthetic demo fixtures where attachment runs about 21 percent. Measured against a real twelve-year salon dataset, attachment is 5.28 percent, so a 3-point absolute drop is a 57 percent relative collapse and the rule almost never fires. Worse, a companion rule needs a staff member to sit 6 points below the house rate, which is arithmetically impossible when the house rate is 5.28. A threshold expressed only in absolute points silently stops working on small-base data.

EXPORT EXACTLY THESE FOUR THINGS:

1. An interface named MaterialityRule with two readonly number fields: absolutePoints (a minimum change in percentage points) and relativeShare (a minimum drop as a share of the baseline, so 0.25 means the value fell by at least a quarter of where it started).

2. A function isMaterialDrop(baseline: number, current: number, rule: MaterialityRule): boolean. It returns true when the fall from baseline to current clears EITHER the absolute test OR the relative test. Either, not both — on a large base the absolute test is the meaningful one, and on a small base the relative test is. A rise is never a drop. A baseline of zero or less can only satisfy the absolute test, because a relative share of zero is undefined — never divide by zero and never return NaN.

3. A function isMaterialGap(reference: number, candidate: number, rule: MaterialityRule): boolean, with the same either-or logic, for judging whether one performer sits far enough below a reference rate to be worth naming. Same zero guard.

4. A function relativeShortfall(baseline: number, current: number): number returning how far the value fell as a share of the baseline, clamped to the range 0 through 1, and returning 0 when the baseline is zero or less or when the value rose. This is for display, so it must always be a finite number.

Every exported symbol needs a doc comment that explains the judgement in plain words, including the real measured numbers above where they make the reasoning concrete. Match the exemplar's comment density and its habit of naming WHY a constant exists rather than restating WHAT the code does. Grade-7 register, no marketing language.

Do not modify any other file. Do not add a default export.

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/packages/core/src/insights/scaling.ts`

## The API surface you may use

Everything below is REAL and already exists. Import from `../evidence`.
Do NOT invent names, keys or props that are not in this list — inventing a key
on the shared style object is the single most common way this task fails.

```ts
CONTRACT API SURFACE — `@/lib/contract` exports EXACTLY these. Nothing else exists.
Do NOT reference any symbol or object key that is not on this list.

functions:
  parseEvidence(value: unknown): Evidence
  safeParseEvidence(value: unknown): Evidence | null
  formatMetricValue(value: number, unit: MetricUnit): string
  formatCurrency(amount: number, currency = 'CAD'): string
  directionOf(delta: number, epsilon = 1e-9): EvidenceDirection
  round(value: number, places = 2): number

consts: EVIDENCE_VERSION, metricUnitSchema, evidenceMetricSchema, evidenceWindowSchema, evidenceDirectionSchema, evidenceSentimentSchema, evidenceComparisonSchema, impactCadenceSchema, evidenceImpactSchema, contributingFactorSchema, evidenceSeriesSchema, evidenceSchema
types: MetricUnit, EvidenceMetric, EvidenceWindow, EvidenceDirection, EvidenceSentiment, EvidenceComparison, ImpactCadence, EvidenceImpact, ContributingFactor, EvidenceSeries, Evidence

evidenceMetricSchema has EXACTLY these 5 keys: key, label, unit, value, formatted

evidenceWindowSchema has EXACTLY these 4 keys: label, start, end, days

evidenceComparisonSchema has EXACTLY these 8 keys: baseline, baselineWindow, current, currentWindow, deltaAbsolute, deltaPercent, direction, sentiment

evidenceImpactSchema has EXACTLY these 7 keys: amount, currency, cadence, basis, confidence, chipLabel, tone

contributingFactorSchema has EXACTLY these 5 keys: key, label, detail, share, direction

evidenceSeriesSchema has EXACTLY these 3 keys: label, unit, points

evidenceSchema has EXACTLY these 8 keys: version, metric, window, comparison, impact, contributingFactors, series, sentence
```
## Follow this exemplar exactly

This file is the approved reference for how this kind of component is written
and styled in this project. Match its structure, its class vocabulary and its
conventions. Deviating from its visual vocabulary is a failure even if the code
compiles.

```tsx
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

```

## Rules

- Write the target file. Do not create other files.
- Do not modify anything outside the target path.
- Import every symbol you use. Do not reference a symbol you have not imported.
- Use ONLY class names and style keys that appear in the surface or the exemplar.
- Do not leave TODOs, stubs, or placeholder values.
- Do not fix unrelated bugs you notice. Build only what is described above.

## Acceptance gate — you are DONE only when all of these are true

1. `/home/danman60/projects/uvalux-platform/packages/core/src/insights/scaling.ts` exists and is complete.
2. It imports what it uses from `../evidence`.
3. `npx tsc --noEmit -p packages/core/tsconfig.json && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/packages/core/src/clock.ts /home/danman60/projects/uvalux-platform/packages/core/src/insights/scaling.ts --contract /home/danman60/projects/uvalux-platform/packages/core/src/evidence.ts` passes with exit code 0.
4. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
