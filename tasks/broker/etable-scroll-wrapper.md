# etable-scroll-wrapper

## What to build

Fix a MEASURED mobile layout bug in an existing component. Keep every existing prop, class name, data-testid, column and cell exactly as they are — this is a wrapper change only, not a redesign.

THE MEASURED BUG (state it in the file header): this component renders a bare seven-column table. A table cannot shrink below the width its columns need. Measured on the live site at a 390px viewport, this table is 616px wide, which forces the whole page to 618px and makes every card on the Monitor screen clip its text at the right edge. Setting display:block on the table was tried and makes it worse — it destroys table layout. The correct fix is a wrapper element that scrolls.

WHAT TO CHANGE — exactly this and nothing else:
Wrap the existing <table> in a single <div> whose className is 'b-etable-scroll'. Everything currently inside the table stays byte-for-byte identical: same columns, same cells, same classNames, same data-testid on the table, same props interface, same imports.

The wrapper needs an accessible name and keyboard access, because a scrollable region that a keyboard user cannot reach is a new bug replacing an old one. Give the div role='region', an aria-label naming what it contains in plain words, and tabIndex={0}.

Add a doc comment above the wrapper, one or two sentences, explaining that the table scrolls inside its own box so the page never scrolls sideways, and that the wrapper is what makes that possible rather than any change to the table itself.

Do not modify any other file. Do not add a default export. Do not rename anything. Do not add CSS — the stylesheet is handled separately.

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/packages/ui/src/components/EmployeeSalesTable.tsx`

## The API surface you may use

Everything below is REAL and already exists. Import from `@bask/core`.
Do NOT invent names, keys or props that are not in this list — inventing a key
on the shared style object is the single most common way this task fails.

```ts
CONTRACT API SURFACE — `@/lib/contract` exports EXACTLY these. Nothing else exists.
Do NOT reference any symbol or object key that is not on this list.

consts: MOMENT_KEYS, MOMENT_LABEL, INTERACTION_OUTCOMES, INTERACTION_OUTCOME_LABEL
types: MomentKey, MomentScores, InteractionOutcome
interfaces: ListenerStatus, TranscriptLine, SalesInteraction, EmployeeSalesStats, MonitorInsight, MonitorFixture

MOMENT_LABEL has EXACTLY these 5 keys: greeting, needs, product, membership, close

INTERACTION_OUTCOME_LABEL has EXACTLY these 4 keys: sale, membership, no_sale, missed_opportunity
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

1. `/home/danman60/projects/uvalux-platform/packages/ui/src/components/EmployeeSalesTable.tsx` exists and is complete.
2. It imports what it uses from `@bask/core`.
3. `npx tsc --noEmit -p packages/ui/tsconfig.json && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/packages/ui/src/components/CohortTable.tsx /home/danman60/projects/uvalux-platform/packages/ui/src/components/EmployeeSalesTable.tsx --contract /home/danman60/projects/uvalux-platform/packages/core/src/monitor/types.ts` passes with exit code 0.
4. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
