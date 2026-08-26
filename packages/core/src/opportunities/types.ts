/**
 * Opportunity Engine vocabulary — the shared contract for the 2026-08-21 build.
 *
 * An Opportunity is the product's unit of intelligence: what changed, why it
 * matters, what it is worth, and the prepared actions that execute it in one
 * click. The feed on Today renders these; the execution surfaces (SMS, email,
 * social, staff task, front-desk script, challenge, order, coaching) each render
 * one member of the `OpportunityAction` union.
 *
 * Demo depth: instances come from `fixtures.ts`, deterministic and hand-set.
 * The ranking dimensions (impact × confidence × urgency × ease) are carried as
 * data so the UI can show them; nothing here computes them.
 */

export const OPPORTUNITY_CATEGORIES = [
  'marketing',
  'membership',
  'retail',
  'operations',
  'customer',
  'coaching',
] as const;
export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number];

/** Grade-7 label for each category, shown on the card's kicker line. */
export const OPPORTUNITY_CATEGORY_LABEL: Record<OpportunityCategory, string> = {
  marketing: 'Marketing',
  membership: 'Memberships',
  retail: 'Retail',
  operations: 'Operations',
  customer: 'Customers',
  coaching: 'Coaching',
};

/** Two confidence levels only (brainstorm §27): certainty or honesty. */
export const OPPORTUNITY_CONFIDENCES = ['high', 'worth_testing'] as const;
export type OpportunityConfidence = (typeof OPPORTUNITY_CONFIDENCES)[number];

export const OPPORTUNITY_CONFIDENCE_LABEL: Record<OpportunityConfidence, string> = {
  high: 'High confidence',
  worth_testing: 'Worth testing',
};

export const OPPORTUNITY_URGENCIES = ['now', 'this_week', 'this_month'] as const;
export type OpportunityUrgency = (typeof OPPORTUNITY_URGENCIES)[number];

export const OPPORTUNITY_URGENCY_LABEL: Record<OpportunityUrgency, string> = {
  now: 'Act today',
  this_week: 'This week',
  this_month: 'This month',
};

/* ---- the execution package ------------------------------------------------ */

export interface SmsAction {
  kind: 'sms';
  /** Button label, e.g. `Approve & send to 17 customers`. */
  label: string;
  recipientCount: number;
  message: string;
  /** e.g. `17 messages · about $1.20` */
  costNote: string;
}

export interface EmailAction {
  kind: 'email';
  label: string;
  recipientCount: number;
  subject: string;
  /** Short body preview — 2–3 sentences, not the full email. */
  body: string;
}

export interface SocialAction {
  kind: 'social';
  label: string;
  facebook: string;
  instagram: string;
  cta: string;
  /** One line of art direction, e.g. `Warm photo of the red-light room, door open.` */
  imageDirection: string;
  /**
   * The finished artwork. `imageDirection` describes what a picture SHOULD be;
   * this is the picture. An owner who is shown a sentence about a photo still
   * has to go and make the photo, which is the work they did not want to do —
   * so the demo prepares the creative, and the direction line stays as the
   * explanation of why it looks like that. More than one slide posts as a
   * carousel.
   */
  creative?: readonly { readonly url: string; readonly alt: string }[];
}

export interface StaffTaskAction {
  kind: 'staff_task';
  label: string;
  /** e.g. `Mention membership options to these 7 qualifying customers.` */
  goal: string;
  /** e.g. `Target: 3 conversations.` */
  target: string;
  customers: string[];
}

export interface FrontDeskScriptAction {
  kind: 'front_desk_script';
  label: string;
  customer: string;
  level: 'high' | 'medium';
  /** The suggested words, verbatim, first person. */
  script: string;
}

export interface StaffChallengeAction {
  kind: 'staff_challenge';
  label: string;
  /** e.g. `Seven-day lotion challenge` */
  name: string;
  /** e.g. `Retail attachment` */
  metric: string;
  days: number;
  staff: { name: string; progress: number; target: number }[];
}

export interface UvaluxOrderAction {
  kind: 'uvalux_order';
  label: string;
  items: { sku: string; name: string; qty: number }[];
  note: string;
}

export interface CoachingRequestAction {
  kind: 'coaching_request';
  label: string;
  topic: string;
  note: string;
}

export type OpportunityAction =
  | SmsAction
  | EmailAction
  | SocialAction
  | StaffTaskAction
  | FrontDeskScriptAction
  | StaffChallengeAction
  | UvaluxOrderAction
  | CoachingRequestAction;

export type ActionKind = OpportunityAction['kind'];

/** "Handle it" (brainstorm §28): the prepared plan the owner approves whole. */
export interface HandleItPlan {
  audience: string;
  offer: string;
  copy: string;
  schedule: string;
  /** e.g. `Nothing sends until you approve.` */
  approvalNote: string;
}

/* ---- the opportunity ------------------------------------------------------ */

export interface Opportunity {
  id: string;
  category: OpportunityCategory;
  /** Plain imperative, e.g. `Fill Tuesday afternoon`. */
  title: string;
  /** What changed, one sentence, grade-7. */
  whatChanged: string;
  /** Why it matters, one sentence. */
  whyItMatters: string;
  /** Dollar framing shown large, e.g. `+$740/mo` or `$350–$500`. */
  impactLabel: string;
  /** Midpoint dollars/month, used only for ordering. */
  impactMonthly: number;
  confidence: OpportunityConfidence;
  /** One sentence backing the confidence, e.g. persistence or data shortage. */
  confidenceNote: string;
  urgency: OpportunityUrgency;
  actions: OpportunityAction[];
  handleIt?: HandleItPlan;
  /**
   * Where this opportunity's METHOD comes from — the UVALUX analytics advisory.
   * De-identified by rule: this is the source's app label, never a person's name.
   * Rendered as a small "Method" line on the card.
   */
  methodSource?: { label: string; basis: string };
}

/* ---- measured outcomes (brainstorm §12–13) -------------------------------- */

export interface OpportunityOutcome {
  id: string;
  /** Title of the opportunity this action came from. */
  opportunityTitle: string;
  actionTaken: string;
  /** e.g. `14 conversations · 9 follow-up texts` */
  executed: string;
  /** e.g. `5 new memberships` */
  result: string;
  /** e.g. `+$375/mo recurring` */
  revenueLabel: string;
  revenueMonthly: number;
  /** e.g. `Jul 8 – Aug 5` */
  window: string;
  /** What the system learned, one sentence. */
  learned: string;
}
