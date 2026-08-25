import { BandChip, type PositionBand } from './BandChip';

/**
 * A compact rail card showing where this salon stands against salons it does NOT compete with.
 *
 * This is a leaderboard that will not make anyone quit. It never shows a position in a list —
 * no '47th of 60' — because an ordinal invites an argument and discourages the people who most
 * need the advice. It shows a band and a gap, over a peer group that excludes anyone the owner
 * competes with locally. It also always names one thing the salon is best at, because a card of
 * nothing but shortfalls does not get looked at twice.
 */
export interface StandingRow {
  label: string;
  /** This salon's figure. Already rounded by the caller. */
  youLabel: string;
  /** The peer group median for the same figure. */
  medianLabel: string;
  /** The gap between you and the median, already formatted with its sign. */
  gapLabel: string;
  band: PositionBand;
}

export interface PeerStandingCardProps {
  heading: string;
  /** e.g. "against 23 salons like yours" */
  peerCountLabel: string;
  rows: readonly StandingRow[];
  /** The one thing this salon leads on, already worded */
  bestLabel: string | null;
  className?: string;
}

export function PeerStandingCard({ heading, peerCountLabel, rows, bestLabel, className }: PeerStandingCardProps) {
  if (rows.length === 0) {
    return (
      <section className={['card', className].filter(Boolean).join(' ')} data-testid="peer-standing-card">
        <p className="b-dtable-empty">Not enough salons in this peer group to draw a comparison yet.</p>
      </section>
    );
  }

  return (
    <section className={['card', className].filter(Boolean).join(' ')} data-testid="peer-standing-card">
      <h3>{heading}</h3>
      <p>{peerCountLabel}</p>
      
      {rows.map((row) => (
        <div key={row.label}>
          <div>{row.label}</div>
          <div>
            <span>{row.youLabel}</span>
            <span>{row.gapLabel}</span>
          </div>
          <div><BandChip band={row.band} /></div>
        </div>
      ))}
      
      {bestLabel && (
        <p>
          You lead on <strong>{bestLabel}</strong>.
        </p>
      )}
    </section>
  );
}