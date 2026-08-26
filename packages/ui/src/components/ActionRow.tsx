/**
 * The execution row — one button per prepared action.
 *
 * The first action is the recommended one and renders solid; everything after
 * it gets a quiet outline. Labels come off the actions themselves
 * (`Approve & text 17 customers`), so this row never composes copy.
 *
 * These were `btn` and `btn btn-ghost`. Bare `.btn` sets `border: 1px solid
 * transparent` and NO background — it is the shared shape, not a variant — and
 * `btn-ghost` is `--ink-faint` with no border either. So the recommended action
 * and every alternative rendered as plain text: the money row on Today, the one
 * thing a stakeholder is meant to click, did not look pressable at any width.
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
          className={i === 0 ? 'btn btn-primary' : 'btn btn-quiet'}
          data-kind={action.kind}
          onClick={onAction ? () => onAction(action.label) : undefined}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}