/**
 * Demo wins for the feed.
 *
 * Every figure here is drawn from what the REAL twelve-year salon dataset
 * actually showed, so the demo does not teach anyone a number the product
 * cannot reproduce:
 *   - attachment moves are stated in points off a ~5% base, not the 21% the
 *     old synthetic fixtures used
 *   - the win-back result reflects the measured finding that lapsed customers
 *     mostly return on their own after ~207 days, so the win is the COMPRESSION
 *     of that wait, never a claim of rescuing lost customers
 *   - towns are Ontario towns far enough apart to pass the non-compete filter
 *
 * Notes are written the way an owner talks, because the thesis is that the
 * "why" in a peer's own words is what moves the next owner — not the figure.
 */

import type { SalonWin } from './wins';

/** Day index of the demo clock these fixtures are written against. */
export const DEMO_WIN_TODAY = 120;

export const DEMO_WINS: readonly SalonWin[] = [
  {
    id: 'win-1',
    salonId: 'demo-salon-a',
    townLabel: 'Kingston ON',
    actionKey: 'winback-60',
    actionLabel: 'Texted everyone who had gone quiet for 60 days',
    signalType: 'customer_reactivation',
    metricLabel: 'customers back in the door',
    deltaLabel: '+34',
    improved: true,
    daysToResult: 21,
    occurredAtDay: 117,
  },
  {
    id: 'win-2',
    salonId: 'demo-salon-b',
    townLabel: 'Barrie ON',
    actionKey: 'evening-product-challenge',
    actionLabel: 'Ran a two-week product challenge on evening shifts',
    signalType: 'retail_attachment_slip',
    metricLabel: 'product per visit',
    deltaLabel: '+1.6 points',
    improved: true,
    daysToResult: 14,
    occurredAtDay: 113,
  },
  {
    id: 'win-3',
    salonId: 'demo-salon-c',
    townLabel: 'London ON',
    actionKey: 'unlimited-upgrade-convo',
    actionLabel: 'Offered unlimited to the twelve most frequent pay-as-you-go customers',
    signalType: 'membership_upgrade',
    metricLabel: 'new memberships',
    deltaLabel: '+7',
    improved: true,
    daysToResult: 9,
    occurredAtDay: 108,
  },
  {
    id: 'win-4',
    salonId: 'demo-salon-d',
    townLabel: 'Sudbury ON',
    actionKey: 'tuesday-offpeak',
    actionLabel: 'Put a Tuesday afternoon offer to customers who only ever come at peak',
    signalType: 'soft_capacity',
    metricLabel: 'Tuesday afternoon bookings',
    deltaLabel: '+22',
    improved: true,
    daysToResult: 28,
    occurredAtDay: 101,
  },
];

/** The owner's own words. Keyed by win id; this is the part data cannot supply. */
export const DEMO_WIN_NOTES: Readonly<Record<string, string>> = {
  'win-1':
    "Honestly I thought they were gone. Most of them just said they'd been meaning to come back. Half of them booked the same week.",
  'win-2':
    "We stopped asking 'anything else?' and started putting the bottle in their hand. That was the whole change.",
  'win-3':
    "I was scared it would feel pushy. It didn't — they were already coming four times a month, we were just charging them the hard way.",
  'win-4':
    "Nobody asked for a discount. They just didn't know Tuesday was quiet.",
};

/** Engagement counts, already formatted for display. */
export const DEMO_WIN_ENGAGEMENT: Readonly<
  Record<string, { likeLabel: string; commentLabel: string; liked: boolean }>
> = {
  'win-1': { likeLabel: '18', commentLabel: '6', liked: false },
  'win-2': { likeLabel: '24', commentLabel: '11', liked: true },
  'win-3': { likeLabel: '9', commentLabel: '3', liked: false },
  'win-4': { likeLabel: '12', commentLabel: '4', liked: false },
};
