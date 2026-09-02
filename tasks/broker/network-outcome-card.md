# network-outcome-card

## What to build

A PRESENTATIONAL leaf card answering the question 'did this work for anyone else like me'. Props in, markup out. No data fetching, no state, no effects, no imports from anywhere except React types and the props interface you define in this file.

WHY IT EXISTS (state it in the file header): a salon owner will not act on a recommendation because software said so. They will act because salons like theirs already tried it and it worked. This card is that evidence.

Define and export an interface NetworkOutcomeCardProps with readonly fields: actionLabel (string, what the action was in plain words), signalLabel (string, the business condition), salonsTried (number), salonsImproved (number), successRateLabel (string, ALREADY FORMATTED e.g. '7 of 11'), medianDeltaLabel (string, ALREADY FORMATTED e.g. '+1.4 points'), medianDaysLabel (string, ALREADY FORMATTED e.g. 'within 30 days'), confident (boolean), and an optional className string.

Export a function component NetworkOutcomeCard taking those props.

CRITICAL RULE — every figure arrives already formatted. This component must NOT compute a percentage, round a number, or do arithmetic of any kind. The exemplar's header states the reason: a component that recomputes a figure will eventually disagree with whatever produced it. Follow that rule exactly.

WHAT IT RENDERS:
- an article with className 'card' plus a component class, and a data-testid of 'network-outcome-card'
- a small kicker line showing the signalLabel
- a heading showing the actionLabel
- the headline evidence: successRateLabel as the largest element, with a caption naming what it counts, e.g. salons that saw the number improve
- a supporting row with medianDeltaLabel and medianDaysLabel, each with a short caption
- when confident is FALSE, a visible honesty note saying the sample is still small and this is early signal rather than proof. This must never be hidden or styled as decoration — an owner reading a success rate off two salons is exactly the failure this note prevents.

Match the exemplar's class-naming convention, its use of data-testid, its comment density, and its grade-7 copy voice. No emoji, no marketing language, no colour or inline styles — className only. Do not modify any other file. No default export.

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/packages/ui/src/components/NetworkOutcomeCard.tsx`

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

1. `/home/danman60/projects/uvalux-platform/packages/ui/src/components/NetworkOutcomeCard.tsx` exists and is complete.
2. It imports what it uses from `@bask/core`.
3. `npx tsc --noEmit -p packages/ui/tsconfig.json && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/packages/ui/src/components/OutcomeCard.tsx /home/danman60/projects/uvalux-platform/packages/ui/src/components/NetworkOutcomeCard.tsx --contract /home/danman60/projects/uvalux-platform/packages/core/src/opportunities/types.ts` passes with exit code 0.
4. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
