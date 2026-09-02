# TASK — ListenerStatusCard

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/ListenerStatusCard.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first**, and
follow its house style exactly.

The Front Desk Listener device tile: online dot, animated audio bars, today's counts, and the
consent line. Pattern borrowed from the REFLECT room-node device panel.

## The file

Start with this doc comment:

```tsx
/**
 * The listener device tile — proof the monitor is alive, and on whose terms.
 *
 * The audio bars are pure CSS animation (no audio is processed anywhere in
 * this codebase); they exist so the surface reads as listening rather than as
 * a report about listening. The consent line renders on the tile itself, not
 * in a settings page — visibility is the licence.
 */
```

Imports, exactly:

```tsx
import type { ListenerStatus } from '@bask/core';
```

Props:

```tsx
export interface ListenerStatusCardProps {
  status: ListenerStatus;
  className?: string;
}
```

Component `export function ListenerStatusCard({ status, className }: ListenerStatusCardProps)`.

Root: `<div className={['card', 'b-listener', className].filter(Boolean).join(' ')} data-testid="listener-status-card">`.

Inside, in this order:

1. Header row:

```tsx
<div className="b-listener-head">
  <span className="b-listener-dot" data-on={status.online ? 'true' : 'false'} aria-hidden="true" />
  <span className="b-listener-name">{status.deviceName}</span>
  <div className="b-listener-bars" aria-hidden="true">
    <span className="b-listener-bar" />
    <span className="b-listener-bar" />
    <span className="b-listener-bar" />
    <span className="b-listener-bar" />
    <span className="b-listener-bar" />
  </div>
</div>
```

2. Stats row, using the existing `StatRow` pattern is NOT wanted here — write three plain stats:

```tsx
<div className="b-listener-stats">
  <div className="b-metric">
    <div className="b-metric-value num">{status.interactionsToday}</div>
    <div className="b-metric-label">conversations today</div>
  </div>
  <div className="b-metric">
    <div className="b-metric-value num">{status.uptimeDays}</div>
    <div className="b-metric-label">days running</div>
  </div>
  <div className="b-metric">
    <div className="b-metric-value">{status.location}</div>
    <div className="b-metric-label">location</div>
  </div>
</div>
```

3. `<p className="b-pledge-line">{status.consentNote}</p>`

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/ListenerStatusCard.tsx`
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` in `packages/ui` reports zero errors naming this file, and the file
  exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
