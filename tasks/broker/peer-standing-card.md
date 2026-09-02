# peer-standing-card

## What to build

A compact rail card showing where this salon stands against salons it does NOT compete with. Presentational leaf: props in, markup out. No state, no effects, no data fetching, no arithmetic.

WHY IT EXISTS (state it in the header): this is a leaderboard that will not make anyone quit. It never shows a position in a list — no '47th of 60' — because an ordinal invites an argument and discourages the people who most need the advice. It shows a band and a gap, over a peer group that excludes anyone the owner competes with locally. It also always names one thing the salon is best at, because a card of nothing but shortfalls does not get looked at twice.

Import PositionBand from the contract file and use it — do not define your own band union, or the two will drift.

Define and export an interface StandingRow with readonly fields: label (string, what is measured in plain words), youLabel (string, ALREADY FORMATTED, e.g. '5.3%'), medianLabel (string, ALREADY FORMATTED), gapLabel (string, ALREADY FORMATTED with its sign, e.g. '+0.8 points'), band (PositionBand).

Define and export an interface PeerStandingCardProps with readonly fields: heading (string), peerCountLabel (string, ALREADY FORMATTED, e.g. 'against 23 salons like yours'), rows (readonly StandingRow[]), bestLabel (string | null — the one thing this salon leads on, already worded), and an optional className.

Export a function component PeerStandingCard.

WHAT IT RENDERS:
- a section with className 'card' plus a component class, and data-testid 'peer-standing-card'
- the heading, and directly under it the peerCountLabel in a quiet style. That line is doing real work — it tells the owner these are not their local rivals, which is the reason the card is not threatening.
- each row: its label, the salon's figure, the gap, and a band indicator. Use the existing BandChip vocabulary rather than inventing a new visual language for bands.
- when bestLabel is not null, a closing line calling it out as the thing they lead on.
- when rows is empty, a plain sentence saying there are not yet enough comparable salons to draw a comparison. Never render an empty card and never imply a rank that does not exist.

Every figure arrives pre-formatted — do not compute, round, or convert anything. Match the exemplar's class-naming convention, data-testid habit, comment density and grade-7 voice. No emoji, no inline styles, no colour values. Do not modify any other file. No default export.

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/packages/ui/src/components/PeerStandingCard.tsx`

## The API surface you may use

Everything below is REAL and already exists. Import from `./BandChip`.
Do NOT invent names, keys or props that are not in this list — inventing a key
on the shared style object is the single most common way this task fails.

```ts
CONTRACT API SURFACE — `@/lib/contract` exports EXACTLY these. Nothing else exists.
Do NOT reference any symbol or object key that is not on this list.

functions:
  BandChip({ band, label, className }: BandChipProps)

consts: BAND_LABEL
types: HealthBand, PositionBand, CitationBand, ChipBand
interfaces: BandChipProps

BAND_LABEL has EXACTLY these 9 keys: healthy, slipping, lapsed, top, above, below, bottom, confirmed, approximate
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

1. `/home/danman60/projects/uvalux-platform/packages/ui/src/components/PeerStandingCard.tsx` exists and is complete.
2. It imports what it uses from `./BandChip`.
3. `npx tsc --noEmit -p packages/ui/tsconfig.json && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/packages/ui/src/components/CohortTable.tsx /home/danman60/projects/uvalux-platform/packages/ui/src/components/PeerStandingCard.tsx --contract /home/danman60/projects/uvalux-platform/packages/ui/src/components/BandChip.tsx` passes with exit code 0.
4. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
