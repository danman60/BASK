/**
 * "Handle it" — the delegation surface.
 *
 * The plan is shown whole (audience, offer, copy, schedule) so approval is
 * informed, and it is approved whole so it stays one click. The approval note
 * is load-bearing: nothing runs until the press, and the surface says so.
 */

import type { HandleItPlan } from '@bask/core';

export interface HandleItPlanCardProps {
  plan: HandleItPlan;
  /** Fired when the approve button is pressed. */
  onApprove?: () => void;
  className?: string;
}

export function HandleItPlanCard({ plan, onApprove, className }: HandleItPlanCardProps) {
  return (
    <div className={['card', 'b-handle', className].filter(Boolean).join(' ')} data-testid="handle-it-plan-card">
      <ul className="b-handle-steps">
        <li className="b-handle-step">
          <span className="b-handle-k">Audience</span>
          <span className="b-handle-v">{plan.audience}</span>
        </li>
        <li className="b-handle-step">
          <span className="b-handle-k">Offer</span>
          <span className="b-handle-v">{plan.offer}</span>
        </li>
        <li className="b-handle-step">
          <span className="b-handle-k">Message</span>
          <span className="b-handle-v">{plan.copy}</span>
        </li>
        <li className="b-handle-step">
          <span className="b-handle-k">Schedule</span>
          <span className="b-handle-v">{plan.schedule}</span>
        </li>
      </ul>
      <button type="button" className="b-approve" onClick={onApprove} data-testid="handle-it-approve">
        Handle it
      </button>
      <p className="b-handle-note">{plan.approvalNote}</p>
    </div>
  );
}