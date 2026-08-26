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
 * ⚠️ NAMES NEVER RENDER, AND NAMES ARE NEVER VALUES. The app must never display
 * the individual advisor's name (owner directive, 2026-08-22). App-facing
 * attribution is the UVALUX advisory program only.
 *
 * "Not rendered" is a weaker guarantee than it sounds, and this file learned it
 * the hard way — see the audit-trail note at the bottom. This barrel is
 * re-exported from `@bask/core/index.ts`, which client components import values
 * from, so ANY string constant in this file is downloaded by every browser that
 * opens Today whether a component reads it or not. The advisor's identity is
 * therefore kept in documentation, not in code. Do not add it back as a
 * `const`, however dead the binding looks.
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

/*
 * INTERNAL AUDIT TRAIL — kept as a COMMENT, deliberately, not as a value.
 *
 * The originating advisor, the talk and the room are already recorded in
 * `docs/SIGNAL_SWEEPS.md` (and the plan that produced it,
 * `docs/plans/2026-08-19-knowledge-base-and-signal-sweeps.md`) — documentation
 * no bundler can see. Nothing was lost by taking them out of this file.
 *
 * They used to live here as a `const INTERNAL_PROVENANCE` that nothing read,
 * guarded by a `void` so the compiler stayed quiet. That guard protects
 * nothing: this barrel is re-exported from `@bask/core/index.ts`, client
 * components import values from that barrel, and a `const` is a runtime string
 * whether or not anybody reads it. Measured on 2026-08-26 against the running
 * dev server: the advisor's name, the talk title and the room were all present
 * in `_next/static/chunks/*.js` — 1.0 MB of JavaScript sent to every browser
 * that opened Today. Nothing RENDERED it, which is exactly why it survived a
 * year of reading the screen and believing the fence held.
 *
 * A comment cannot be shipped. Keep it that way: no name, no talk title and no
 * room in any binding in this file, however dead the binding looks.
 */
