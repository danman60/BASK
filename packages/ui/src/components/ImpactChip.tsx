/**
 * ImpactChip — the money pill on an insight card (DESIGN_SPEC §3.1).
 *
 * `≈ $640/mo if it holds` in terracotta wash for a cost, green wash for an
 * opportunity. The LABEL is not assembled here: it comes pre-rendered off
 * `Evidence.impact.chipLabel`, which is written next to the number that produced
 * it. Formatting money in the view is how a card and its evidence drift apart.
 */

export interface ImpactChipProps {
  /** `Evidence.impact.chipLabel`. */
  label: string;
  /** `Evidence.impact.tone`. Opportunity chips render green. */
  tone: 'cost' | 'opportunity';
  className?: string;
}

export function ImpactChip({ label, tone, className }: ImpactChipProps) {
  return (
    <span
      className={['b-impact', className].filter(Boolean).join(' ')}
      data-tone={tone}
      data-testid="impact-chip"
    >
      {label}
    </span>
  );
}
