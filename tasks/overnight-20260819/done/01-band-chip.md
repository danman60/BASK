# TASK — BandChip

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/BandChip.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT.md` first**, and
follow its house style exactly.

This is the **only status pill in the product**. Six other components import it. It owns the shared
band types, so get the type names and the string values exactly right.

## The file

Start with this doc comment:

```tsx
/**
 * The one status pill.
 *
 * Three vocabularies share one component on purpose: customer health, benchmark
 * position, and knowledge-citation confidence all render the same shape, and the
 * moment there are two pill components they drift. `ImpactChip` is not a
 * substitute — it is two-tone (cost/opportunity) and cannot carry four positions.
 *
 * Colour comes from `data-band` in health.css. Never pass a style prop.
 */
```

Then export these types, verbatim:

```tsx
export type HealthBand = 'healthy' | 'slipping' | 'lapsed';
export type PositionBand = 'top' | 'above' | 'below' | 'bottom';
export type CitationBand = 'confirmed' | 'approximate';
export type ChipBand = HealthBand | PositionBand | CitationBand;
```

Then export a constant mapping every band to its visible label, with these exact strings:

```tsx
export const BAND_LABEL: Record<ChipBand, string> = {
  healthy: 'Healthy',
  slipping: 'Slipping',
  lapsed: 'Lapsed',
  top: 'Top quartile',
  above: 'Above median',
  below: 'Below median',
  bottom: 'Bottom quartile',
  confirmed: 'Confirmed',
  approximate: 'Approximate',
};
```

Then the props interface and the component:

```tsx
export interface BandChipProps {
  band: ChipBand;
  /** Overrides the default label. Use only when the row already says the word. */
  label?: string;
  className?: string;
}
```

`BandChip` returns a single `<span>`:
- `className` is `['b-band', className].filter(Boolean).join(' ')`
- `data-band={band}`
- `data-testid="band-chip"`
- its text content is `label ?? BAND_LABEL[band]`

That is the whole component. It has no other markup, no wrapper, no icon.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/BandChip.tsx`
- Do NOT create or modify any other file. Do NOT edit `index.ts`. Do NOT edit any `.css` file.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/ui`
  reports zero errors naming this file; the file exports `HealthBand`, `PositionBand`,
  `CitationBand`, `ChipBand`, `BAND_LABEL`, `BandChipProps` and `BandChip`; and it returns JSX.
- No `any`. No `useState`. No `style={{...}}`. No default export.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
