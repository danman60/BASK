# TASK — CitationCard

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/CitationCard.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT.md` first**, and
follow its house style exactly.

Where a coaching answer came from: which room, which session, which minute — and how confident we
are that the session is the one we say it is.

**This component is the reason the knowledge base is UVALUX's and not a generic chatbot.** An answer
that can point at the recording is evidence; one that can't is an opinion.

## Imports

```tsx
import { BandChip, type CitationBand } from './BandChip';
```

## The file

Doc comment:

```tsx
/**
 * One source behind a coaching answer.
 *
 * `confidence` is not decoration. Expo sessions whose boundaries were derived
 * from the printed agenda's clock drift — one such slice put "The Power of
 * Numbers" over a different speaker entirely. So an `approximate` citation shows
 * the room and timestamp, which are exact, and must never present the speaker's
 * name as if it were confirmed. A confident wrong attribution is worse than none.
 */
```

Types and props:

```tsx
export interface CitationCardProps {
  /** The session title, or the room when confidence is 'approximate'. */
  title: string;
  /** e.g. "Room B · Owners & managers · 2026 Expo · from 3h37m". */
  meta: string;
  /** The quoted passage, verbatim from the transcript. */
  quote: string;
  confidence: CitationBand;
  /** Shown only when confidence is 'approximate'. Defaults to the line below. */
  caution?: string;
  className?: string;
}
```

Export the default caution line as a named constant, with this exact string:

```tsx
export const APPROXIMATE_CAUTION =
  'Session attribution here is placed by the clock, so we cite the room and the timestamp rather than a speaker.';
```

Component `CitationCard`:

```tsx
<article className={['card', 'b-cite', className].filter(Boolean).join(' ')} data-testid="citation-card">
  <div className="b-cite-title">{title}</div>
  <div className="b-cite-meta">{meta}</div>
  <BandChip band={confidence} />
  <blockquote className="b-cite-quote">{quote}</blockquote>
  {confidence === 'approximate' ? (
    <p className="b-cite-caution">{caution ?? APPROXIMATE_CAUTION}</p>
  ) : null}
</article>
```

The caution paragraph renders **only** when `confidence === 'approximate'`. Do not render it for
`confirmed`, and do not render it always with different text.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/CitationCard.tsx`
- Do NOT create or modify any other file. Do NOT edit `index.ts`. Do NOT edit any `.css` file.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/ui`
  reports zero errors naming this file; the file exports `CitationCardProps`,
  `APPROXIMATE_CAUTION` and `CitationCard`; it returns JSX; and it contains the string
  `confidence === 'approximate'`.
- No `any`. No `useState`. No `style={{...}}`. No default export.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
