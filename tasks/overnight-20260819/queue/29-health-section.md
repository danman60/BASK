# TASK — CustomerHealthSection

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/CustomerHealthSection.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT.md` first**, and
follow its house style exactly.

## What this is

The composed Customers screen: the three band counts, the grid, and the worklist, in one component
that a page can drop in. It **composes components that already exist** — it does not reimplement any
of them.

## Imports — all three already exist in this directory

```tsx
import { HealthBandTiles, type HealthBandCount } from './HealthBandTiles';
import { HealthGrid, type HealthGridCell } from './HealthGrid';
import { SlippingList, type SlippingRow } from './SlippingList';
```

Read those three files before writing. Use their exported prop types exactly as declared; do not
redeclare them and do not widen them.

## The file

Doc comment:

```tsx
/**
 * The Customers screen, composed.
 *
 * Presentation only: counts, cells and rows are all computed upstream by
 * `computeCustomerHealth` in @bask/core. If this component ever starts deciding
 * which band a customer is in, the tiles and the grid will disagree with each
 * other about the same person.
 */
```

Props:

```tsx
export interface CustomerHealthSectionProps {
  counts: readonly HealthBandCount[];
  cells: readonly HealthGridCell[];
  rows: readonly SlippingRow[];
  /** Total customers, already formatted, e.g. "1,412". */
  totalLabel: string;
  /** How many are slipping, already formatted, e.g. "329". */
  slippingLabel: string;
  onDraft?: (id: string) => void;
  className?: string;
}
```

Component `CustomerHealthSection` renders, in this order:

1. A header block:
   ```tsx
   <header className="b-section-head">
     <span className="eyebrow">Customers</span>
     <h1 className="page-h1">{totalLabel} customers. <em>{slippingLabel} are slipping.</em></h1>
     <p className="page-sub">
       Scored on how recently they came, how often they used to, and what they spend.
       Sorted so the ones worth a call today are at the top.
     </p>
   </header>
   ```
2. `<HealthBandTiles counts={counts} />`
3. `<h2>The grid</h2>`
4. `<HealthGrid cells={cells} />`
5. `<h2>Worth a call today</h2>`
6. `<SlippingList rows={rows} onDraft={onDraft} />`

Root element: `<section className={['b-health-section', className].filter(Boolean).join(' ')} data-testid="customer-health-section">`.

The two copy strings in the header are exactly as given. Do not add a fourth paragraph, a summary
line, or any figure not passed in as a prop.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/CustomerHealthSection.tsx`
- Do NOT create or modify any other file. Do NOT edit `index.ts`, any `.css` file, or the three
  components you import.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/ui`
  reports zero errors naming this file; the file exports `CustomerHealthSectionProps` and
  `CustomerHealthSection`; it renders `HealthBandTiles`, `HealthGrid` and `SlippingList`; and it
  returns JSX.
- Declare the component as `export function CustomerHealthSection({...}: CustomerHealthSectionProps)`.
  **Do NOT use `React.FC`** — this package does not use it anywhere, and it references the React
  namespace without importing it.
- No `any`. No `useState`. No `style={{...}}`. No default export.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
