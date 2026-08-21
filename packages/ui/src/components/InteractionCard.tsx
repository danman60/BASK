/**
 * One analyzed front-desk conversation.
 *
 * The transcript excerpt is the evidence; the moment dots are the analysis;
 * the coaching line is the point. Customers appear as pattern labels, never
 * names — the monitor coaches staff, it does not profile customers. Outcome
 * colours: a missed opportunity is amber, not red; the tone is "next time",
 * never "gotcha".
 */

import {
  INTERACTION_OUTCOME_LABEL,
  MOMENT_KEYS,
  MOMENT_LABEL,
  type SalesInteraction,
} from '@bask/core';

export interface InteractionCardProps {
  interaction: SalesInteraction;
  className?: string;
}

export function InteractionCard({ interaction, className }: InteractionCardProps) {
  return (
    <article className={['card', 'b-inter', className].filter(Boolean).join(' ')} data-testid="interaction-card">
      <div className="b-inter-head">
        <span className="b-inter-time num">{interaction.time}</span>
        <span className="b-inter-emp">{interaction.employee}</span>
        <span className="b-inter-cust">{interaction.customerLabel}</span>
        <span className="b-inter-outcome" data-outcome={interaction.outcome}>
          {INTERACTION_OUTCOME_LABEL[interaction.outcome]}
        </span>
      </div>
      
      <ul className="b-inter-transcript">
        {interaction.excerpt.map((line, i) => (
          <li className="b-inter-line" data-speaker={line.speaker} key={i}>
            <b>{line.speaker === 'staff' ? interaction.employee : 'Customer'}:</b> {line.text}
          </li>
        ))}
      </ul>
      
      <div className="b-inter-scores">
        {MOMENT_KEYS.map((moment) => (
          <div className="b-inter-score" key={moment}>
            <span className="b-inter-score-k">{MOMENT_LABEL[moment]}</span>
            <span className="b-inter-dots">
              {[1, 2, 3, 4, 5].map((step) => (
                <span
                  className="b-inter-dot"
                  data-hit={step <= interaction.scores[moment] ? 'true' : 'false'}
                  key={step}
                />
              ))}
            </span>
          </div>
        ))}
      </div>
      
      <div className="b-inter-cust">{interaction.outcomeDetail}</div>
      <p className="b-inter-coach">{interaction.coachingNote}</p>
    </article>
  );
}