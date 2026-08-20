/**
 * One source behind a coaching answer.
 *
 * `confidence` is not decoration. Expo sessions whose boundaries were derived
 * from the printed agenda's clock drift — one such slice put "The Power of
 * Numbers" over a different speaker entirely. So an `approximate` citation shows
 * the room and timestamp, which are exact, and must never present the speaker's
 * name as if it were confirmed. A confident wrong attribution is worse than none.
 */
import { BandChip, type CitationBand } from './BandChip';

export interface CitationCardProps {
  /** The session title, or the room when confidence is 'approximate'. */
  title: string;
  /** e.g. "Room B · Owners & managers · 2026 Expo · from 3h37m". */
  meta: string;
  /** The quoted passage, verbatim from the transcript. */
  quote: string;
  confidence: CitationBand;
  /** Shown only when confidence is 'approximate'. Defaults to the line below. */
  caution?: string;
  className?: string;
}

export const APPROXIMATE_CAUTION =
  'Session attribution here is placed by the clock, so we cite the room and the timestamp rather than a speaker.';

const CitationCard = ({ title, meta, quote, confidence, caution, className }: CitationCardProps) => (
  <article className={['card', 'b-cite', className].filter(Boolean).join(' ')} data-testid="citation-card">
    <div className="b-cite-title">{title}</div>
    <div className="b-cite-meta">{meta}</div>
    <BandChip band={confidence} />
    <blockquote className="b-cite-quote">{quote}</blockquote>
    {confidence === 'approximate' ? (
      <p className="b-cite-caution">{caution ?? APPROXIMATE_CAUTION}</p>
    ) : null}
  </article>
);

export default CitationCard;