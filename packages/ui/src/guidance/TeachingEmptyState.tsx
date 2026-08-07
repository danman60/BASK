'use client';

import type { ReactNode } from 'react';
import { EMPTY_STATES, type EmptyStateKey } from './guidance';

/**
 * Teaching empty state (IMPLEMENTATION_SPEC §3.3): explains what will appear here,
 * why it is useful, and offers the first action. Never "No data".
 *
 * The action label comes from the dictionary and states an outcome — DESIGN_SPEC §5
 * bans Submit/OK/Confirm — so the caller supplies the handler, not the words.
 */
export function TeachingEmptyState({
  state,
  onAction,
  icon,
  className,
}: {
  state: EmptyStateKey;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}) {
  const copy = EMPTY_STATES[state];

  return (
    <div
      className={['g-empty', className].filter(Boolean).join(' ')}
      data-testid="teaching-empty-state"
    >
      <div className="g-empty-art" aria-hidden>
        {icon ?? '✦'}
      </div>
      <h3>{copy.title}</h3>
      <p>{copy.body}</p>
      {onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {copy.action}
        </button>
      )}
    </div>
  );
}
