# CONTRACT — Opportunity Engine + Front Desk Monitor build (2026-08-21)

**Supervisor-written. Task zero. NOT dispatched to a model.**
Every task file references this. No task file redefines anything in it.

---

## Where files go

- UI components: `packages/ui/src/components/<Name>.tsx`, one file per task, beside the existing
  vocabulary (`InsightCard`, `BandChip`, `MetricTile`, `StatRow`, `ImpactChip`, `Sparkline`).
- Sections: `apps/web/src/components/today/` and `apps/web/src/components/monitor/`.
- Fixtures: `packages/core/src/opportunities/fixtures.ts`, `packages/core/src/monitor/fixtures.ts`.
- Docs: `promo/VO-SCRIPT-V3.md`, `promo/SHOT-PLAN-V3.md`.

**Do NOT edit `packages/ui/src/index.ts`.** Export wiring is the supervisor's job.
**Do NOT edit any `.css` file.** All styling already exists in
`packages/ui/src/components/opportunity.css` (plus `components.css`, `health.css`). Use the class
names your task dictates verbatim. If a class you want is missing, use the closest dictated one —
never invent one, never add `style={{...}}`.

## The shared types are ALREADY WRITTEN. Import, never redeclare.

- `@bask/core` exports the whole Opportunity vocabulary:
  `Opportunity`, `OpportunityAction`, `SmsAction`, `EmailAction`, `SocialAction`,
  `StaffTaskAction`, `FrontDeskScriptAction`, `StaffChallengeAction`, `UvaluxOrderAction`,
  `CoachingRequestAction`, `HandleItPlan`, `OpportunityOutcome`,
  `OPPORTUNITY_CATEGORY_LABEL`, `OPPORTUNITY_CONFIDENCE_LABEL`, `OPPORTUNITY_URGENCY_LABEL`.
- And the whole Monitor vocabulary:
  `ListenerStatus`, `SalesInteraction`, `TranscriptLine`, `MomentScores`, `MomentKey`,
  `MOMENT_KEYS`, `MOMENT_LABEL`, `EmployeeSalesStats`, `MonitorInsight`, `MonitorFixture`,
  `INTERACTION_OUTCOME_LABEL`.

In `packages/ui` components import from `@bask/core`. In `packages/core` fixture files import
from `./types` (relative). In `apps/web` sections import components from `@bask/ui` **only if the
task file says the export exists** — otherwise import from the component's file path given in the
task.

## House style — copy the existing components exactly

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
- Every component takes optional `className`, appended with `.filter(Boolean).join(' ')`.
- Every root element gets a kebab-case `data-testid`.
- **No `any`. No `useState`, no `useEffect`, no hand-written event logic.** Presentational only.
  Optional callback props are allowed and passed straight to `onClick`.
- `'use client'` must NOT be added.
- Numbers that align in a column get `className="num"`.
- Buttons: `className="btn"` (primary-ish) and `className="btn btn-ghost"` (secondary). The one
  exception is the approve button style `b-approve`, dictated where used.

## Voice

Grade-7 plain English. Money first. Never a metric without the thing to do about it. Any
user-facing string a task dictates is verbatim — do not paraphrase. Confidence is honest: the
product is allowed to say "Worth testing — not enough history yet."

## The demo world (use these numbers consistently in fixtures and doc comments)

**Sunset Ridge Tanning**, virtual clock **August 2026**. 1,412 customers — 986 healthy / 329
slipping / 97 lapsed. Cohort of 287 Canadian salons. Average member tenure 2.6 months vs cohort
median 3.1. Retail attachment 14% now vs 21% in the spring. Staff: **Maya** (front desk, strong),
**Jordan** (evenings, needs product coaching), **Priya** (part-time, new), **Tess** (manager).
Front-desk device: **"Front Desk Listener"**, online, 47 interactions today, 12 days uptime.
Never invent customer full names in monitor transcripts — customers are labels like
`Regular · visits 2×/week`.

## Reuse, do not rebuild

- `BandChip` exists and is the only status pill — but the opportunity confidence chip and the
  interaction outcome chip are dictated as plain `<span>`s with their own classes
  (`b-opp-conf`, `b-inter-outcome`) because their vocabularies are new. Do not extend `BandChip`.
- `StatRow`, `MetricTile`, `Sparkline`, `ImpactChip` exist — use them where the task says.
- `SlippingList`, `HealthGrid`, `CohortTable`, `CitationCard`, `CoachAnswer` exist from the
  previous build. Never rebuild them.

## RULES (every task, mandatory)

- Write exactly ONE file: the absolute path named in the task.
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` zero errors in the file's package, file exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
