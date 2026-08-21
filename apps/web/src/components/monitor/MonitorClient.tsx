'use client';

/**
 * The Front Desk Monitor, made interactive for the demo.
 *
 * MonitorSurface is presentational (@bask/ui); this wrapper turns the
 * "plan the coaching" press into a visible confirmation so the pitch shows the
 * coaching loop closing. Nothing is recorded — the press is acknowledged.
 */

import { useState } from 'react';

import type { MonitorFixture } from '@bask/core';
import { MonitorSurface } from '@bask/ui';

export function MonitorClient({ data }: { data: MonitorFixture }) {
  const [coached, setCoached] = useState<string | null>(null);

  const label = coached
    ? data.insights.find((insight) => insight.id === coached)?.pattern ?? null
    : null;

  return (
    <div data-testid="monitor-client">
      <MonitorSurface data={data} onCoach={(id) => setCoached(id)} />
      {label && (
        <div className="b-toast" role="status" data-testid="monitor-confirm">
          <span className="b-toast-msg">Coaching drafted for: “{label}”.</span>
          <button type="button" className="b-toast-x" onClick={() => setCoached(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
