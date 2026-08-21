# TASK — CoachAnswer

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/CoachAnswer.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT.md` first**, and
follow its house style exactly.

## What this is

A coaching answer with its sources underneath — the screen that makes the knowledge base **UVALUX's**
rather than a generic chatbot. An answer that can point at the room, the session and the minute is
evidence. One that can't is an opinion.

## Imports — `CitationCard` already exists in this directory

```tsx
import { CitationCard, type CitationCardProps } from './CitationCard';
```

Read that file before writing. Use its prop type exactly as declared; do not redeclare it.

## The file

Doc comment:

```tsx
/**
 * A coaching answer and the sources behind it.
 *
 * The sources are not a footnote — they are the product. Part of the expo corpus
 * has session boundaries derived from a printed agenda's clock, and those drift,
 * so a source can only be as confident as its own attribution. `CitationCard`
 * enforces that; this component must not summarise the sources in a way that
 * launders an approximate one into a confident claim.
 */
```

Props:

```tsx
export interface CoachAnswerProps {
  /** The question, shown above the answer. */
  question: string;
  /** The answer, already split into paragraphs by the caller. */
  paragraphs: readonly string[];
  sources: readonly CitationCardProps[];
  className?: string;
}
```

Component `CoachAnswer` renders, in this order:

1. The question block:
   ```tsx
   <div className="card b-cite">
     <span className="eyebrow">The question</span>
     <p className="b-coach-question">{question}</p>
   </div>
   ```
2. The answer block: a `<div className="card spined">` containing `<div className="rail brand" />`
   and a `<div className="body">` holding `<span className="eyebrow">The answer</span>` followed by
   one `<p className="b-coach-para">` per entry in `paragraphs`, keyed by index.
3. `<h2>Where this came from</h2>`
4. One `CitationCard` per entry in `sources`, spreading the entry's props and keying on its
   `title` plus `meta`.

Root: `<section className={['b-coach', className].filter(Boolean).join(' ')} data-testid="coach-answer">`.

**Empty sources is a hard case, not a cosmetic one.** When `sources.length === 0`, render the
question and the answer as normal, then instead of the sources heading render exactly:

```tsx
<p className="b-cite-caution">No source in the library supports this answer. Treat it as opinion.</p>
```

That line is required and its wording is exact. An answer with nothing behind it must say so.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/CoachAnswer.tsx`
- Do NOT create or modify any other file. Do NOT edit `index.ts`, any `.css` file, or `CitationCard`.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/ui`
  reports zero errors naming this file; the file exports `CoachAnswerProps` and `CoachAnswer`; it
  renders `CitationCard`; it contains the string `Treat it as opinion`; and it returns JSX.
- Declare it as `export function CoachAnswer({...}: CoachAnswerProps)`. **Do NOT use `React.FC`.**
- No `any`. No `useState`. No `style={{...}}`. No default export.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
