/**
 * The daily action feed — the product's primary interface.
 *
 * The heading counts the opportunities because "4 ways to grow your business
 * today" is a promise sized to a coffee break; "analytics" is not. Cards
 * arrive ranked; this section adds nothing but the frame. Outcomes render
 * after the feed under "What your last actions made" — proof directly under
 * promise.
 */

import type { Opportunity, OpportunityOutcome } from '@bask/core';

import { OpportunityCard } from './OpportunityCard';
import { OutcomeCard } from './OutcomeCard';

export interface OpportunityFeedSectionProps {
  /** Already ranked, best first. */
  opportunities: Opportunity[];
  /** Measured results of past actions, newest first. */
  outcomes?: OpportunityOutcome[];
  /** Fired with (opportunityId, actionLabel) when any card's action is pressed. */
  onAction?: (opportunityId: string, actionLabel: string) => void;
  className?: string;
}

export function OpportunityFeedSection({ opportunities, outcomes, onAction, className }: OpportunityFeedSectionProps) {
  return (
    <section className={['b-oppfeed', className].filter(Boolean).join(' ')} data-testid="opportunity-feed-section">
      <div>
        <h2 className="b-oppfeed-head">
          {opportunities.length} ways to grow your business today
        </h2>
        <p className="b-oppfeed-sub">
          Found in your own numbers overnight. Every one opens into the thing that does it.
        </p>
      </div>

      <div className="b-oppfeed-list">
        {opportunities.map((opp, i) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            rank={i + 1}
            onAction={onAction ? (label) => onAction(opp.id, label) : undefined}
          />
        ))}
      </div>

      {outcomes && outcomes.length > 0 && (
        <div>
          <h2 className="b-oppfeed-head">What your last actions made</h2>
          <div className="b-oppfeed-list">
            {outcomes.map((outcome) => (
              <OutcomeCard key={outcome.id} outcome={outcome} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}