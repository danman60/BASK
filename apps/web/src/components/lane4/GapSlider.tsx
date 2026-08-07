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
  const suggested = useMemo(
    () => round1(gap.yourValue + Math.max(0, gap.cohortMedian - gap.yourValue) / 2),
    [gap.yourValue, gap.cohortMedian],
  );
  const [target, setTarget] = useState(suggested);
  const sliderId = useId();

  const points = round1(target - gap.yourValue);
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
              : `Getting from ${gap.yourValue}% to ${round1(target)}% is ${points} ${
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
        step={0.5}
        value={target}
        style={{ ['--fill' as string]: `${clamp(fill)}%` }}
        onChange={(event) => setTarget(Number(event.target.value))}
        aria-valuetext={`${round1(target)} percent, worth ${formatCurrency(monthly)} a month`}
        data-testid="gap-slider-input"
      />

      <p className="l4-workings" style={{ marginTop: 10 }}>
        <Guided metric="peerGap">How this is worked out</Guided> — {gap.workings}
      </p>
      <WhisperNote note="figuresFromYourTill" />
    </div>
  );
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}
