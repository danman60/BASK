# TASK — ScoreboardSection

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/ScoreboardSection.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT.md` first**, and
follow its house style exactly.

## What this is

The composed Scoreboard screen: four benchmarked headline numbers and the category table. It
**composes components that already exist** and reimplements none of them.

This is the client's four-year-old idea — *"you sell 35 tanning lotion while the industry average is
22 — are you above or below? Scoreboard it."*

## Imports — both already exist in this directory

```tsx
import { MetricTile, MetricRow } from './MetricTile';
import { CohortTable, type CohortRow } from './CohortTable';
import type { PositionBand } from './BandChip';
```

Read those files before writing. Use their exported prop types exactly as declared.

## The file

Doc comment:

```tsx
/**
 * The Scoreboard screen, composed.
 *
 * Every figure arrives formatted: percentile maths lives in the server's peers
 * module, not here. A component that recomputes a rank will eventually disagree
 * with the one that produced it.
 */
```

Types and props:

```tsx
export interface ScoreboardMetric {
  label: string;
  value: string;
  position: PositionBand;
  /** e.g. "Cohort median $13.20". */
  sub?: string;
}

export interface ScoreboardSectionProps {
  /** Rank line, already formatted, e.g. "14th of 287". */
  rankLabel: string;
  metrics: readonly ScoreboardMetric[];
  rows: readonly CohortRow[];
  /** e.g. "Units per 100 customers, July 2026." */
  unitNote?: string;
  className?: string;
}
```

Component `ScoreboardSection` renders, in this order:

1. Header:
   ```tsx
   <header className="b-section-head">
     <span className="eyebrow">Scoreboard</span>
     <h1 className="page-h1">You rank <em>{rankLabel}</em> Canadian salons</h1>
     <p className="page-sub">
       Compared with salons of similar size across Canada. Updated monthly from what you buy
       and what you report.
     </p>
   </header>
   ```
2. A `MetricRow` containing one `MetricTile` per entry in `metrics`, keyed on `label`, passing
   `label`, `value`, `position` and `sub` straight through.
3. `<h2>Where you sit, category by category</h2>`
4. `<CohortTable rows={rows} unitNote={unitNote} />`

Root: `<section className={['b-scoreboard-section', className].filter(Boolean).join(' ')} data-testid="scoreboard-section">`.

Do not add a fifth metric, a chart, a total row, or any figure not passed in as a prop.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/ScoreboardSection.tsx`
- Do NOT create or modify any other file. Do NOT edit `index.ts`, any `.css` file, or the components
  you import.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/ui`
  reports zero errors naming this file; the file exports `ScoreboardMetric`,
  `ScoreboardSectionProps` and `ScoreboardSection`; it renders `MetricRow`, `MetricTile` and
  `CohortTable`; and it returns JSX.
- Declare it as `export function ScoreboardSection({...}: ScoreboardSectionProps)`.
  **Do NOT use `React.FC`.**
- No `any`. No `useState`. No `style={{...}}`. No default export.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
