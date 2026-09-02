# TASK — StaffTaskCard

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/StaffTaskCard.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first**, and
follow its house style exactly.

The frontline task an opportunity creates: today's goal, a target, and the qualifying customers
as chips.

## The file

Start with this doc comment:

```tsx
/**
 * A frontline task — what the team should do today, in one glance.
 *
 * Customers render as chips, not a table: staff scan names between walk-ins.
 * The target is a number of conversations, never a quota of sales — coaching,
 * not surveillance.
 */
```

Imports, exactly:

```tsx
import type { StaffTaskAction } from '@bask/core';
```

Props:

```tsx
export interface StaffTaskCardProps {
  action: StaffTaskAction;
  className?: string;
}
```

Component `export function StaffTaskCard({ action, className }: StaffTaskCardProps)`.

Root: `<div className={['card', 'b-stask', className].filter(Boolean).join(' ')} data-testid="staff-task-card">`.

Inside, in this order:

1. `<div className="b-stask-goal">{action.goal}</div>`
2. `<div className="b-stask-target">{action.target}</div>`
3. The customer chips:

```tsx
<ul className="b-stask-list">
  {action.customers.map((name) => (
    <li key={name}>{name}</li>
  ))}
</ul>
```

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/StaffTaskCard.tsx`
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` in `packages/ui` reports zero errors naming this file, and the file
  exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
