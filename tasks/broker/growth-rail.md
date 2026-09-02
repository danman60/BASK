# growth-rail

## What to build

The left rail of the wins feed: a short, ranked list of ways this salon can grow, each starting a real action in one click. Presentational leaf — props in, markup out, no state, no effects, no data fetching.

WHY IT EXISTS (header): the feed shows what worked for other salons. This rail is how the owner acts on it without going hunting through the app. Each item is already ranked by what it is worth to this salon, so the top of the list is where the money is.

Define and export an interface GrowthAction with readonly fields: id (string), label (string, the action in plain words, e.g. 'Win back customers who have gone quiet'), worthLabel (string, ALREADY FORMATTED, e.g. 'about $680 a month'), signalLabel (string, the condition behind it), onStart (a function taking no arguments returning void).

Define and export an interface GrowthRailProps with readonly fields: heading (string), actions (readonly GrowthAction[]), and an optional className.

Export a function component GrowthRail.

WHAT IT RENDERS:
- a nav element with className 'card' plus a component class, data-testid 'growth-rail', and an aria-label taken from the heading
- the heading
- an ordered list — the order carries meaning here, because the list is ranked by what each action is worth, so use an ol and not a div
- each action as a list item: the label as a button calling onStart, the worthLabel alongside it, and the signalLabel as a quiet supporting line
- when actions is empty, a plain sentence saying there is nothing needing attention right now. That is a good state, so word it as good news, not as an error or a blank.

Every figure arrives pre-formatted — no arithmetic in this component. Buttons must be real button elements with type='button' so they are keyboard reachable. Match the exemplar's class-naming convention, data-testid habit, comment density and grade-7 voice. No emoji, no inline styles, no colour values. Do not modify any other file. No default export.

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/packages/ui/src/components/GrowthRail.tsx`

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
 * The execution row — one button per prepared action.
 *
 * The first action is the recommended one and renders as the solid button;
 * everything after it is a ghost. Labels come off the actions themselves
 * (`Approve & send to 17 customers`), so this row never composes copy.
 */
import type { OpportunityAction } from '@bask/core';

export interface ActionRowProps {
  actions: OpportunityAction[];
  /** Fired with the pressed action's label. */
  onAction?: (actionLabel: string) => void;
  className?: string;
}

export function ActionRow({ actions, onAction, className }: ActionRowProps) {
  if (actions.length === 0) return null;

  return (
    <div className={['b-actionrow', className].filter(Boolean).join(' ')} data-testid="action-row">
      {actions.map((action, i) => (
        <button
          key={action.label}
          type="button"
          className={i === 0 ? 'btn' : 'btn btn-ghost'}
          data-kind={action.kind}
          onClick={onAction ? () => onAction(action.label) : undefined}
        >
          {action.label}
        </button>
      ))}
    </div>
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

1. `/home/danman60/projects/uvalux-platform/packages/ui/src/components/GrowthRail.tsx` exists and is complete.
2. It imports what it uses from `@bask/core`.
3. `npx tsc --noEmit -p packages/ui/tsconfig.json && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/packages/ui/src/components/ActionRow.tsx /home/danman60/projects/uvalux-platform/packages/ui/src/components/GrowthRail.tsx --contract /home/danman60/projects/uvalux-platform/packages/core/src/opportunities/types.ts` passes with exit code 0.
4. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
