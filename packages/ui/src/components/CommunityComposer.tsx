/**
 * The post box that sits above the owners-only community feed.
 *
 * This is a controlled presentational leaf. It owns no state of its own,
 * holds no data, and performs no submission. The parent supplies the
 * values and the change handlers.
 *
 * The existing feed can display posts but there is no way to write one.
 * An owner will post a number here that they would not post in a public
 * group, which is why a post can carry a figure as a first-class field
 * rather than being buried in the text.
 */


export interface CommunityComposerProps {
  /** The body of the post. */
  body: string;
  /** Handler for body changes. */
  onBodyChange: (value: string) => void;
  /** Optional figure value. */
  figureValue?: string;
  /** Handler for figure value changes. */
  onFigureValueChange?: (value: string) => void;
  /** Optional figure caption. */
  figureCaption?: string;
  /** Handler for figure caption changes. */
  onFigureCaptionChange?: (value: string) => void;
  /** Handler for the submission. */
  onSubmit: () => void;
  /** Whether the form is currently submitting. */
  submitting: boolean;
  /** Optional reason why the form is disabled. */
  disabledReason?: string;
  /** Custom class name. */
  className?: string;
}

export function CommunityComposer({
  body,
  onBodyChange,
  figureValue,
  onFigureValueChange,
  figureCaption,
  onFigureCaptionChange,
  onSubmit,
  submitting,
  disabledReason,
  className,
}: CommunityComposerProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const isSubmitDisabled =
    submitting ||
    !body.trim() ||
    !!disabledReason;

  return (
    <form
      className={['card', 'b-composer', className].filter(Boolean).join(' ')}
      data-testid="community-composer"
      onSubmit={handleSubmit}
    >
      {!disabledReason ? (
        <>
          <div className="b-composer-field">
            <label className="b-composer-label" htmlFor="community-composer-body">
              Share a question with the community
            </label>
            <textarea
              className="b-composer-body"
              id="community-composer-body"
              rows={3}
              placeholder="What are you seeing that you cannot explain?"
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
            />
          </div>

          {(onFigureValueChange || onFigureCaptionChange) && (
            <div className="b-composer-field">
              <span className="b-composer-label">Add a figure (optional)</span>
              <div className="b-composer-figure">
                <div className="b-composer-field">
                  <label className="b-composer-sub" htmlFor="community-composer-figure-value">
                    Value
                  </label>
                  <input
                    className="b-composer-input"
                    id="community-composer-figure-value"
                    type="text"
                    placeholder="5.9% vs 3.1%"
                    value={figureValue || ''}
                    onChange={(e) => onFigureValueChange?.(e.target.value)}
                  />
                </div>
                <div className="b-composer-field">
                  <label className="b-composer-sub" htmlFor="community-composer-figure-caption">
                    Caption
                  </label>
                  <input
                    className="b-composer-input"
                    id="community-composer-figure-caption"
                    type="text"
                    placeholder="product per visit, AM vs PM"
                    value={figureCaption || ''}
                    onChange={(e) => onFigureCaptionChange?.(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="b-composer-foot">
            <span className="b-composer-fence">Owners only · your town, never your business name</span>
            <button
              type="submit"
              className="btn btn-primary b-composer-post"
              disabled={isSubmitDisabled}
            >
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </>
      ) : (
        <div className="b-composer-disabled">{disabledReason}</div>
      )}
    </form>
  );
}
