# peer-standing-pure

## What to build

A PURE module that works out where a salon stands against a group of peers. No I/O, no clock, no randomness, no React.

WHY THIS EXISTS (put the reasoning in the header): a plain leaderboard is hostile. An owner told they are 47th of 60, or that they trail the shop down the road, either argues with it or stops opening the product. Two rules make a standing usable instead: the peers must be salons the owner does not compete with, and the answer must be a BAND and a GAP rather than a position in a list. This module only ever produces a band and a gap — it must not expose an ordinal rank, because the surface cannot show what it never receives.

EXPORT EXACTLY THESE:

1. A type StandingBand — the union of the string literals 'top', 'above', 'below', 'bottom'. Comment that these mirror the existing PositionBand vocabulary in the UI package so the two cannot drift apart.

2. An interface PeerMetric with readonly fields: key (string), label (string, plain words for what is measured), you (number), peerValues (readonly number[] — every non-competing peer's figure for the same metric), higherIsBetter (boolean, because a low no-show rate is good and a low attachment rate is not).

3. An interface MetricStanding with readonly fields: key, label, you (number), median (number), gapToMedian (number — positive when the salon is ahead in the direction that counts as good, negative when behind), band (StandingBand), peerCount (number).

4. A function medianOf(values: readonly number[]): number — a true median, averaging the two middle values on an even count. An empty array returns 0. Never NaN or Infinity.

5. A function bandFor(you: number, peerValues: readonly number[], higherIsBetter: boolean): StandingBand. Work out the share of peers the salon beats, in whichever direction counts as good. Top quarter is 'top', above the median is 'above', below the median is 'below', bottom quarter is 'bottom'. Fewer than four peers always returns 'above' — with three peers a quartile is meaningless and calling somebody 'bottom' on that basis is both wrong and discouraging. An empty peer list also returns 'above'.

6. A function standingFor(metric: PeerMetric): MetricStanding — assembles the above for one metric.

7. A function bestMetric(standings: readonly MetricStanding[]): MetricStanding | null. Returns the metric the salon does best on, preferring a better band first and a larger gap second. Returns null for an empty list. This exists so every owner has something they are winning at — a screen with nothing but shortfalls on it does not get opened twice.

Every exported symbol needs a doc comment in plain words explaining the judgement, matching the exemplar's habit of saying WHY a rule exists. Grade-7 register. Never divide by zero. Do not modify any other file. No default export.

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/packages/core/src/network/standing.ts`

## The API surface you may use

Everything below is REAL and already exists. Import from `./outcomes`.
Do NOT invent names, keys or props that are not in this list — inventing a key
on the shared style object is the single most common way this task fails.

```ts
CONTRACT API SURFACE — `@/lib/contract` exports EXACTLY these. Nothing else exists.
Do NOT reference any symbol or object key that is not on this list.

consts: MIN_SALONS_FOR_CONFIDENCE
interfaces: NetworkOutcomeRecord, NetworkOutcomeSummary
```
## Follow this exemplar exactly

This file is the approved reference for how this kind of component is written
and styled in this project. Match its structure, its class vocabulary and its
conventions. Deviating from its visual vocabulary is a failure even if the code
compiles.

```tsx
/**
 * Scale-invariant threshold helpers for the insights rules engine.
 *
 * The detectors currently judge a change using ABSOLUTE percentage points — a rule
 * like 'flag a retail attachment drop of 3 or more points'. That was tuned against
 * synthetic demo fixtures where attachment runs about 21 percent. Measured against
 * a real twelve-year salon dataset, attachment is 5.28 percent, so a 3-point
 * absolute drop is a 57 percent relative collapse and the rule almost never fires.
 * Worse, a companion rule needs a staff member to sit 6 points below the house
 * rate, which is arithmetically impossible when the house rate is 5.28.
 *
 * These helpers let rules express thresholds in terms of both absolute points and
 * relative share, so they work on both large-base and small-base data without
 * tuning. A drop is material if it exceeds either the absolute threshold OR the
 * relative threshold — on a large base the absolute test is the meaningful one,
 * and on a small base the relative test is.
 *
 * For example, with a baseline of 5.28 percent:
 *   - An absolute test of 3 points is only met by a fall to 2.28 or below
 *   - A relative test of 0.40 is met by a fall to 3.17 or below (40% of 5.28)
 *   - So a fall to 2.9 percent is material on the relative test (it lost 45% of
 *     the baseline) but not on the absolute test (it moved only 2.38 points).
 *     On the synthetic 21 percent base that same 2.38-point move is noise, and
 *     there the absolute test is the one that correctly stays silent.
 *
 * The same logic applies to gaps — when comparing one performer to a reference
 * rate, we want to know if they're significantly below that rate.
 */

/**
 * A materiality rule defines the minimum change needed to consider a drop or gap
 * significant. Either absolutePoints or relativeShare (or both) may be specified,
 * but not both must be satisfied — on large bases the absolute test is meaningful,
 * on small bases the relative test is.
 */
export interface MaterialityRule {
  /** Minimum change in percentage points. */
  readonly absolutePoints: number;
  /** Minimum drop as a share of the baseline (0.25 = 25% drop). */
  readonly relativeShare: number;
}

/**
 * Returns true when a fall from baseline to current clears EITHER the absolute
 * test OR the relative test. Either, not both — on a large base the absolute test
 * is the meaningful one, and on a small base the relative test is.
 *
 * Example: on a 5.28 percent baseline a fall to 2.9 clears a 0.40 relative rule
 * (it lost 45% of the baseline) but not a 3-point absolute rule (it moved 2.38).
 *
 * @param baseline The reference value (must be > 0 for relative tests)
 * @param current The value being compared to baseline
 * @param rule The materiality thresholds to apply
 * @returns true when the fall is significant according to either test
 */
export function isMaterialDrop(
  baseline: number,
  current: number,
  rule: MaterialityRule,
): boolean {
  // A rise is never a drop
  if (current >= baseline) return false;

  // Baseline of zero or less can only satisfy the absolute test, because a
  // relative share of zero is undefined — never divide by zero and never return NaN
  if (baseline <= 0) {
    return baseline - current >= rule.absolutePoints;
  }

  const absoluteTest = baseline - current >= rule.absolutePoints;
  const relativeTest = (baseline - current) / baseline >= rule.relativeShare;

  return absoluteTest || relativeTest;
}

/**
 * Returns true when a candidate performer sits far enough below a reference rate
 * to be worth naming. Same logic as isMaterialDrop, for judging whether one
 * performer sits far enough below a reference rate to be worth naming.
 *
 * This is the rule that unblocks staff comparison entirely. The old absolute-only
 * form asked for a staffer 6 points under the house rate, which cannot exist when
 * the house rate is 5.28. Measured 2019 spread was 3.37% to 8.48% against that
 * 5.28% house rate: a relative rule names the 3.37% staffer, an absolute one
 * never can.
 *
 * @param reference The reference value (must be > 0 for relative tests)
 * @param candidate The value being compared to reference
 * @param rule The materiality thresholds to apply
 * @returns true when the gap is significant according to either test
 */
export function isMaterialGap(
  reference: number,
  candidate: number,
  rule: MaterialityRule,
): boolean {
  // A rise is never a gap
  if (candidate >= reference) return false;

  // Reference of zero or less can only satisfy the absolute test, because a
  // relative share of zero is undefined — never divide by zero and never return NaN
  if (reference <= 0) {
    return reference - candidate >= rule.absolutePoints;
  }

  const absoluteTest = reference - candidate >= rule.absolutePoints;
  const relativeTest = (reference - candidate) / reference >= rule.relativeShare;

  return absoluteTest || relativeTest;
}

/**
 * Returns how far the value fell as a share of the baseline, clamped to the range
 * 0 through 1, and returning 0 when the baseline is zero or less or when the value rose.
 *
 * This is for display purposes, so it must always be a finite number.
 *
 * @param baseline The reference value (must be > 0 for relative tests)
 * @param current The value being compared to baseline
 * @returns the relative shortfall as a fraction between 0 and 1
 */
export function relativeShortfall(baseline: number, current: number): number {
  // When baseline is zero or less, or when the value rose, return 0
  if (baseline <= 0 || current >= baseline) return 0;

  const shortfall = (baseline - current) / baseline;
  // Clamp to range 0 through 1
  return Math.min(1, Math.max(0, shortfall));
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

1. `/home/danman60/projects/uvalux-platform/packages/core/src/network/standing.ts` exists and is complete.
2. It imports what it uses from `./outcomes`.
3. `npx tsc --noEmit -p packages/core/tsconfig.json && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/packages/core/src/insights/scaling.ts /home/danman60/projects/uvalux-platform/packages/core/src/network/standing.ts --contract /home/danman60/projects/uvalux-platform/packages/core/src/network/outcomes.ts` passes with exit code 0.
4. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
