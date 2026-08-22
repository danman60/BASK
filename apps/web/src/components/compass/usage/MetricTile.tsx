/**
 * Compass component vocabulary (DESIGN_SPEC §4): `MetricTile` is a usage metric
 * tile that shows a value with its denominator and contributor count. It reuses
 * StatRow and TrendArrow from the exemplar.
 *
 * PRODUCT_SPEC §14: "trust made legible in the UVALUX-facing UI too" — a rep
 * should be able to see why a screen is thin before they wonder whether it is
 * broken.
 */

import type { TrendDirection } from '@bask/core';
import type { ReactNode } from 'react';
import { StatRow } from '../primitives'; // Reusing from exemplar
import { TrendArrow } from '../primitives'; // Reusing from exemplar

/* ------------------------------------------------------------- MetricTile */

export function MetricTile({
  label,
  value,
  denominator,
  trendDirection,
  contributorCount,
  suppressed = false,
}: {
  label: string;
  value: number;
  denominator: number;
  trendDirection?: TrendDirection;
  contributorCount: number;
  suppressed?: boolean;
}) {
  if (suppressed) {
    return (
      <div className="cp-statrow">
        <StatRow
          label={label}
          value={
            <span>
              Not enough salons to show this metric
            </span>
          }
        />
      </div>
    );
  }

  const percentage = denominator > 0 ? Math.round((value / denominator) * 100) : 0;

  return (
    <div className="cp-statrow">
      <StatRow
        label={label}
        value={
          <span>
            <span className="n num">{value}</span>
            <span> of {denominator} </span>
            <span className="n num">{percentage}%</span>
          </span>
        }
      />
      <div className="cp-trend">
        <TrendArrow direction={trendDirection} />
        <span>
          {contributorCount} salon{contributorCount !== 1 ? 's' : ''} contributed
        </span>
      </div>
    </div>
  );
}