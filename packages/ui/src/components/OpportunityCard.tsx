/**
 * One ranked business opportunity — the product's unit of intelligence.
 *
 * Reads in the order the owner thinks: what to do, what changed, what it is
 * worth, how sure we are, then the buttons that execute it. The money line is
 * the largest element on purpose; an owner scans dollars, not metrics.
 *
 * Presentational. Ranking and data live in @bask/core fixtures; the action
 * buttons arrive pre-built as `actions` and are rendered by `ActionRow`.
 */
import type { ReactNode } from 'react';

import {
  OPPORTUNITY_CATEGORY_LABEL,
  OPPORTUNITY_CONFIDENCE_LABEL,
  OPPORTUNITY_URGENCY_LABEL,
  type Opportunity,
} from '@bask/core';

import { ActionRow } from './ActionRow';

export interface OpportunityCardProps {
  opportunity: Opportunity;
  /** 1-based position in the ranked feed. */
  rank: number;
  /** Fired with the action's label when any action button is pressed. */
  onAction?: (actionLabel: string) => void;
  /** Rendered under the meta row when provided (e.g. a Handle-it panel). */
  children?: ReactNode;
  className?: string;
}

export function OpportunityCard({ opportunity, rank, onAction, children, className }: OpportunityCardProps) {
  return (
    <article className={['card', 'b-opp', className].filter(Boolean).join(' ')} data-testid="opportunity-card">
      <div className="b-opp-head">
        <span className="b-opp-rank">{rank}</span>
        <div>
          <div className="b-opp-cat">{OPPORTUNITY_CATEGORY_LABEL[opportunity.category]}</div>
          <h3 className="b-opp-title">{opportunity.title}</h3>
        </div>
      </div>
      <p className="b-opp-changed">{opportunity.whatChanged}</p>
      <p className="b-opp-why">{opportunity.whyItMatters}</p>
      <div className="b-opp-impact num">{opportunity.impactLabel}</div>
      <div className="b-opp-meta">
        <span className="b-opp-conf" data-conf={opportunity.confidence}>{OPPORTUNITY_CONFIDENCE_LABEL[opportunity.confidence]}</span>
        <span className="b-opp-urgency">{OPPORTUNITY_URGENCY_LABEL[opportunity.urgency]}</span>
      </div>
      <p className="b-opp-confnote">{opportunity.confidenceNote}</p>
      <ActionRow actions={opportunity.actions} onAction={onAction} />
      {children}
    </article>
  );
}