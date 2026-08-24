/**
 * Compass component vocabulary (DESIGN_SPEC §4): a single training corpus as a card.
 *
 * A corpus is a named group of claims (one extraction pass over one body of
 * audio), not its own table — so this card renders the identity, the review
 * progress, and the ONE lifecycle action the operator has: soft-archive.
 * Archiving hides a corpus from the curation queue and the graph but leaves its
 * rows in the shared `bask` schema, so it is always reversible ("Restore").
 *
 * Props-only. The page owns the data and the mutations; this leaf just renders.
 */

import type { CorpusOverviewRow } from '@bask/core';

import { ReviewProgressBar } from './ReviewProgressBar';

export function CorpusCard({
  row,
  onArchive,
  onUnarchive,
}: {
  row: CorpusOverviewRow;
  onArchive?: (corpus: string) => void;
  onUnarchive?: (corpus: string) => void;
}) {
  const title = row.label || row.corpus;

  return (
    <div className={row.archived ? 'cp-corpus-card cp-corpus-card--archived' : 'cp-corpus-card'}>
      <div className="cp-corpus-card-head">
        <p className="cp-corpus-card-title">{title}</p>
        {row.archived ? <span className="cp-badge">Archived</span> : null}
      </div>

      <p className="cp-note">
        {row.total.toLocaleString()} claims • {row.verified.toLocaleString()} verified
      </p>

      <ReviewProgressBar decided={row.decided} total={row.total} />

      {row.lastActivity ? (
        <p className="cp-note">Last activity {new Date(row.lastActivity).toLocaleDateString()}</p>
      ) : null}

      <div className="cp-corpus-card-actions">
        {row.archived
          ? onUnarchive && (
              <button type="button" className="cp-btn" onClick={() => onUnarchive(row.corpus)}>
                Restore
              </button>
            )
          : onArchive && (
              <button type="button" className="cp-btn" onClick={() => onArchive(row.corpus)}>
                Archive
              </button>
            )}
      </div>
    </div>
  );
}
