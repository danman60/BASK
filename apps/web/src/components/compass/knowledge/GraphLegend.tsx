/**
 * Compass component vocabulary (DESIGN_SPEC §4): `EvidenceTile`, `SuggestBlock`,
 * `StatusChip`, `StatRow`, plus the consent badge PRODUCT_SPEC §14 asks for on
 * every account.
 *
 * These live in `apps/web` rather than `@bask/ui` on purpose: the M1 merge
 * protocol gives Lane 1 ownership of `packages/ui`, and other lanes request
 * additions instead of editing it. They are written to the §4 names and prop
 * shapes so promoting them upward later is a file move, not a rewrite.
 *
 * All of them are presentational. They receive values that have already been
 * derived and consent-filtered by `@bask/core` — no component here decides what
 * a number means or whether a rep may see it.
 */

import type { Claim } from '@bask/core';

/* -------------------------------------------------------------- GraphLegend */

/**
 * Compact static legend for the 3D map showing node size, color, and brightness
 * meanings. Node SIZE is how many claims a topic holds, node COLOUR is the share
 * of those claims a human has verified, node BRIGHTNESS is provenance strength,
 * and a ring means the node has an open alert.
 */
export function GraphLegend() {
  return (
    <div className="cp-legend">
      <span className="cp-legend-item">
        <i className="cp-legend-dot cp-legend-dot--none" aria-hidden="true"></i>
        None verified
      </span>
      <span className="cp-legend-item">
        <i className="cp-legend-dot cp-legend-dot--some" aria-hidden="true"></i>
        Some verified
      </span>
      <span className="cp-legend-item">
        <i className="cp-legend-dot cp-legend-dot--most" aria-hidden="true"></i>
        Mostly verified
      </span>
      <span className="cp-legend-item">
        <i className="cp-legend-dot cp-legend-dot--all" aria-hidden="true"></i>
        All verified
      </span>
      <span className="cp-legend-sep" aria-hidden="true"></span>
      <span className="cp-legend-item">
        Bigger = more claims
      </span>
      <span className="cp-legend-item">
        Brighter = stronger provenance
      </span>
      <span className="cp-legend-item">
        Sparse and dim = thin topic
      </span>
    </div>
  );
}