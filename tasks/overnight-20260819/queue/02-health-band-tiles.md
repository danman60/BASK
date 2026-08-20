# TASK — HealthBandTiles

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/HealthBandTiles.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT.md` first**, and
follow its house style exactly.

Three tiles across the top of the Customers screen: how many customers are healthy, slipping and
lapsed right now.

## Imports

Only these two:

```tsx
import type { HealthBand } from './BandChip';
```

(You do not need `BandChip` itself here — the tile shows the band word as its own heading.)

## The file

Doc comment:

```tsx
/**
 * The three health counts, across the top of the Customers screen.
 *
 * Counts arrive as props. This component does no scoring — `computeCustomerHealth`
 * in @bask/core owns that, and duplicating any part of it here would let the tiles
 * and the grid disagree about the same customer.
 */
```

Types and props:

```tsx
export interface HealthBandCount {
  band: HealthBand;
  count: number;
}

export interface HealthBandTilesProps {
  counts: readonly HealthBandCount[];
  className?: string;
}
```

Also export this constant, with these exact strings — they are the one-line explanations under each
count:

```tsx
export const BAND_NOTE: Record<HealthBand, string> = {
  healthy: 'Coming as often as they always have.',
  slipping: 'Quieter than their own normal. Still winnable.',
  lapsed: 'Gone long enough that it takes a real reason to return.',
};

export const BAND_HEADING: Record<HealthBand, string> = {
  healthy: 'Healthy',
  slipping: 'Slipping',
  lapsed: 'Lapsed',
};
```

Component `HealthBandTiles`:

- root `<div>` with class list `['b-bandtiles', className]`, `data-testid="health-band-tiles"`
- map over `counts`. For each one render:
  ```tsx
  <div className="card b-bandtile" data-band={c.band} key={c.band} data-testid="health-band-tile">
    <div className="b-bandtile-rail" />
    <div className="b-bandtile-body">
      <div className="b-bandtile-count num">{c.count.toLocaleString()}</div>
      <div className="b-bandtile-label">{BAND_HEADING[c.band]}</div>
      <p className="b-bandtile-note">{BAND_NOTE[c.band]}</p>
    </div>
  </div>
  ```

Nothing else. No totals row, no percentages, no sorting — render `counts` in the order given.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/HealthBandTiles.tsx`
- Do NOT create or modify any other file. Do NOT edit `index.ts`. Do NOT edit any `.css` file.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/ui`
  reports zero errors naming this file; the file exports `HealthBandCount`, `HealthBandTilesProps`,
  `BAND_NOTE`, `BAND_HEADING` and `HealthBandTiles`; and it returns JSX.
- No `any`. No `useState`. No `style={{...}}`. No default export.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
