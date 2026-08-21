'use client';

/**
 * The Opportunity feed, made interactive for the demo.
 *
 * The section itself is presentational (@bask/ui); this thin client wrapper
 * turns an action press into a visible confirmation so the pitch can show the
 * one-click loop end to end — nothing sends, but the owner sees the product
 * acknowledge the press. That acknowledgement is the film's money shot.
 */

import { useState } from 'react';

import type { Opportunity, OpportunityOutcome } from '@bask/core';
import { OpportunityFeedSection } from '@bask/ui';

export function OpportunityFeed({
  opportunities,
  outcomes,
}: {
  opportunities: Opportunity[];
  outcomes: OpportunityOutcome[];
}) {
  const [confirmed, setConfirmed] = useState<string | null>(null);

  return (
    <div className="b-oppfeed-wrap" data-testid="opportunity-feed-wrap">
      <OpportunityFeedSection
        opportunities={opportunities}
        outcomes={outcomes}
        onAction={(_id, label) => setConfirmed(label)}
      />
      {confirmed && (
        <div className="b-toast" role="status" data-testid="opportunity-confirm">
          <span className="b-toast-msg">Prepared: “{confirmed}”. Nothing sends until you say so.</span>
          <button type="button" className="b-toast-x" onClick={() => setConfirmed(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
