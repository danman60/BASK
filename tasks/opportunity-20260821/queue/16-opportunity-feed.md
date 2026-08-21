# TASK — OpportunityFeedSection

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/OpportunityFeedSection.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first**, and
follow its house style exactly.

The feed itself: "N ways to grow your business today" over the ranked opportunity cards. This is
what the Today page renders as its main column.

## The file

Start with this doc comment:

```tsx
/**
 * The daily action feed — the product's primary interface.
 *
 * The heading counts the opportunities because "4 ways to grow your business
 * today" is a promise sized to a coffee break; "analytics" is not. Cards
 * arrive ranked; this section adds nothing but the frame. Outcomes render
 * after the feed under "What your last actions made" — proof directly under
 * promise.
 */
```

Imports, exactly:

```tsx
import type { Opportunity, OpportunityOutcome } from '@bask/core';

import { OpportunityCard } from './OpportunityCard';
import { OutcomeCard } from './OutcomeCard';
```

Props:

```tsx
export interface OpportunityFeedSectionProps {
  /** Already ranked, best first. */
  opportunities: Opportunity[];
  /** Measured results of past actions, newest first. */
  outcomes?: OpportunityOutcome[];
  /** Fired with (opportunityId, actionLabel) when any card's action is pressed. */
  onAction?: (opportunityId: string, actionLabel: string) => void;
  className?: string;
}
```

Component
`export function OpportunityFeedSection({ opportunities, outcomes, onAction, className }: OpportunityFeedSectionProps)`.

Root: `<section className={['b-oppfeed', className].filter(Boolean).join(' ')} data-testid="opportunity-feed-section">`.

Inside, in this order:

1. Heading:

```tsx
<div>
  <h2 className="b-oppfeed-head">
    {opportunities.length} ways to grow your business today
  </h2>
  <p className="b-oppfeed-sub">
    Found in your own numbers overnight. Every one opens into the thing that does it.
  </p>
</div>
```

2. The ranked list:

```tsx
<div className="b-oppfeed-list">
  {opportunities.map((opp, i) => (
    <OpportunityCard
      key={opp.id}
      opportunity={opp}
      rank={i + 1}
      onAction={onAction ? (label) => onAction(opp.id, label) : undefined}
    />
  ))}
</div>
```

3. Only when `outcomes` is present and non-empty:

```tsx
{outcomes && outcomes.length > 0 && (
  <div>
    <h2 className="b-oppfeed-head">What your last actions made</h2>
    <div className="b-oppfeed-list">
      {outcomes.map((outcome) => (
        <OutcomeCard key={outcome.id} outcome={outcome} />
      ))}
    </div>
  </div>
)}
```

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/OpportunityFeedSection.tsx`
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` in `packages/ui` reports zero errors naming this file, and the file
  exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
- `./OpportunityCard` and `./OutcomeCard` are earlier tasks in this queue and will exist by the
  time your gate runs. Import them exactly as written; do not inline substitutes.
