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
  /**
   * Fired when the assign button is pressed. Omit to render the task read-only.
   * Same shape as `StaffChallengeCard.onStart`: the button only exists when a
   * caller can do something with the press, so no surface shows a dead control.
   */
  onAssign?: () => void;
  className?: string;
}

export function StaffTaskCard({ action, onAssign, className }: StaffTaskCardProps) {
  return (
    <div className={['card', 'b-stask', className].filter(Boolean).join(' ')} data-testid="staff-task-card">
      <div className="b-stask-goal">{action.goal}</div>
      <div className="b-stask-target">{action.target}</div>
      <ul className="b-stask-list">
        {action.customers.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      {onAssign && (
        <button type="button" className="b-approve" onClick={onAssign} data-testid="staff-task-assign">
          Put this on today&rsquo;s list
        </button>
      )}
    </div>
  );
}
