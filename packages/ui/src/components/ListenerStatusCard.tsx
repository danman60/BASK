/**
 * The listener device tile — proof the monitor is alive, and on whose terms.
 *
 * The audio bars are pure CSS animation (no audio is processed anywhere in
 * this codebase); they exist so the surface reads as listening rather than as
 * a report about listening. The consent line renders on the tile itself, not
 * in a settings page — visibility is the licence.
 */
import type { ListenerStatus } from '@bask/core';

export interface ListenerStatusCardProps {
  status: ListenerStatus;
  className?: string;
}

export function ListenerStatusCard({ status, className }: ListenerStatusCardProps) {
  return (
    <div className={['card', 'b-listener', className].filter(Boolean).join(' ')} data-testid="listener-status-card">
      <div className="b-listener-head">
        <span className="b-listener-dot" data-on={status.online ? 'true' : 'false'} aria-hidden="true" />
        <span className="b-listener-name">{status.deviceName}</span>
        <div className="b-listener-bars" aria-hidden="true">
          <span className="b-listener-bar" />
          <span className="b-listener-bar" />
          <span className="b-listener-bar" />
          <span className="b-listener-bar" />
          <span className="b-listener-bar" />
        </div>
      </div>
      <div className="b-listener-stats">
        <div className="b-metric">
          <div className="b-metric-value num">{status.interactionsToday}</div>
          <div className="b-metric-label">conversations today</div>
        </div>
        <div className="b-metric">
          <div className="b-metric-value num">{status.uptimeDays}</div>
          <div className="b-metric-label">days running</div>
        </div>
      </div>
      {/* Location is a label, not a figure — set as a number it outweighed the
          two counts beside it. */}
      <p className="b-listener-where">
        <span className="b-metric-label">Location</span> {status.location}
      </p>
      <p className="b-pledge-line">{status.consentNote}</p>
    </div>
  );
}