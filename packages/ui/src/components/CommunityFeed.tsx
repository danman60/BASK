'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The owners-only feed — a room of QUESTIONS, not a second leaderboard.
 *
 * Not a customer-facing social surface and never becomes one; the fence is that
 * we never touch a salon's customers. What makes this room worth joining is
 * that an owner will put a number on the table here they would not post in a
 * public group, which is why a post can carry a figure as a first-class thing
 * rather than buried in the text — but the figure is EVIDENCE FOR THE QUESTION,
 * never a result being celebrated. Outcomes belong in the wins feed. If both
 * surfaces carry wins, nobody asks anything here.
 *
 * PATTERN PORTED FROM STAGEABLE (`platform/src/components/social.tsx`):
 *   - ReactionBar — a row of pill chips, each glyph + label + count, ONE active
 *     reaction per post, `aria-pressed` carrying the state.
 *   - CommentSection — replies rendered inline under the post as their own
 *     cards, rather than a dead "7 replies" string.
 * The shape is Stageable's; the styling is this product's own tokens, and the
 * reaction vocabulary is rewritten for the room. Stageable applauds a
 * performance; an owner asking "anyone else seeing this?" is asking HOW MANY
 * others see it, so "Same here" is not a like — it is the answer to the
 * question, and the count is the finding.
 *
 * IDENTITY: town only. Never a business name, never a person. Same rule the
 * wins feed enforces — consent is the licence to operate, and the room only
 * works if an owner can speak without identifying their salon.
 */

export type CommunityReaction = 'same' | 'helpful' | 'watching';

export const COMMUNITY_REACTIONS: readonly CommunityReaction[] = ['same', 'helpful', 'watching'];

export const COMMUNITY_REACTION_META: Record<
  CommunityReaction,
  { glyph: string; label: string; title: string }
> = {
  same: { glyph: '◎', label: 'Same here', title: 'I am seeing this too' },
  helpful: { glyph: '✦', label: 'Helpful', title: 'This thread helped me' },
  watching: { glyph: '◔', label: 'Watching', title: 'Tell me what you find out' },
};

export interface CommunityReply {
  id: string;
  /** Town only. */
  townLabel: string;
  /** Already formatted, e.g. "2 days ago". */
  when: string;
  body: string;
}

/**
 * A photo or a video attached to a post. `url` is whatever the caller can hand
 * a browser — an uploaded object URL in the demo, a storage URL once a bucket
 * exists. The card does not care which.
 */
export interface CommunitySlide {
  url: string;
  /** Describes the picture for anyone who cannot see it. Never decorative. */
  alt?: string;
}

export type CommunityMedia =
  | ({ kind: 'image' } & CommunitySlide)
  | ({ kind: 'video'; poster?: string } & CommunitySlide)
  /** Several shots in one post — a before/after, or a set the app generated. */
  | { kind: 'carousel'; items: readonly CommunitySlide[] };

export interface CommunityPost {
  id: string;
  /**
   * Town only — "Burlington ON". Never a business name and never a person's
   * name. This previously carried `author` + `where` ("Dana R." / "Sunset
   * Ridge · Burlington ON"), which contradicted the wins feed and would have
   * shipped two different privacy promises on one product.
   */
  townLabel: string;
  /** Neutral role, e.g. "Owner". Never a name. */
  roleLabel?: string;
  /** Already formatted, e.g. "2 days ago". */
  when: string;
  body: string;
  /** Evidence for the question, never a celebrated result. */
  figure?: { value: string; caption: string };
  /**
   * A picture or clip of the thing being asked about — the shelf, the room, the
   * bed, the receipt. Owners describe a layout problem far faster by showing it
   * than by writing it, which is the whole reason this room gets media.
   */
  media?: CommunityMedia;
  /** Counts per reaction, ALREADY FORMATTED — the card never does arithmetic. */
  reactions: Readonly<Record<CommunityReaction, string>>;
  /** Which reaction the viewer has left, if any. One per post, as in Stageable. */
  mine?: CommunityReaction | null;
  onReact?: (kind: CommunityReaction) => void;
  /** The conversation, rendered inline. */
  replies: readonly CommunityReply[];
  replyLabel: string;
  onReply?: () => void;
}

export interface CommunityFeedProps {
  posts: readonly CommunityPost[];
  className?: string;
}

export const COMMUNITY_BLURB =
  'Owners only. Not your customers, not the public — a room where you can put a real number on the table and ask what other people are seeing.';

/** Initials for the badge, derived from the town — no logo, no avatar, no face. */
function townMark(town: string): string {
  const parts = town.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

/**
 * Stageable's `AutoVideo`, reduced to what this room needs: a clip plays muted
 * while it is on screen and pauses when it is not, so a feed of ten posts is
 * never ten videos decoding at once. Controls stay on, so sound is one tap
 * away — muted autoplay is the only kind a browser will start unprompted.
 */
function FeedVideo({ media }: { media: Extract<CommunityMedia, { kind: 'video' }> }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          // A rejected play() is normal (reduced-motion, data saver, no gesture
          // budget). The poster stays up and the controls still work.
          void el.play().catch(() => undefined);
        } else {
          el.pause();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className="b-post-media-el"
      src={media.url}
      poster={media.poster}
      muted
      loop
      playsInline
      controls
      preload="metadata"
    />
  );
}

/**
 * A swipeable set of shots, the way every social feed shows more than one
 * picture: a scroll-snapping strip with a counter and dots. Scroll position is
 * the source of truth for which slide is active — no index state to drift out
 * of sync with what the user actually dragged, and it keeps native momentum
 * scrolling and keyboard scrolling working for free.
 */
function FeedCarousel({ items }: { items: readonly CommunitySlide[] }) {
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = stripRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    setActive(Math.min(items.length - 1, Math.max(0, i)));
  };

  const goTo = (i: number) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="b-carousel">
      <div className="b-carousel-strip" ref={stripRef} onScroll={onScroll}>
        {items.map((slide, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slide.url}
            className="b-carousel-slide"
            src={slide.url}
            alt={slide.alt ?? ''}
            loading={i === 0 ? undefined : 'lazy'}
          />
        ))}
      </div>
      <span className="b-carousel-count num" aria-hidden="true">
        {active + 1}/{items.length}
      </span>
      <div className="b-carousel-dots" role="tablist" aria-label="Pictures in this post">
        {items.map((slide, i) => (
          <button
            key={slide.url}
            type="button"
            role="tab"
            className="b-carousel-dot"
            data-active={i === active ? 'true' : 'false'}
            aria-selected={i === active}
            aria-label={`Picture ${i + 1} of ${items.length}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}

export function CommunityFeed({ posts, className }: CommunityFeedProps) {
  if (posts.length === 0) {
    return (
      <div className={['b-feed', className].filter(Boolean).join(' ')} data-testid="community-feed">
        <p className="b-dtable-empty">Nothing asked yet. Be the first to put a question up.</p>
      </div>
    );
  }

  return (
    <div className={['b-feed', className].filter(Boolean).join(' ')} data-testid="community-feed">
      {posts.map((post) => (
        <article key={post.id} className="card b-post" data-testid="community-post">
          <div className="b-post-head">
            <div className="b-post-avatar" aria-hidden="true">
              {townMark(post.townLabel)}
            </div>
            <div>
              <div className="b-post-who">{post.townLabel}</div>
              <div className="b-post-where">{post.roleLabel ?? 'Owner'}</div>
            </div>
            <span className="b-post-when">{post.when}</span>
          </div>

          <p className="b-post-body">{post.body}</p>

          {post.figure && (
            <div className="b-post-figure">
              {post.figure.value}
              <small>{post.figure.caption}</small>
            </div>
          )}

          {/* Full-bleed to the card edges, the way a photo reads in any feed
              worth scrolling. Aspect is never forced — a portrait phone photo
              stays portrait rather than being cropped to a bad square. */}
          {post.media && (
            <div className="b-post-media">
              {post.media.kind === 'carousel' ? (
                <FeedCarousel items={post.media.items} />
              ) : post.media.kind === 'video' ? (
                <FeedVideo media={post.media} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="b-post-media-el"
                  src={post.media.url}
                  alt={post.media.alt ?? ''}
                  loading="lazy"
                />
              )}
            </div>
          )}

          {/* Stageable's ReactionBar: one active reaction per post, count beside
              the label so the room can see how common a problem actually is. */}
          <div className="b-react" role="group" aria-label="Reactions">
            {COMMUNITY_REACTIONS.map((kind) => {
              const meta = COMMUNITY_REACTION_META[kind];
              const active = post.mine === kind;
              const count = post.reactions[kind];
              return (
                <button
                  key={kind}
                  type="button"
                  className="b-react-chip"
                  data-active={active ? 'true' : 'false'}
                  aria-pressed={active}
                  title={active ? `${meta.title} — click to take it back` : meta.title}
                  onClick={() => post.onReact?.(kind)}
                >
                  <span className="b-react-glyph" aria-hidden="true">
                    {meta.glyph}
                  </span>
                  <span className="b-react-label">{meta.label}</span>
                  {count ? <span className="b-react-count num">{count}</span> : null}
                </button>
              );
            })}
            <button type="button" className="b-react-chip b-react-reply" onClick={post.onReply}>
              <span className="b-react-glyph" aria-hidden="true">
                ✎
              </span>
              <span className="b-react-label">{post.replyLabel}</span>
            </button>
          </div>

          {/* Stageable's CommentSection: the conversation is the point of a
              question, so it renders in the feed instead of behind a click. */}
          {post.replies.length > 0 && (
            <div className="b-replies">
              {post.replies.map((reply) => (
                <article key={reply.id} className="b-reply" data-testid="community-reply">
                  <div className="b-reply-head">
                    <span className="b-reply-mark" aria-hidden="true">
                      {townMark(reply.townLabel)}
                    </span>
                    <span className="b-reply-who">{reply.townLabel}</span>
                    <span className="b-reply-when">{reply.when}</span>
                  </div>
                  <p className="b-reply-body">{reply.body}</p>
                </article>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
