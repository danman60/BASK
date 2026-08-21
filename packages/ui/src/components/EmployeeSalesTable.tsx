/**
 * Team performance from monitored conversations.
 *
 * The flag column is a coaching suggestion, not a demerit — it names the
 * skill to work on, and it is the row's only judgement. Framing rule from the
 * brainstorm: identifying best practices and staffing, never surveillance.
 */

import type { EmployeeSalesStats } from '@bask/core';

export interface EmployeeSalesTableProps {
  employees: EmployeeSalesStats[];
  className?: string;
}

export function EmployeeSalesTable({ employees, className }: EmployeeSalesTableProps) {
  return (
    <table className={['b-etable', className].filter(Boolean).join(' ')} data-testid="employee-sales-table">
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
    </table>
  );
}