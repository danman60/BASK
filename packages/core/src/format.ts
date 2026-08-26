/**
 * @bask/core/format — the ONE place a clock hour, a weekday index or a small
 * count becomes user-facing text.
 *
 * Why this file exists: four private copies of these helpers had drifted apart.
 * `detectors.ts` rendered a soft-capacity window as `2pm–5pm` while the campaign
 * generated from that same window rendered `2 pm–5 pm` — and Beat 1 of the pitch
 * puts both on screen inside thirty seconds. Money/metric formatting is a
 * different concern and stays in `evidence.ts`; calendar-date formatting stays
 * in `clock.ts`.
 *
 * Canonical hour format is `2pm` — no space. See ITEM 16 notes in the lane
 * report: it is what the insight card, the capacity sparkline labels and the
 * floor schedule gutter already rendered, and it is the format that survives a
 * narrow column.
 */

import { addDays, weekdayName, type DateOnly } from './clock';

/** 2026-01-04 is a Sunday, so `addDays(SUNDAY_ANCHOR, n)` lands on weekday `n`. */
const SUNDAY_ANCHOR = '2026-01-04' as DateOnly;

/**
 * `0 → "Sunday"`, `2 → "Tuesday"`. Indexes match Postgres/JS `getUTCDay()`.
 *
 * Routed through `clock.weekdayName` on purpose: the weekday name list lives in
 * exactly one array, in `clock.ts`.
 */
export function weekdayNameForIndex(index: number): string {
  // Out-of-range indexes used to fall through to a hard-coded 'Tuesday' in the
  // marketing router; wrapping into 0–6 is honest for any integer.
  if (!Number.isFinite(index)) return 'Tuesday';
  const normalised = ((Math.trunc(index) % 7) + 7) % 7;
  return weekdayName(addDays(SUNDAY_ANCHOR, normalised));
}

/** `14 → "2pm"`, `0 → "12am"`, `12 → "12pm"`. No space — see the file header. */
export function formatHour(hour: number): string {
  const suffix = hour >= 12 ? 'pm' : 'am';
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}${suffix}`;
}

/** `(14, 17) → "2pm–5pm"`. En dash, both ends carry their meridiem. */
export function formatHourRange(startHour: number, endHour: number): string {
  return `${formatHour(startHour)}–${formatHour(endHour)}`;
}

/**
 * `3 → "three"`. Lower case: these land mid-sentence and the callers capitalise
 * the start of the sentence themselves. Above the table it falls back to
 * digits, which reads fine in a count ("12 things need attention").
 */
export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'] as const;
