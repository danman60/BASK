# TASK — StaffChallengeCard

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/StaffChallengeCard.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first**, and
follow its house style exactly.

A staff challenge: the name, the metric, the length, and one progress bar per team member.

## The file

Start with this doc comment:

```tsx
/**
 * A staff challenge — friendly competition on one metric.
 *
 * Bars are progress toward a personal target, never a leaderboard rank; the
 * point is coaching, and a bar that reads "behind" should still look like an
 * invitation. Progress caps at 100% visually even when someone beats target.
 */
```

Imports, exactly:

```tsx
import type { StaffChallengeAction } from '@bask/core';
```

Props:

```tsx
export interface StaffChallengeCardProps {
  action: StaffChallengeAction;
  /** Fired when the start button is pressed. Omit for an already-running challenge. */
  onStart?: () => void;
  className?: string;
}
```

Component `export function StaffChallengeCard({ action, onStart, className }: StaffChallengeCardProps)`.

Root: `<div className={['card', 'b-chal', className].filter(Boolean).join(' ')} data-testid="staff-challenge-card">`.

Inside, in this order:

1. `<div className="b-chal-name">{action.name}</div>`
2. `<div className="b-chal-meta">{action.metric} · {action.days} days</div>`
3. One row per staff member:

```tsx
{action.staff.map((member) => {
  const pct = Math.min(100, Math.round((member.progress / member.target) * 100));
  const step = Math.round(pct / 10) * 10;
  return (
    <div className="b-chal-row" key={member.name}>
      <span className="b-chal-row-name">{member.name}</span>
      <div className="b-chal-bar">
        <div className="b-chal-fill" data-pct={step} />
      </div>
      <span className="b-chal-count num">
        {member.progress}/{member.target}
      </span>
    </div>
  );
})}
```

Note: the fill width cannot be an inline style (banned). The stylesheet defines widths for
`data-pct` values 0,10,20,…,100 — that is why `step` rounds to the nearest ten. Render
`data-pct={step}` exactly as shown. Do not add a `style` attribute.

4. When `onStart` is provided, the button:

```tsx
{onStart && (
  <button type="button" className="b-approve" onClick={onStart} data-testid="challenge-start">
    Start the challenge
  </button>
)}
```

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/StaffChallengeCard.tsx`
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` in `packages/ui` reports zero errors naming this file, and the file
  exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
