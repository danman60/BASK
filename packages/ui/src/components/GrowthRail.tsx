/**
 * The growth rail — a short, ranked list of ways this salon can grow,
 * each starting a real action in one click.
 */
import type { OpportunityAction } from '@bask/core';

export interface GrowthAction {
  readonly id: string;
  readonly label: string;
  readonly worthLabel: string;
  readonly signalLabel: string;
  readonly onStart: () => void;
}

export interface GrowthRailProps {
  readonly heading: string;
  readonly actions: readonly GrowthAction[];
  readonly className?: string;
}

export function GrowthRail({ heading, actions, className }: GrowthRailProps) {
  if (actions.length === 0) {
    return (
      <nav 
        className={['card', className].filter(Boolean).join(' ')} 
        data-testid="growth-rail"
        aria-label={heading}
      >
        <h2>{heading}</h2>
        <p>There is nothing needing attention right now. That's good news!</p>
      </nav>
    );
  }

  return (
    <nav 
      className={['card', className].filter(Boolean).join(' ')} 
      data-testid="growth-rail"
      aria-label={heading}
    >
      <h2>{heading}</h2>
      <ol>
        {actions.map((action) => (
          <li key={action.id}>
            <button
              type="button"
              onClick={action.onStart}
            >
              {action.label}
            </button>
            <span>{action.worthLabel}</span>
            <p>{action.signalLabel}</p>
          </li>
        ))}
      </ol>
    </nav>
  );
}