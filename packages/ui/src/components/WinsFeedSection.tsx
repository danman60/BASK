/**
 * The wins feed, composed — the social layer's landing surface.
 *
 * Thesis (Daniel, 2026-08-24): owners are SOCIAL DRIVEN. Seeing a salon like
 * theirs succeed, and reading why in that owner's own words, moves them in a way
 * a ranked dashboard does not. So this sits high on the landing page, above the
 * analytics, and every card ends in the action that produced the win.
 *
 * The fence line in the header is deliberate and permanent: it states on the
 * surface that nobody here competes with you. That promise is the reason an
 * owner is willing to be IN the feed, so it is never tucked into a settings
 * page. The filtering itself happens upstream in `@bask/core` — this component
 * never receives a competing salon.
 */

import { WinCard, type WinCardProps } from './WinCard';

export interface WinsFeedItem extends Omit<WinCardProps, 'className'> {
  id: string;
}

export interface WinsFeedSectionProps {
  heading: string;
  /** One line on what this feed is. */
  blurb: string;
  /** ALREADY FORMATTED — "23 salons like yours, none within 25km". */
  fenceLabel: string;
  items: readonly WinsFeedItem[];
  /** Shown when nothing has cleared the bar yet. */
  emptyLabel: string;
  className?: string;
}

export function WinsFeedSection({
  heading,
  blurb,
  fenceLabel,
  items,
  emptyLabel,
  className,
}: WinsFeedSectionProps) {
  return (
    <section
      className={['b-winfeed', className].filter(Boolean).join(' ')}
      aria-label={heading}
      data-testid="wins-feed"
    >
      <div className="b-winfeed-head">
        <h2 className="b-winfeed-title">{heading}</h2>
        <span className="b-winfeed-fence">{fenceLabel}</span>
      </div>
      <p className="b-winfeed-sub">{blurb}</p>

      {items.length === 0 ? (
        <p className="b-dtable-empty">{emptyLabel}</p>
      ) : (
        items.map(({ id, ...win }) => <WinCard key={id} {...win} />)
      )}
    </section>
  );
}
