# TASK — CommunityFeed

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/CommunityFeed.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT.md` first**, and
follow its house style exactly.

## Why this exists

Asked what salons actually come to UVALUX for, the client said the lotion, then the insights, then
the training — and then, flatly, **"the community's the biggest one."** It was in no plan, no
proposal and no film.

This is an **owners-only** room, deliberately not the Facebook groups he described as *"so much
negativity… generally always run by two loud people."* The thing that makes it worth having is that
an owner will post a real number from their own salon here that they would never post publicly.

## Imports

```tsx
import type { ReactNode } from 'react';
```

This component imports nothing from the other tasks.

## The file

Doc comment:

```tsx
/**
 * The owners-only feed.
 *
 * Not a customer-facing social surface and never becomes one — the fence is that
 * we never touch a salon's customers. What makes this room worth joining is that
 * an owner will post a number here they would not post in a public group, which
 * is why a post can carry a figure as a first-class thing rather than buried in
 * the text.
 */
```

Types and props:

```tsx
export interface CommunityPost {
  id: string;
  /** Post author's display name. */
  author: string;
  /** Their salon and town, e.g. "Sunset Ridge · Burlington ON". */
  where: string;
  /** Initials for the avatar, e.g. "SR". */
  initials: string;
  /** Already formatted, e.g. "2 days ago". */
  when: string;
  body: string;
  /** Optional headline number the author is sharing from their own salon. */
  figure?: { value: string; caption: string };
  replyCount: number;
}

export interface CommunityFeedProps {
  posts: readonly CommunityPost[];
  className?: string;
}
```

Component `CommunityFeed`:

- root `<div>` with class list `['b-feed', className]`, `data-testid="community-feed"`
- one `<article className="card b-post" key={post.id} data-testid="community-post">` per post
- inside each post, in this order:
  1. `<div className="b-post-head">` containing
     `<div className="b-post-avatar">{post.initials}</div>`, then a `<div>` holding
     `<div className="b-post-who">{post.author}</div>` and
     `<div className="b-post-where">{post.where}</div>`, then
     `<span className="b-post-when">{post.when}</span>`
  2. `<p className="b-post-body">{post.body}</p>`
  3. when `post.figure` is present:
     ```tsx
     <div className="b-post-figure">
       {post.figure.value}
       <small>{post.figure.caption}</small>
     </div>
     ```
  4. `<div className="b-post-foot"><span>{post.replyCount} replies</span></div>`
- **empty state:** when `posts.length === 0`, render the root containing only
  `<p className="b-dtable-empty">Nothing posted yet. Be the first to ask something.</p>`

Also export a small named constant used by whoever renders the page header:

```tsx
export const COMMUNITY_BLURB =
  'Owners only. Not your customers, not the public — a room where you can put a real number on the table and ask what other people are seeing.';
```

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/CommunityFeed.tsx`
- Do NOT create or modify any other file. Do NOT edit `index.ts`. Do NOT edit any `.css` file —
  every class above already exists in `health.css`.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/ui`
  reports zero errors naming this file; the file exports `CommunityPost`, `CommunityFeedProps`,
  `COMMUNITY_BLURB` and `CommunityFeed`; and it returns JSX.
- No `any`. No `useState`. No `style={{...}}`. No default export.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
