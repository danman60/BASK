/**
 * The Customers screen, composed.
 *
 * Presentation only: counts, cells and rows are all computed upstream by
 * `computeCustomerHealth` in @bask/core. If this component ever starts deciding
 * which band a customer is in, the tiles and the grid will disagree with each
 * other about the same person.
 */

import { HealthBandTiles, type HealthBandCount } from './HealthBandTiles';
import { HealthGrid, type HealthGridCell } from './HealthGrid';
import { SlippingList, type SlippingRow } from './SlippingList';

export interface CustomerHealthSectionProps {
  counts: readonly HealthBandCount[];
  cells: readonly HealthGridCell[];
  rows: readonly SlippingRow[];
  /** Total customers, already formatted, e.g. "1,412". */
  totalLabel: string;
  /** How many are slipping, already formatted, e.g. "329". */
  slippingLabel: string;
  onDraft?: (id: string) => void;
  className?: string;
}

export function CustomerHealthSection({
  counts,
  cells,
  rows,
  totalLabel,
  slippingLabel,
  onDraft,
  className,
}: CustomerHealthSectionProps) {
  return (
    <section
      className={['b-health-section', className].filter(Boolean).join(' ')}
      data-testid="customer-health-section"
    >
      <header className="b-section-head">
        <span className="eyebrow">Customers</span>
        <h1 className="page-h1">
          {totalLabel} customers. <em>{slippingLabel} are slipping.</em>
        </h1>
        <p className="page-sub">
          Scored on how recently they came, how often they used to, and what they spend.
          Sorted so the ones worth a call today are at the top.
        </p>
      </header>

      <HealthBandTiles counts={counts} />

      <h2>The grid</h2>
      <HealthGrid cells={cells} />

      <h2>Worth a call today</h2>
      <SlippingList rows={rows} onDraft={onDraft} />
    </section>
  );
}
