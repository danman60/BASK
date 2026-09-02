# inspection-slipping-table-labels

## What to build

Write a complete replacement candidate for SlippingList.tsx. Preserve its exported interfaces, rendering behavior, copy, callbacks, empty state, class names, and table semantics. Add the minimum semantic cell labeling needed for CSS to reflow every mobile data row into a readable stacked layout without inventing labels in CSS and without changing desktop content. Use the existing section data-testid as the surface discriminator. Do not add business logic or new dependencies.

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/packages/ui/src/components/SlippingList.visual.tsx`

## The API surface you may use

Everything below is REAL and already exists. Import from `./SlippingList`.
Do NOT invent names, keys or props that are not in this list — inventing a key
on the shared style object is the single most common way this task fails.

```ts
CONTRACT API SURFACE — `@/lib/contract` exports EXACTLY these. Nothing else exists.
Do NOT reference any symbol or object key that is not on this list.

functions:
  SlippingList({ rows, onDraft, className }: SlippingListProps)

interfaces: SlippingRow, SlippingListProps
```
## Follow this exemplar exactly

This file is the approved reference for how this kind of component is written
and styled in this project. Match its structure, its class vocabulary and its
conventions. Deviating from its visual vocabulary is a failure even if the code
compiles.

```tsx
import { BandChip, type PositionBand } from './BandChip';

/**
 * You against the cohort, per category.
 *
 * Units, not dollars, by default: the client asked the question in units ("35
 * against 22") and units survive price differences between salons. The caller
 * decides what the unit is and says so in `unitNote`.
 *
 * `ComparisonCard` covers the two-sided named comparison; this is the many-row
 * ranked table, which is a different shape.
 */
export interface CohortRow {
  category: string;
  /** This salon's figure. Already rounded by the caller. */
  you: number;
  /** The cohort median for the same figure. */
  median: number;
  position: PositionBand;
}

export interface CohortTableProps {
  rows: readonly CohortRow[];
  /** e.g. "Units per 100 customers, July 2026." Sits under the table. */
  unitNote?: string;
  className?: string;
}

export function CohortTable({ rows, unitNote, className }: CohortTableProps) {
  if (rows.length === 0) {
    return (
      <section className={['card', className].filter(Boolean).join(' ')} data-testid="cohort-table">
        <p className="b-dtable-empty">Not enough salons in this cohort to compare yet.</p>
      </section>
    );
  }

  return (
    <section className={['card', className].filter(Boolean).join(' ')} data-testid="cohort-table">
      <table className="b-dtable">
        <thead>
          <tr>
            <th>Category</th>
            <th className="num">You</th>
            <th className="num">Cohort median</th>
            <th>Position</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.category}>
              <td>{row.category}</td>
              <td className="num">{row.you.toLocaleString()}</td>
              <td className="num">{row.median.toLocaleString()}</td>
              <td><BandChip band={row.position} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {unitNote && <p className="b-metric-sub">{unitNote}</p>}
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

1. `/home/danman60/projects/uvalux-platform/packages/ui/src/components/SlippingList.visual.tsx` exists and is complete.
2. It imports what it uses from `./SlippingList`.
3. `npx tsc --noEmit && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/packages/ui/src/components/CohortTable.tsx /home/danman60/projects/uvalux-platform/packages/ui/src/components/SlippingList.visual.tsx --contract /home/danman60/projects/uvalux-platform/packages/ui/src/components/SlippingList.tsx` passes with exit code 0.
4. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
