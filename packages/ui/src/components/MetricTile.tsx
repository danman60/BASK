/**
 * One benchmarked headline number.
 *
 * The position chip is the point — a number on its own tells an owner nothing,
 * and every metric on this screen exists to answer "am I above or below?".
 * `StatRow` covers the un-benchmarked label/value case; use that instead when
 * there is no cohort to compare against.
 */
import type { ReactNode } from 'react';
import { BandChip, type PositionBand } from './BandChip';

export interface MetricTileProps {
  /** Short uppercase label, e.g. "Revenue per session". */
  label: string;
  /** The formatted value, e.g. "$14.80". Formatting belongs to the caller. */
  value: ReactNode;
  position: PositionBand;
  /** Optional line under the chip, e.g. "Cohort median $13.20". */
  sub?: string;
  className?: string;
}

export function MetricTile({ label, value, position, sub, className }: MetricTileProps) {
  return (
    <div className={['card', 'b-metric', className].filter(Boolean).join(' ')} data-testid="metric-tile">
      <div className="b-metric-label">{label}</div>
      <div className="b-metric-value num">{value}</div>
      <BandChip band={position} />
      {sub ? <div className="b-metric-sub">{sub}</div> : null}
    </div>
  );
}

export interface MetricRowProps {
  children: ReactNode;
  className?: string;
}

export function MetricRow({ children, className }: MetricRowProps) {
  return (
    <div className={['b-metrics', className].filter(Boolean).join(' ')} data-testid="metric-row">
      {children}
    </div>
  );
}
