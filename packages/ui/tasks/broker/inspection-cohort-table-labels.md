# inspection-cohort-table-labels

## What to build

Write a complete replacement candidate for CohortTable.tsx. Preserve its exported interfaces, rendering behavior, copy, formatting, empty state, class names, and table semantics. Add the minimum semantic cell labeling needed for CSS to reflow every mobile data row into a readable stacked layout without inventing labels in CSS and without changing desktop content. Use the existing section data-testid as the surface discriminator. Do not add business logic or new dependencies.

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/packages/ui/src/components/CohortTable.visual.tsx`

## The API surface you may use

Everything below is REAL and already exists. Import from `./CohortTable`.
Do NOT invent names, keys or props that are not in this list — inventing a key
on the shared style object is the single most common way this task fails.

```ts
CONTRACT API SURFACE — `@/lib/contract` exports EXACTLY these. Nothing else exists.
Do NOT reference any symbol or object key that is not on this list.

functions:
  CohortTable({ rows, unitNote, className }: CohortTableProps)

interfaces: CohortRow, CohortTableProps
```
## Follow this exemplar exactly

This file is the approved reference for how this kind of component is written
and styled in this project. Match its structure, its class vocabulary and its
conventions. Deviating from its visual vocabulary is a failure even if the code
compiles.

```tsx
import { BandChip, type HealthBand } from './BandChip';

/**
 * Who to call today, and why.
 *
 * The `why` string is written by `healthReason` in @bask/core, not here — the
 * reason a customer is flagged has to match the score that flagged them, and a
 * second copy of that wording in the UI is how they drift apart.
 *
 * Built by hand after the local model's two attempts were rejected. Its output
 * was substantively right; it declared the component as `React.FC`, which this
 * package does not use anywhere and which references the React namespace without
 * importing it. Kept its markup, moved it to the house shape.
 */
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

export function SlippingList({ rows, onDraft, className }: SlippingListProps) {
  if (rows.length === 0) {
    return (
      <section
        className={['card', className].filter(Boolean).join(' ')}
        data-testid="slipping-list"
      >
        <p className="b-dtable-empty">Nobody needs a call today.</p>
      </section>
    );
  }

  return (
    <section
      className={['card', className].filter(Boolean).join(' ')}
      data-testid="slipping-list"
    >
      <table className="b-dtable">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Last visit</th>
            <th>Usually</th>
            <th>Band</th>
            <th>Why</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="b-dtable-who">{row.name}</td>
              <td>{row.lastVisit}</td>
              <td>{row.usual}</td>
              <td>
                <BandChip band={row.band} />
              </td>
              <td className="b-dtable-why">{row.why}</td>
              <td>
                {onDraft ? (
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => onDraft(row.id)}
                  >
                    Draft a note
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
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

1. `/home/danman60/projects/uvalux-platform/packages/ui/src/components/CohortTable.visual.tsx` exists and is complete.
2. It imports what it uses from `./CohortTable`.
3. `npx tsc --noEmit && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/packages/ui/src/components/SlippingList.tsx /home/danman60/projects/uvalux-platform/packages/ui/src/components/CohortTable.visual.tsx --contract /home/danman60/projects/uvalux-platform/packages/ui/src/components/CohortTable.tsx` passes with exit code 0.
4. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
