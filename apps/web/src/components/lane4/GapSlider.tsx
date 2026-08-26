'use client';

import { useId, useMemo, useState } from 'react';
import { formatCurrency } from '@bask/core';
import { Guided, WhisperNote } from '@bask/ui';

import type { PeerGap } from '@/server/peers';
import { Chip } from './primitives';

/**
 * GapSlider (DESIGN_SPEC §4) — drag the target, the money recomputes under the
 * finger. Terracotta track, tabular output.
 *
 * The recompute is deliberately one multiplication:
 *
 *     monthly = (target − yours) × dollarsPerPoint
 *
 * `dollarsPerPoint` is computed on the server from the salon's own traffic
 * (`server/peers.ts`), and its derivation is printed under the slider. That
 * matters more than the animation: an owner who drags this to a number they
 * like has to be able to see why the dollar figure moved with it, or the whole
 * screen is a slot machine.
 */
export function GapSlider({ gap }: { gap: PeerGap }) {
  // At rest the slider MUST read the same dollars as the headline, which comes
  // from `halfGapMonthly` in server/peers.ts:
  //
  //     gapPoints = round(cohortMedian - yourValue, 1)
  //     halfGapMonthly = round((gapPoints / 2) * dollarsPerPoint)
  //
  // The server halves the *rounded* gap and does not round again, so the resting
  // target is `yourValue + gapPoints / 2` — 7.35 points, not 7.4. Rounding that
  // to one decimal here used to shift the figure by half a step of money
  // (~$89 on the utilisation gap), so the headline and the card under it
  // disagreed before the owner had touched anything.
  const suggested = useMemo(() => {
    const gapPoints = round1(Math.max(0, gap.cohortMedian - gap.yourValue));
    const raw = gap.yourValue + gapPoints / 2;
    return Math.min(gap.sliderMax, Math.max(gap.sliderMin, raw));
  }, [gap.yourValue, gap.cohortMedian, gap.sliderMin, gap.sliderMax]);
  const [target, setTarget] = useState(suggested);
  const sliderId = useId();

  // Half of a one-decimal gap always lands on a 0.05 boundary, so STEP keeps the
  // resting value on the input's own grid. An off-grid value makes the browser
  // snap on the first drag, which reads as the number jumping when touched.
  const points = target - gap.yourValue;
  const monthly = Math.round(points * gap.dollarsPerPoint);
  const yearly = monthly * 12;

  const span = gap.sliderMax - gap.sliderMin || 1;
  const fill = ((target - gap.sliderMin) / span) * 100;
  const medianAt = clamp(((gap.cohortMedian - gap.sliderMin) / span) * 100);
  const topAt = clamp(((gap.cohortTopQuartile - gap.sliderMin) / span) * 100);

  return (
    <div>
      <div className="l4-gap-head">
        <div>
          <p className="l4-slider-value" data-testid="gap-slider-money">
            {monthly <= 0 ? formatCurrency(0) : `+${formatCurrency(monthly)}`}
            <span style={{ fontSize: 'var(--text-md)', color: 'var(--ink-faint)' }}> / month</span>
          </p>
          <p className="l4-slider-caption">
            {points <= 0
              ? 'Drag the target above where you are now to see what it is worth.'
              : `Getting from ${gap.yourValue}% to ${trim(target)}% is ${trim(points)} ${
                  points === 1 ? 'point' : 'points'
                }, worth about ${formatCurrency(yearly)} a year.`}
          </p>
        </div>
        <Chip tone="accent">
          <span className="num">{formatCurrency(gap.dollarsPerPoint)}</span>&nbsp;a month per point
        </Chip>
      </div>

      <div className="l4-gap-scale" aria-hidden>
        <div className="l4-gap-fill" style={{ width: `${clamp(fill)}%` }} />
        <div className="l4-gap-marker" style={{ left: `${medianAt}%` }}>
          <span>middle {gap.cohortMedian}%</span>
        </div>
        <div
          className="l4-gap-marker"
          style={{ left: `${topAt}%`, opacity: 0.45 }}
        />
      </div>

      <label htmlFor={sliderId} style={{ display: 'block', marginTop: 26 }}>
        <span className="l4-stat-label">
          Where do you want to get to? (you are at {gap.yourValue}% today)
        </span>
      </label>
      <input
        id={sliderId}
        className="l4-range"
        type="range"
        min={gap.sliderMin}
        max={gap.sliderMax}
        step={STEP}
        value={target}
        style={{ ['--fill' as string]: `${clamp(fill)}%` }}
        // React maps onChange for a range input onto the native `input` event,
        // so this fires continuously under the finger rather than on release.
        onChange={(event) => setTarget(Number(event.target.value))}
        aria-valuetext={`${trim(target)} percent, worth ${formatCurrency(monthly)} a month`}
        data-testid="gap-slider-input"
      />

      <p className="l4-workings" style={{ marginTop: 10 }}>
        <Guided metric="peerGap">How this is worked out</Guided> — {gap.workings}
      </p>
      <WhisperNote note="figuresFromYourTill" />
    </div>
  );
}

/** Half of a one-decimal gap is always a multiple of this. */
const STEP = 0.05;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Show the real number without trailing zeros: 7.4 → "7.4", 7.35 → "7.35". */
function trim(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}
