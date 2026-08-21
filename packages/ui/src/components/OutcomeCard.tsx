/**
 * The proof card — a recommendation that ran, and what it made.
 *
 * The funnel reads recommendation → executed → result so the owner can see
 * the causal chain, and the revenue line is the biggest element because it is
 * the reason to trust the next recommendation. The learned line is the system
 * being honest about what the result taught it.
 */
import type { OpportunityOutcome } from '@bask/core';

export interface OutcomeCardProps {
  outcome: OpportunityOutcome;
  className?: string;
}

export function OutcomeCard({ outcome, className }: OutcomeCardProps) {
  return (
    <article className={['card', 'b-outcome', className].filter(Boolean).join(' ')} data-testid="outcome-card">
      <div className="b-opp-cat">{outcome.window}</div>
      <h3 className="b-opp-title">{outcome.opportunityTitle}</h3>
      <div className="b-outcome-funnel">
        <span className="b-outcome-step">{outcome.actionTaken}</span>
        <span className="b-outcome-arrow" aria-hidden="true">→</span>
        <span className="b-outcome-step">{outcome.executed}</span>
        <span className="b-outcome-arrow" aria-hidden="true">→</span>
        <span className="b-outcome-step">{outcome.result}</span>
      </div>
      <div className="b-outcome-rev num">{outcome.revenueLabel}</div>
      <p className="b-outcome-learned">{outcome.learned}</p>
    </article>
  );
}