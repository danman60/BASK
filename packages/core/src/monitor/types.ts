/**
 * Front Desk Monitor vocabulary — the shared contract for the 2026-08-21 build.
 *
 * A listener device at the front desk hears each sales interaction; the system
 * transcribes it, scores the coachable moments, and turns patterns into
 * coaching insights. Pattern source: the REFLECT room-node pipeline
 * (capture → transcribe → analyze → insight), reduced to demo depth.
 *
 * Demo depth: everything renders from `fixtures.ts`. No audio is captured or
 * processed anywhere in this codebase. Consent framing is part of the product
 * surface (`consentNote`, `ConsentPledgeCard`) — staff-aware, coaching-purpose,
 * never punitive. Keep it that way.
 */

export interface ListenerStatus {
  deviceName: string;
  location: string;
  online: boolean;
  interactionsToday: number;
  uptimeDays: number;
  /** One sentence: who knows about it and what it is for. */
  consentNote: string;
}

/** The five coachable moments scored per interaction, 0–5 each. */
export const MOMENT_KEYS = ['greeting', 'needs', 'product', 'membership', 'close'] as const;
export type MomentKey = (typeof MOMENT_KEYS)[number];

export const MOMENT_LABEL: Record<MomentKey, string> = {
  greeting: 'Greeting',
  needs: 'Asked needs',
  product: 'Product',
  membership: 'Membership',
  close: 'Close',
};

export type MomentScores = Record<MomentKey, number>;

export interface TranscriptLine {
  speaker: 'staff' | 'customer';
  text: string;
}

export const INTERACTION_OUTCOMES = [
  'sale',
  'membership',
  'no_sale',
  'missed_opportunity',
] as const;
export type InteractionOutcome = (typeof INTERACTION_OUTCOMES)[number];

export const INTERACTION_OUTCOME_LABEL: Record<InteractionOutcome, string> = {
  sale: 'Sale',
  membership: 'Membership signed',
  no_sale: 'No sale',
  missed_opportunity: 'Missed opportunity',
};

export interface SalesInteraction {
  id: string;
  /** Salon-local wall time, e.g. `2:41 PM`. */
  time: string;
  employee: string;
  /** Never a name — a pattern label, e.g. `Regular · visits 2×/week`. */
  customerLabel: string;
  /** 3–6 lines, the coachable part only. */
  excerpt: TranscriptLine[];
  scores: MomentScores;
  outcome: InteractionOutcome;
  /** e.g. `Bought 1 bottle` or `Asked about price, left without booking`. */
  outcomeDetail: string;
  /** One coaching sentence tied to the lowest-scoring moment. */
  coachingNote: string;
}

export interface EmployeeSalesStats {
  name: string;
  role: string;
  interactions: number;
  membershipMentions: number;
  conversions: number;
  /** Retail attachment across their interactions, 0–100. */
  attachmentPct: number;
  trend: 'up' | 'flat' | 'down';
  /** Set only when coaching is suggested, one short phrase. */
  flag?: string;
}

export interface MonitorInsight {
  id: string;
  /** The pattern, e.g. `Evening shift rarely mentions products after 6 PM.` */
  pattern: string;
  evidenceCount: number;
  /** What to do about it, one sentence. */
  suggestion: string;
  /** Optional pointer into the UVALUX knowledge corpus, e.g. `Room A · 10:42`. */
  knowledgeRef?: string;
}

export interface MonitorFixture {
  status: ListenerStatus;
  interactions: SalesInteraction[];
  employees: EmployeeSalesStats[];
  insights: MonitorInsight[];
}
