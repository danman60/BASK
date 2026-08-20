import { BandChip, type PositionBand } from './BandChip';

/**
 * You against the cohort, per category.
 *
 * Units, not dollars, by default: the client asked the question in units ("35
 * against 22") and units survive price differences between salons. The caller
 * decides what the unit is and says so in `unitNote`.
 *
 * `ComparisonCard` covers the two-sided named comparison; this is the many-row
 * ranked table, which is a different shape.
 */
export interface CohortRow {
  category: string;
  /** This salon's figure. Already rounded by the caller. */
  you: number;
  /** The cohort median for the same figure. */
  median: number;
  position: PositionBand;
}

export interface CohortTableProps {
  rows: readonly CohortRow[];
  /** e.g. "Units per 100 customers, July 2026." Sits under the table. */
  unitNote?: string;
  className?: string;
}

export function CohortTable({ rows, unitNote, className }: CohortTableProps) {
  if (rows.length === 0) {
    return (
      <section className={['card', className].filter(Boolean).join(' ')} data-testid="cohort-table">
        <p className="b-dtable-empty">Not enough salons in this cohort to compare yet.</p>
      </section>
    );
  }

  return (
    <section className={['card', className].filter(Boolean).join(' ')} data-testid="cohort-table">
      <table className="b-dtable">
        <thead>
          <tr>
            <th>Category</th>
            <th className="num">You</th>
            <th className="num">Cohort median</th>
            <th>Position</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.category}>
              <td>{row.category}</td>
              <td className="num">{row.you.toLocaleString()}</td>
              <td className="num">{row.median.toLocaleString()}</td>
              <td><BandChip band={row.position} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {unitNote && <p className="b-metric-sub">{unitNote}</p>}
    </section>
  );
}