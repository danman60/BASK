# TASK — OutcomeCard

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/OutcomeCard.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first**, and
follow its house style exactly.

The "did it work" card: a past recommendation, what was executed, the result, and the money.
This is the product's proof surface.

## The file

Start with this doc comment:

```tsx
/**
 * The proof card — a recommendation that ran, and what it made.
 *
 * The funnel reads recommendation → executed → result so the owner can see
 * the causal chain, and the revenue line is the biggest element because it is
 * the reason to trust the next recommendation. The learned line is the system
 * being honest about what the result taught it.
 */
```

Imports, exactly:

```tsx
import type { OpportunityOutcome } from '@bask/core';
```

Props:

```tsx
export interface OutcomeCardProps {
  outcome: OpportunityOutcome;
  className?: string;
}
```

Component `export function OutcomeCard({ outcome, className }: OutcomeCardProps)`.

Root: `<article className={['card', 'b-outcome', className].filter(Boolean).join(' ')} data-testid="outcome-card">`.

Inside, in this order:

1. `<div className="b-opp-cat">{outcome.window}</div>`
2. `<h3 className="b-opp-title">{outcome.opportunityTitle}</h3>`
3. The funnel:

```tsx
<div className="b-outcome-funnel">
  <span className="b-outcome-step">{outcome.actionTaken}</span>
  <span className="b-outcome-arrow" aria-hidden="true">→</span>
  <span className="b-outcome-step">{outcome.executed}</span>
  <span className="b-outcome-arrow" aria-hidden="true">→</span>
  <span className="b-outcome-step">{outcome.result}</span>
</div>
```

4. `<div className="b-outcome-rev num">{outcome.revenueLabel}</div>`
5. `<p className="b-outcome-learned">{outcome.learned}</p>`

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/OutcomeCard.tsx`
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` in `packages/ui` reports zero errors naming this file, and the file
  exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
