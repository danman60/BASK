/**
 * Every customer as one square, coloured by band.
 *
 * Deliberately not a chart. The point is that an owner sees the shape of their
 * whole book in one glance and can tell that the amber is spreading before any
 * number tells them.
 */
import { BandChip, type HealthBand } from './BandChip';

export interface HealthGridCell {
  id: string;
  band: HealthBand;
  /** Shown as the square's tooltip. Usually the customer's name. */
  title: string;
}

export interface HealthGridProps {
  cells: readonly HealthGridCell[];
  /** Sits above the grid. Defaults to the line below. */
  caption?: string;
  className?: string;
}

export const HEALTH_GRID_CAPTION = 'Each square is one customer. Warmer means longer since their last visit.';

export function HealthGrid({ cells, caption, className }: HealthGridProps) {
  return (
    <section className={['card', 'b-healthgrid-wrap', className].filter(Boolean).join(' ')} data-testid="health-grid">
      <p className="b-healthgrid-caption">{caption ?? HEALTH_GRID_CAPTION}</p>
      
      {cells.length === 0 ? (
        <p className="b-dtable-empty">No customers yet.</p>
      ) : (
        <>
          <div className="b-healthgrid">
            {cells.map((cell) => (
              <span
                key={cell.id}
                className="b-healthgrid-cell"
                data-band={cell.band}
                title={cell.title}
              />
            ))}
          </div>
          
          <div className="b-healthgrid-legend">
            <BandChip band="healthy" />
            <BandChip band="slipping" />
            <BandChip band="lapsed" />
          </div>
        </>
      )}
    </section>
  );
}