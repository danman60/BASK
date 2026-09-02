# TASK — Opportunity fixtures

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/opportunities/fixtures.ts`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first.**
Then read `/home/danman60/projects/uvalux-platform/packages/core/src/opportunities/types.ts` — your
file must satisfy those types exactly.

The demo's ranked opportunities and measured outcomes. Literal data, deterministic, no clock, no
randomness, no I/O. This is what Today renders, and what the film shoots — write it like the best
day of the product's life, using ONLY the demo world's numbers.

## The file

Start with a doc comment explaining that these are the demo dataset for Sunset Ridge Tanning
(August 2026) and that ranking is by `impactMonthly` descending, pre-sorted here.

Imports, exactly (relative, NOT `@bask/core` — this file is inside the package):

```ts
import type { Opportunity, OpportunityOutcome } from './types';
```

Export exactly two constants:

```ts
export const DEMO_OPPORTUNITIES: Opportunity[] = [ /* six entries */ ];
export const DEMO_OUTCOMES: OpportunityOutcome[] = [ /* two entries */ ];
```

## The six opportunities, in this order (already ranked)

1. **`opp-retail-attach`** — category `retail`. Title `Improve evening retail sales`. Retail
   attachment fell from 21% to 14% while visits stayed normal; most of the drop is evening
   shifts. Impact `+$1,270/mo`, impactMonthly `1270`, confidence `high` (four weeks persistent,
   also below similar salons), urgency `this_week`. Actions: a `staff_challenge` (name
   `Seven-day lotion challenge`, metric `Retail attachment`, days 7, staff Maya 4/5, Jordan 1/5,
   Priya 2/5), a `social` post promoting a featured lotion, and a `coaching_request`
   (topic `Evening retail confidence`). No handleIt.
2. **`opp-membership-convert`** — category `membership`. Title `Convert 17 regulars to members`.
   17 frequent visitors match the high-conversion profile (3+ visits in first 21 days converts at
   31% vs 9% overall). Impact `+$640/mo`, impactMonthly `640`, confidence `high`, urgency
   `this_week`. Actions: a `front_desk_script` (customer `Regular · visits 2×/week`, level
   `high`, script about how membership would cost less than paying per visit), an `sms`
   (recipientCount 17, a friendly message about membership saving them money, costNote
   `17 messages · about $1.20`), and an `email` (recipientCount 17, subject about doing the math
   on membership). No handleIt.
3. **`opp-recover-payments`** — category `membership`. Title `Recover seven failed payments`.
   Seven membership payments failed this month; the members still visit. Impact `+$412/mo`,
   impactMonthly `412`, confidence `high`, urgency `now`. Actions: an `sms` (recipientCount 7,
   a warm no-blame message that the card needs a minute, costNote `7 messages · about $0.50`)
   and a `staff_task` (goal about mentioning it gently at check-in, target
   `Target: 4 conversations.`, customers as FIRST-NAME-ONLY list of 7). No handleIt.
4. **`opp-fill-tuesday`** — category `marketing`. Title `Fill Tuesday afternoon`. Next Tuesday
   1–4 PM is running well below its usual bookings. Impact `$350–$500`, impactMonthly `425`,
   confidence `worth_testing` (one week of signal so far), urgency `this_week`. Actions: an
   `sms` to 24 weekday responders, and a `social` post. **This one carries `handleIt`**: audience
   `24 customers who usually visit on weekday afternoons and respond to offers`, offer, copy,
   schedule (`Sends Monday at 10 AM if you approve`), approvalNote
   `Nothing sends until you approve.`.
5. **`opp-reorder-bronzer`** — category `retail`. Title `Reorder before the shelf goes empty`.
   Hempz Botanical Sunshine Revitalizing Bronzer sells out in about 8 days at current pace.
   Impact `Protect ~$600/mo`, impactMonthly `600` — but rank it 5th anyway (protection, not
   growth; note this in the confidenceNote). Confidence `high`, urgency `now`. Actions: a
   `uvalux_order` (items: sku `BSK-10007`, name
   `Hempz Botanical Sunshine Revitalizing Bronzer`, qty 12; note that it adds to the existing
   UVALUX draft order). No handleIt.
6. **`opp-redlight-use`** — category `operations`. Title `Wake up the red-light room`. Red-light
   equipment sits idle roughly seven of every ten open hours; 112 customers look like good
   candidates. Impact `Worth testing`, impactMonthly `0`, confidence `worth_testing` (not enough
   history to size it — say so honestly in the confidenceNote), urgency `this_month`. Actions:
   an `email` to 112 candidates and a `coaching_request` (topic `Marketing red light without
   discounting UV`). No handleIt.

Every action needs its `label` written as the button text (`Start the challenge`,
`Approve & send to 17 customers`, `Add to UVALUX order`, …). Every opportunity needs
`whatChanged`, `whyItMatters` and `confidenceNote` written in grade-7 plain English, one
sentence each. Money appears in the sentence wherever it can.

## The two outcomes

1. **`out-membership-june`** — from `Convert regulars to members`, window `Jun 30 – Jul 28`.
   actionTaken `Front-desk conversations + SMS follow-up`, executed
   `14 conversations · 9 follow-up texts`, result `5 new memberships`, revenueLabel
   `+$375/mo recurring`, revenueMonthly `375`, learned
   `Staff conversations beat discounts for this group — nobody needed money off.`
2. **`out-reactivation-july`** — from a reactivation campaign, window `Jul 8 – Aug 5`.
   actionTaken `Reactivation SMS to 42 lapsed customers`, executed `40 delivered`, result
   `11 came back · 8 bought product`, revenueLabel `$684 revenue · $96 in discounts`,
   revenueMonthly `684`, learned
   `The sweet spot was 18–25 days after their usual visit gap broke.`

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/opportunities/fixtures.ts`
- Do NOT create or modify any other file.
- No `Date.now()`, no `new Date()`, no `Math.random`, no I/O, no `any`.
- Acceptance: `tsc --noEmit` in `packages/core` reports zero errors naming this file; both
  constants exported; every one of the eight action kinds appears at least once across the six
  opportunities.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
