/**
 * The guidance dictionary — every user-facing string in the Guidance Layer.
 *
 * IMPLEMENTATION_SPEC §3.7: copy lives here, never inline in JSX. Two reasons that
 * both bite later: a tone-review pass before the Nick demo has to be doable by reading
 * ONE file, and Quebec/French is a real UVALUX region — we are not building i18n now,
 * but inline strings would foreclose it.
 *
 * Register (IMPLEMENTATION_SPEC §3.4, DESIGN_SPEC §5):
 *   - ~grade 7 reading level. Short sentences. No jargon in `label` or `what`.
 *   - The technical term (MRR, attachment rate) may appear ONLY inside `how`, after
 *     the plain-language explanation has already landed.
 *   - Consequences are concrete and count real people: "43 people", not "your list".
 *   - Buttons state outcomes. Banned: Submit, OK, Confirm, Execute.
 */

/** An "explain this metric" popover: what it is, how it is worked out, why it matters. */
export interface MetricExplainer {
  /** the metric's plain-language name, as shown on screen */
  label: string;
  /** what it is — one sentence, no jargon */
  what: string;
  /** how it is computed — the only place a technical term may appear */
  how: string;
  /** why the owner should care — tie it to money or time */
  why: string;
}

/** A plain tooltip for an icon-only control or an unfamiliar word. */
export interface Tip {
  label: string;
  body: string;
}

/** A teaching empty state: what will appear here, why it helps, first action. */
export interface EmptyState {
  title: string;
  body: string;
  action: string;
}

/** One spotlight step in a first-run tour. */
export interface TourStep {
  title: string;
  body: string;
}

export interface Tour {
  id: string;
  /** shown when the tour is offered or replayed from the header "?" */
  label: string;
  steps: TourStep[];
}

/* ------------------------------------------------------------------ metrics */

export const METRICS = {
  retailAttachment: {
    label: 'Retail sold with sessions',
    what: 'How often someone buys a lotion or a spray along with their tanning session.',
    how: 'Out of every 100 sessions, the number where the customer also bought a product. Sometimes called the retail attachment rate.',
    why: 'Products earn more per sale than session time does. A few points here is usually the fastest money in the salon.',
  },
  membershipRevenue: {
    label: 'Money coming in monthly from memberships',
    what: 'What your members pay you every month, added up.',
    how: 'Every active membership at its monthly price, added together. Packages and one-off visits are not counted, because those do not repeat. The industry word for this is MRR.',
    why: 'This is the money you can count on before anyone walks in the door. It is the number that makes a slow week survivable.',
  },
  sessionTiming: {
    label: 'Time between sessions',
    what: 'How long a customer has to wait before they can tan again.',
    how: 'Counted from the end of their last session. The gap comes from their skin type and the equipment they used.',
    why: 'It is a safety rule, not a suggestion. Booking someone too soon risks a burn, and the salon carries that.',
  },
  capacityUse: {
    label: 'How full your rooms are',
    what: 'The share of your open hours that rooms are actually in use.',
    how: 'Minutes booked, divided by minutes open. We count every room you had open that day.',
    why: 'Empty rooms still cost you rent and power. Quiet stretches are where a promotion pays for itself.',
  },
  failedPayments: {
    label: 'Payments that did not go through',
    what: 'Memberships whose card was declined this month.',
    how: 'Every membership charge the bank refused, minus the ones that have since been paid.',
    why: 'Most of these are just an expired card. A quick message usually gets the money back — but only if someone asks.',
  },
  stockCover: {
    label: 'Days of stock left',
    what: 'How many days you can keep selling a product before you run out.',
    how: 'What is on the shelf divided by how much you have been selling per day recently.',
    why: 'Running out of a product your regulars buy sends them to another salon to get it.',
  },
} as const satisfies Record<string, MetricExplainer>;

export type MetricKey = keyof typeof METRICS;

/* --------------------------------------------------------------------- tips */

export const TIPS = {
  dismissInsight: {
    label: 'Not useful',
    body: 'Hides this from today. You can bring it back from the Insights list.',
  },
  consentProtected: {
    label: 'Why some details are hidden',
    body: 'This salon shares only summary numbers. Their customer details stay with them.',
  },
  demoClock: {
    label: 'Demo date',
    body: 'The date the app is pretending it is right now, so a whole month can be shown in a minute.',
  },
  roomMaintenance: {
    label: 'Out of service',
    body: 'This room is closed for repairs, so nobody can be booked into it.',
  },
} as const satisfies Record<string, Tip>;

export type TipKey = keyof typeof TIPS;

/* ------------------------------------------------------------- consequences */

/**
 * WhisperNote copy — the small trust lines that sit at the point of action.
 * Functions where a real count belongs in the sentence, per DESIGN_SPEC §5.
 */
export const WHISPERS = {
  campaignAudience: (people: number) =>
    `Goes to ${people} ${people === 1 ? 'person' : 'people'} who agreed to texts.`,
  nothingSendsYet: 'Nothing sends until you read it and press send.',
  undoAvailable: 'You can undo this for the next few seconds.',
  demoData: 'These are practice numbers, not a real salon.',
  consentSummaryOnly: 'Summary numbers only — this salon keeps its customer details private.',
} as const;

export type WhisperKey = keyof typeof WHISPERS;

/* ------------------------------------------------------------- empty states */

export const EMPTY_STATES = {
  campaigns: {
    title: 'No campaigns yet',
    body: 'When you make one, it will live here — the message, who it went to, and what it earned back. Bask writes the first draft for you, so you are editing rather than starting at a blank page.',
    action: 'Try one',
  },
  insights: {
    title: 'Nothing needs you this morning',
    body: 'Bask reads yesterday every night and puts anything worth your time here — a product running low, a payment that failed, a quiet afternoon worth filling. A clear list means it found nothing.',
    action: 'See how yesterday went',
  },
  callList: {
    title: 'No calls lined up',
    body: 'Salons that could use a hand show up here, newest first, with the reason they surfaced and what to say. The list builds itself overnight from what their numbers are doing.',
    action: 'Look at the whole portfolio',
  },
} as const satisfies Record<string, EmptyState>;

export type EmptyStateKey = keyof typeof EMPTY_STATES;

/* -------------------------------------------------------------------- tours */

export const TOURS = {
  today: {
    id: 'today',
    label: 'Show me around this page',
    steps: [
      {
        title: 'Start with the letter',
        body: 'Every morning Bask writes up how yesterday went, in plain sentences. Read this first and you know where the salon stands.',
      },
      {
        title: 'Then the cards below',
        body: 'Each card is one thing worth your attention, with the numbers behind it. They are in order — the top one matters most today.',
      },
      {
        title: 'Every card has a next step',
        body: 'The button on a card does the obvious thing about it. Nothing sends or charges anyone until you read it and say go.',
      },
    ],
  },
} as const satisfies Record<string, Tour>;

export type TourKey = keyof typeof TOURS;

/* ------------------------------------------------------------- tour chrome */

/** Strings the tour driver itself needs — kept here so no UI string is inline. */
export const TOUR_UI = {
  next: 'Next',
  back: 'Back',
  done: 'Got it',
  skip: 'Skip for now',
  replay: 'Show me around',
  progress: (step: number, total: number) => `Step ${step} of ${total}`,
} as const;

/** Chrome for the <Guided> popover. */
export const GUIDED_UI = {
  explainLabel: (metric: string) => `What does "${metric}" mean?`,
  close: 'Close',
  whatHeading: 'What it is',
  howHeading: 'How it is worked out',
  whyHeading: 'Why it matters',
} as const;
