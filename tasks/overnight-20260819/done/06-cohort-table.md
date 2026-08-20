# TASK — CohortTable

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/CohortTable.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT.md` first**, and
follow its house style exactly.

Category by category: what this salon sells against what the cohort's median salon sells. This is
the client's own four-year-old idea — *"you sell 35 tanning lotion while the industry average is 22
— are you above or below? Scoreboard it."*

## Imports

```tsx
import { BandChip, type PositionBand } from './BandChip';
```

## The file

Doc comment:

```tsx
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
```

Types and props:

```tsx
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
```

Component `CohortTable`:

- root `<section>` with class list `['card', className]`, `data-testid="cohort-table"`
- a `<table className="b-dtable">`
- `<thead>`: `<th>Category</th>`, `<th className="num">You</th>`,
  `<th className="num">Cohort median</th>`, `<th>Position</th>`
- `<tbody>`: one `<tr key={row.category}>` per row:
  1. `<td>{row.category}</td>`
  2. `<td className="num">{row.you.toLocaleString()}</td>`
  3. `<td className="num">{row.median.toLocaleString()}</td>`
  4. `<td><BandChip band={row.position} /></td>`
- after the table, when `unitNote` is given:
  `<p className="b-metric-sub">{unitNote}</p>`
- **empty state:** when `rows.length === 0`, render the root section containing only
  `<p className="b-dtable-empty">Not enough salons in this cohort to compare yet.</p>` and no table.

That empty-state string is exact and it matters: cohorts below the minimum size are never shown,
because a benchmark computed from a handful of salons identifies them.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/CohortTable.tsx`
- Do NOT create or modify any other file. Do NOT edit `index.ts`. Do NOT edit any `.css` file.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/ui`
  reports zero errors naming this file; the file exports `CohortRow`, `CohortTableProps` and
  `CohortTable`; and it returns JSX.
- No `any`. No `useState`. No `style={{...}}`. No default export.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
