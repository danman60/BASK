# TASK — MonitorInsightCard

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/MonitorInsightCard.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first**, and
follow its house style exactly.

A pattern the monitor found across many interactions, with its evidence count and the suggested
coaching move.

## The file

Start with this doc comment:

```tsx
/**
 * A coaching pattern found across conversations.
 *
 * One pattern, its evidence count, and one move. The knowledge line, when
 * present, points into the UVALUX corpus by room + timestamp — the citation
 * rule from the knowledge build applies here too: place, not person.
 */
```

Imports, exactly:

```tsx
import type { MonitorInsight } from '@bask/core';
```

Props:

```tsx
export interface MonitorInsightCardProps {
  insight: MonitorInsight;
  /** Fired when the coaching button is pressed. */
  onCoach?: () => void;
  className?: string;
}
```

Component `export function MonitorInsightCard({ insight, onCoach, className }: MonitorInsightCardProps)`.

Root: `<div className={['card', 'b-mon-insight', className].filter(Boolean).join(' ')} data-testid="monitor-insight-card">`.

Inside, in this order:

1. `<div className="b-mon-pattern">{insight.pattern}</div>`
2. `<div className="b-mon-evidence">Heard in {insight.evidenceCount} conversations</div>`
3. `<p className="b-mon-suggestion">{insight.suggestion}</p>`
4. Only when `insight.knowledgeRef` is set:
   `{insight.knowledgeRef && <div className="b-mon-evidence">UVALUX training: {insight.knowledgeRef}</div>}`
5. The button:

```tsx
<button type="button" className="btn btn-ghost" onClick={onCoach} data-testid="monitor-coach">
  Plan the coaching
</button>
```

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/MonitorInsightCard.tsx`
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` in `packages/ui` reports zero errors naming this file, and the file
  exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
