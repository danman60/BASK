# TASK — SlippingList

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/SlippingList.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT.md` first**, and
follow its house style exactly.

The worklist: the customers worth a call today, why each one, and a button to draft the note. This
is the screen the client described as *"it's been 85 days since Daniel last spent — this is what he
generally likes."*

## Imports

```tsx
import { BandChip, type HealthBand } from './BandChip';
```

## The file

Doc comment:

```tsx
/**
 * Who to call today, and why.
 *
 * The `why` string is written by `healthReason` in @bask/core, not here — the
 * reason a customer is flagged has to match the score that flagged them, and a
 * second copy of that wording in the UI is how they drift apart.
 */
```

Types and props:

```tsx
export interface SlippingRow {
  id: string;
  name: string;
  band: HealthBand;
  /** e.g. "38 days ago" — already formatted by the caller. */
  lastVisit: string;
  /** e.g. "every 9 days" — the customer's own rhythm, already formatted. */
  usual: string;
  /** One sentence from `healthReason`. */
  why: string;
}

export interface SlippingListProps {
  rows: readonly SlippingRow[];
  /** Optional. When given, each row shows a draft button. */
  onDraft?: (id: string) => void;
  className?: string;
}
```

Component `SlippingList`:

- root `<section>` with class list `['card', className]`, `data-testid="slipping-list"`
- inside, a `<table className="b-dtable">`
- `<thead>` with one row of `<th>`: `Customer`, `Last visit`, `Usually`, `Band`, `Why`, and a final
  empty `<th />` for the button column
- `<tbody>`: one `<tr key={row.id}>` per row, cells in this order:
  1. `<td className="b-dtable-who">{row.name}</td>`
  2. `<td>{row.lastVisit}</td>`
  3. `<td>{row.usual}</td>`
  4. `<td><BandChip band={row.band} /></td>`
  5. `<td className="b-dtable-why">{row.why}</td>`
  6. a `<td>` containing, **only when `onDraft` is provided**,
     `<button type="button" className="btn btn-quiet" onClick={() => onDraft(row.id)}>Draft a note</button>`
- **empty state:** when `rows.length === 0`, render the root section containing only
  `<p className="b-dtable-empty">Nobody needs a call today.</p>` and no table at all.

The button text is exactly `Draft a note`. The empty-state text is exactly
`Nobody needs a call today.`

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/SlippingList.tsx`
- Do NOT create or modify any other file. Do NOT edit `index.ts`. Do NOT edit any `.css` file.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/ui`
  reports zero errors naming this file; the file exports `SlippingRow`, `SlippingListProps` and
  `SlippingList`; and it returns JSX.
- No `any`. No `useState`. No `style={{...}}`. No default export. `onClick` is the only handler.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
