import { formatCurrency } from '@bask/core';

import type { HeatmapView } from '@/server/insights-data';

/**
 * `@bask/core`'s `weekdayName` takes a date string; `CapacitySlotFacts` carries
 * a weekday INDEX (0 = Sunday), so the grid names them from the index directly.
 */
const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

function weekdayLabel(index: number): string {
  return WEEKDAYS[index] ?? '';
}

/**
 * Hour × weekday utilisation, built from real room/session events.
 *
 * Every cell is `sessionsRun / sessionsPossible` for that weekday-and-hour over
 * the 28-day window — the same `CapacityFacts` the soft-capacity detector reads,
 * so the quiet square on this grid is the quiet Tuesday on the insight card.
 *
 * Warm-toned and annotated (DESIGN_SPEC §2): the grid exists to hold up the
 * sentence printed under it, and the two squares that sentence is about are
 * outlined rather than left for the eye to find.
 */
export function UtilizationHeatmap({ heatmap }: { heatmap: HeatmapView }) {
  const byKey = new Map(heatmap.cells.map((cell) => [`${cell.weekday}:${cell.hour}`, cell]));
  const max = Math.max(...heatmap.cells.map((c) => c.utilisation), 1);

  return (
    <div>
      <div className="l4-heat" style={{ ['--heat-cols' as string]: heatmap.hours.length }}>
        <div className="l4-heat-row">
          <span />
          {heatmap.hours.map((hour) => (
            <span key={hour} className="l4-heat-label num" style={{ textAlign: 'center' }}>
              {hour}
            </span>
          ))}
        </div>
        {heatmap.weekdays.map((weekday) => (
          <div key={weekday} className="l4-heat-row">
            <span className="l4-heat-label">{weekdayLabel(weekday).slice(0, 3)}</span>
            {heatmap.hours.map((hour) => {
              const cell = byKey.get(`${weekday}:${hour}`);
              const intensity = cell ? cell.utilisation / max : 0;
              return (
                <span
                  key={hour}
                  className="l4-heat-cell"
                  data-peak={heatmap.peak?.weekday === weekday && heatmap.peak?.hour === hour}
                  data-soft={heatmap.softest?.weekday === weekday && heatmap.softest?.hour === hour}
                  title={
                    cell
                      ? `${weekdayLabel(weekday)} ${hour}:00 — ${cell.utilisation}% full (${cell.sessionsRun} of ${cell.sessionsPossible} possible sessions)`
                      : `${weekdayLabel(weekday)} ${hour}:00 — closed`
                  }
                  style={
                    cell
                      ? {
                          background: `color-mix(in oklab, var(--primary) ${Math.round(
                            intensity * 82,
                          )}%, var(--paper-2))`,
                        }
                      : { background: 'transparent' }
                  }
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="l4-heat-scale">
        <span>Quiet</span>
        {[0, 0.25, 0.5, 0.75, 1].map((step) => (
          <span
            key={step}
            className="l4-heat-swatch"
            style={{
              background: `color-mix(in oklab, var(--primary) ${Math.round(step * 82)}%, var(--paper-2))`,
            }}
          />
        ))}
        <span>Full</span>
        <span style={{ marginLeft: 12 }}>
          Average across the week: <span className="num">{heatmap.averageUtilisation}%</span>
        </span>
      </div>

      {heatmap.peak && heatmap.softest && (
        <p className="l4-evidence" style={{ marginTop: 16 }}>
          Your fullest hour is <b>{weekdayLabel(heatmap.peak.weekday)} at {heatmap.peak.hour}:00</b>,
          running <b className="num">{heatmap.peak.utilisation}%</b> full. The quietest hour you
          properly staff is{' '}
          <b>
            {weekdayLabel(heatmap.softest.weekday)} at {heatmap.softest.hour}:00
          </b>{' '}
          at <b className="num">{heatmap.softest.utilisation}%</b> — about{' '}
          <b className="num">
            {Math.round((heatmap.softest.sessionsPossible - heatmap.softest.sessionsRun) / 4)}
          </b>{' '}
          empty sessions a week, worth roughly{' '}
          <b className="num">{formatCurrency(heatmap.softSlotWeeklyValue)}</b> at what a session
          usually brings in.
        </p>
      )}
    </div>
  );
}
