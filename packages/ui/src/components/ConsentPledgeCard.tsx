/**
 * The monitor's terms, on the monitor itself.
 *
 * Every line is a commitment the demo build actually keeps (nothing here
 * processes audio; fixtures only). If the product ever breaks one of these
 * lines, this card is where that becomes a lie — which is the point of
 * keeping it on the surface.
 */
import type { ReactNode } from 'react';

export interface ConsentPledgeCardProps {
  /** Override the default pledge lines. */
  lines?: string[];
  children?: ReactNode;
  className?: string;
}

export const PLEDGE_LINES = [
  'The team knows the listener is here. It is part of how we coach, and it is in the open.',
  'Conversations are scored for coaching. Nobody is disciplined off a transcript.',
  'Customers are patterns, never profiles. No customer names, no voices kept.',
  'The salon owns this data. UVALUX sees it only with consent, like everything else.',
];

export function ConsentPledgeCard({ lines, children, className }: ConsentPledgeCardProps) {
  return (
    <div className={['card', 'b-pledge', className].filter(Boolean).join(' ')} data-testid="consent-pledge-card">
      <div className="b-pledge-title">How the listener is used</div>
      {(lines ?? PLEDGE_LINES).map((line) => <p className="b-pledge-line" key={line}>{line}</p>)}
      {children}
    </div>
  );
}