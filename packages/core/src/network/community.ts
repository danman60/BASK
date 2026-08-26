/**
 * Demo posts for the owners-only community room.
 *
 * THE DIVISION OF LABOUR, and it is strict:
 *   - the WINS FEED is outcomes. A salon did a thing, the number moved, here is
 *     the measurement. Machine-derived, never authored.
 *   - the COMMUNITY is QUESTIONS. An owner does not understand something and is
 *     asking other owners. Human-authored, no measured result required.
 * A post that reports a win belongs in the wins feed. If both surfaces carry
 * wins, the room is just a second leaderboard and nobody asks anything in it —
 * which is the opposite of why it exists.
 *
 * A figure may still appear, but it is the EVIDENCE FOR THE QUESTION ("here is
 * the split I cannot explain"), never a result being celebrated.
 *
 * IDENTITY RULE, same as the wins feed: the town and nothing else. No business
 * name, no person's name. Consent is the licence to operate, and the room is
 * only worth joining if an owner can put a real number on the table without
 * identifying their business.
 *
 * The questions are ones the real twelve-year dataset actually raises.
 */

export interface CommunityPostSeed {
  readonly id: string;
  readonly townLabel: string;
  readonly roleLabel?: string;
  /** Day index on the demo clock this was posted. */
  readonly occurredAtDay: number;
  readonly body: string;
  /** Evidence FOR the question, never a result. */
  readonly figure?: { readonly value: string; readonly caption: string };
  /**
   * A picture or clip of the thing being asked about. Owners describe a shelf
   * or a room far faster by showing it. Same identity rule as everything else
   * here: nothing in frame may identify the business.
   */
  readonly media?:
    | { readonly kind: 'image'; readonly url: string; readonly alt?: string }
    | { readonly kind: 'video'; readonly url: string; readonly alt?: string; readonly poster?: string }
    | { readonly kind: 'carousel'; readonly items: readonly { readonly url: string; readonly alt?: string }[] };
  /** Counts per reaction kind. "same" is the finding, not a like: an owner
   *  asking "anyone else seeing this?" is asking how many others are. */
  readonly reactions: { readonly same: number; readonly helpful: number; readonly watching: number };
  /** Which reaction the demo viewer has already left, if any. */
  readonly mine?: 'same' | 'helpful' | 'watching' | null;
  readonly replies: readonly {
    readonly id: string;
    readonly townLabel: string;
    readonly occurredAtDay: number;
    readonly body: string;
  }[];
}

export const DEMO_COMMUNITY_POSTS: readonly CommunityPostSeed[] = [
  {
    /* The before/after set. A shelf question is answered with pictures faster
       than with any paragraph, which is the whole argument for media in here. */
    id: 'post-wall',
    townLabel: 'St. Catharines ON',
    occurredAtDay: 120,
    body: 'Moved my whole retail wall up to eye level and faced everything forward. Took an afternoon. Before and after plus the two shelves I care about. Has anyone actually measured whether this does anything, or did I just spend a Sunday tidying?',
    media: {
      kind: 'carousel',
      items: [
        { url: '/community/wall-before.webp', alt: 'A crowded retail shelf with lotion bottles at waist height, some lying on their side' },
        { url: '/community/wall-after.webp', alt: 'The same shelf tidied, bottles standing in rows and faced forward' },
        { url: '/community/wall-eye.webp', alt: 'A close view of a row of lotion bottles at eye level with price cards below' },
        { url: '/community/wall-counter.webp', alt: 'Three bottles standing beside the till on the front counter' },
      ],
    },
    reactions: { same: 6, helpful: 31, watching: 18 },
    mine: null,
    replies: [
      {
        id: 'post-wall-r1',
        townLabel: 'Oshawa ON',
        occurredAtDay: 120,
        body: 'It does something. I did the same in February and product per visit went from 3.4% to 5.1% over about six weeks. Nothing else changed that I know of.',
      },
      {
        id: 'post-wall-r2',
        townLabel: 'Guelph ON',
        occurredAtDay: 119,
        body: 'The counter shot is the one that matters. Mine sells more off three bottles beside the till than off the whole wall.',
      },
    ],
  },
  {
    /* The app's own output, shared by the owner it was made for. This is the
       one post where a picture carries words, because the app wrote them. */
    id: 'post-generated',
    townLabel: 'London ON',
    occurredAtDay: 119,
    body: 'These are the three the app wrote for me on Monday. I have never posted three times in one week in my life. Genuinely asking — is anyone getting bookings off these, or do they just sit there getting likes?',
    media: {
      kind: 'carousel',
      items: [
        { url: '/community/promo-1.webp', alt: 'A cream and terracotta promo graphic reading "Tuesday afternoons are quiet, 20% off 1-4pm this week"' },
        { url: '/community/promo-2.webp', alt: 'A promo graphic reading "Your membership costs less than you think, ask us at the desk"' },
        { url: '/community/promo-3.webp', alt: 'A promo graphic reading "We missed you, come back for a free upgrade"' },
      ],
    },
    reactions: { same: 11, helpful: 8, watching: 22 },
    mine: null,
    replies: [
      {
        id: 'post-generated-r1',
        townLabel: 'Kingston ON',
        occurredAtDay: 119,
        body: 'The quiet-afternoon one filled four beds for me. The other two did nothing. I think it is the specific hour that does the work, not the offer.',
      },
      {
        id: 'post-generated-r2',
        townLabel: 'Barrie ON',
        occurredAtDay: 118,
        body: 'Same. Anything with a time in it works. Anything that just says come back does not.',
      },
    ],
  },
  {
    /* The one post carrying a picture, because a question about a specific
       bottle is exactly the kind an owner answers with a photo rather than a
       paragraph. The image is a catalogue product shot already in the repo —
       nothing in frame identifies a salon. */
    id: 'post-0',
    townLabel: 'Cambridge ON',
    occurredAtDay: 119,
    body: 'This one has sat on my shelf since spring and barely moves. My rep says it is their best seller. Is it just me, or is anyone actually selling it?',
    media: {
      kind: 'image',
      url: '/catalogue/BSK-10004.jpg',
      alt: 'A bottle of Fitspiration Ultimate Natural Bronzer, 400 mL',
    },
    reactions: { same: 9, helpful: 12, watching: 4 },
    mine: null,
    replies: [
      {
        id: 'post-0-r1',
        townLabel: 'Barrie ON',
        occurredAtDay: 119,
        body: 'It moves for me but only when it is at eye level. It was on my bottom shelf for a year doing nothing.',
      },
    ],
  },
  {
    id: 'post-1',
    townLabel: 'Burlington ON',
    occurredAtDay: 118,
    body: "Anyone else seeing evening shifts attach way worse than mornings? Mine is almost double in the AM. Same products, same shelf, same prices. I cannot work out what is different apart from who is on.",
    figure: { value: '5.9% vs 3.1%', caption: 'product per visit, AM vs PM' },
    reactions: { same: 14, helpful: 3, watching: 6 },
    mine: null,
    replies: [
      {
        id: 'post-1-r1',
        townLabel: 'Guelph ON',
        occurredAtDay: 118,
        body: 'Same split here almost exactly. Mornings are my two longest-serving staff and evenings are whoever I can get. I stopped blaming the hour.',
      },
      {
        id: 'post-1-r2',
        townLabel: 'Oshawa ON',
        occurredAtDay: 117,
        body: 'Check whether the bottle is even out on the counter at 6pm. Mine was getting put away at close-down prep and nobody noticed for months.',
      },
    ],
  },
  {
    id: 'post-2',
    townLabel: 'Kingston ON',
    occurredAtDay: 116,
    body: 'What do you actually SAY to someone who has been gone four months? Not a discount blast — the wording. I have a list of about six hundred and no script I believe in.',
    media: {
      kind: 'image',
      url: '/community/desk-owner.webp',
      alt: 'An owner at the front desk looking at a booking calendar on a laptop',
    },
    reactions: { same: 23, helpful: 5, watching: 11 },
    mine: 'same',
    replies: [
      {
        id: 'post-2-r1',
        townLabel: 'Peterborough ON',
        occurredAtDay: 115,
        body: 'I stopped selling in the first message. Just "we changed the beds in room 2, thought of you". Half of them replied about something else entirely and booked anyway.',
      },
      {
        id: 'post-2-r2',
        townLabel: 'Barrie ON',
        occurredAtDay: 115,
        body: 'Careful with the big list. I sent 400 at once and got flagged as spam by my own provider. Went out in batches of 40 after that.',
      },
      {
        id: 'post-2-r3',
        townLabel: 'Sudbury ON',
        occurredAtDay: 114,
        body: 'Mine mostly say they had been meaning to come back. They are not angry, they just fell out of the habit. That changed how I word it.',
      },
    ],
  },
  {
    id: 'post-3',
    townLabel: 'Barrie ON',
    occurredAtDay: 113,
    body: 'How do you bring up unlimited without it feeling like a pitch? I have people coming four times a month on a session pack and I know I am charging them the hard way, but I do not want to sound like I am upselling every visit.',
    media: {
      kind: 'image',
      url: '/community/room-bed.webp',
      alt: 'A clean empty tanning bed in a small private room, lid open',
    },
    reactions: { same: 11, helpful: 8, watching: 4 },
    mine: null,
    replies: [
      {
        id: 'post-3-r1',
        townLabel: 'London ON',
        occurredAtDay: 112,
        body: 'I frame it as them overpaying, not me selling. "You came four times this month, that would have been cheaper on unlimited." Nobody has ever been annoyed at that.',
      },
    ],
  },
  {
    id: 'post-4',
    townLabel: 'Sudbury ON',
    occurredAtDay: 110,
    body: 'Is anyone actually making Tuesday afternoons work, or do you all just accept them? I have tried discounting and it moved nothing except my margin. Wondering whether to cut the hours instead.',
    figure: { value: '31 visits', caption: 'Tuesday 1–5pm, four-week average' },
    media: {
      kind: 'image',
      url: '/community/room-quiet.webp',
      alt: 'An empty salon reception area on a quiet weekday afternoon',
    },
    reactions: { same: 19, helpful: 2, watching: 9 },
    mine: null,
    replies: [
      {
        id: 'post-4-r1',
        townLabel: 'Kingston ON',
        occurredAtDay: 109,
        body: 'Discounting a quiet hour just moves your Saturday people into it. I cut the hours and nobody complained.',
      },
      {
        id: 'post-4-r2',
        townLabel: 'Burlington ON',
        occurredAtDay: 109,
        body: 'Mine is the same and I kept the hours — it is the only slot my shift workers can use. Worth checking who is actually in there before you cut.',
      },
    ],
  },
  {
    id: 'post-5',
    townLabel: 'Peterborough ON',
    occurredAtDay: 107,
    body: 'Those of you who added a second modality — how long before you could tell whether it was paying for itself? Everyone quotes me a payback number and I do not know what to believe.',
    media: {
      kind: 'image',
      url: '/community/room-redlight.webp',
      alt: 'A red light therapy bed with its panels switched on, nobody in the room',
    },
    reactions: { same: 8, helpful: 4, watching: 21 },
    mine: null,
    replies: [
      {
        id: 'post-5-r1',
        townLabel: 'Oshawa ON',
        occurredAtDay: 106,
        body: 'Took me most of a year to see anything I trusted, and I still cannot separate it from the fact I also fixed my front desk that spring. Be suspicious of anyone quoting you a clean number.',
      },
    ],
  },
];

/** Day index of the demo clock these fixtures are written against. */
export const DEMO_COMMUNITY_TODAY = 120;
