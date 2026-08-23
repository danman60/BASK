import type { Claim } from '@bask/core';
import { formatTimecode, REVIEW_STATE_LABEL } from '@bask/core';

interface ClaimRowProps {
  claim: Claim;
  focused: boolean;
  onSelect: () => void;
}

export function ClaimRow({ claim, focused, onSelect }: ClaimRowProps) {
  const state = claim.reviewState;
  const stateLabel = REVIEW_STATE_LABEL[state];
  
  return (
    <tr
      className={`cp-claim-row ${focused ? 'cp-claim-row--focused' : ''}`}
      onClick={onSelect}
    >
      <td>
        <span className={`cp-state-dot cp-state-dot--${state}`} aria-hidden="true" />
        <span className="cp-sr-only">State: {stateLabel}
        </span>
      </td>
      <td className="cp-claim-cell">
        <span className="cp-claim-text">{claim.claim}</span>
      </td>
      <td className="cp-topic-cell">
        {claim.category}
      </td>
      <td className="cp-at-cell">
        {claim.provenance.length > 0 ? formatTimecode(claim.provenance[0].tStart) : ''}
      </td>
    </tr>
  );
}