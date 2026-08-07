/**
 * Studio copy.
 *
 * Same rule as `@bask/ui`'s guidance dictionary (IMPLEMENTATION_SPEC §3.7):
 * user-facing strings live in one file, never inline in JSX, so a tone pass
 * before the demo is one file to read.
 *
 * It sits here rather than in `packages/ui/src/guidance/guidance.ts` because
 * that dictionary belongs to Lane 1 under the M1 merge protocol — lanes request
 * additions rather than editing it. Everything below is a candidate to fold in
 * at merge; the shapes match. Where a key ALREADY exists there
 * (`WHISPERS.campaignAudience`, `EMPTY_STATES.campaigns`) this file does not
 * restate it — the components import the dictionary directly.
 */

export const STUDIO_COPY = {
  hub: {
    title: 'Studio',
    body: 'Campaigns that come from what your numbers already say. Pick one of these, or start from nothing — either way, nothing sends until you say so.',
    startCampaign: 'Start a campaign',
    tabs: { ideas: 'Ideas', campaigns: 'Campaigns', calendar: 'Calendar' },
    loadingIdeas: 'Reading this week’s numbers…',
    loadingCampaigns: 'Loading campaigns…',
    loadingCalendar: 'Loading the calendar…',
    buildThis: 'Build this',
    fromInsight: 'From an insight',
    fromCustomers: 'From your customers',
    noIdeas: {
      title: 'Nothing needs a campaign this week',
      body: 'Bask suggests campaigns when the numbers ask for one — a quiet stretch, a group going quiet, packages running out. None of those are happening right now.',
      action: 'Start one anyway',
    },
  },

  steps: { goal: 'Goal', audience: 'Audience', offer: 'Offer', review: 'Review', schedule: 'Schedule' },

  goal: {
    title: 'What do you want this campaign to do?',
    sub: 'One line. It shapes every word that gets written.',
    label: 'Goal',
    placeholder: 'Fill Tuesday afternoon',
    hint: 'Plain language beats marketing language. “Fill Tuesday 2–5 pm” is a better goal than “drive midweek engagement”.',
    next: 'Next — pick who it goes to',
  },

  audience: {
    title: 'Who should get this?',
    sub: 'Counts are live — they come from your customers, not a saved list.',
    segmentsLabel: 'Smart segments',
    channelsLabel: 'Where it goes',
    channelHint:
      'Texts and emails only reach people who agreed to them. Instagram and Facebook are public posts, so everyone sees those.',
    reaching: 'Reaching',
    next: 'Next — set the offer',
    textsOk: (n: number) => `${n} texts OK`,
    emailsOk: (n: number) => `${n} emails OK`,
  },

  offer: {
    title: 'What’s the offer?',
    sub: 'Bask suggested this one. Change it to anything inside your limits.',
    offerLabel: 'The offer',
    validityLabel: 'Good for',
    generate: 'Generate the campaign',
    generating: 'Writing your campaign…',
    useSuggestion: (headline: string) => `Use ${headline}`,
  },

  review: {
    title: 'Here’s your campaign. Change anything.',
    sub: 'Every word is editable — tap any text.',
    channels: { instagram: 'Instagram post', sms: 'Text message' },
    regenerate: '↻ Regenerate',
    emailSubject: 'Email subject',
    emailBody: 'Email body',
    facebook: 'Facebook post',
    audience: 'Audience',
    schedule: 'Schedule',
    send: 'Send',
    offerValid: 'Offer valid',
    resultsTracked: 'Results tracked',
    resultsAutomatic: 'Automatic',
    preview: 'Preview on a phone',
    scheduleCampaign: 'Schedule campaign',
    scheduling: 'Scheduling…',
    afterSchedule: 'You’ll see bookings and revenue from this campaign on Today.',
    people: (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`,
    characters: (n: number) => `${n} characters`,
    credits: (n: number) => `${n} credit${n === 1 ? '' : 's'} each`,
    /** The mockup's exact consent line: audience count, then the hard promise. */
    nothingSendsUntilSchedule: 'Nothing sends until you press Schedule.',
    textsOk: 'Texts OK',
    emailsOk: 'Emails OK',
  },

  preview: {
    tabs: { instagram: 'Instagram', sms: 'Text', email: 'Email' },
    title: 'This is what lands',
    body: 'Names fill in per person — the preview uses a real customer’s first name so you can see the spacing.',
    back: 'Back to editing',
  },

  scheduled: {
    title: (when: string) => `Scheduled. It goes out ${when}`,
    body: (people: number) =>
      `${people} ${people === 1 ? 'person' : 'people'} will get it. Nothing has gone out yet — advance the demo clock past the send date and the results land on Today.`,
    seeCampaigns: 'See all campaigns',
    backToToday: 'Back to Today',
  },

  context: {
    fixing: (title: string) => `Fixing: ${title}.`,
    why: 'Why this offer',
    hideWhy: 'Hide',
    whyHeading: 'Why this offer',
  },

  provenance: {
    ai: (model: string) => `Written by ${model}`,
    fallback: 'Written from your salon’s templates',
  },

  list: {
    people: 'people',
    bookings: 'bookings',
    notScheduled: 'Not scheduled',
    waitingToSend: 'waiting to send',
    previous: '← Previous',
    next: 'Next →',
  },

  loadingContext: 'Loading your salon’s numbers…',
  back: 'Back',
} as const;
