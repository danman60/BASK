import type { Claim } from '@bask/core';

import { ProvenanceCard } from './ProvenanceCard';
import { ReviewStateChip } from './ReviewStateChip';

/**
 * The always-present right-hand panel.
 *
 * ORDER IS THE ARGUMENT HERE. The verbatim quote comes FIRST and largest, and
 * the model's one-sentence summary sits beneath it in a quieter voice. That is
 * deliberate: the summary is a machine's paraphrase and the quote is what a
 * human actually said. A curator who reads the summary first will start
 * agreeing with the machine instead of checking it, which is the whole failure
 * this surface exists to prevent.
 *
 * The quote is never shortened. If it is long, it is long.
 */
export function ClaimInspector({
  claim,
  onVerify,
  onReject,
}: {
  claim: Claim | null;
  onVerify: () => void;
  onReject: () => void;
}) {
  if (!claim) {
    return (
      <p className="cp-note">
        Pick a row to see the quote it came from.
      </p>
    );
  }

  return (
    <div className="cp-inspector">
      <ReviewStateChip state={claim.reviewState} />

      <blockquote className="cp-quote">{claim.quote}</blockquote>

      <p className="cp-claim-sentence">{claim.claim}</p>

      <p className="cp-quote-meta">
        {claim.category}
        {claim.moment !== 'none' ? ` · ${claim.moment}` : ''} · {claim.specificity} · said in{' '}
        {claim.distinctEvents} {claim.distinctEvents === 1 ? 'recording' : 'recordings'}
      </p>

      <div className="cp-provenance">
        {claim.provenance.length === 0 ? (
          <p className="cp-note">No source recorded for this claim.</p>
        ) : (
          claim.provenance.map((p) => (
            <ProvenanceCard key={`${p.sourceStream}-${p.tStart}`} provenance={p} />
          ))
        )}
      </div>

      <div className="cp-inspector-actions">
        <button type="button" className="cp-btn" onClick={onVerify}>
          Verify
        </button>
        <button type="button" className="cp-btn" onClick={onReject}>
          Reject
        </button>
      </div>
    </div>
  );
}
