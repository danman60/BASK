/**
 * Demo dataset for Sunset Ridge Tanning (August 2026).
 *
 * Ranking is by `impactMonthly` descending, pre-sorted here.
 */
import type { Opportunity, OpportunityOutcome } from './types';

export const DEMO_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-retail-attach',
    methodSource: { label: 'UVALUX analytics method', basis: 'Retail attachment benchmarked across 300+ salons' },

    category: 'retail',
    title: 'Improve evening retail sales',
    whatChanged: 'Retail attachment fell from 21% to 14% while visits stayed normal; most of the drop is evening shifts.',
    whyItMatters: 'This decline in evening retail sales could cost the salon about $1,270 per month in lost revenue.',
    impactLabel: '+$1,270/mo',
    impactMonthly: 1270,
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
        facebook: 'Post about featured lotion',
        instagram: 'Story promoting featured lotion',
        cta: 'Try it for yourself',
        imageDirection: 'Lotion bottle on a table with soft lighting'
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
    methodSource: { label: 'UVALUX analytics method', basis: 'Membership-conversion profile from the advisory playbook' },

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
    id: 'opp-recover-payments',
    methodSource: { label: 'UVALUX analytics method', basis: 'Failed-payment recovery benchmark' },

    category: 'membership',
    title: 'Recover seven failed payments',
    whatChanged: 'Seven membership payments failed this month; the members still visit.',
    whyItMatters: 'These failed payments represent $412 in lost revenue that could be recovered.',
    impactLabel: '+$412/mo',
    impactMonthly: 412,
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
        facebook: 'Post about Tuesday afternoon special',
        instagram: 'Story promoting Tuesday afternoon offer',
        cta: 'Book now',
        imageDirection: 'Group of customers smiling in a salon'
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
    id: 'opp-reorder-bronzer',
    category: 'retail',
    title: 'Reorder before the shelf goes empty',
    whatChanged: 'Hempz Botanical Sunshine Revitalizing Bronzer sells out in about 8 days at current pace.',
    whyItMatters: 'Running out of this popular bronzer could cost the salon about $600 per month in lost sales.',
    impactLabel: 'Protect ~$600/mo',
    impactMonthly: 600,
    confidence: 'high',
    confidenceNote: 'This is protection, not growth. Note this in the confidenceNote.',
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
    id: 'opp-redlight-use',
    category: 'operations',
    title: 'Wake up the red-light room',
    whatChanged: 'Red-light equipment sits idle roughly seven of every ten open hours; 112 customers look like good candidates.',
    whyItMatters: 'This underutilized equipment could be generating revenue but currently produces no income.',
    impactLabel: 'Worth testing',
    impactMonthly: 0,
    confidence: 'worth_testing',
    confidenceNote: 'Not enough history to size it — say so honestly in the confidenceNote.',
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