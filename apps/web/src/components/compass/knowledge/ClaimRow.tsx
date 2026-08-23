import type { Claim } from '@bask/core';
import { REVIEW_STATE_LABEL, formatTimecode } from '@bask/core';

export function ClaimRow({
  claim,
  focused,
  onSelect,
  onVerify,
  onReject,
}: {
  claim: Claim;
  focused: boolean;
  onSelect: () => void;
  onVerify: () => void;
  onReject: () => void;
}) {
  const { claim: claimText, category, moment, distinctEvents, provenance } = claim;
  
  // Guard against empty provenance array
  const firstProvenance = provenance.length > 0 ? provenance[0] : null;
  
  return (
    <tr
      className={`cp-claim-row ${focused ? 'cp-claim-row--focused' : ''}`}
      onClick={onSelect}
    >
      <td>{REVIEW_STATE_LABEL[claim.reviewState]}</td>
      <td>
        <span className="cp-claim-text">{claimText}</span>
      </td>
      <td>{category}</td>
      <td>{moment}</td>
      <td>{distinctEvents}</td>
      <td>{firstProvenance ? formatTimecode(firstProvenance.tStart) : '-'}</td>
    </tr>
  );
}