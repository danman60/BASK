# TASK — FrontDeskScriptCard

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/FrontDeskScriptCard.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first**, and
follow its house style exactly.

The suggested conversation staff see when a qualifying customer checks in: who, how strong the
opportunity is, and the exact words to try.

## The file

Start with this doc comment:

```tsx
/**
 * The words to try at the front desk.
 *
 * The script is quoted verbatim so a nervous new hire can literally read it.
 * The outcome buttons close the loop: what staff press here is what the
 * Opportunity Engine learns from.
 */
```

Imports, exactly:

```tsx
import type { FrontDeskScriptAction } from '@bask/core';
```

Props:

```tsx
export interface FrontDeskScriptCardProps {
  action: FrontDeskScriptAction;
  /** Fired with 'presented' | 'accepted' | 'declined'. */
  onOutcome?: (outcome: 'presented' | 'accepted' | 'declined') => void;
  className?: string;
}
```

Component `export function FrontDeskScriptCard({ action, onOutcome, className }: FrontDeskScriptCardProps)`.

Root: `<div className={['card', 'b-script', className].filter(Boolean).join(' ')} data-testid="front-desk-script-card">`.

Inside, in this order:

1. Who row:

```tsx
<div className="b-script-who">
  <span className="b-script-level" data-level={action.level}>
    {action.level === 'high' ? 'Strong opportunity' : 'Worth a mention'}
  </span>
  <span className="b-inter-emp">{action.customer}</span>
</div>
```

2. `<blockquote className="b-script-quote">{action.script}</blockquote>`
3. A `<div className="b-actionrow">` with exactly three buttons:

```tsx
<button type="button" className="btn btn-ghost" onClick={onOutcome ? () => onOutcome('presented') : undefined}>
  Talked about it
</button>
<button type="button" className="btn" onClick={onOutcome ? () => onOutcome('accepted') : undefined}>
  They said yes
</button>
<button type="button" className="btn btn-ghost" onClick={onOutcome ? () => onOutcome('declined') : undefined}>
  Not today
</button>
```

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/FrontDeskScriptCard.tsx`
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` in `packages/ui` reports zero errors naming this file, and the file
  exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
