/**
 * One win in the feed — what another salon did, and what it moved.
 *
 * THE THESIS (Daniel, 2026-08-24): "our users are SOCIAL DRIVEN; seeing others
 * like them succeeding and why will drive them." So the engagement row is not
 * decoration on a data card — it IS the mechanism. An owner acts because a peer
 * did it and said it worked, not because a dashboard ranked it.
 *
 * Between Instagram and LinkedIn, deliberately:
 *   - the SHAPE is Instagram — a scrollable card with light engagement
 *   - the IDENTITY is LinkedIn — a business and its town, never a person, never
 *     a photo, never a mood
 *   - the CURRENCY is neither — a measured result, or it is not a win at all
 *
 * Every figure arrives already formatted. A component that recomputes a number
 * will eventually disagree with whatever produced it.
 *
 * The salon shown here has already passed the non-compete filter upstream
 * (`isNonCompeting` in `@bask/core`), so this component never receives a salon
 * the viewer competes with — which is what makes the feed socially possible.
 */

export interface WinCardProps {
  /** Town only — "Burlington ON". Never a business name. */
  readonly townLabel: string;
  /** What they did, in plain words. */
  readonly actionLabel: string;
  /** The problem it solved. */
  readonly signalLabel: string;
  /** What moved — "product per visit". */
  readonly metricLabel: string;
  /** ALREADY FORMATTED, with sign — "+1.4 points". */
  readonly deltaLabel: string;
  /** ALREADY FORMATTED — "3 weeks ago". */
  readonly timeLabel: string;
  /** ALREADY FORMATTED — "within 30 days". */
  readonly daysLabel: string;
  /** The owner's own words on why it worked. The part data cannot supply. */
  readonly note?: string | null;
  /**
   * Credit line — that Bask found this and the owner acted on it.
   *
   * It sits OUTSIDE `note` on purpose. `note` is the owner's own words, and
   * putting the product's name inside somebody's quote would be putting words
   * in their mouth — the one thing this feed cannot do and stay believable.
   * So the claim gets its own line, in the product's voice, next to theirs.
   *
   * Optional, and rendered only when supplied: a win imported from somewhere
   * Bask did not surface must not claim otherwise.
   */
  readonly viaLabel?: string | null;
  /** ALREADY FORMATTED counts. */
  readonly likeLabel: string;
  readonly commentLabel: string;
  /** Whether the viewer has already liked this. */
  readonly liked?: boolean;
  readonly onLike?: () => void;
  readonly onComment?: () => void;
  readonly onMessage?: () => void;
  readonly onTryThis: () => void;
  readonly tryLabel: string;
  readonly className?: string;
}

/** Initials for the town badge — no logo, no avatar, no face. */
function townMark(town: string): string {
  const parts = town.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

export function WinCard({
  townLabel,
  actionLabel,
  signalLabel,
  metricLabel,
  deltaLabel,
  timeLabel,
  daysLabel,
  note,
  viaLabel,
  likeLabel,
  commentLabel,
  liked = false,
  onLike,
  onComment,
  onMessage,
  onTryThis,
  tryLabel,
  className,
}: WinCardProps) {
  return (
    <article
      className={['card', 'b-win', className].filter(Boolean).join(' ')}
      data-testid="win-card"
    >
      <header className="b-win-head">
        <span className="b-win-mark" aria-hidden="true">
          {townMark(townLabel)}
        </span>
        <span className="b-win-who">
          <span className="b-win-town">{townLabel}</span>
          <span className="b-win-sig">{signalLabel}</span>
        </span>
        <time className="b-win-when">{timeLabel}</time>
      </header>

      <h3 className="b-win-action">{actionLabel}</h3>

      {/* The result is the largest thing on the card. It is the only reason
          the card exists — everything else is context for it. */}
      <div className="b-win-result">
        <span className="b-win-delta num">{deltaLabel}</span>
        <span className="b-win-metric">
          {metricLabel}
          <small>{daysLabel}</small>
        </span>
      </div>

      {note ? <p className="b-win-note">{note}</p> : null}

      {viaLabel ? (
        <p className="b-win-via">
          <span aria-hidden="true">✦</span> {viaLabel}
        </p>
      ) : null}

      <div className="b-win-foot">
        <div className="b-win-social">
          <button
            type="button"
            className="b-win-act"
            onClick={onLike}
            aria-pressed={liked}
            data-liked={liked ? 'true' : 'false'}
          >
            <span aria-hidden="true">♥</span> {likeLabel}
          </button>
          <button type="button" className="b-win-act" onClick={onComment}>
            <span aria-hidden="true">✎</span> {commentLabel}
          </button>
          {onMessage ? (
            <button type="button" className="b-win-act" onClick={onMessage}>
              Message
            </button>
          ) : null}
        </div>
        {/* The whole point of the card: read a win, start the same action. */}
        <button type="button" className="btn btn-primary b-win-try" onClick={onTryThis}>
          {tryLabel}
        </button>
      </div>
    </article>
  );
}
