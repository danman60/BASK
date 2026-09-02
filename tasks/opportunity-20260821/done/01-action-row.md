# TASK — ActionRow

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/ActionRow.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first**, and
follow its house style exactly.

The one row of execution buttons under every opportunity. Every action in the product goes through
this row, so there is exactly one of it.

## The file

Start with this doc comment:

```tsx
/**
 * The execution row — one button per prepared action.
 *
 * The first action is the recommended one and renders as the solid button;
 * everything after it is a ghost. Labels come off the actions themselves
 * (`Approve & send to 17 customers`), so this row never composes copy.
 */
```

Imports, exactly:

```tsx
import type { OpportunityAction } from '@bask/core';
```

Props:

```tsx
export interface ActionRowProps {
  actions: OpportunityAction[];
  /** Fired with the pressed action's label. */
  onAction?: (actionLabel: string) => void;
  className?: string;
}
```

Component `export function ActionRow({ actions, onAction, className }: ActionRowProps)`.

If `actions.length === 0` return `null`.

Root: `<div className={['b-actionrow', className].filter(Boolean).join(' ')} data-testid="action-row">`.

Map over `actions`; for each action at index `i` render:

```tsx
<button
  key={action.label}
  type="button"
  className={i === 0 ? 'btn' : 'btn btn-ghost'}
  data-kind={action.kind}
  onClick={onAction ? () => onAction(action.label) : undefined}
>
  {action.label}
</button>
```

Nothing else. No state, no logic beyond the map and the index test.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/ActionRow.tsx`
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` in `packages/ui` reports zero errors naming this file, and the file
  exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
