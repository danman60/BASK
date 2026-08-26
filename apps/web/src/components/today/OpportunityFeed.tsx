'use client';

/**
 * The Opportunity feed, made interactive for the demo.
 *
 * The section itself is presentational (@bask/ui); this thin client wrapper
 * turns an action press into a visible result so the pitch can show the
 * one-click loop end to end — nothing sends, but the owner sees what the
 * product prepared.
 *
 * A social action opens the prepared post rather than a toast. A toast saying
 * "Prepared: Approve & post to Facebook and Instagram" is the app telling you
 * it did something; the post itself is the app showing you. That difference is
 * the whole pitch for a marketing feature, so the social kind gets the panel
 * and everything else keeps the acknowledgement.
 */

import { useState } from 'react';

import type { Opportunity, OpportunityOutcome, SocialAction } from '@bask/core';
import { OpportunityFeedSection, SocialPostCard } from '@bask/ui';

export function OpportunityFeed({
  opportunities,
  outcomes,
  salonName,
}: {
  opportunities: Opportunity[];
  outcomes: OpportunityOutcome[];
  salonName?: string;
}) {
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [post, setPost] = useState<SocialAction | null>(null);

  const press = (id: string, label: string) => {
    const social = opportunities
      .find((o) => o.id === id)
      ?.actions.find((a): a is SocialAction => a.kind === 'social' && a.label === label);
    if (social) {
      setPost(social);
      return;
    }
    setConfirmed(label);
  };

  return (
    <div className="b-oppfeed-wrap" data-testid="opportunity-feed-wrap">
      <OpportunityFeedSection
        opportunities={opportunities}
        outcomes={outcomes}
        onAction={press}
      />

      {post && (
        <div
          className="b-postsheet"
          role="dialog"
          aria-modal="true"
          aria-label="The post Bask prepared"
          data-testid="social-sheet"
        >
          <div className="b-postsheet-scrim" onClick={() => setPost(null)} />
          <div className="b-postsheet-body">
            <div className="b-postsheet-head">
              <p className="b-postsheet-title">Bask wrote this for you</p>
              <button
                type="button"
                className="b-toast-x"
                onClick={() => setPost(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <SocialPostCard
              action={post}
              salonName={salonName}
              onCreate={() => {
                setPost(null);
                setConfirmed(post.label);
              }}
            />
          </div>
        </div>
      )}

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
