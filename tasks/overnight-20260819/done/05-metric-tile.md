# TASK — MetricTile

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/MetricTile.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT.md` first**, and
follow its house style exactly.

One headline number on the Scoreboard, with where it sits against the cohort. Four of these across
the top of the page.

## Imports

```tsx
import type { ReactNode } from 'react';
import { BandChip, type PositionBand } from './BandChip';
```

## The file

Doc comment:

```tsx
/**
 * One benchmarked headline number.
 *
 * The position chip is the point — a number on its own tells an owner nothing,
 * and every metric on this screen exists to answer "am I above or below?".
 * `StatRow` covers the un-benchmarked label/value case; use that instead when
 * there is no cohort to compare against.
 */
```

Props:

```tsx
export interface MetricTileProps {
  /** Short uppercase label, e.g. "Revenue per session". */
  label: string;
  /** The formatted value, e.g. "$14.80". Formatting belongs to the caller. */
  value: ReactNode;
  position: PositionBand;
  /** Optional line under the chip, e.g. "Cohort median $13.20". */
  sub?: string;
  className?: string;
}
```

Component `MetricTile`:

```tsx
<div className={['card', 'b-metric', className].filter(Boolean).join(' ')} data-testid="metric-tile">
  <div className="b-metric-label">{label}</div>
  <div className="b-metric-value num">{value}</div>
  <BandChip band={position} />
  {sub ? <div className="b-metric-sub">{sub}</div> : null}
</div>
```

That is the whole component.

Also export a small wrapper that lays four of them out in a row:

```tsx
export interface MetricRowProps {
  children: ReactNode;
  className?: string;
}

export function MetricRow({ children, className }: MetricRowProps) {
  return (
    <div className={['b-metrics', className].filter(Boolean).join(' ')} data-testid="metric-row">
      {children}
    </div>
  );
}
```

`MetricRow` does nothing but apply the grid class. It does not count, validate or clone children.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/MetricTile.tsx`
- Do NOT create or modify any other file. Do NOT edit `index.ts`. Do NOT edit any `.css` file.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/ui`
  reports zero errors naming this file; the file exports `MetricTileProps`, `MetricTile`,
  `MetricRowProps` and `MetricRow`; and it returns JSX.
- No `any`. No `useState`. No `style={{...}}`. No default export.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
