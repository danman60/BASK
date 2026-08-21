/**
 * A prepared SMS, shown before anything sends.
 *
 * The bubble shape says "this is the actual message", not a description of
 * one. The approve button carries the recipient count so the owner knows the
 * blast radius before pressing. Nothing sends without this press — that
 * promise is the product's licence to prepare messages at all.
 */
import type { SmsAction } from '@bask/core';

export interface SmsPreviewCardProps {
  action: SmsAction;
  /** Fired when the approve button is pressed. */
  onApprove?: () => void;
  className?: string;
}

export function SmsPreviewCard({ action, onApprove, className }: SmsPreviewCardProps) {
  return (
    <div className={['card', 'b-msg', className].filter(Boolean).join(' ')} data-testid="sms-preview-card">
      <div className="b-msg-bubble">{action.message}</div>
      <div className="b-msg-meta">{action.costNote}</div>
      <button type="button" className="b-approve" onClick={onApprove} data-testid="sms-approve">
        Approve &amp; send to {action.recipientCount} customers
      </button>
      <div className="b-msg-meta">Nothing sends until you approve.</div>
    </div>
  );
}