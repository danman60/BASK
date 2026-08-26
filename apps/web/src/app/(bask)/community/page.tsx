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

import { useEffect, useRef, useState } from 'react';

import { DEMO_COMMUNITY_POSTS, DEMO_COMMUNITY_TODAY } from '@bask/core';
import {
  CommunityFeed,
  CommunityComposer,
  COMMUNITY_MEDIA_LIMITS,
  type CommunityMedia,
  type CommunityMediaError,
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

/** A post the viewer wrote this session. Nothing is persisted — see the fence below. */
interface DraftPost {
  id: string;
  body: string;
  figure?: { value: string; caption: string };
  media?: CommunityMedia;
}

export default function CommunityPage() {
  const [body, setBody] = useState('');
  const [figureValue, setFigureValue] = useState('');
  const [figureCaption, setFigureCaption] = useState('');
  const [media, setMedia] = useState<CommunityMedia | null>(null);
  const [mediaError, setMediaError] = useState<CommunityMediaError | null>(null);
  const [posted, setPosted] = useState<DraftPost[]>([]);

  /**
   * Every object URL handed to an <img>/<video> has to be handed back, or the
   * blob stays in memory for the life of the document. Revoking on unmount
   * covers both the attachment and anything already posted this session.
   */
  const objectUrls = useRef<string[]>([]);
  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.current = [];
    },
    [],
  );

  /**
   * Reads the picked file straight into an object URL. There is no storage
   * bucket behind this yet, so an attachment lives as long as the tab does —
   * the fence under the composer says so rather than implying it uploaded.
   * Limits match Stageable's, which is where the pattern came from.
   */
  const handleMedia = (files: File[]) => {
    if (files.length === 0) {
      setMedia(null);
      setMediaError(null);
      return;
    }
    const kindOf = (f: File) =>
      f.type.startsWith('video/') ? 'video' : f.type.startsWith('image/') ? 'image' : null;

    if (files.some((f) => kindOf(f) === null)) {
      setMedia(null);
      setMediaError('type');
      return;
    }
    const tooBig = files.some(
      (f) =>
        f.size >
        (kindOf(f) === 'video'
          ? COMMUNITY_MEDIA_LIMITS.videoBytes
          : COMMUNITY_MEDIA_LIMITS.imageBytes),
    );
    if (tooBig) {
      setMedia(null);
      setMediaError('size');
      return;
    }

    const urlFor = (f: File) => {
      const url = URL.createObjectURL(f);
      objectUrls.current.push(url);
      return url;
    };
    setMediaError(null);

    // More than one picture is a set, which is what a carousel is for. A video
    // is always on its own — a mixed strip of stills and clips has no sensible
    // playback behaviour, so the first file wins and the rest are ignored.
    const images = files.filter((f) => kindOf(f) === 'image');
    if (images.length > 1) {
      setMedia({ kind: 'carousel', items: images.map((f) => ({ url: urlFor(f), alt: f.name })) });
      return;
    }
    const first = files[0]!;
    setMedia({ kind: kindOf(first) === 'video' ? 'video' : 'image', url: urlFor(first), alt: first.name });
  };

  /** Which reaction the viewer has left per post — one at a time, as in Stageable. */
  const [mine, setMine] = useState<Record<string, CommunityReaction | null>>(() =>
    Object.fromEntries(DEMO_COMMUNITY_POSTS.map((p) => [p.id, p.mine ?? null])),
  );

  /* Anything written this session sits at the top of the feed, the way it does
     in any feed — an owner who posts and sees nothing happen assumes it broke. */
  const own: CommunityPost[] = posted.map((draft) => ({
    id: draft.id,
    townLabel: 'Burlington ON',
    roleLabel: 'Owner',
    when: 'just now',
    body: draft.body,
    figure: draft.figure,
    media: draft.media,
    reactions: { same: '', helpful: '', watching: '' },
    mine: null,
    replies: [],
    replyLabel: 'No replies yet',
  }));

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
      media: seed.media ? { ...seed.media } : undefined,
      reactions: {
        same: countFor('same'),
        helpful: countFor('helpful'),
        watching: countFor('watching'),
      },
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
    /* Two elements on purpose. The shell owns the page gutter and the outer
       max-width; the feed column owns its own much narrower one. Putting both
       classes on one element made them fight over `max-width` at equal
       specificity, and source order — not intent — decided it. */
    <main className="b-shell b-shell-wide">
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
          media={media}
          onMediaChange={handleMedia}
          mediaError={mediaError}
          submitting={false}
          onSubmit={() => {
            setPosted((prev) => [
              {
                id: `own-${prev.length + 1}`,
                body: body.trim(),
                figure:
                  figureValue.trim() || figureCaption.trim()
                    ? { value: figureValue.trim(), caption: figureCaption.trim() }
                    : undefined,
                media: media ?? undefined,
              },
              ...prev,
            ]);
            setBody('');
            setFigureValue('');
            setFigureCaption('');
            setMedia(null);
            setMediaError(null);
          }}
        />

        {/* Said out loud rather than faked: there is no posts table and no media
          bucket behind this room yet, so a post lives in this tab. */}
        <p className="b-community-fence">
          Nothing here is saved yet — posts and attachments stay in this tab until the community
          room is connected to the server.
        </p>

        <CommunityFeed posts={[...own, ...posts]} />
      </div>
    </main>
  );
}
