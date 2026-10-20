/**
 * Developmental feature gates, keyed to the BASK x UVALUX proposal.
 *
 * Every item in the proposal (dancoded.ca/p/bask-uvalux-cmxb8vlay3, the `ITEMS` list) that has a
 * surface in this app gets one entry here. A feature UVALUX has not approved stays OFF in a
 * production deployment and ON in the demo and in development, so the demo can show the whole
 * proposal while a real salon only ever sees what was signed for.
 *
 * Mode comes from `BASK_ENV`: `production`, `demo` or `dev`. UNSET MEANS DEMO, on purpose: the
 * only deployment today is the stakeholder demo, and it must not lose surfaces because this file
 * landed. A real salon deployment sets `BASK_ENV=production` explicitly.
 *
 * Per-feature override: `BASK_FLAG_<KEY>` in UPPER_SNAKE_CASE (`1/true/yes/on` or `0/false/no/off`)
 * wins over the mode default in every mode.
 *
 * This module is imported by the Next proxy, so it must stay dependency-free.
 */

export type BaskEnv = 'production' | 'demo' | 'dev';

/** Where the proposal puts an item. `addon` = the tray and the "add-ons" ideas (L.*, N.*). */
export type ProposalPhase = 'P1' | 'P2' | 'P3' | 'addon';

export interface Feature {
  /** Proposal card id, e.g. `2.7`. */
  readonly proposalId: string;
  readonly title: string;
  readonly phase: ProposalPhase;
  /** Page path prefixes this feature owns. `/customers?view=recovery` style query gates are not supported. */
  readonly routes: readonly string[];
  /** tRPC procedure prefixes this feature owns, e.g. `community.`. */
  readonly procedures: readonly string[];
}

export const FEATURES = {
  todayDashboard: { proposalId: '1.1', title: 'Salon intelligence dashboard', phase: 'P1', routes: [], procedures: [] },
  compass: { proposalId: '1.2', title: 'UVALUX intelligence (Compass)', phase: 'P1', routes: ['/compass'], procedures: ['compass.'] },
  benchmarks: { proposalId: '1.5', title: 'Benchmarking scoreboard', phase: 'P1', routes: ['/insights/peers'], procedures: [] },
  customerHealth: { proposalId: '1.6', title: 'Customer health grid', phase: 'P1', routes: ['/customers'], procedures: ['customers.'] },
  knowledgeBase: { proposalId: '1.8', title: 'UVALUX knowledge base', phase: 'P1', routes: ['/compass/knowledge', '/compass/coaching'], procedures: ['knowledge.'] },
  measuredLift: { proposalId: '2.1', title: 'Measured lift: one headline number', phase: 'P2', routes: ['/insights/activity'], procedures: [] },
  campaigns: { proposalId: '2.4', title: 'Campaigns off the data', phase: 'P2', routes: ['/marketing'], procedures: ['marketing.'] },
  consent: { proposalId: '2.5', title: 'Production sign-in, privacy and consent', phase: 'P2', routes: ['/settings/data-sharing'], procedures: ['dataSharing.'] },
  community: { proposalId: '2.7', title: 'Members-only community space', phase: 'P2', routes: ['/community'], procedures: [] },
  coachingCall: { proposalId: 'L.1', title: 'One click to book a coaching call', phase: 'addon', routes: [], procedures: ['compass.scheduleCoaching'] },
  frontDeskListener: { proposalId: 'L.3', title: 'Front Desk Listener', phase: 'addon', routes: ['/monitor'], procedures: [] },
  expertChat: { proposalId: 'N.5', title: 'Expert chatbot and customer chatbot', phase: 'addon', routes: ['/ask'], procedures: [] },
  inventoryOrder: { proposalId: 'N.8', title: 'Inventory to UVALUX draft order', phase: 'addon', routes: ['/inventory'], procedures: ['inventory.'] },
} as const satisfies Record<string, Feature>;

export type FeatureKey = keyof typeof FEATURES;
export const FEATURE_KEYS = Object.keys(FEATURES) as FeatureKey[];

/**
 * Features UVALUX has signed for. EMPTY: no phase is agreed (the Sept 4 Phase 1 letter was sent,
 * never accepted). shortcut: hand-maintained list, move to a DB row if approvals ever change often.
 */
export const APPROVED: readonly FeatureKey[] = [];

export type FlagState = Readonly<Record<FeatureKey, boolean>>;
type Env = Readonly<Record<string, string | undefined>>;

export function resolveEnv(source: Env): BaskEnv {
  const v = source.BASK_ENV?.trim().toLowerCase();
  return v === 'production' || v === 'dev' ? v : 'demo';
}

export const flagEnvName = (key: FeatureKey) =>
  `BASK_FLAG_${key.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}`;

function override(raw: string | undefined): boolean | undefined {
  const v = raw?.trim().toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  return undefined;
}

export function readFlags(source: Env): FlagState {
  const prod = resolveEnv(source) === 'production';
  return Object.fromEntries(
    FEATURE_KEYS.map((key) => [
      key,
      override(source[flagEnvName(key)]) ?? (prod ? APPROVED.includes(key) : true),
    ]),
  ) as Record<FeatureKey, boolean>;
}

export function isEnabled(flags: FlagState, key: FeatureKey): boolean {
  return flags[key];
}

/** Every feature owning this page path. `/compass/knowledge` belongs to compass AND knowledgeBase. */
export function featuresForPath(pathname: string): FeatureKey[] {
  return FEATURE_KEYS.filter((key) =>
    FEATURES[key].routes.some((r: string) => pathname === r || pathname.startsWith(`${r}/`)),
  );
}

/** Every feature owning a tRPC procedure path such as `community.list`. */
export function featuresForProcedure(procedure: string): FeatureKey[] {
  return FEATURE_KEYS.filter((key) =>
    FEATURES[key].procedures.some((p: string) => procedure.startsWith(p)),
  );
}

/** A page or procedure is reachable only when every feature that owns it is on. */
export const allowed = (flags: FlagState, owners: readonly FeatureKey[]) =>
  owners.every((key) => flags[key]);
