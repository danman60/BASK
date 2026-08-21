/**
 * A staff challenge — friendly competition on one metric.
 *
 * Bars are progress toward a personal target, never a leaderboard rank; the
 * point is coaching, and a bar that reads "behind" should still look like an
 * invitation. Progress caps at 100% visually even when someone beats target.
 */
import type { StaffChallengeAction } from '@bask/core';

export interface StaffChallengeCardProps {
  action: StaffChallengeAction;
  /** Fired when the start button is pressed. Omit for an already-running challenge. */
  onStart?: () => void;
  className?: string;
}

export function StaffChallengeCard({ action, onStart, className }: StaffChallengeCardProps) {
  return (
    <div className={['card', 'b-chal', className].filter(Boolean).join(' ')} data-testid="staff-challenge-card">
      <div className="b-chal-name">{action.name}</div>
      <div className="b-chal-meta">{action.metric} · {action.days} days</div>
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
      {onStart && (
        <button type="button" className="b-approve" onClick={onStart} data-testid="challenge-start">
          Start the challenge
        </button>
      )}
    </div>
  );
}