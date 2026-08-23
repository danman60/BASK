/**
 * Compass component vocabulary (DESIGN_SPEC §4): `ReviewProgressBar`.
 *
 * This component displays a summary of corpus review progress, showing the remaining
 * work and supporting statistics.
 */

import { ReviewProgressBar } from './ReviewProgressBar';

export function CorpusSummary({
  corpusName,
  total,
  decided,
  alertCount,
  onJumpToNext,
}: {
  corpusName: string;
  total: number;
  decided: number;
  alertCount: number;
  onJumpToNext?: () => void;
}) {
  if (total === 0) {
    return (
      <div className="cp-corpus-summary">
        <p className="cp-corpus-lead">The corpus is empty and loads via the load-claims script.</p>
      </div>
    );
  }

  const remaining = total - decided;

  return (
    <div className="cp-corpus-summary">
      <p className="cp-corpus-lead">
        <strong className="cp-corpus-count">{remaining.toLocaleString()}</strong> claims to review
      </p>
      <p className="cp-note">
        {total.toLocaleString()} total claims • {decided.toLocaleString()} decided
      </p>
      <ReviewProgressBar decided={decided} total={total} />
      {onJumpToNext && (
        <button className="cp-btn" onClick={onJumpToNext}>
          Next unreviewed
        </button>
      )}
    </div>
  );
}