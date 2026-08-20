import type { HealthBand } from './BandChip';

/**
 * The three health counts, across the top of the Customers screen.
 *
 * Counts arrive as props. This component does no scoring — `computeCustomerHealth`
 * in @bask/core owns that, and duplicating any part of it here would let the tiles
 * and the grid disagree about the same customer.
 */

export interface HealthBandCount {
  band: HealthBand;
  count: number;
}

export interface HealthBandTilesProps {
  counts: readonly HealthBandCount[];
  className?: string;
}

export const BAND_NOTE: Record<HealthBand, string> = {
  healthy: 'Coming as often as they always have.',
  slipping: 'Quieter than their own normal. Still winnable.',
  lapsed: 'Gone long enough that it takes a real reason to return.',
};

export const BAND_HEADING: Record<HealthBand, string> = {
  healthy: 'Healthy',
  slipping: 'Slipping',
  lapsed: 'Lapsed',
};

export function HealthBandTiles({
  counts,
  className,
}: HealthBandTilesProps) {
  return (
    <div className={['b-bandtiles', className].filter(Boolean).join(' ')} data-testid="health-band-tiles">
      {counts.map((c) => (
        <div
          key={c.band}
          className="card b-bandtile"
          data-band={c.band}
          data-testid="health-band-tile"
        >
          <div className="b-bandtile-rail" />
          <div className="b-bandtile-body">
            <div className="b-bandtile-count num">{c.count.toLocaleString()}</div>
            <div className="b-bandtile-label">{BAND_HEADING[c.band]}</div>
            <p className="b-bandtile-note">{BAND_NOTE[c.band]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
