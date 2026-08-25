/**
 * Team performance from monitored conversations.
 *
 * The flag column is a coaching suggestion, not a demerit — it names the
 * skill to work on, and it is the row's only judgement. Framing rule from the
 * brainstorm: identifying best practices and staffing, never surveillance.
 *
 * MEASURED BUG: This component renders a bare seven-column table. A table cannot
 * shrink below the width its columns need. Measured on the live site at a 390px
 * viewport, this table is 616px wide, which forces the whole page to 618px
 * and makes every card on the Monitor screen clip its text at the right edge.
 * Setting display:block on the table was tried and makes it worse — it destroys
 * table layout. The correct fix is a wrapper element that scrolls.
 *
 * The table scrolls inside its own box so the page never scrolls sideways,
 * and the wrapper is what makes that possible rather than any change to the table itself.
 */

import type { EmployeeSalesStats } from '@bask/core';

export interface EmployeeSalesTableProps {
  employees: EmployeeSalesStats[];
  className?: string;
}

export function EmployeeSalesTable({ employees, className }: EmployeeSalesTableProps) {
  return (
    <div
      className="b-etable-scroll"
      role="region"
      aria-label="Employee sales performance table"
      tabIndex={0}
    >
      <table
        className={['b-etable', className].filter(Boolean).join(' ')}
        data-testid="employee-sales-table"
      >
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
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.name}>
              <td>
                {emp.name} <span>{emp.role}</span>
              </td>
              <td className="num">{emp.interactions}</td>
              <td className="num">{emp.membershipMentions}</td>
              <td className="num">{emp.conversions}</td>
              <td className="num">{emp.attachmentPct}%</td>
              <td>
                <span
                  data-trend={emp.trend}
                >
                  {emp.trend === 'up'
                    ? '▲ improving'
                    : emp.trend === 'down'
                    ? '▼ slipping'
                    : '— steady'}
                </span>
              </td>
              <td>
                {emp.flag ? (
                  <span>{emp.flag}</span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}