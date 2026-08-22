/**
 * Compass component vocabulary (DESIGN_SPEC §4): `ProvenanceCard`
 *
 * This component displays provenance information for a claim, showing where it
 * came from and trust signals. It shows event, sessionTitle, knowledgeRef,
 * speaker, and time span. Trust signals are shown when titleConfidence is
 * 'interpolated' or quoteVerified is false.
 */

import { formatTimecode } from '@bask/core';
import type { ClaimProvenance } from '@bask/core';

export function ProvenanceCard({ provenance }: { provenance: ClaimProvenance }) {
  const {
    event,
    sessionTitle,
    knowledgeRef,
    speaker,
    tStart,
    tEnd,
    titleConfidence,
    quoteVerified,
  } = provenance;

  return (
    <div>
      <div className="cp-statrow">
        <span className="l">Event</span>
        <span className="v">{event}</span>
      </div>

      <div className="cp-statrow">
        <span className="l">Session</span>
        <span className="v">{sessionTitle ?? <span className="cp-empty">None</span>}</span>
      </div>

      <div className="cp-statrow">
        <span className="l">Knowledge Ref</span>
        <span className="v">{knowledgeRef}</span>
      </div>

      <div className="cp-statrow">
        <span className="l">Speaker</span>
        <span className="v">
          {speaker ?? <span className="cp-empty">None</span>}
          {titleConfidence === 'interpolated' && (
            <span className="cp-note">
              {' '}
              (speaker inferred from agenda)
            </span>
          )}
        </span>
      </div>

      <div className="cp-statrow">
        <span className="l">Time</span>
        <span className="v">
          {formatTimecode(tStart)} - {formatTimecode(tEnd)}
        </span>
      </div>

      {quoteVerified === false && (
        <div className="cp-note">
          Quote no longer matches transcript
        </div>
      )}

      <div className="cp-statrow">
        <span className="l">Trust</span>
        <span className="v">
          {titleConfidence === 'interpolated' ? (
            <span className="cp-chip cp-chip--watch">Inferred speaker</span>
          ) : (
            <span className="cp-chip cp-chip--steady">Anchored speaker</span>
          )}
          {quoteVerified === false ? (
            <span className="cp-chip cp-chip--watch">Unverified quote</span>
          ) : (
            <span className="cp-chip cp-chip--steady">Verified quote</span>
          )}
        </span>
      </div>
    </div>
  );
}