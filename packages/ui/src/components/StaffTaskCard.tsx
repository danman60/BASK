/**
 * A frontline task — what the team should do today, in one glance.
 *
 * Customers render as chips, not a table: staff scan names between walk-ins.
 * The target is a number of conversations, never a quota of sales — coaching,
 * not surveillance.
 */
import type { StaffTaskAction } from '@bask/core';

export interface StaffTaskCardProps {
  action: StaffTaskAction;
  className?: string;
}

export function StaffTaskCard({ action, className }: StaffTaskCardProps) {
  return (
    <div className={['card', 'b-stask', className].filter(Boolean).join(' ')} data-testid="staff-task-card">
      <div className="b-stask-goal">{action.goal}</div>
      <div className="b-stask-target">{action.target}</div>
      <ul className="b-stask-list">
        {action.customers.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
