/**
 * Demo posts for the owners-only community room.
 *
 * IDENTITY RULE, same as the wins feed: a post carries the TOWN and nothing
 * else. No business name, no person's name. The two social surfaces previously
 * disagreed on this — CommunityFeed named people and salons while WinCard was
 * town-only — which would have shipped two different privacy promises on one
 * screen. Town-only wins, because consent is the licence to operate and the
 * room is only worth joining if an owner can put a real number on the table
 * without identifying their business.
 *
 * The questions are the ones the real dataset actually raises: attachment that
 * varies by shift, the upgrade conversation nobody runs, and the reactivation
 * gap the 224-cluster corpus has zero coaching for.
 */

export interface CommunityPostSeed {
  readonly id: string;
  readonly townLabel: string;
  readonly roleLabel?: string;
  /** Day index on the demo clock this was posted. */
  readonly occurredAtDay: number;
  readonly body: string;
  readonly figure?: { readonly value: string; readonly caption: string };
  readonly replyCount: number;
}

export const DEMO_COMMUNITY_POSTS: readonly CommunityPostSeed[] = [
  {
    id: 'post-1',
    townLabel: 'Burlington ON',
    occurredAtDay: 118,
    body: "Anyone else seeing evening shifts attach way worse than mornings? Mine is almost double in the AM and I cannot work out why. Same products, same shelf.",
    figure: { value: '5.9% vs 3.1%', caption: 'product per visit, AM vs PM' },
    replyCount: 7,
  },
  {
    id: 'post-2',
    townLabel: 'Barrie ON',
    occurredAtDay: 116,
    body: 'Ran the unlimited conversation with my top pay-as-you-go people after Bask flagged them. Seven took it in a week. I was scared it would feel pushy and it just did not — they were already coming four times a month.',
    figure: { value: '+7', caption: 'upgrades in one week' },
    replyCount: 3,
  },
  {
    id: 'post-3',
    townLabel: 'Kingston ON',
    occurredAtDay: 113,
    body: 'What is everyone actually saying to someone who has been gone four months? Not a discount blast — the wording. I have a long list and no script I believe in.',
    replyCount: 12,
  },
  {
    id: 'post-4',
    townLabel: 'Sudbury ON',
    occurredAtDay: 109,
    body: 'Tuesday afternoons are dead and I have stopped pretending otherwise. Moved one staff member to evenings instead of discounting the empty hours. Revenue flat, payroll down.',
    figure: { value: '−$310', caption: 'weekly payroll, same revenue' },
    replyCount: 5,
  },
];

/** Day index of the demo clock these fixtures are written against. */
export const DEMO_COMMUNITY_TODAY = 120;
