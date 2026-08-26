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


import type { CommunityMedia } from './CommunityFeed';

/** What the browser rejected, so the composer can say why in plain words. */
export type CommunityMediaError = 'size' | 'type';

/** Ported from Stageable's PostComposer, which enforces the same two limits. */
export const COMMUNITY_MEDIA_LIMITS = {
  imageBytes: 8 * 1024 * 1024,
  videoBytes: 50 * 1024 * 1024,
} as const;

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
  /** The attached photo or clip, if the owner picked one. */
  media?: CommunityMedia | null;
  /** Fires with every picked file, or an empty list when the owner clears it. */
  onMediaChange?: (files: File[]) => void;
  /** Why the last pick was refused. The composer states it rather than failing quietly. */
  mediaError?: CommunityMediaError | null;
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
  media,
  onMediaChange,
  mediaError,
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
    (!body.trim() && !media) ||
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

          {onMediaChange && (
            <div className="b-composer-field">
              <span className="b-composer-label">Add a photo or video (optional)</span>
              {media ? (
                <div className="b-composer-media">
                  {media.kind === 'video' ? (
                    <video className="b-composer-media-el" src={media.url} muted playsInline controls />
                  ) : media.kind === 'carousel' ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="b-composer-media-el" src={media.items[0]?.url} alt="" />
                      <span className="b-composer-media-count num">{media.items.length} pictures</span>
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="b-composer-media-el" src={media.url} alt="" />
                  )}
                  <button
                    type="button"
                    className="btn btn-quiet b-composer-media-drop"
                    onClick={() => onMediaChange([])}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <input
                    className="b-composer-file"
                    id="community-composer-media"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => onMediaChange(Array.from(e.target.files ?? []))}
                  />
                  <span className="b-composer-sub">
                    Pictures up to 8MB, video up to 50MB. Pick more than one picture and they post
                    as a set.
                  </span>
                </>
              )}
              {mediaError && (
                <p className="b-composer-media-error" role="alert">
                  {mediaError === 'size'
                    ? 'That file is too big. Pictures can be up to 8MB and video up to 50MB.'
                    : 'That file type will not play here. Use a picture or a video.'}{' '}
                  Nothing was attached.
                </p>
              )}
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
