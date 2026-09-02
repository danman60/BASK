# TASK — OpportunityCard

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/OpportunityCard.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first**, and
follow its house style exactly.

This is the unit of the whole product: one ranked, money-first business opportunity with its
prepared actions. The feed on Today renders a stack of these.

## The file

Start with this doc comment:

```tsx
/**
 * One ranked business opportunity — the product's unit of intelligence.
 *
 * Reads in the order the owner thinks: what to do, what changed, what it is
 * worth, how sure we are, then the buttons that execute it. The money line is
 * the largest element on purpose; an owner scans dollars, not metrics.
 *
 * Presentational. Ranking and data live in @bask/core fixtures; the action
 * buttons arrive pre-built as `actions` and are rendered by `ActionRow`.
 */
```

Imports, exactly:

```tsx
import type { ReactNode } from 'react';

import {
  OPPORTUNITY_CATEGORY_LABEL,
  OPPORTUNITY_CONFIDENCE_LABEL,
  OPPORTUNITY_URGENCY_LABEL,
  type Opportunity,
} from '@bask/core';

import { ActionRow } from './ActionRow';
```

Props:

```tsx
export interface OpportunityCardProps {
  opportunity: Opportunity;
  /** 1-based position in the ranked feed. */
  rank: number;
  /** Fired with the action's label when any action button is pressed. */
  onAction?: (actionLabel: string) => void;
  /** Rendered under the meta row when provided (e.g. a Handle-it panel). */
  children?: ReactNode;
  className?: string;
}
```

Component `export function OpportunityCard({ opportunity, rank, onAction, children, className }: OpportunityCardProps)`.

Root: `<article className={['card', 'b-opp', className].filter(Boolean).join(' ')} data-testid="opportunity-card">`.

Inside, in this order:

1. Header `<div className="b-opp-head">` containing:
   - `<span className="b-opp-rank">{rank}</span>`
   - a `<div>` with `<div className="b-opp-cat">{OPPORTUNITY_CATEGORY_LABEL[opportunity.category]}</div>`
     then `<h3 className="b-opp-title">{opportunity.title}</h3>`
2. `<p className="b-opp-changed">{opportunity.whatChanged}</p>`
3. `<p className="b-opp-why">{opportunity.whyItMatters}</p>`
4. `<div className="b-opp-impact num">{opportunity.impactLabel}</div>`
5. Meta row `<div className="b-opp-meta">` containing:
   - `<span className="b-opp-conf" data-conf={opportunity.confidence}>{OPPORTUNITY_CONFIDENCE_LABEL[opportunity.confidence]}</span>`
   - `<span className="b-opp-urgency">{OPPORTUNITY_URGENCY_LABEL[opportunity.urgency]}</span>`
6. `<p className="b-opp-confnote">{opportunity.confidenceNote}</p>`
7. `<ActionRow actions={opportunity.actions} onAction={onAction} />`
8. `{children}`

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/OpportunityCard.tsx`
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` in `packages/ui` reports zero errors naming this file, and the file
  exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
- Note: `./ActionRow` may not exist yet when you start. Import it anyway exactly as written — it
  is another task in this queue and lands before the gate runs. Do not inline a substitute.
