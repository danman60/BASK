/**
 * The Scoreboard screen, composed.
 *
 * Every figure arrives formatted: percentile maths live in the server's peers
 * module, not here. A component that recomputes a rank will eventually disagree
 * with the one that produced it.
 */

import { MetricTile, MetricRow } from './MetricTile';
import { CohortTable, type CohortRow } from './CohortTable';
import type { PositionBand } from './BandChip';

export interface ScoreboardMetric {
  label: string;
  value: string;
  position: PositionBand;
  /** e.g. "Cohort median $13.20". */
  sub?: string;
}

export interface ScoreboardSectionProps {
  /** Rank line, already formatted, e.g. "14th of 287". */
  rankLabel: string;
  metrics: readonly ScoreboardMetric[];
  rows: readonly CohortRow[];
  /** e.g. "Units per 100 customers, July 2026." */
  unitNote?: string;
  className?: string;
}

export function ScoreboardSection({
  rankLabel,
  metrics,
  rows,
  unitNote,
  className,
}: ScoreboardSectionProps) {
  return (
    <section
      className={['b-scoreboard-section', className].filter(Boolean).join(' ')}
      data-testid="scoreboard-section"
    >
      <header className="b-section-head">
        <span className="eyebrow">Scoreboard</span>
        <h1 className="page-h1">You rank <em>{rankLabel}</em> Canadian salons</h1>
        <p className="page-sub">
          Compared with salons of similar size across Canada. Updated monthly from what you buy
          and what you report.
        </p>
      </header>

      <MetricRow>
        {metrics.map((metric) => (
          <MetricTile
            key={metric.label}
            label={metric.label}
            value={metric.value}
            position={metric.position}
            sub={metric.sub}
          />
        ))}
      </MetricRow>

      <h2>Where you sit, category by category</h2>

      <CohortTable rows={rows} unitNote={unitNote} />
    </section>
  );
}
