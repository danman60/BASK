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

/* -------------------------------------------------------------- GraphLegend */

/**
 * Static legend explaining the 3D graph's visual channels:
 * - Node colour means review state
 * - Node size means how many separate recordings said it
 * - Node brightness means how confident the provenance is
 * - Halo means the node has an open alert
 */
export function GraphLegend() {
  return (
    <div className="cp-ev">
      <div className="cp-ev-item">
        <div className="cp-dot cp-dot--unreviewed" />
        <div className="cp-note">Not reviewed</div>
      </div>

      <div className="cp-ev-item">
        <div className="cp-dot cp-dot--verified" />
        <div className="cp-note">Verified</div>
      </div>

      <div className="cp-ev-item">
        <div className="cp-dot cp-dot--rejected" />
        <div className="cp-note">Rejected</div>
      </div>

      <div className="cp-ev-item">
        <div className="cp-dot cp-dot--needs_edit" />
        <div className="cp-note">Needs an edit</div>
      </div>

      <div className="cp-ev-item">
        <div className="cp-chip cp-chip--steady" />
        <div className="cp-note">Larger = more recordings</div>
      </div>

      <div className="cp-ev-item">
        <div className="cp-chip cp-chip--watch" />
        <div className="cp-note">Brighter = more confident</div>
      </div>

      <div className="cp-ev-item">
        <div className="cp-chip cp-chip--grow" />
        <div className="cp-note">Halo indicates alert</div>
      </div>
    </div>
  );
}