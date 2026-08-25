/**
 * A card showing whether an action worked for other salons.
 *
 * A salon owner will not act on a recommendation because software said so.
 * They will act because salons like theirs already tried it and it worked.
 * This card is that evidence.
 */
export interface NetworkOutcomeCardProps {
  actionLabel: string;
  signalLabel: string;
  /** Kept on the contract for callers/analytics; the copy comes pre-formatted. */
  salonsTried: number;
  salonsImproved: number;
  successRateLabel: string;
  medianDeltaLabel: string;
  medianDaysLabel: string;
  confident: boolean;
  className?: string;
}

export function NetworkOutcomeCard({
  actionLabel,
  signalLabel,
  successRateLabel,
  medianDeltaLabel,
  medianDaysLabel,
  confident,
  className,
}: NetworkOutcomeCardProps) {
  return (
    <article
      className={['card', 'b-outcome', className].filter(Boolean).join(' ')}
      data-testid="network-outcome-card"
    >
      <div className="b-opp-cat">{signalLabel}</div>
      <h3 className="b-opp-title">{actionLabel}</h3>
      <div className="b-outcome-rev num">{successRateLabel}</div>
      <div className="b-outcome-learned">
        salons with this signal saw the number improve after running it
      </div>
      {/* Two parallel facts, not a sequence — no funnel arrow between them. */}
      <div className="b-outcome-funnel">
        <span className="b-outcome-step">{medianDeltaLabel} typical move</span>
        <span className="b-outcome-step">{medianDaysLabel}</span>
      </div>
      {!confident && (
        <p className="b-outcome-learned">
          Note: the sample size is still small and this is early signal rather than proof.
        </p>
      )}
    </article>
  );
}
