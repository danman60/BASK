/**
 * A prepared email, shown before anything sends.
 *
 * Subject and a short body preview — enough to judge tone without opening an
 * editor. Preview and Edit are ghosts; Send carries the recipient count.
 */
import type { EmailAction } from '@bask/core';

export interface EmailPreviewCardProps {
  action: EmailAction;
  /** Fired with 'preview' | 'edit' | 'send'. */
  onPress?: (button: 'preview' | 'edit' | 'send') => void;
  className?: string;
}

export function EmailPreviewCard({ action, onPress, className }: EmailPreviewCardProps) {
  return (
    <div className={['card', 'b-mailprev', className].filter(Boolean).join(' ')} data-testid="email-preview-card">
      <div className="b-mailprev-subject">{action.subject}</div>
      <p className="b-mailprev-body">{action.body}</p>
      <div className="b-actionrow">
        <button type="button" className="btn btn-ghost" onClick={onPress ? () => onPress('preview') : undefined}>
          Preview
        </button>
        <button type="button" className="btn btn-ghost" onClick={onPress ? () => onPress('edit') : undefined}>
          Edit
        </button>
        <button type="button" className="b-approve" onClick={onPress ? () => onPress('send') : undefined}>
          Send to {action.recipientCount} customers
        </button>
      </div>
    </div>
  );
}
