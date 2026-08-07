/**
 * Customers copy. Same rule and same reasoning as `../marketing/copy.ts`:
 * strings in one file, never inline in JSX (IMPLEMENTATION_SPEC §3.7), sitting
 * beside the surface rather than in Lane 1's `@bask/ui` dictionary.
 */

export const CUSTOMERS_COPY = {
  title: 'Customers',
  body: 'Everyone who has been through the door. Search by name, phone or email, or start from one of the groups below.',
  searchPlaceholder: 'Search by name, phone or email',
  matched: (shown: number, total: number) =>
    shown === total ? `${total} people` : `${shown} of ${total}`,
  allCustomers: 'Everyone',
  loading: 'Loading your customers…',
  pickSomeone: 'Pick someone from the list to see their history, packages and what they buy.',

  tabs: {
    visits: 'Visits',
    products: 'Products',
    account: 'Account',
    notes: 'Notes',
  },

  stats: {
    spend: 'Spent, all time',
    visits: 'Visits',
    last: 'Last in',
    visits90: 'Visits, 90 days',
    never: 'Never',
    daysAgo: (n: number) => (n === 0 ? 'Today' : n === 1 ? 'Yesterday' : `${n} days ago`),
  },

  membership: {
    heading: 'Membership',
    none: 'No membership — pays per visit or by package.',
    monthly: (amount: string) => `${amount} a month`,
    nextBilling: 'Next payment',
    paymentState: {
      current: 'Paying fine',
      failed: 'Payment did not go through',
      past_due: 'Behind on payment',
      recovered: 'Payment sorted',
    },
  },

  packages: {
    heading: 'Packages',
    none: 'No packages.',
    remaining: (left: number, total: number) => `${left} of ${total} left`,
    expires: (when: string) => `Expires ${when}`,
  },

  products: {
    heading: 'What they buy',
    none: 'Nothing bought yet.',
    favourite: 'Their usual',
    boughtTimes: (n: number, when: string) =>
      `${n} time${n === 1 ? '' : 's'} · last on ${when}`,
    everyDays: (n: number) => `about every ${n} days`,
    dueNow: 'Likely due',
    dueIn: (n: number) => `due in ${n} days`,
    overdue: (n: number) => `${n} days overdue`,
    noPattern: 'only bought once',
  },

  consent: {
    heading: 'Waiver and permissions',
    waiver: 'Waiver signed',
    waiverNo: 'Not signed',
    sms: 'Agreed to texts',
    email: 'Agreed to emails',
    photo: 'Agreed to photos',
    yes: 'Yes',
    no: 'No',
  },

  notes: {
    heading: 'Notes',
    hint: 'Anything the next person on the desk should know. Everyone at the salon can see this.',
    save: 'Save note',
    saving: 'Saving…',
    saved: 'Saved',
  },

  timeline: {
    heading: 'Visits',
    none: 'No visits yet.',
  },

  recovery: {
    title: 'Payments that did not go through',
    body: 'Most of these are an expired card. Bask ranks them by whether the person is still coming in — those are the ones worth a message.',
    open: 'Failed payments',
    back: 'Back to customers',
    counts: {
      failed: 'Failed this month',
      recoverable: 'Look recoverable',
      recovered: 'Sorted out',
    },
    value: (amount: string) => `${amount} a month`,
    draftAll: 'Write the messages',
    drafting: 'Writing…',
    redraft: 'Rewrite them',
    approve: 'Send this one',
    sending: 'Sending…',
    sent: 'Sent — payment sorted',
    perMessage:
      'Read each one and send it yourself. There is no send-all button, on purpose.',
    channel: { sms: 'By text', email: 'By email' },
    noneFailed: 'No failed payments right now. Nothing to chase.',
    notRecoverable:
      'Not ranked as recoverable — a message is unlikely to land. Worth a phone call instead.',
    loading: 'Loading payments…',
  },
} as const;
