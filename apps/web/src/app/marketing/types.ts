/**
 * Router-inferred types for the Studio client.
 *
 * Derived from `AppRouter` rather than restated, so a change to a procedure's
 * return shape is a compile error here instead of a runtime surprise on stage.
 */

import type { AppRouter } from '@bask/api';
import type { inferRouterOutputs } from '@trpc/server';

export type RouterOutputs = inferRouterOutputs<AppRouter>;

/** The generated content set. Null until a campaign has been generated. */
export type CampaignContent = NonNullable<RouterOutputs['marketing']['campaign']['content']>;

/**
 * The context banner's subject.
 *
 * Two entry points supply it and only one carries the "why this offer" note:
 * `studioContext` builds it from the insight's evidence, while reopening a saved
 * campaign only knows which insight it came from. Optional rather than two
 * types — the banner renders the same either way.
 */
export interface FixingContext {
  insightId: string;
  title: string;
  evidenceSentence: string;
  whyThisOffer?: string[];
}
