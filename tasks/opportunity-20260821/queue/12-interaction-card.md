# TASK — InteractionCard

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/InteractionCard.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first**, and
follow its house style exactly.

One analyzed sales interaction: when, who served, the transcript excerpt, the five moment scores
as dot scales, the outcome chip, and one coaching sentence.

## The file

Start with this doc comment:

```tsx
/**
 * One analyzed front-desk conversation.
 *
 * The transcript excerpt is the evidence; the moment dots are the analysis;
 * the coaching line is the point. Customers appear as pattern labels, never
 * names — the monitor coaches staff, it does not profile customers. Outcome
 * colours: a missed opportunity is amber, not red; the tone is "next time",
 * never "gotcha".
 */
```

Imports, exactly:

```tsx
import {
  INTERACTION_OUTCOME_LABEL,
  MOMENT_KEYS,
  MOMENT_LABEL,
  type SalesInteraction,
} from '@bask/core';
```

Props:

```tsx
export interface InteractionCardProps {
  interaction: SalesInteraction;
  className?: string;
}
```

Component `export function InteractionCard({ interaction, className }: InteractionCardProps)`.

Root: `<article className={['card', 'b-inter', className].filter(Boolean).join(' ')} data-testid="interaction-card">`.

Inside, in this order:

1. Header:

```tsx
<div className="b-inter-head">
  <span className="b-inter-time num">{interaction.time}</span>
  <span className="b-inter-emp">{interaction.employee}</span>
  <span className="b-inter-cust">{interaction.customerLabel}</span>
  <span className="b-inter-outcome" data-outcome={interaction.outcome}>
    {INTERACTION_OUTCOME_LABEL[interaction.outcome]}
  </span>
</div>
```

2. Transcript excerpt:

```tsx
<ul className="b-inter-transcript">
  {interaction.excerpt.map((line, i) => (
    <li className="b-inter-line" data-speaker={line.speaker} key={i}>
      <b>{line.speaker === 'staff' ? interaction.employee : 'Customer'}:</b> {line.text}
    </li>
  ))}
</ul>
```

3. The five moment scores. Each is a label plus five dots, filled up to the score:

```tsx
<div className="b-inter-scores">
  {MOMENT_KEYS.map((moment) => (
    <div className="b-inter-score" key={moment}>
      <span className="b-inter-score-k">{MOMENT_LABEL[moment]}</span>
      <span className="b-inter-dots">
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            className="b-inter-dot"
            data-hit={step <= interaction.scores[moment] ? 'true' : 'false'}
            key={step}
          />
        ))}
      </span>
    </div>
  ))}
</div>
```

4. `<div className="b-inter-cust">{interaction.outcomeDetail}</div>`
5. `<p className="b-inter-coach">{interaction.coachingNote}</p>`

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/InteractionCard.tsx`
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` in `packages/ui` reports zero errors naming this file, and the file
  exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
