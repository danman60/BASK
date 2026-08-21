# TASK — SmsPreviewCard

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/SmsPreviewCard.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first**, and
follow its house style exactly.

The prepared text message an opportunity wants to send, shown as a phone bubble with the
recipient count and one approve button. Nothing sends in the demo; the button only fires a
callback.

## The file

Start with this doc comment:

```tsx
/**
 * A prepared SMS, shown before anything sends.
 *
 * The bubble shape says "this is the actual message", not a description of
 * one. The approve button carries the recipient count so the owner knows the
 * blast radius before pressing. Nothing sends without this press — that
 * promise is the product's licence to prepare messages at all.
 */
```

Imports, exactly:

```tsx
import type { SmsAction } from '@bask/core';
```

Props:

```tsx
export interface SmsPreviewCardProps {
  action: SmsAction;
  /** Fired when the approve button is pressed. */
  onApprove?: () => void;
  className?: string;
}
```

Component `export function SmsPreviewCard({ action, onApprove, className }: SmsPreviewCardProps)`.

Root: `<div className={['card', 'b-msg', className].filter(Boolean).join(' ')} data-testid="sms-preview-card">`.

Inside, in this order:

1. `<div className="b-msg-bubble">{action.message}</div>`
2. `<div className="b-msg-meta">{action.costNote}</div>`
3. The approve button:

```tsx
<button type="button" className="b-approve" onClick={onApprove} data-testid="sms-approve">
  Approve &amp; send to {action.recipientCount} customers
</button>
```

4. `<div className="b-msg-meta">Nothing sends until you approve.</div>`

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/SmsPreviewCard.tsx`
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` in `packages/ui` reports zero errors naming this file, and the file
  exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
