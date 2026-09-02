# TASK — EmailPreviewCard

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/EmailPreviewCard.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first**, and
follow its house style exactly.

The prepared email an opportunity wants to send: subject, short body preview, three buttons.

## The file

Start with this doc comment:

```tsx
/**
 * A prepared email, shown before anything sends.
 *
 * Subject and a short body preview — enough to judge tone without opening an
 * editor. Preview and Edit are ghosts; Send carries the recipient count.
 */
```

Imports, exactly:

```tsx
import type { EmailAction } from '@bask/core';
```

Props:

```tsx
export interface EmailPreviewCardProps {
  action: EmailAction;
  /** Fired with 'preview' | 'edit' | 'send'. */
  onPress?: (button: 'preview' | 'edit' | 'send') => void;
  className?: string;
}
```

Component `export function EmailPreviewCard({ action, onPress, className }: EmailPreviewCardProps)`.

Root: `<div className={['card', 'b-mailprev', className].filter(Boolean).join(' ')} data-testid="email-preview-card">`.

Inside, in this order:

1. `<div className="b-mailprev-subject">{action.subject}</div>`
2. `<p className="b-mailprev-body">{action.body}</p>`
3. A `<div className="b-actionrow">` with exactly three buttons:

```tsx
<button type="button" className="btn btn-ghost" onClick={onPress ? () => onPress('preview') : undefined}>
  Preview
</button>
<button type="button" className="btn btn-ghost" onClick={onPress ? () => onPress('edit') : undefined}>
  Edit
</button>
<button type="button" className="b-approve" onClick={onPress ? () => onPress('send') : undefined}>
  Send to {action.recipientCount} customers
</button>
```

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/EmailPreviewCard.tsx`
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` in `packages/ui` reports zero errors naming this file, and the file
  exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
