/**
 * Method sources — provenance for intelligence that traces to UVALUX advisory
 * technique.
 *
 * The product's credibility comes from saying WHERE a recommendation's method
 * came from. When a detector, sweep or opportunity uses a technique from the
 * UVALUX analytics advisory (attachment math, cohort benchmark ranking, visit-
 * frequency, membership penetration, revenue hygiene), it carries a
 * `MethodSource` and the app shows the source.
 *
 * ⚠️ NAMES NEVER RENDER. The app must never display the individual advisor's
 * name (owner directive, 2026-08-22). App-facing attribution is the UVALUX
 * advisory program only. The originating expert is recorded for our own audit
 * in `INTERNAL_PROVENANCE` below, which no UI code imports — do not surface it.
 *
 * More advisory material is being ingested; each new technique attaches here.
 */

export interface MethodSource {
  /** Registry key, e.g. `retail_attachment`. */
  key: string;
  /** App-facing label — the UVALUX advisory, never a person. */
  label: string;
  /** One short phrase of why the method carries weight — no names. */
  basis: string;
  /** Where it comes from, app-facing — event only, no room/speaker. */
  event: string;
}

/** The single app-facing source identity. Never a person's name. */
const UVALUX_ADVISORY = {
  label: 'UVALUX analytics method',
  event: 'UVALUX Expo 2026',
} as const;

/**
 * Techniques → app-facing method source. A detector/opportunity names its
 * technique key and gets a de-identified source to render.
 */
export const METHOD_SOURCES: Record<string, MethodSource> = {
  retail_attachment: {
    key: 'retail_attachment',
    label: UVALUX_ADVISORY.label,
    basis: 'Retail & wellness attachment benchmarked across 300+ salons',
    event: UVALUX_ADVISORY.event,
  },
  peer_benchmark: {
    key: 'peer_benchmark',
    label: UVALUX_ADVISORY.label,
    basis: 'Cohort benchmark ranking against comparable salons',
    event: UVALUX_ADVISORY.event,
  },
  visit_frequency: {
    key: 'visit_frequency',
    label: UVALUX_ADVISORY.label,
    basis: 'Average visit frequency = sessions ÷ unique customers',
    event: UVALUX_ADVISORY.event,
  },
  membership_penetration: {
    key: 'membership_penetration',
    label: UVALUX_ADVISORY.label,
    basis: 'Membership penetration benchmark (2.5–4% of the customer base)',
    event: UVALUX_ADVISORY.event,
  },
  revenue_hygiene: {
    key: 'revenue_hygiene',
    label: UVALUX_ADVISORY.label,
    basis: 'True revenue = gross − tax − chargebacks − shrink at full retail',
    event: UVALUX_ADVISORY.event,
  },
};

/** Look up the app-facing method source for a technique, or null. */
export function methodSourceFor(technique: string): MethodSource | null {
  return METHOD_SOURCES[technique] ?? null;
}

/**
 * INTERNAL audit trail only — the originating advisor behind these techniques.
 * NOT exported into any surface; the app never reads this. Kept so we can trace
 * provenance in our own records as more material is ingested.
 */
const INTERNAL_PROVENANCE = {
  advisor: 'Mike Blore',
  talk: 'The Evidence Behind Your Business',
  ref: 'Room B · UVALUX Expo 2026',
} as const;
void INTERNAL_PROVENANCE;
