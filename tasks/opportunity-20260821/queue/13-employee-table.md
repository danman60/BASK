# TASK — EmployeeSalesTable

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/EmployeeSalesTable.tsx`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first**, and
follow its house style exactly.

Per-employee sales performance from the monitored interactions: counts, conversion, attachment,
trend, and the coaching flag.

## The file

Start with this doc comment:

```tsx
/**
 * Team performance from monitored conversations.
 *
 * The flag column is a coaching suggestion, not a demerit — it names the
 * skill to work on, and it is the row's only judgement. Framing rule from the
 * brainstorm: identifying best practices and staffing, never surveillance.
 */
```

Imports, exactly:

```tsx
import type { EmployeeSalesStats } from '@bask/core';
```

Props:

```tsx
export interface EmployeeSalesTableProps {
  employees: EmployeeSalesStats[];
  className?: string;
}
```

Component `export function EmployeeSalesTable({ employees, className }: EmployeeSalesTableProps)`.

Root:
`<table className={['b-etable', className].filter(Boolean).join(' ')} data-testid="employee-sales-table">`.

Head:

```tsx
<thead>
  <tr>
    <th scope="col">Team member</th>
    <th scope="col">Conversations</th>
    <th scope="col">Memberships raised</th>
    <th scope="col">Said yes</th>
    <th scope="col">Retail attach</th>
    <th scope="col">Trend</th>
    <th scope="col">Coaching</th>
  </tr>
</thead>
```

Body — one row per employee:

```tsx
<tbody>
  {employees.map((emp) => (
    <tr key={emp.name}>
      <td>
        {emp.name} <span className="b-inter-cust">{emp.role}</span>
      </td>
      <td className="num">{emp.interactions}</td>
      <td className="num">{emp.membershipMentions}</td>
      <td className="num">{emp.conversions}</td>
      <td className="num">{emp.attachmentPct}%</td>
      <td>
        <span className="b-etable-trend" data-trend={emp.trend}>
          {emp.trend === 'up' ? '▲ improving' : emp.trend === 'down' ? '▼ slipping' : '— steady'}
        </span>
      </td>
      <td>{emp.flag ? <span className="b-etable-flag">{emp.flag}</span> : null}</td>
    </tr>
  ))}
</tbody>
```

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/ui/src/components/EmployeeSalesTable.tsx`
- Do NOT create or modify any other file.
- Acceptance: `tsc --noEmit` in `packages/ui` reports zero errors naming this file, and the file
  exists and is non-empty.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
