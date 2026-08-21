# TASK — MonitorSurface

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/MonitorSurface.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first**, and
follow its house style exactly.

The whole Front Desk Monitor surface: listener tile and pledge in the rail, coaching patterns and
the interaction feed in the main column, team table across the bottom.

## The file

Start with this doc comment:

```tsx
/**
 * The Front Desk Monitor, composed.
 *
 * Reading order is the argument: what the monitor found (patterns), then the
 * evidence (conversations), then the team view. The device tile and the
 * consent pledge share the rail so "it is listening" and "here are the terms"
 * are never separated.
 */
```

Imports, exactly:

```tsx
import type { MonitorFixture } from '@bask/core';

import { ConsentPledgeCard } from './ConsentPledgeCard';
import { EmployeeSalesTable } from './EmployeeSalesTable';
import { InteractionCard } from './InteractionCard';
import { ListenerStatusCard } from './ListenerStatusCard';
import { MonitorInsightCard } from './MonitorInsightCard';
```

Props:

```tsx
export interface MonitorSurfaceProps {
  data: MonitorFixture;
  /** Fired with the insight id when a pattern's coaching button is pressed. */
  onCoach?: (insightId: string) => void;
  className?: string;
}
```

Component `export function MonitorSurface({ data, onCoach, className }: MonitorSurfaceProps)`.

Root: `<div className={['b-monitor', className].filter(Boolean).join(' ')} data-testid="monitor-surface">`.

Inside, in this order:

1. The two-column grid:

```tsx
<div className="b-monitor-grid">
  <div className="b-monitor-main">
    <h2 className="b-oppfeed-head">What the listener is hearing</h2>
    {data.insights.map((insight) => (
      <MonitorInsightCard
        key={insight.id}
        insight={insight}
        onCoach={onCoach ? () => onCoach(insight.id) : undefined}
      />
    ))}
    <h2 className="b-oppfeed-head">Today&apos;s conversations</h2>
    {data.interactions.map((interaction) => (
      <InteractionCard key={interaction.id} interaction={interaction} />
    ))}
  </div>
  <div className="b-monitor-rail">
    <ListenerStatusCard status={data.status} />
    <ConsentPledgeCard />
  </div>
</div>
```

2. The team table under the grid:

```tsx
<div className="card">
  <h2 className="b-oppfeed-head">The team, this week</h2>
  <EmployeeSalesTable employees={data.employees} />
</div>
```

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/MonitorSurface.tsx`
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` in `packages/ui` reports zero errors naming this file, and the file
  exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
- The five imported components are earlier tasks in this queue and will exist by the time your
  gate runs. Import them exactly as written; do not inline substitutes.
