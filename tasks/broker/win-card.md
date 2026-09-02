# win-card

## What to build

One card in a feed of wins from other salons. A presentational leaf: props in, markup out. No data fetching, no state, no effects.

WHY IT EXISTS (state it in the header): this reads like a social feed but it is not one. Every card is a real action this product recommended, what a salon did with it, and what the number did afterward. There are no opinions, no photos and no chat here — if an item has no measured result it is not a win and does not belong in the feed. The salon is identified only by its TOWN, never by a business name, and never a salon that competes with the viewer.

Define and export an interface WinCardProps with readonly fields: townLabel (string, e.g. 'Burlington ON'), actionLabel (string, what they did in plain words), signalLabel (string, the problem it solved), metricLabel (string, what moved), deltaLabel (string, ALREADY FORMATTED e.g. '+1.4 points'), timeLabel (string, ALREADY FORMATTED e.g. '3 weeks ago'), daysLabel (string, ALREADY FORMATTED e.g. 'within 30 days'), onTryThis (a function taking no arguments returning void), tryLabel (string, the button's words), and an optional className.

Export a function component WinCard.

CRITICAL RULE — every figure arrives already formatted. This component must NOT compute a percentage, round a number, or do arithmetic. The exemplar's header gives the reason: a component that recomputes a figure will eventually disagree with whatever produced it.

WHAT IT RENDERS:
- an article with className 'card' plus a component class, and data-testid 'win-card'
- a head row: the town label and the time label. The town is the identity — no avatar, no name, no logo.
- the action they took, as the card's heading
- the result as the largest element: deltaLabel, with metricLabel as its caption
- a quiet line naming the problem this solved (signalLabel) and how fast it worked (daysLabel)
- a button calling onTryThis, labelled with tryLabel. This is the whole point of the card — the owner reads a win and starts the same action. Make it the clearest thing after the result.

Match the exemplar's class-naming convention, data-testid habit, comment density and grade-7 copy voice. No emoji, no inline styles, no colour, no imagery. Do not modify any other file. No default export.

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/packages/ui/src/components/WinCard.tsx`

## The API surface you may use

Everything below is REAL and already exists. Import from `@bask/core`.
Do NOT invent names, keys or props that are not in this list — inventing a key
on the shared style object is the single most common way this task fails.

```ts
CONTRACT API SURFACE — `@/lib/contract` exports EXACTLY these. Nothing else exists.
Do NOT reference any symbol or object key that is not on this list.

consts: OPPORTUNITY_CATEGORIES, OPPORTUNITY_CATEGORY_LABEL, OPPORTUNITY_CONFIDENCES, OPPORTUNITY_CONFIDENCE_LABEL, OPPORTUNITY_URGENCIES, OPPORTUNITY_URGENCY_LABEL
types: OpportunityCategory, OpportunityConfidence, OpportunityUrgency, OpportunityAction, ActionKind
interfaces: SmsAction, EmailAction, SocialAction, StaffTaskAction, FrontDeskScriptAction, StaffChallengeAction, UvaluxOrderAction, CoachingRequestAction, HandleItPlan, Opportunity, OpportunityOutcome

OPPORTUNITY_CATEGORY_LABEL has EXACTLY these 6 keys: marketing, membership, retail, operations, customer, coaching

OPPORTUNITY_CONFIDENCE_LABEL has EXACTLY these 2 keys: high, worth_testing

OPPORTUNITY_URGENCY_LABEL has EXACTLY these 3 keys: now, this_week, this_month
```
## Follow this exemplar exactly

This file is the approved reference for how this kind of component is written
and styled in this project. Match its structure, its class vocabulary and its
conventions. Deviating from its visual vocabulary is a failure even if the code
compiles.

```tsx
/**
 * The proof card — a recommendation that ran, and what it made.
 *
 * The funnel reads recommendation → executed → result so the owner can see
 * the causal chain, and the revenue line is the biggest element because it is
 * the reason to trust the next recommendation. The learned line is the system
 * being honest about what the result taught it.
 */
import type { OpportunityOutcome } from '@bask/core';

export interface OutcomeCardProps {
  outcome: OpportunityOutcome;
  className?: string;
}

export function OutcomeCard({ outcome, className }: OutcomeCardProps) {
  return (
    <article className={['card', 'b-outcome', className].filter(Boolean).join(' ')} data-testid="outcome-card">
      <div className="b-opp-cat">{outcome.window}</div>
      <h3 className="b-opp-title">{outcome.opportunityTitle}</h3>
      <div className="b-outcome-funnel">
        <span className="b-outcome-step">{outcome.actionTaken}</span>
        <span className="b-outcome-arrow" aria-hidden="true">→</span>
        <span className="b-outcome-step">{outcome.executed}</span>
        <span className="b-outcome-arrow" aria-hidden="true">→</span>
        <span className="b-outcome-step">{outcome.result}</span>
      </div>
      <div className="b-outcome-rev num">{outcome.revenueLabel}</div>
      <p className="b-outcome-learned">{outcome.learned}</p>
    </article>
  );
}
```

## Rules

- Write the target file. Do not create other files.
- Do not modify anything outside the target path.
- Import every symbol you use. Do not reference a symbol you have not imported.
- Use ONLY class names and style keys that appear in the surface or the exemplar.
- Do not leave TODOs, stubs, or placeholder values.
- Do not fix unrelated bugs you notice. Build only what is described above.

## Acceptance gate — you are DONE only when all of these are true

1. `/home/danman60/projects/uvalux-platform/packages/ui/src/components/WinCard.tsx` exists and is complete.
2. It imports what it uses from `@bask/core`.
3. `npx tsc --noEmit -p packages/ui/tsconfig.json && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/packages/ui/src/components/OutcomeCard.tsx /home/danman60/projects/uvalux-platform/packages/ui/src/components/WinCard.tsx --contract /home/danman60/projects/uvalux-platform/packages/core/src/opportunities/types.ts` passes with exit code 0.
4. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
