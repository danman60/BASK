/**
 * The owners-only feed.
 *
 * Not a customer-facing social surface and never becomes one — the fence is that
 * we never touch a salon's customers. What makes this room worth joining is that
 * an owner will post a number here they would not post in a public group, which
 * is why a post can carry a figure as a first-class thing rather than buried in
 * the text.
 */

import type { ReactNode } from 'react';

export interface CommunityPost {
  id: string;
  /** Post author's display name. */
  author: string;
  /** Their salon and town, e.g. "Sunset Ridge · Burlington ON". */
  where: string;
  /** Initials for the avatar, e.g. "SR". */
  initials: string;
  /** Already formatted, e.g. "2 days ago". */
  when: string;
  body: string;
  /** Optional headline number the author is sharing from their own salon. */
  figure?: { value: string; caption: string };
  replyCount: number;
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
            <div className="b-post-avatar">{post.initials}</div>
            <div>
              <div className="b-post-who">{post.author}</div>
              <div className="b-post-where">{post.where}</div>
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
