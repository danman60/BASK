/**
 * The one status pill.
 *
 * Three vocabularies share one component on purpose: customer health, benchmark
 * position, and knowledge-citation confidence all render the same shape, and the
 * moment there are two pill components they drift. `ImpactChip` is not a
 * substitute — it is two-tone (cost/opportunity) and cannot carry four positions.
 *
 * Colour comes from `data-band` in health.css. Never pass a style prop.
 */

import type { ReactNode } from 'react';

export type HealthBand = 'healthy' | 'slipping' | 'lapsed';
export type PositionBand = 'top' | 'above' | 'below' | 'bottom';
export type CitationBand = 'confirmed' | 'approximate';
export type ChipBand = HealthBand | PositionBand | CitationBand;

export const BAND_LABEL: Record<ChipBand, string> = {
  healthy: 'Healthy',
  slipping: 'Slipping',
  lapsed: 'Lapsed',
  top: 'Top quartile',
  above: 'Above median',
  below: 'Below median',
  bottom: 'Bottom quartile',
  confirmed: 'Confirmed',
  approximate: 'Approximate',
};

export interface BandChipProps {
  band: ChipBand;
  /** Overrides the default label. Use only when the row already says the word. */
  label?: string;
  className?: string;
}

export function BandChip({ band, label, className }: BandChipProps) {
  return (
    <span
      className={['b-band', className].filter(Boolean).join(' ')}
      data-band={band}
      data-testid="band-chip"
    >
      {label ?? BAND_LABEL[band]}
    </span>
  );
}
