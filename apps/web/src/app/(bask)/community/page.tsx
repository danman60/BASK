'use client';

/**
 * The owners-only community room.
 *
 * Nick's own read of why salons stay with UVALUX: they come for the lotion, but
 * "the community's the biggest one". This is that room, and it is the surface
 * `CommunityFeed`/`CommunityComposer` were built for — both had been sitting in
 * `@bask/ui` rendering for nobody.
 *
 * Identity is TOWN ONLY, matching the wins feed. The composer state lives here
 * because the components are pure and props-only; posting is not wired to a
 * server yet, so submit clears the box and nothing is persisted. That is stated
 * on screen rather than faked.
 */

import { useState } from 'react';

import { DEMO_COMMUNITY_POSTS, DEMO_COMMUNITY_TODAY } from '@bask/core';
import {
  CommunityFeed,
  CommunityComposer,
  type CommunityPost,
  type CommunityReaction,
} from '@bask/ui';

function whenLabel(occurredAtDay: number, today: number): string {
  const days = Math.max(0, today - occurredAtDay);
  if (days <= 1) return 'today';
  if (days < 14) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  return `${weeks} weeks ago`;
}

export default function CommunityPage() {
  const [body, setBody] = useState('');
  const [figureValue, setFigureValue] = useState('');
  const [figureCaption, setFigureCaption] = useState('');

  /** Which reaction the viewer has left per post — one at a time, as in Stageable. */
  const [mine, setMine] = useState<Record<string, CommunityReaction | null>>(() =>
    Object.fromEntries(DEMO_COMMUNITY_POSTS.map((p) => [p.id, p.mine ?? null])),
  );

  const posts: CommunityPost[] = DEMO_COMMUNITY_POSTS.map((seed) => {
    const chosen = mine[seed.id] ?? null;
    const seeded = seed.mine ?? null;
    // Show the count the viewer's own tap implies without recomputing anything
    // the server owns — the card itself never does arithmetic.
    const countFor = (kind: CommunityReaction) => {
      const base = seed.reactions[kind];
      const shown = base + (chosen === kind ? 1 : 0) - (seeded === kind ? 1 : 0);
      return shown > 0 ? String(shown) : '';
    };
    return {
      id: seed.id,
      townLabel: seed.townLabel,
      roleLabel: seed.roleLabel,
      when: whenLabel(seed.occurredAtDay, DEMO_COMMUNITY_TODAY),
      body: seed.body,
      figure: seed.figure ? { value: seed.figure.value, caption: seed.figure.caption } : undefined,
      reactions: { same: countFor('same'), helpful: countFor('helpful'), watching: countFor('watching') },
      mine: chosen,
      onReact: (kind: CommunityReaction) =>
        setMine((prev) => ({ ...prev, [seed.id]: prev[seed.id] === kind ? null : kind })),
      replies: seed.replies.map((r) => ({
        id: r.id,
        townLabel: r.townLabel,
        when: whenLabel(r.occurredAtDay, DEMO_COMMUNITY_TODAY),
        body: r.body,
      })),
      replyLabel: seed.replies.length === 1 ? '1 reply' : `${seed.replies.length} replies`,
      onReply: () => undefined,
    };
  });

  return (
    <div className="b-community">
      <header className="b-winfeed-head">
        <div>
          <h1 className="b-winfeed-title">Community</h1>
          <p className="b-winfeed-sub">
            Owners only. Not your customers, not the public — a room where you can put a real
            number on the table and ask what other people are seeing.
          </p>
        </div>
        <span className="b-winfeed-fence">Your town, never your business name</span>
      </header>

      <CommunityComposer
        body={body}
        onBodyChange={setBody}
        figureValue={figureValue}
        onFigureValueChange={setFigureValue}
        figureCaption={figureCaption}
        onFigureCaptionChange={setFigureCaption}
        submitting={false}
        onSubmit={() => {
          setBody('');
          setFigureValue('');
          setFigureCaption('');
        }}
      />

      <CommunityFeed posts={posts} />
    </div>
  );
}
