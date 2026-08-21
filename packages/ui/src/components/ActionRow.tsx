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