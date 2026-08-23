/**
 * What the map's visual channels mean.
 *
 * The graph is only useful if a viewer can read it without training, so this is
 * not decoration — it is the key that turns colour, size and brightness back
 * into facts about the corpus.
 *
 * Its swatches use their own `cp-legend-*` classes rather than borrowing the
 * evidence-tile or health-band vocabulary. Those exist for other meanings, and
 * reusing them here made the legend render as four large empty cards.
 */
export function GraphLegend() {
  return (
    <div className="cp-legend">
      <span className="cp-legend-item">
        <i className="cp-legend-dot cp-legend-dot--unreviewed" /> Not reviewed
      </span>
      <span className="cp-legend-item">
        <i className="cp-legend-dot cp-legend-dot--verified" /> Verified
      </span>
      <span className="cp-legend-item">
        <i className="cp-legend-dot cp-legend-dot--rejected" /> Rejected
      </span>
      <span className="cp-legend-item">
        <i className="cp-legend-dot cp-legend-dot--needs_edit" /> Needs an edit
      </span>
      <span className="cp-legend-sep" aria-hidden="true" />
      <span className="cp-legend-item">Bigger = said in more recordings</span>
      <span className="cp-legend-item">Brighter = stronger provenance</span>
      <span className="cp-legend-item">Sparse, dim area = thin topic</span>
    </div>
  );
}
