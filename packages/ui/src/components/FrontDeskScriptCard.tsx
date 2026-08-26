/**
 * The words to try at the front desk.
 *
 * The script is quoted verbatim so a nervous new hire can literally read it.
 * The outcome buttons close the loop: what staff press here is what the
 * Opportunity Engine learns from.
 */
import type { FrontDeskScriptAction } from '@bask/core';

export interface FrontDeskScriptCardProps {
  action: FrontDeskScriptAction;
  /** Fired with 'presented' | 'accepted' | 'declined'. */
  onOutcome?: (outcome: 'presented' | 'accepted' | 'declined') => void;
  className?: string;
}

export function FrontDeskScriptCard({ action, onOutcome, className }: FrontDeskScriptCardProps) {
  return (
    <div className={['card', 'b-script', className].filter(Boolean).join(' ')} data-testid="front-desk-script-card">
      <div className="b-script-who">
        <span className="b-script-level" data-level={action.level}>
          {action.level === 'high' ? 'Strong opportunity' : 'Worth a mention'}
        </span>
        <span className="b-inter-emp">{action.customer}</span>
      </div>
      <blockquote className="b-script-quote">{action.script}</blockquote>
      {/* `btn` alone is the SHARED SHAPE, not a variant: transparent border, no
          background. `btn-ghost` adds only a faint ink colour. So these three
          outcomes rendered as plain words on a phone — nothing looked pressable,
          which is fatal for the one control staff are meant to tap after a
          conversation. Same trap, same fix as `ActionRow`: primary for the
          affirmative, `btn-quiet` (which has a real border) for the rest. */}
      <div className="b-actionrow">
        <button type="button" className="btn btn-primary" onClick={onOutcome ? () => onOutcome('accepted') : undefined}>
          They said yes
        </button>
        <button type="button" className="btn btn-quiet" onClick={onOutcome ? () => onOutcome('presented') : undefined}>
          Talked about it
        </button>
        <button type="button" className="btn btn-quiet" onClick={onOutcome ? () => onOutcome('declined') : undefined}>
          Not today
        </button>
      </div>
    </div>
  );
}