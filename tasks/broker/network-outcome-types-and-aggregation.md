# network-outcome-types-and-aggregation

## What to build

A PURE module for network-wide action outcomes: what happened when OTHER salons ran the same recommended action. No I/O, no clock reads, no randomness, no React. Types plus one aggregation function.

WHY THIS EXISTS (put the reasoning in the file header): the product already shows a salon its OWN outcome for an action it ran. It cannot yet answer the question an owner actually asks, which is 'did this work for anyone else like me'. Aggregating what happened across many salons turns the recommendation engine into something that learns from its own results — and it fills gaps the recorded coaching material does not cover.

EXPORT EXACTLY THESE:

1. An interface NetworkOutcomeRecord: one salon's result from running one action. Readonly fields: salonId (string, an opaque id, never a salon name), actionKey (string, identifies which recommended action was run), signalType (string, the business condition that triggered it), improved (boolean, whether the tracked metric moved the right way), deltaPoints (number, how far the metric moved in percentage points, negative if it went the wrong way), daysToResult (number).

2. An interface NetworkOutcomeSummary with readonly fields: actionKey, signalType, salonsTried (number), salonsImproved (number), successRate (number between 0 and 1), medianDeltaPoints (number), medianDaysToResult (number), confident (boolean).

3. A constant MIN_SALONS_FOR_CONFIDENCE set to 5, with a comment explaining that below this a success rate is anecdote rather than evidence, and the surface must say so rather than quoting a percentage off two salons.

4. A function summariseNetworkOutcomes(records: readonly NetworkOutcomeRecord[]): NetworkOutcomeSummary[]. Group the records by the pair of actionKey and signalType. For each group compute the summary above. successRate is salonsImproved divided by salonsTried. confident is true only when salonsTried is at least MIN_SALONS_FOR_CONFIDENCE. Use a true median, not a mean — one salon with a wild result must not drag the number, and with an even count take the average of the two middle values. Sort the output so the most useful group comes first: confident groups before unconfident ones, then by success rate descending, then by salonsTried descending. An empty input returns an empty array. Never divide by zero and never return NaN or Infinity anywhere.

Every exported symbol gets a doc comment explaining the judgement in plain words, matching the exemplar's habit of saying WHY a rule exists rather than restating the code. Grade-7 register. Do not modify any other file. No default export.

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/packages/core/src/network/outcomes.ts`

## The API surface you may use

Everything below is REAL and already exists. Import from `../opportunities/types`.
Do NOT invent names, keys or props that are not in this list — inventing a key
on the shared style object is the single most common way this task fails.

```ts
CONTRACT API SURFACE — `@/lib/contract` exports EXACTLY these. Nothing else exists.
Do NOT reference any symbol or object key that is not on this list.

consts: OPPORTUNITY_CATEGORIES, OPPORTUNITY_CATEGORY_LABEL, OPPORTUNITY_CONFIDENCES, OPPORTUNITY_CONFIDENCE_LABEL, OPPORTUNITY_URGENCIES, OPPORTUNITY_URGENCY_LABEL
types: OpportunityCategory, OpportunityConfidence, OpportunityUrgency, OpportunityAction, ActionKind
interfaces: SmsAction, EmailAction, SocialAction, StaffTaskAction, FrontDeskScriptAction, StaffChallengeAction, UvaluxOrderAction, CoachingRequestAction, HandleItPlan, Opportunity, OpportunityOutcome

OPPORTUNITY_CATEGORY_LABEL has EXACTLY these 6 keys: marketing, membership, retail, operations, customer, coaching

OPPORTUNITY_CONFIDENCE_LABEL has EXACTLY these 2 keys: high, worth_testing

OPPORTUNITY_URGENCY_LABEL has EXACTLY these 3 keys: now, this_week, this_month
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

1. `/home/danman60/projects/uvalux-platform/packages/core/src/network/outcomes.ts` exists and is complete.
2. It imports what it uses from `../opportunities/types`.
3. `npx tsc --noEmit -p packages/core/tsconfig.json && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/packages/core/src/insights/scaling.ts /home/danman60/projects/uvalux-platform/packages/core/src/network/outcomes.ts --contract /home/danman60/projects/uvalux-platform/packages/core/src/opportunities/types.ts` passes with exit code 0.
4. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
