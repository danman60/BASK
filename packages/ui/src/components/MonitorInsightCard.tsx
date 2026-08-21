/**
 * A coaching pattern found across conversations.
 *
 * One pattern, its evidence count, and one move. The knowledge line, when
 * present, points into the UVALUX corpus by room + timestamp — the citation
 * rule from the knowledge build applies here too: place, not person.
 */
import type { MonitorInsight } from '@bask/core';

export interface MonitorInsightCardProps {
  insight: MonitorInsight;
  /** Fired when the coaching button is pressed. */
  onCoach?: () => void;
  className?: string;
}

export function MonitorInsightCard({ insight, onCoach, className }: MonitorInsightCardProps) {
  return (
    <div className={['card', 'b-mon-insight', className].filter(Boolean).join(' ')} data-testid="monitor-insight-card">
      <div className="b-mon-pattern">{insight.pattern}</div>
      <div className="b-mon-evidence">Heard in {insight.evidenceCount} conversations</div>
      <p className="b-mon-suggestion">{insight.suggestion}</p>
      {insight.knowledgeRef && <div className="b-mon-evidence">UVALUX training: {insight.knowledgeRef}</div>}
      <button type="button" className="btn btn-ghost" onClick={onCoach} data-testid="monitor-coach">
        Plan the coaching
      </button>
    </div>
  );
}