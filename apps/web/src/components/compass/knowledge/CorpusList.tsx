/**
 * Compass component vocabulary (DESIGN_SPEC §4): the corpus-management grid.
 *
 * Renders every training corpus as a `CorpusCard`. Active corpora come first;
 * archived ones sink to the bottom (they are still visible so an operator can
 * restore one, but they never sit above live work).
 *
 * Props-only. The page owns the data and the archive/unarchive mutations.
 */

import type { CorpusOverviewRow } from '@bask/core';

import { CorpusCard } from './CorpusCard';

export function CorpusList({
  corpora,
  onArchive,
  onUnarchive,
}: {
  corpora: CorpusOverviewRow[];
  onArchive?: (corpus: string) => void;
  onUnarchive?: (corpus: string) => void;
}) {
  if (corpora.length === 0) {
    return <p className="cp-note">No corpora loaded yet.</p>;
  }

  // Active before archived; within each group, largest corpus first.
  const ordered = [...corpora].sort((a, b) => {
    if (a.archived !== b.archived) return a.archived ? 1 : -1;
    return b.total - a.total;
  });

  return (
    <div className="cp-corpus-list">
      {ordered.map((row) => (
        <CorpusCard
          key={row.corpus}
          row={row}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
        />
      ))}
    </div>
  );
}
