/**
 * StatRow — label / value with a hairline divider (DESIGN_SPEC §4).
 *
 * The atom the pulse card, the Compass account panels and (M1 Lane 2) the Shift
 * Handoff card are all built from. Values are tabular by default because every
 * number in this product is (`--font-body` + `.num`, DESIGN_SPEC §2.2).
 *
 * `explain` takes a <Guided metric> element rather than a metric key so this file
 * stays free of guidance imports and the row can also carry no explainer at all.
 */

import type { ReactNode } from 'react';

export interface StatRowProps {
  label: ReactNode;
  value: ReactNode;
  /** The small green "on pace" line that sits after the value. */
  whisper?: string | null;
  className?: string;
}

export function StatRow({ label, value, whisper, className }: StatRowProps) {
  return (
    <div className={['b-statrow', className].filter(Boolean).join(' ')} data-testid="stat-row">
      <span className="b-statrow-k">{label}</span>
      <span className="b-statrow-v num">
        {value}
        {whisper ? <small>{whisper}</small> : null}
      </span>
    </div>
  );
}
