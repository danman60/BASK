import { ReviewProgressBar } from './ReviewProgressBar';

/**
 * Header strip above the claims table.
 *
 * Every number here appears with its denominator. A bare "6%" tells a curator
 * nothing about whether the corpus is 100 claims or 1,000, and this surface
 * exists to make the shape of the corpus obvious at a glance.
 */
export function CorpusSummary({
  corpusName,
  total,
  decided,
  alertCount,
}: {
  corpusName: string;
  total: number;
  decided: number;
  alertCount: number;
}) {
  if (total === 0) {
    return (
      <div className="cp-corpus-summary">
        <h2 className="cp-head">{corpusName}</h2>
        <p className="cp-note">
          No claims are loaded yet. Run{' '}
          <code>tsx scripts/knowledge/load-claims.ts --commit</code> from{' '}
          <code>packages/db</code> to load the mined corpora.
        </p>
      </div>
    );
  }

  return (
    <div className="cp-corpus-summary">
      <h2 className="cp-head">{corpusName}</h2>
      <p className="cp-note">
        {total.toLocaleString()} claims · {decided.toLocaleString()} decided ·{' '}
        {(total - decided).toLocaleString()} still to review
        {alertCount > 0 ? ` · ${alertCount.toLocaleString()} alerts` : ''}
      </p>
      <ReviewProgressBar decided={decided} total={total} />
    </div>
  );
}
