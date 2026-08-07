/**
 * ComparisonCard — two locations, key deltas (DESIGN_SPEC §4, IMPLEMENTATION_SPEC §7).
 *
 * Shown on Today only for an org with more than one salon. Full multi-location UX is
 * deferred; this card is the whole of it in M1, so it stays deliberately small:
 * a row per metric, both shops' numbers, and one delta chip in a semantic wash.
 *
 * The delta's colour comes from `sentiment`, not from the sign — down is not always
 * bad, and the Evidence schema already makes that distinction everywhere else.
 */

import type { ReactNode } from 'react';

export interface ComparisonMetric {
  key: string;
  label: ReactNode;
  left: string;
  right: string;
  /** `+12%` / `−$140` — pre-rendered by the caller alongside the numbers. */
  delta: string;
  sentiment: 'good' | 'bad' | 'neutral';
}

export interface ComparisonCardProps {
  heading: ReactNode;
  leftName: string;
  rightName: string;
  metrics: readonly ComparisonMetric[];
  className?: string;
}

export function ComparisonCard({
  heading,
  leftName,
  rightName,
  metrics,
  className,
}: ComparisonCardProps) {
  return (
    <section
      className={['card', 'b-compare'].concat(className ?? []).join(' ')}
      data-testid="comparison-card"
    >
      <h4>{heading}</h4>
      <div className="b-compare-head">
        <span />
        <span className="b-compare-name">{leftName}</span>
        <span className="b-compare-name">{rightName}</span>
        <span />
      </div>
      {metrics.map((metric) => (
        <div className="b-compare-row" key={metric.key}>
          <span className="b-compare-k">{metric.label}</span>
          <span className="b-compare-v num">{metric.left}</span>
          <span className="b-compare-v num">{metric.right}</span>
          <span className="b-compare-delta num" data-sentiment={metric.sentiment}>
            {metric.delta}
          </span>
        </div>
      ))}
    </section>
  );
}
