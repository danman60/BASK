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

import { DEMO_COMMUNITY_POSTS, DEMO_COMMUNITY_TODAY, type CommunityPostSeed } from '@bask/core';
import { CommunityFeed, CommunityComposer, type CommunityPost } from '@bask/ui';

function whenLabel(occurredAtDay: number, today: number): string {
  const days = Math.max(0, today - occurredAtDay);
  if (days <= 1) return 'today';
  if (days < 14) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  return `${weeks} weeks ago`;
}

function toPost(seed: CommunityPostSeed): CommunityPost {
  return {
    id: seed.id,
    townLabel: seed.townLabel,
    roleLabel: seed.roleLabel,
    when: whenLabel(seed.occurredAtDay, DEMO_COMMUNITY_TODAY),
    body: seed.body,
    figure: seed.figure ? { value: seed.figure.value, caption: seed.figure.caption } : undefined,
    replyCount: seed.replyCount,
  };
}

export default function CommunityPage() {
  const [body, setBody] = useState('');
  const [figureValue, setFigureValue] = useState('');
  const [figureCaption, setFigureCaption] = useState('');

  const posts = DEMO_COMMUNITY_POSTS.map(toPost);

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
