'use client';

/**
 * UndoToast — undo over confirm (IMPLEMENTATION_SPEC §3.5).
 *
 * Dismissing an insight is safe and reversible, so it does not get a confirm
 * dialog; it gets a toast with an Undo that stays put for a few seconds. Confirm
 * is reserved for outward acts (sending a campaign), which live in other lanes.
 *
 * Built here rather than on sonner: it is one element with one action, and the
 * whole product's toast surface is currently this. `role="status"` (not `alert`)
 * because an undo offer should not interrupt a screen reader mid-sentence.
 */

import { useEffect } from 'react';

import { INSIGHT_UI } from '../guidance/guidance';

export interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  /** Milliseconds before it fades itself out. */
  timeout?: number;
}

export function UndoToast({ message, onUndo, onDismiss, timeout = 7000 }: UndoToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, timeout);
    return () => clearTimeout(timer);
  }, [onDismiss, timeout, message]);

  return (
    <div className="b-toast" role="status" aria-live="polite" data-testid="undo-toast">
      <span className="b-toast-msg">{message}</span>
      <button type="button" className="b-toast-undo" onClick={onUndo}>
        {INSIGHT_UI.undoAction}
      </button>
      <button
        type="button"
        className="b-toast-x"
        onClick={onDismiss}
        aria-label={INSIGHT_UI.undoDismissLabel}
      >
        ×
      </button>
    </div>
  );
}
