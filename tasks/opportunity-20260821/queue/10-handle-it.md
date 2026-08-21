# TASK — HandleItPlanCard

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/HandleItPlanCard.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first**, and
follow its house style exactly.

The "Handle it" surface: the system has already prepared the whole plan — audience, offer, copy,
schedule — and the owner approves it whole with one press.

## The file

Start with this doc comment:

```tsx
/**
 * "Handle it" — the delegation surface.
 *
 * The plan is shown whole (audience, offer, copy, schedule) so approval is
 * informed, and it is approved whole so it stays one click. The approval note
 * is load-bearing: nothing runs until the press, and the surface says so.
 */
```

Imports, exactly:

```tsx
import type { HandleItPlan } from '@bask/core';
```

Props:

```tsx
export interface HandleItPlanCardProps {
  plan: HandleItPlan;
  /** Fired when the approve button is pressed. */
  onApprove?: () => void;
  className?: string;
}
```

Component `export function HandleItPlanCard({ plan, onApprove, className }: HandleItPlanCardProps)`.

Root: `<div className={['card', 'b-handle', className].filter(Boolean).join(' ')} data-testid="handle-it-plan-card">`.

Inside, in this order:

1. The four plan steps:

```tsx
<ul className="b-handle-steps">
  <li className="b-handle-step">
    <span className="b-handle-k">Audience</span>
    <span className="b-handle-v">{plan.audience}</span>
  </li>
  <li className="b-handle-step">
    <span className="b-handle-k">Offer</span>
    <span className="b-handle-v">{plan.offer}</span>
  </li>
  <li className="b-handle-step">
    <span className="b-handle-k">Message</span>
    <span className="b-handle-v">{plan.copy}</span>
  </li>
  <li className="b-handle-step">
    <span className="b-handle-k">Schedule</span>
    <span className="b-handle-v">{plan.schedule}</span>
  </li>
</ul>
```

2. The approve button:

```tsx
<button type="button" className="b-approve" onClick={onApprove} data-testid="handle-it-approve">
  Handle it
</button>
```

3. `<p className="b-handle-note">{plan.approvalNote}</p>`

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/HandleItPlanCard.tsx`
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` in `packages/ui` reports zero errors naming this file, and the file
  exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
