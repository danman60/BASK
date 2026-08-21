# TASK — SocialPostCard

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/SocialPostCard.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first**, and
follow its house style exactly.

The prepared social campaign: Facebook copy, Instagram copy, CTA, and one line of art direction.

## The file

Start with this doc comment:

```tsx
/**
 * A prepared social campaign — both networks' copy side by side.
 *
 * The image line is art direction, not an image: the demo prepares words and
 * the owner supplies the photo. Copy arrives finished off the action; this
 * card never writes marketing.
 */
```

Imports, exactly:

```tsx
import type { SocialAction } from '@bask/core';
```

Props:

```tsx
export interface SocialPostCardProps {
  action: SocialAction;
  /** Fired when the create button is pressed. */
  onCreate?: () => void;
  className?: string;
}
```

Component `export function SocialPostCard({ action, onCreate, className }: SocialPostCardProps)`.

Root: `<div className={['card', 'b-social', className].filter(Boolean).join(' ')} data-testid="social-post-card">`.

Inside, in this order:

1. `<div className="b-social-net">Facebook</div>`
2. `<p className="b-social-copy">{action.facebook}</p>`
3. `<div className="b-social-net">Instagram</div>`
4. `<p className="b-social-copy">{action.instagram}</p>`
5. `<div className="b-social-cta">{action.cta}</div>`
6. `<p className="b-social-img">{action.imageDirection}</p>`
7. The button:

```tsx
<button type="button" className="b-approve" onClick={onCreate} data-testid="social-create">
  Create posts
</button>
```

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/SocialPostCard.tsx`
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` in `packages/ui` reports zero errors naming this file, and the file
  exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
