/**
 * Demo dataset for Sunset Ridge Tanning (August 2026).
 *
 * Ranking is by `impactMonthly` descending, pre-sorted here.
 *
 * `methodSource` comes off the registry in `../sources/experts.ts` — it is NOT
 * typed out here. Three of these opportunities used to carry hand-copied label
 * and basis strings, which meant the registry (the thing that enforces the
 * de-identification rule) was imported by nobody and a future edit could put a
 * person's name on a card without tripping anything. Naming the technique makes
 * the registry the single place attribution copy can come from.
 *
 * An opportunity whose technique is not in the registry gets NO method line.
 * `opp-fill-tuesday` (off-peak capacity), `opp-reorder-bronzer` (stock cover)
 * and `opp-redlight-use` (idle equipment) are those cases — they are left bare
 * rather than given the nearest-sounding method, because a method line that
 * does not match the method is worse than no method line.
 */
import { methodSourceFor } from '../sources/experts';

import type { Opportunity, OpportunityOutcome } from './types';

/**
 * Registry lookup, narrowed to what a card renders.
 *
 * Throws on an unknown key rather than silently dropping the line: a typo'd
 * technique should fail at import, not quietly un-cite a recommendation.
 */
function method(technique: string): { label: string; basis: string } {
  const source = methodSourceFor(technique);
  if (!source) throw new Error(`Unknown method technique: ${technique}`);
  return { label: source.label, basis: source.basis };
}

export const DEMO_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-retail-attach',
    methodSource: method('retail_attachment'),

    category: 'retail',
    title: 'Improve evening retail sales',
    /* Re-derived from the rebuilt fixtures on 2026-08-27, and it has to STAY
       derived: this card is the first thing a stakeholder reads, and it used to
       claim "21% to 14%" against a dataset that measured 8.07%. A 21% retail
       attachment rate is not a tanning salon — the real SalonTouch field data
       runs 5.2–9.4% across four salons — so the old copy was both wrong about
       the demo and wrong about the industry, in front of someone who sells to
       that industry for a living.

       Measured at day zero: 217 retail lines over 2,612 visits in the 28-day
       baseline (8.3%) against 88 over 1,488 in the 14-day window (5.9%), at an
       average product line of ~$55. 3,235 visits a month × 2.4pp × $55 ≈ $4,260. */
    whatChanged: 'Retail attachment fell from 8.3% to 5.9% while visits stayed normal; most of the drop is evening shifts.',
    whyItMatters: 'This decline in evening retail sales could cost the salon about $4,260 per month in lost revenue.',
    impactLabel: '+$4,260/mo',
    impactMonthly: 4260,
    confidence: 'high',
    confidenceNote: 'Four weeks of persistent signal, also below similar salons.',
    urgency: 'this_week',
    actions: [
      {
        kind: 'staff_challenge',
        label: 'Start the challenge',
        name: 'Seven-day lotion challenge',
        metric: 'Retail attachment',
        days: 7,
        staff: [
          { name: 'Maya', progress: 4, target: 5 },
          { name: 'Jordan', progress: 1, target: 5 },
          { name: 'Priya', progress: 2, target: 5 }
        ]
      },
      {
        kind: 'social',
        label: 'Approve & post to Facebook and Instagram',
        facebook: 'Evenings are our quietest hours and our best staff are on. If you have been meaning to ask which lotion is actually right for your skin, tonight is the night to do it — no queue, no rush.',
        instagram: 'The one your skin actually wants. Come in after 5 and ask us — we will be honest about which of the four is right for you, and it is usually not the most expensive one.',
        cta: 'Try it for yourself',
        imageDirection: 'Lotion bottle on a table with soft lighting',
        creative: [
          { url: '/community/ig-retail-1.webp', alt: 'A cream and terracotta post reading "The one your skin actually wants"' },
          { url: '/community/wall-eye.webp', alt: 'A tidy row of lotion bottles at eye level on the retail shelf' },
        ],
      },
      {
        kind: 'coaching_request',
        label: 'Request coaching',
        topic: 'Evening retail confidence',
        note: 'How to engage customers during evening shifts'
      }
    ]
  },
  {
    id: 'opp-membership-convert',
    methodSource: method('membership_penetration'),

    category: 'membership',
    title: 'Convert 17 regulars to members',
    whatChanged: '17 frequent visitors match the high-conversion profile (3+ visits in first 21 days converts at 31% vs 9% overall).',
    whyItMatters: 'Converting these regular customers to memberships could bring in an extra $640 per month.',
    impactLabel: '+$640/mo',
    impactMonthly: 640,
    confidence: 'high',
    confidenceNote: 'Four weeks of persistent signal, also below similar salons.',
    urgency: 'this_week',
    actions: [
      {
        kind: 'front_desk_script',
        label: 'Prepare script',
        customer: 'Regular · visits 2×/week',
        level: 'high',
        script: 'I see you visit regularly. Have you considered membership? It would actually cost less than paying per visit.'
      },
      {
        kind: 'sms',
        label: 'Approve & text 17 customers',
        recipientCount: 17,
        message: 'Hi there! Did you know that a membership could save you money compared to pay-per-visit pricing?',
        costNote: '17 messages · about $1.20'
      },
      {
        kind: 'email',
        label: 'Approve & email 17 customers',
        recipientCount: 17,
        subject: 'Do the math on your membership savings',
        body: 'We calculated that a membership would actually cost less than paying per visit for your regular visits.'
      }
    ]
  },
  {
    id: 'opp-reorder-bronzer',
    category: 'retail',
    title: 'Reorder before the shelf goes empty',
    whatChanged: 'Hempz Botanical Sunshine Revitalizing Bronzer sells out in about 8 days at current pace.',
    whyItMatters: 'Running out of this popular bronzer could cost the salon about $600 per month in lost sales.',
    impactLabel: 'Protect ~$600/mo',
    impactMonthly: 600,
    confidence: 'high',
    /* Second instruction-to-self found in shipped copy, same sweep, same cause:
       "This is protection, not growth. Note this in the confidenceNote." The
       point it makes is a good one and worth saying to the owner — this card
       defends revenue rather than adding any — so it is now said to them. */
    confidenceNote: 'This protects money you already make, rather than adding new.',
    urgency: 'now',
    actions: [
      {
        kind: 'uvalux_order',
        label: 'Add to UVALUX order',
        items: [
          {
            sku: 'BSK-10007',
            name: 'Hempz Botanical Sunshine Revitalizing Bronzer',
            qty: 12
          }
        ],
        note: 'Adds to existing UVALUX draft order'
      }
    ]
  },
  {
    id: 'opp-fill-tuesday',
    category: 'marketing',
    title: 'Fill Tuesday afternoon',
    whatChanged: 'Next Tuesday 1–4 PM is running well below its usual bookings.',
    whyItMatters: 'This low booking rate could cost the salon $350–$500 in lost revenue.',
    impactLabel: '$350–$500',
    impactMonthly: 425,
    confidence: 'worth_testing',
    confidenceNote: 'One week of signal so far.',
    urgency: 'this_week',
    actions: [
      {
        kind: 'sms',
        label: 'Approve & text 24 customers',
        recipientCount: 24,
        message: 'We have a special offer for Tuesday afternoons this week. Come enjoy a discount on your usual services.',
        costNote: '24 messages · about $1.80'
      },
      {
        kind: 'social',
        label: 'Approve & post to Facebook and Instagram',
        facebook: 'Tuesday afternoons are our quietest stretch, so we are making them worth your while: 20% off any session between 1 and 4pm this week. No booking needed, just come in.',
        instagram: 'Tuesday afternoons are quiet. 20% off 1-4pm this week — walk in, no appointment. Bring someone who has been putting it off.',
        cta: 'Book now',
        imageDirection: 'Group of customers smiling in a salon',
        creative: [
          { url: '/community/promo-1.webp', alt: 'A post reading "Tuesday afternoons are quiet, 20% off 1-4pm this week"' },
          { url: '/community/room-quiet.webp', alt: 'The empty reception area on a quiet weekday afternoon' },
        ],
      }
    ],
    handleIt: {
      audience: '24 customers who usually visit on weekday afternoons and respond to offers',
      offer: 'Special Tuesday afternoon discount',
      copy: 'Come enjoy a discount on your usual services this Tuesday afternoon.',
      schedule: 'Sends Monday at 10 AM if you approve',
      approvalNote: 'Nothing sends until you approve.'
    }
  },
  {
    id: 'opp-recover-payments',
    methodSource: method('revenue_hygiene'),

    category: 'membership',
    title: 'Recover seven failed payments',
    /* $412 matched nothing. Measured 2026-08-27: seven memberships sit at
       payment_state='failed' worth $523/mo in total, of which FOUR are
       recoverable at exactly $284/mo — one gold, one silver, two bronze, which
       `ARCS.failedPayments.recoverableTiers` in the fixture constants spells out
       and calls "the number the mockup quotes". The card was quoting neither the
       total nor the recoverable figure. $284 is the honest one: it is what the
       action on this card can actually win back. */
    whatChanged: 'Seven membership payments failed this month; the members still visit.',
    whyItMatters: 'Four of the seven look recoverable — about $284 a month, from members who never left.',
    impactLabel: '+$284/mo',
    impactMonthly: 284,
    confidence: 'high',
    confidenceNote: 'Four weeks of persistent signal, also below similar salons.',
    urgency: 'now',
    actions: [
      {
        kind: 'sms',
        label: 'Approve & text 7 customers',
        recipientCount: 7,
        message: 'Hi there! We had trouble processing your payment. Could you please update your card details?',
        costNote: '7 messages · about $0.50'
      },
      {
        kind: 'staff_task',
        label: 'Assign task',
        goal: 'Mention membership payments gently at check-in',
        target: 'Target: 4 conversations.',
        customers: ['Customer1', 'Customer2', 'Customer3', 'Customer4', 'Customer5', 'Customer6', 'Customer7']
      }
    ]
  },
  {
    id: 'opp-redlight-use',
    category: 'operations',
    title: 'Wake up the red-light room',
    whatChanged: 'Red-light equipment sits idle roughly seven of every ten open hours; 112 customers look like good candidates.',
    whyItMatters: 'This underutilized equipment could be generating revenue but currently produces no income.',
    impactLabel: 'Worth testing',
    impactMonthly: 0,
    confidence: 'worth_testing',
    /* This shipped as "Not enough history to size it — say so honestly in the
       confidenceNote." The second half is an instruction to whoever was writing
       the card, and it was rendering on Today, in the demo. Found by looking at
       a screenshot, not by any check: nothing validates copy for being about
       itself. The instruction was right, so it is now simply followed. */
    confidenceNote: 'Not enough history yet to put a number on this one.',
    urgency: 'this_month',
    actions: [
      {
        kind: 'email',
        label: 'Approve & email 112 customers',
        recipientCount: 112,
        subject: 'Special offer for red-light services',
        body: 'We have a special offer for our red-light services that might interest you.'
      },
      {
        kind: 'coaching_request',
        label: 'Request coaching',
        topic: 'Marketing red light without discounting UV',
        note: 'How to promote red-light services effectively without offering discounts'
      }
    ]
  }
];

export const DEMO_OUTCOMES: OpportunityOutcome[] = [
  {
    id: 'out-membership-june',
    opportunityTitle: 'Convert regulars to members',
    actionTaken: 'Front-desk conversations + SMS follow-up',
    executed: '14 conversations · 9 follow-up texts',
    result: '5 new memberships',
    revenueLabel: '+$375/mo recurring',
    revenueMonthly: 375,
    window: 'Jun 30 – Jul 28',
    learned: 'Staff conversations beat discounts for this group — nobody needed money off.'
  },
  {
    id: 'out-reactivation-july',
    opportunityTitle: 'Reactivation campaign',
    actionTaken: 'Reactivation SMS to 42 lapsed customers',
    executed: '40 delivered',
    result: '11 came back · 8 bought product',
    revenueLabel: '$684 revenue · $96 in discounts',
    revenueMonthly: 684,
    window: 'Jul 8 – Aug 5',
    learned: 'The sweet spot was 18–25 days after their usual visit gap broke.'
  }
];