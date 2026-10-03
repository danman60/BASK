/**
 * The Front Desk Monitor, composed.
 *
 * Reading order is the argument: what the monitor found (patterns), then the
 * evidence (conversations), then the team view. The device tile and the
 * consent pledge share the rail so "it is listening" and "here are the terms"
 * are never separated.
 */
import type { MonitorFixture } from '@bask/core';

import { ConsentPledgeCard } from './ConsentPledgeCard';
import { EmployeeSalesTable } from './EmployeeSalesTable';
import { InteractionCard } from './InteractionCard';
import { ListenerStatusCard } from './ListenerStatusCard';
import { MonitorInsightCard } from './MonitorInsightCard';

export interface MonitorSurfaceProps {
  data: MonitorFixture;
  /** Fired with the insight id when a pattern's coaching button is pressed. */
  onCoach?: (insightId: string) => void;
  className?: string;
}

export function MonitorSurface({ data, onCoach, className }: MonitorSurfaceProps) {
  return (
    <div className={['b-monitor', className].filter(Boolean).join(' ')} data-testid="monitor-surface">
      {/* The two-column grid */}
      <div className="b-monitor-grid">
        <div className="b-monitor-main">
          <h2 className="b-oppfeed-head">What the listener is hearing</h2>
          {data.insights.map((insight) => (
            <MonitorInsightCard
              key={insight.id}
              insight={insight}
              onCoach={onCoach ? () => onCoach(insight.id) : undefined}
            />
          ))}
          <h2 className="b-oppfeed-head">Today&apos;s conversations</h2>
          {data.interactions.map((interaction) => (
            <InteractionCard key={interaction.id} interaction={interaction} />
          ))}
        </div>
        <div className="b-monitor-rail">
          <ListenerStatusCard status={data.status} />
          <ConsentPledgeCard />
        </div>
      </div>

      {/* The team table under the grid */}
      <div className="card">
        <h2 className="b-oppfeed-head">The team, this week</h2>
        <EmployeeSalesTable employees={data.employees} />
      </div>
    </div>
  );
}