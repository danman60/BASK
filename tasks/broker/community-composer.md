# community-composer

## What to build

The post box that sits above the owners-only community feed. A CONTROLLED presentational leaf: it owns no state of its own, holds no data, performs no submission. The parent supplies the values and the change handlers.

WHY IT EXISTS (state it in the header): the existing feed can display posts but there is no way to write one. Read the exemplar's header first — it establishes the fence this component must respect: owners only, never customer-facing, and a post can carry a real FIGURE as a first-class field because an owner will put a number on the table here that they would not post in a public group. The composer must therefore make attaching a figure feel ordinary, not buried.

Define and export an interface CommunityComposerProps with readonly fields: body (string), onBodyChange (a function taking a string and returning void), figureValue (optional string), onFigureValueChange (optional function taking a string returning void), figureCaption (optional string), onFigureCaptionChange (optional function taking a string returning void), onSubmit (a function taking no arguments returning void), submitting (boolean), disabledReason (optional string — when present the composer is not usable and this sentence explains why, for example that the salon has not yet opted in to sharing), and an optional className.

Export a function component CommunityComposer.

WHAT IT RENDERS:
- a form element with className 'card' plus a component class and a data-testid of 'community-composer'
- a textarea bound to body and onBodyChange, with a placeholder inviting a real question
- an optional figure area: two small text inputs, one for the number and one for a short caption saying what it counts. Only render this when the matching change handlers were supplied.
- a submit button, disabled when submitting is true, or when body is empty or only whitespace, or when disabledReason is present
- when disabledReason is present, show that sentence plainly instead of the inputs. Do not render a dead form the owner cannot use.

The form's submit handler must call preventDefault before calling onSubmit, otherwise the page reloads and the post is lost.

Accessibility: every input needs an associated label. Use htmlFor with matching ids.

Match the exemplar's class-naming convention, comment density and grade-7 copy voice. No emoji, no inline styles, no colour. Do not modify any other file. No default export.

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/packages/ui/src/components/CommunityComposer.tsx`

## The API surface you may use

Everything below is REAL and already exists. Import from `@bask/core`.
Do NOT invent names, keys or props that are not in this list — inventing a key
on the shared style object is the single most common way this task fails.

```ts
CONTRACT API SURFACE — `@/lib/contract` exports EXACTLY these. Nothing else exists.
Do NOT reference any symbol or object key that is not on this list.

consts: OPPORTUNITY_CATEGORIES, OPPORTUNITY_CATEGORY_LABEL, OPPORTUNITY_CONFIDENCES, OPPORTUNITY_CONFIDENCE_LABEL, OPPORTUNITY_URGENCIES, OPPORTUNITY_URGENCY_LABEL
types: OpportunityCategory, OpportunityConfidence, OpportunityUrgency, OpportunityAction, ActionKind
interfaces: SmsAction, EmailAction, SocialAction, StaffTaskAction, FrontDeskScriptAction, StaffChallengeAction, UvaluxOrderAction, CoachingRequestAction, HandleItPlan, Opportunity, OpportunityOutcome

OPPORTUNITY_CATEGORY_LABEL has EXACTLY these 6 keys: marketing, membership, retail, operations, customer, coaching

OPPORTUNITY_CONFIDENCE_LABEL has EXACTLY these 2 keys: high, worth_testing

OPPORTUNITY_URGENCY_LABEL has EXACTLY these 3 keys: now, this_week, this_month
```
## Follow this exemplar exactly

This file is the approved reference for how this kind of component is written
and styled in this project. Match its structure, its class vocabulary and its
conventions. Deviating from its visual vocabulary is a failure even if the code
compiles.

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

import type { ReactNode } from 'react';

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

export const COMMUNITY_BLURB =
  'Owners only. Not your customers, not the public — a room where you can put a real number on the table and ask what other people are seeing.';

export function CommunityFeed({ posts, className }: CommunityFeedProps) {
  if (posts.length === 0) {
    return (
      <div className={['b-feed', className].filter(Boolean).join(' ')} data-testid="community-feed">
        <p className="b-dtable-empty">Nothing posted yet. Be the first to ask something.</p>
      </div>
    );
  }

  return (
    <div className={['b-feed', className].filter(Boolean).join(' ')} data-testid="community-feed">
      {posts.map((post) => (
        <article
          key={post.id}
          className="card b-post"
          data-testid="community-post"
        >
          <div className="b-post-head">
            <div className="b-post-avatar">{post.initials}</div>
            <div>
              <div className="b-post-who">{post.author}</div>
              <div className="b-post-where">{post.where}</div>
            </div>
            <span className="b-post-when">{post.when}</span>
          </div>
          <p className="b-post-body">{post.body}</p>
          {post.figure && (
            <div className="b-post-figure">
              {post.figure.value}
              <small>{post.figure.caption}</small>
            </div>
          )}
          <div className="b-post-foot">
            <span>{post.replyCount} replies</span>
          </div>
        </article>
      ))}
    </div>
  );
}

```

## Rules

- Write the target file. Do not create other files.
- Do not modify anything outside the target path.
- Import every symbol you use. Do not reference a symbol you have not imported.
- Use ONLY class names and style keys that appear in the surface or the exemplar.
- Do not leave TODOs, stubs, or placeholder values.
- Do not fix unrelated bugs you notice. Build only what is described above.

## Acceptance gate — you are DONE only when all of these are true

1. `/home/danman60/projects/uvalux-platform/packages/ui/src/components/CommunityComposer.tsx` exists and is complete.
2. It imports what it uses from `@bask/core`.
3. `npx tsc --noEmit -p packages/ui/tsconfig.json && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/packages/ui/src/components/CommunityFeed.tsx /home/danman60/projects/uvalux-platform/packages/ui/src/components/CommunityComposer.tsx --contract /home/danman60/projects/uvalux-platform/packages/core/src/opportunities/types.ts` passes with exit code 0.
4. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
