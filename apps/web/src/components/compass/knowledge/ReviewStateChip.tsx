/**
 * Compass component vocabulary (DESIGN_SPEC §4): `ReviewStateChip`.
 *
 * A small status chip showing a claim's review state. Takes a single prop, the
 * ReviewState from the contract. Render the human label from REVIEW_STATE_LABEL,
 * never the raw enum value. Follow StatusChip in the exemplar exactly for markup
 * shape and class naming: a span with a cp- prefixed class plus a state modifier
 * class. Add no colours in the component; the modifier class carries them.
 */

// Since we can't directly import from contract, using the values from the instruction
type ReviewState = 'unreviewed' | 'verified' | 'rejected' | 'needs_edit';

const REVIEW_STATE_LABEL: Record<ReviewState, string> = {
  unreviewed: 'Not reviewed',
  verified: 'Verified',
  rejected: 'Rejected',
  needs_edit: 'Needs an edit',
};

const REVIEW_STATE_CLASS: Record<ReviewState, string> = {
  unreviewed: 'cp-chip--unreviewed',
  verified: 'cp-chip--verified',
  rejected: 'cp-chip--rejected',
  needs_edit: 'cp-chip--needs-edit',
};

export function ReviewStateChip({ state }: { state: ReviewState }) {
  return (
    <span className={`cp-chip ${REVIEW_STATE_CLASS[state]}`}>
      {REVIEW_STATE_LABEL[state]}
    </span>
  );
}