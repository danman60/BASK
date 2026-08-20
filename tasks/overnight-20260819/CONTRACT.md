# CONTRACT — shared types, classes and copy for the real components

**Supervisor-written. Task zero. NOT dispatched to a model.**
Every task file references this. No task file redefines anything in it.

Its job is to stop seven independently-written components from disagreeing about band words, prop
shapes or class names — the one thing a per-file builder cannot see for itself.

---

## Where these go

`packages/ui/src/components/<Name>.tsx`, one file per task, beside the existing vocabulary
(`InsightCard`, `ComparisonCard`, `StatRow`, `ImpactChip`, `Sparkline`, `PulseCard`,
`EvidenceDrilldown`, `UndoToast`).

**Do NOT edit `packages/ui/src/index.ts`.** Wiring the exports up is the supervisor's task.
**Do NOT edit any `.css` file.** All styling already exists — see below.

## The CSS is already written. Use these class names verbatim.

`packages/ui/src/components/health.css` is supervisor-owned and already contains every class these
components need. Seven tasks editing one stylesheet would collide, so **no task writes CSS.**
If a class you want is not in the list below, use the closest one that is — do not invent one and
do not add a `style={{...}}` attribute.

## House style — copy the existing components exactly

Every component in this package follows the same shape. Match it:

```tsx
import type { ReactNode } from 'react';

export interface ThingProps {
  /* ...props... */
  className?: string;
}

export function Thing({ a, b, className }: ThingProps) {
  return (
    <div className={['card', 'b-thing', className].filter(Boolean).join(' ')} data-testid="thing">
      ...
    </div>
  );
}
```

- Named exports only. No default export.
- Every component takes an optional `className` and appends it with
  `.filter(Boolean).join(' ')`.
- Every root element gets a `data-testid` in kebab-case.
- Numbers that should align in a column get `className="num"`.
- **No `any`. No `useState`, no `useEffect`, no event handlers** — these are presentational. Data
  and behaviour arrive as props. Callbacks are allowed as optional props but are only passed to
  `onClick`; never write logic in the component.
- `'use client'` is **not** needed and must not be added.

## The band vocabulary — ONE chip, three vocabularies

`BandChip` (task 01) is the only status pill in the product. Everything else imports it. Nobody
hand-rolls a second one, and nobody re-styles it.

It renders `<span className="b-band" data-band={band}>` and the CSS colours it off `data-band`.

| vocabulary | `band` values | label shown |
|---|---|---|
| customer health | `healthy` · `slipping` · `lapsed` | `Healthy` · `Slipping` · `Lapsed` |
| benchmark position | `top` · `above` · `below` · `bottom` | `Top quartile` · `Above median` · `Below median` · `Bottom quartile` |
| citation confidence | `confirmed` · `approximate` | `Confirmed` · `Approximate` |

**The three health values are exactly the strings `CustomerHealthBand` already uses in
`@bask/core`** (`'healthy' | 'slipping' | 'lapsed'`). Do not capitalize them in the prop; capitalize
only the visible label.

## Types every task shares

These are declared **inside the component file that owns them** (named in each task) and imported by
the others. Copy the declaration verbatim into the owning file.

```ts
export type HealthBand = 'healthy' | 'slipping' | 'lapsed';
export type PositionBand = 'top' | 'above' | 'below' | 'bottom';
export type CitationBand = 'confirmed' | 'approximate';
export type ChipBand = HealthBand | PositionBand | CitationBand;
```

Owner: `BandChip.tsx` (task 01). Every other task imports what it needs from `./BandChip`.

## Reuse, do not rebuild

Anti-duplication was checked against `@bask/ui` before these tasks were written:

- **`ImpactChip` is NOT a substitute for `BandChip`** — it is two-tone (`cost` | `opportunity`) and
  cannot express three health bands or four benchmark positions. That is why `BandChip` is new.
- **`ComparisonCard` already does you-versus-them comparison** with named sides and a metric list.
  The tenure comparison reuses it. No task rebuilds it.
- **`StatRow`** already does label/value/whisper rows. Use it inside a card rather than writing rows.
- **`Sparkline`** already exists for trend marks.

## Voice

Grade-7 plain English, matching `packages/ui/src/guidance/guidance.ts`. Short sentences. Never a
metric without the thing to do about it — that is the product's premise. Any user-facing string a
task dictates is given verbatim in that task; do not paraphrase it.

## Numbers, when a task needs an example in a doc comment

One salon, one period, used consistently: **Sunset Ridge Tanning**, July 2026, cohort of **287**
Canadian salons, **1,412** unique customers, **986 healthy / 329 slipping / 97 lapsed**, RPS
**$14.80**, average member tenure **2.6 months** against a cohort median of **3.1**.
