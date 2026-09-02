# TASK — ConsentPledgeCard

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/ConsentPledgeCard.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first**, and
follow its house style exactly.

The monitor's consent framing, on the surface itself. This card is the licence to operate — it
never moves to a settings page.

## The file

Start with this doc comment:

```tsx
/**
 * The monitor's terms, on the monitor itself.
 *
 * Every line is a commitment the demo build actually keeps (nothing here
 * processes audio; fixtures only). If the product ever breaks one of these
 * lines, this card is where that becomes a lie — which is the point of
 * keeping it on the surface.
 */
```

Imports, exactly:

```tsx
import type { ReactNode } from 'react';
```

Props:

```tsx
export interface ConsentPledgeCardProps {
  /** Override the default pledge lines. */
  lines?: string[];
  children?: ReactNode;
  className?: string;
}
```

Declare the default lines above the component, verbatim:

```tsx
export const PLEDGE_LINES = [
  'The team knows the listener is here. It is part of how we coach, and it is in the open.',
  'Conversations are scored for coaching. Nobody is disciplined off a transcript.',
  'Customers are patterns, never profiles. No customer names, no voices kept.',
  'The salon owns this data. UVALUX sees it only with consent, like everything else.',
];
```

Component `export function ConsentPledgeCard({ lines, children, className }: ConsentPledgeCardProps)`.

Root: `<div className={['card', 'b-pledge', className].filter(Boolean).join(' ')} data-testid="consent-pledge-card">`.

Inside:

1. `<div className="b-pledge-title">How the listener is used</div>`
2. `{(lines ?? PLEDGE_LINES).map((line) => <p className="b-pledge-line" key={line}>{line}</p>)}`
3. `{children}`

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/ConsentPledgeCard.tsx`
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` in `packages/ui` reports zero errors naming this file, and the file
  exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
