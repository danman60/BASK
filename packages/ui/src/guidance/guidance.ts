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

  /* --- Lane 4 (Inventory + Insights/Peers) ------------------------------- */

  sellThroughPace: {
    label: 'How fast it is selling',
    what: 'The number of bottles of one product that leave the shelf on an average day.',
    how: 'Everything sold in the last 30 days, plus what your staff used in the rooms, divided by 30. Nothing here is typed in by hand — it is counted from your till.',
    why: 'It is the number that turns "we have got sixteen" into "that is three weeks" — which is the only version you can order against.',
  },
  salesPerShift: {
    label: 'Product sales per shift',
    what: 'The value of products one person sells on a day they are working.',
    how: 'Their product sales over the last two weeks, divided by the number of days they actually rang something through.',
    why: 'It shows who is comfortable talking about products at the counter, so you know who to pair a newer person with.',
  },
  peerGap: {
    label: 'The gap to businesses like yours',
    what: 'The difference between your number and the middle number for salons of your size.',
    how: 'Every participating salon shares summary figures only. We line them up, take the middle one, and compare it to yours. Nobody is named, and a group smaller than eight salons is never shown at all.',
    why: 'A gap is an amount of money, not a grade. It tells you what is realistically there to pick up, at your own traffic.',
  },
  roomUtilisation: {
    label: 'How full each hour is',
    what: 'The share of your rooms that were actually in use, hour by hour, across a normal week.',
    how: 'Sessions that ran in that hour, divided by the sessions that could have run in it — your open rooms across four weeks of that same weekday.',
    why: 'Quiet hours are where a promotion pays for itself, and full hours are the argument for another room.',
  },
  revenueToday: {
    label: 'Revenue',
    what: 'Money taken at the front desk so far today.',
    how: 'Every sale rung up today, added together, up to the moment you opened this page. Refunds come back off.',
    why: 'It tells you by mid-morning whether today is tracking like a normal day or needs a nudge.',
  },
  bookingsToday: {
    label: 'Bookings today',
    what: 'People expected in the salon today.',
    how: 'Every booking on the books for today, whether it came from the phone, the front desk, or online.',
    why: 'It is the day at a glance — and the first place a quiet afternoon shows up while you can still fill it.',
  },
  inSalonNow: {
    label: 'In the salon now',
    what: 'People checked in and not yet gone.',
    how: 'Anyone checked in whose session has not finished and who has not checked out.',
    why: 'Tells you if the front desk is busy before you walk out there.',
  },
  roomsInUse: {
    label: 'Rooms in use',
    what: 'How many of your rooms have someone in them right now.',
    how: 'Rooms with a session running, out of the rooms you have open today. Rooms closed for repairs are left out.',
    why: 'Rooms sitting empty still cost you rent and power.',
  },
  impactEstimate: {
    label: 'What it is worth',
    what: 'Our best estimate of the money involved in this finding.',
    how: 'Worked out from your own numbers — how much moved, times what it usually sells for. The card says which figures went into it.',
    why: 'It is why the cards are in this order. The top one is the biggest number, not the loudest one.',
  },
  onPace: {
    label: 'On pace',
    what: 'Today is running about the same as a normal day like this one.',
    how: 'Today so far compared with the same hours on the last few of the same weekday.',
    why: 'A morning is not a day. Comparing like with like stops a slow start looking like a disaster.',
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

  /* --- Lane 4 (Inventory + Insights/Peers) ------------------------------- */

  cohortSize: {
    label: 'How many salons are in this group',
    body: 'The number of participating salons behind these figures. It is always shown, and it is never fewer than eight.',
  },
  cohortSuppressed: {
    label: 'Why this group is hidden',
    body: 'Fewer than eight salons take part in this group. With a group that small, everyone could work out whose numbers were whose, so nothing is shown at all.',
  },
  wholesalePrice: {
    label: 'Your cost',
    body: 'What you pay UVALUX per bottle. The shelf price beside it is what you charge.',
  },
  orderReason: {
    label: 'Why this is on the order',
    body: 'Every suggested line says what put it there — a shelf below its threshold, how fast it is selling, or a service that is getting busier.',
  },
  overstockFlag: {
    label: 'Sitting too long',
    body: 'There is more of this on the shelf than four months of selling would use. Money on a shelf is money you cannot spend.',
  },
  reorderPoint: {
    label: 'Reorder point',
    body: 'The count at which a product should go back on an order — roughly two weeks of selling at its usual pace.',
  },
  severityRail: {
    label: 'The coloured stripe',
    body: 'Amber means something is slipping. Green means there is money on the table.',
  },
  sparkline: {
    label: 'The little line',
    body: 'The last few weeks of this number, oldest on the left. No scale — it is there for the shape, not the reading.',
  },
  weeklyStory: {
    label: 'Your week, as a story',
    body: 'A short read-through of the whole week, ready Sunday evening. Same plain sentences as the morning letter.',
  },
  locationCompare: {
    label: 'Comparing your two locations',
    body: 'The same numbers side by side, for yesterday. The arrow points at whichever shop is ahead.',
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

  /* --- Lane 4 (Inventory + Insights/Peers) ------------------------------- */

  orderNotSentYet: 'Nothing goes to UVALUX until you read the order and press send.',
  orderGoesToRep: (lines: number) =>
    `Sends ${lines} ${lines === 1 ? 'line' : 'lines'} to your UVALUX rep. They will confirm before anything ships.`,
  peersAnonymous: (count: number) =>
    `Worked out from ${count} salons that agreed to share summary numbers. None of them are named, and neither are you.`,
  coachingRequestVisible: 'Your rep sees that you asked, and what you asked about. Nothing else.',
  challengeVisibleToStaff: 'Your team sees this on the Floor. It shows a target, never a ranking.',
  figuresFromYourTill: 'Every figure here is counted from your own sales — nothing is typed in.',
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

  /* --- Lane 4 (Inventory + Insights/Peers) ------------------------------- */

  draftOrder: {
    title: 'Your order is empty',
    body: 'Bask watches how fast every product leaves the shelf and suggests what to reorder before you run out. Each suggestion says why it is there, and nothing goes to UVALUX until you send it.',
    action: 'See what it suggests',
  },
  activityLog: {
    title: 'Nothing has happened yet today',
    body: 'Every discount, void, dismissed insight and sharing change lands here with who did it and when. It is the answer to "who changed that", without anyone having to remember.',
    action: 'See yesterday instead',
  },
  peersPrivate: {
    title: 'Peers is off while sharing is private',
    body: 'Comparisons only work if salons put numbers in, so a salon on the private setting does not get them back. Turning sharing on adds your summary figures to groups of at least eight salons — never your customers, never your takings.',
    action: 'Look at what UVALUX would see',
  },
  nextUp: {
    title: 'Nothing else booked today',
    body: 'The rest of the day is open. Anyone who books or walks in from here shows up in this list, with the time, the name and what they are booked for.',
    action: 'Open the floor',
  },
  locationCompare: {
    title: 'Nothing to compare yet',
    body: 'Your two shops sit side by side here — revenue, visits and members for yesterday, with the gap called out. The numbers start filling in as soon as both locations are ringing sales through Bask.',
    action: 'Open the floor',
  },
  daybreak: {
    title: "Your letter isn't written yet",
    body: 'Bask reads yesterday overnight and writes this up before you open the door. Move the demo clock forward a day and it appears.',
    action: 'See the numbers instead',
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

/* ------------------------------------------------------------- app shell */

/**
 * The whole app's chrome (DESIGN_SPEC §3.1 — "nav is the whole app's chrome, no
 * sidebar in Bask"). Destination LABELS live here so the six names are reviewed
 * in one place; the hrefs live with the shell because they are routing, not copy.
 */
export const SHELL_UI = {
  wordmark: 'Bask',
  nav: {
    today: 'Today',
    floor: 'The Floor',
    customers: 'Customer Health',
    marketing: 'Marketing',
    inventory: 'Inventory',
    insights: 'Analytics',
    monitor: 'Monitor',
    community: 'Community',
    ask: 'Ask',
  },
  /**
   * Tab-bar labels. Six 10px labels across a 390px bar leaves ~64px each, so the
   * two-word names lose their article rather than being ellipsised into nonsense.
   * Same destinations, same words — never a different name for the same place.
   */
  navShort: {
    today: 'Today',
    floor: 'Floor',
    customers: 'Health',
    marketing: 'Marketing',
    inventory: 'Inventory',
    insights: 'Analytics',
    monitor: 'Monitor',
    community: 'Community',
    ask: 'Ask',
  },
  navLandmark: 'Main sections',
  avatarLabel: (name: string) => `Signed in as ${name}`,
  skipToContent: 'Skip to the main part of this page',
} as const;

export type NavKey = keyof typeof SHELL_UI.nav;

/* ------------------------------------------------------------------ today */

/** Section labels and states on the Today surface. */
export const TODAY_UI = {
  queueHeading: 'Needs your attention — ranked by impact',
  queueHeadingShort: 'Needs your attention',
  pulseHeading: 'Today so far',
  nextUpHeading: 'Next up',
  comparisonHeading: 'Your two locations, yesterday',
  storyLead: 'Your week, as a story.',
  storyBody: 'Five beats, ready Sunday evening.',
  storyAction: 'Preview',
  loading: 'Reading last night’s numbers…',
  bookingHold: 'Walk-in hold',
  errorTitle: 'This page could not finish loading',
  errorBody:
    'The numbers behind your morning letter did not come back. Nothing is lost — try again, and if it keeps happening the demo database is probably still starting up.',
  errorAction: 'Try again',
} as const;

/* ---------------------------------------------------------- insight cards */

/**
 * Card mechanics copy. `Show me why` opens INLINE — never a modal — so the label
 * has to promise an expansion, and the close label has to promise a collapse.
 */
export const INSIGHT_UI = {
  showWhy: 'Show me why',
  hideWhy: 'Hide the detail',
  showWhyShort: 'Why',
  dismiss: 'Dismiss',
  dismissPrompt: 'Why are you putting this away?',
  dismissCancel: 'Keep it',
  dismissReasons: [
    { key: 'not_relevant', label: 'Not relevant to me' },
    { key: 'already_handled', label: 'Already handled it' },
    { key: 'snooze', label: 'Remind me next week' },
  ],
  undoToast: (title: string) => `Put away: ${title}`,
  undoAction: 'Undo',
  undoDismissLabel: 'Close this message',
  dismissFailed: 'That did not save. It is still on your list — try again.',
  drilldownHeading: 'What we measured',
  factorsHeading: "What's behind it",
  basisHeading: 'How the money figure works',
  windowLabel: (label: string) => `Measured over the ${label}.`,
  comparisonLabel: (baseline: string, current: string) => `${baseline} before · ${current} now`,
  shareLabel: (percent: number) => `${percent}% of the movement`,
  noSeries: 'There is no day-by-day trend for this one — it is a single count.',
} as const;

export type DismissReasonKey = (typeof INSIGHT_UI.dismissReasons)[number]['key'];
