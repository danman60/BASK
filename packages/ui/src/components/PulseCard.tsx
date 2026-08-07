/**
 * PulseCard / PulseChip — "Today so far" (DESIGN_SPEC §3.1 right rail, §3.5 mobile).
 *
 * Same numbers, two arrangements: a StatRow stack in the desktop right rail, and a
 * horizontally scrollable chip strip on mobile. They are separate components rather
 * than one responsive component because mockup 05 puts the chips ABOVE the queue
 * while mockup 01 puts the stack BESIDE it — that is a different position in the
 * document, which CSS alone cannot do honestly.
 *
 * Rows arrive pre-formatted from the stored Daybreak brief (`brief.pulse.rows`).
 * Nothing here computes a number.
 */

import type { ReactNode } from 'react';

import { StatRow } from './StatRow';

export interface PulseRow {
  label: string;
  value: string;
  whisper?: string | null;
}

export interface PulseCardProps {
  heading: ReactNode;
  rows: readonly PulseRow[];
  /** Optional per-row explainer, keyed by row label — supplied by the surface. */
  explain?: (row: PulseRow) => ReactNode;
  className?: string;
}

export function PulseCard({ heading, rows, explain, className }: PulseCardProps) {
  return (
    <section
      className={['card', 'b-rail-card', className].filter(Boolean).join(' ')}
      data-testid="pulse-card"
    >
      <h4>{heading}</h4>
      {rows.map((row) => (
        <StatRow
          key={row.label}
          label={explain ? explain(row) : row.label}
          value={row.value}
          whisper={row.whisper}
        />
      ))}
    </section>
  );
}

export interface PulseChipsProps {
  rows: readonly PulseRow[];
  label: string;
  className?: string;
}

/** The mobile strip: value over label, scrolls sideways, never wraps. */
export function PulseChips({ rows, label, className }: PulseChipsProps) {
  return (
    <div
      className={['b-pulse-chips', className].filter(Boolean).join(' ')}
      role="group"
      aria-label={label}
      data-testid="pulse-chips"
    >
      {rows.map((row) => (
        <div className="b-pulse-chip" key={row.label}>
          <div className="b-pulse-chip-v num">{row.value}</div>
          <div className="b-pulse-chip-k">{row.label}</div>
        </div>
      ))}
    </div>
  );
}
