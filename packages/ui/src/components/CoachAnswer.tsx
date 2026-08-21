/**
 * A coaching answer and the sources behind it.
 *
 * The sources are not a footnote — they are the product. Part of the expo corpus
 * has session boundaries derived from a printed agenda's clock, and those drift,
 * so a source can only be as confident as its own attribution. `CitationCard`
 * enforces that; this component must not summarise the sources in a way that
 * launders an approximate one into a confident claim.
 */
import CitationCard, { type CitationCardProps } from './CitationCard';

export interface CoachAnswerProps {
  /** The question, shown above the answer. */
  question: string;
  /** The answer, already split into paragraphs by the caller. */
  paragraphs: readonly string[];
  sources: readonly CitationCardProps[];
  className?: string;
}

export function CoachAnswer({ question, paragraphs, sources, className }: CoachAnswerProps) {
  return (
    <section className={['b-coach', className].filter(Boolean).join(' ')} data-testid="coach-answer">
      <div className="card b-cite">
        <span className="eyebrow">The question</span>
        <p className="b-coach-question">{question}</p>
      </div>

      <div className="card spined">
        <div className="rail brand" />
        <div className="body">
          <span className="eyebrow">The answer</span>
          {paragraphs.map((para, i) => (
            <p key={i} className="b-coach-para">{para}</p>
          ))}
        </div>
      </div>

      <h2>Where this came from</h2>

      {sources.length === 0 ? (
        <p className="b-cite-caution">No source in the library supports this answer. Treat it as opinion.</p>
      ) : (
        sources.map((source) => (
          <CitationCard
            key={`${source.title}-${source.meta}`}
            {...source}
          />
        ))
      )}
    </section>
  );
}