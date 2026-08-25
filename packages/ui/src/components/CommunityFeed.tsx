/**
 * The owners-only feed.
 *
 * Not a customer-facing social surface and never becomes one — the fence is that
 * we never touch a salon's customers. What makes this room worth joining is that
 * an owner will post a number here they would not post in a public group, which
 * is why a post can carry a figure as a first-class thing rather than buried in
 * the text.
 */

export interface CommunityPost {
  id: string;
  /**
   * Town only — "Burlington ON". Never a business name and never a person's
   * name. This used to carry `author` + `where` ("Dana R." / "Sunset Ridge ·
   * Burlington ON"), which contradicted the rule the wins feed enforces and
   * would have shipped two different privacy promises on the same screen.
   * Town-only wins: consent is the licence to operate, so the room has to be
   * one an owner can speak in without identifying their business.
   */
  townLabel: string;
  /** Neutral role, e.g. "Owner". Never a name. */
  roleLabel?: string;
  /** Already formatted, e.g. "2 days ago". */
  when: string;
  body: string;
  /** Optional headline number the poster is sharing from their own salon. */
  figure?: { value: string; caption: string };
  replyCount: number;
}

/** Initials for the badge, derived from the town — no logo, no avatar, no face. */
function townMark(town: string): string {
  const parts = town.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

export interface CommunityFeedProps {
  posts: readonly CommunityPost[];
  className?: string;
}

export const COMMUNITY_BLURB =
  'Owners only. Not your customers, not the public — a room where you can put a real number on the table and ask what other people are seeing.';

export function CommunityFeed({ posts, className }: CommunityFeedProps) {
  if (posts.length === 0) {
    return (
      <div className={['b-feed', className].filter(Boolean).join(' ')} data-testid="community-feed">
        <p className="b-dtable-empty">Nothing posted yet. Be the first to ask something.</p>
      </div>
    );
  }

  return (
    <div className={['b-feed', className].filter(Boolean).join(' ')} data-testid="community-feed">
      {posts.map((post) => (
        <article
          key={post.id}
          className="card b-post"
          data-testid="community-post"
        >
          <div className="b-post-head">
            <div className="b-post-avatar" aria-hidden="true">{townMark(post.townLabel)}</div>
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
          <div className="b-post-foot">
            <span>{post.replyCount} replies</span>
          </div>
        </article>
      ))}
    </div>
  );
}
