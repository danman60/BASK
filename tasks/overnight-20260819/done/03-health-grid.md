# TASK — HealthGrid

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/HealthGrid.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT.md` first**, and
follow its house style exactly.

Every customer as one small square, coloured by health band. The whole book at a glance — this is
the screen the client reacted to when it was described as a Sims-style grid.

## Imports

```tsx
import { BandChip, type HealthBand } from './BandChip';
```

## The file

Doc comment:

```tsx
/**
 * Every customer as one square, coloured by band.
 *
 * Deliberately not a chart. The point is that an owner sees the shape of their
 * whole book in one glance and can tell that the amber is spreading before any
 * number tells them.
 */
```

Types and props:

```tsx
export interface HealthGridCell {
  id: string;
  band: HealthBand;
  /** Shown as the square's tooltip. Usually the customer's name. */
  title: string;
}

export interface HealthGridProps {
  cells: readonly HealthGridCell[];
  /** Sits above the grid. Defaults to the line below. */
  caption?: string;
  className?: string;
}
```

Export the default caption as a named constant, with this exact string:

```tsx
export const HEALTH_GRID_CAPTION = 'Each square is one customer. Warmer means longer since their last visit.';
```

Component `HealthGrid`:

- root `<section>` with class list `['card', 'b-healthgrid-wrap', className]`,
  `data-testid="health-grid"`
- first child: `<p className="b-healthgrid-caption">{caption ?? HEALTH_GRID_CAPTION}</p>`
- then the grid: `<div className="b-healthgrid">` containing one `<span>` per cell:
  ```tsx
  <span
    key={cell.id}
    className="b-healthgrid-cell"
    data-band={cell.band}
    title={cell.title}
  />
  ```
- then a legend: `<div className="b-healthgrid-legend">` containing three `BandChip` elements, in
  this order: `<BandChip band="healthy" />`, `<BandChip band="slipping" />`,
  `<BandChip band="lapsed" />`
- **empty state:** if `cells.length === 0`, render the root and caption as normal but replace the
  grid and legend with a single
  `<p className="b-dtable-empty">No customers yet.</p>`

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/HealthGrid.tsx`
- Do NOT create or modify any other file. Do NOT edit `index.ts`. Do NOT edit any `.css` file.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/ui`
  reports zero errors naming this file; the file exports `HealthGridCell`, `HealthGridProps`,
  `HEALTH_GRID_CAPTION` and `HealthGrid`; and it returns JSX.
- No `any`. No `useState`. No `style={{...}}`. No default export.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
