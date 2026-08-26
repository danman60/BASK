'use client';

/**
 * A prepared social campaign, shown the way it will actually appear.
 *
 * This card used to render `imageDirection` as a sentence — "Warm photo of the
 * red-light room, door open" — under the two captions, and nothing in the app
 * rendered the card at all. Both halves of that were the same mistake: an owner
 * who is handed a description of a photo still has to go and take the photo,
 * which is exactly the work they did not want to do. The card now shows the
 * finished artwork, and the direction line survives as the explanation of why
 * the picture looks like that.
 *
 * Instagram and Facebook are one post with two captions, so they are a toggle
 * rather than two stacked blocks — the owner reads one at a time, the way it
 * gets posted.
 */
import { useState } from 'react';

import type { SocialAction } from '@bask/core';

export interface SocialPostCardProps {
  action: SocialAction;
  /** The salon's own public handle. This IS their branding — unlike the
   *  owners-only room, a marketing post is supposed to say who it is from. */
  salonName?: string;
  /** Fired when the create button is pressed. */
  onCreate?: () => void;
  className?: string;
}

type Network = 'instagram' | 'facebook';

export function SocialPostCard({
  action,
  salonName = 'Your salon',
  onCreate,
  className,
}: SocialPostCardProps) {
  const [network, setNetwork] = useState<Network>('instagram');
  const [slide, setSlide] = useState(0);

  const creative = action.creative ?? [];
  const caption = network === 'instagram' ? action.instagram : action.facebook;
  const initials = salonName.trim().slice(0, 2).toUpperCase();

  return (
    <div
      className={['card', 'b-social', className].filter(Boolean).join(' ')}
      data-testid="social-post-card"
    >
      <div className="b-social-tabs" role="tablist" aria-label="Where this posts">
        {(['instagram', 'facebook'] as const).map((net) => (
          <button
            key={net}
            type="button"
            role="tab"
            aria-selected={network === net}
            className="b-social-tab"
            data-active={network === net ? 'true' : 'false'}
            onClick={() => setNetwork(net)}
          >
            {net === 'instagram' ? 'Instagram' : 'Facebook'}
          </button>
        ))}
      </div>

      {/* The post as it will look, not a description of it. */}
      <div className="b-social-preview">
        <div className="b-social-head">
          <span className="b-social-avatar" aria-hidden="true">
            {initials}
          </span>
          <span className="b-social-handle">{salonName}</span>
        </div>

        {creative.length > 0 ? (
          <div className="b-social-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="b-social-img-el"
              src={creative[Math.min(slide, creative.length - 1)]!.url}
              alt={creative[Math.min(slide, creative.length - 1)]!.alt}
            />
            {creative.length > 1 && (
              <>
                <span className="b-social-count num" aria-hidden="true">
                  {slide + 1}/{creative.length}
                </span>
                <div className="b-social-dots">
                  {creative.map((c, i) => (
                    <button
                      key={c.url}
                      type="button"
                      className="b-social-dot"
                      data-active={i === slide ? 'true' : 'false'}
                      aria-label={`Slide ${i + 1} of ${creative.length}`}
                      onClick={() => setSlide(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          // No artwork prepared for this one — say so plainly rather than
          // implying a picture exists.
          <p className="b-social-noimg">
            No picture prepared yet. {action.imageDirection}
          </p>
        )}

        <div className="b-social-glyphs" aria-hidden="true">
          <span>♡</span>
          <span>💬</span>
          <span>↗</span>
        </div>

        <p className="b-social-copy">
          <b>{salonName}</b> {caption}
        </p>
      </div>

      <p className="b-social-cta">{action.cta}</p>
      {creative.length > 0 && (
        <p className="b-social-img">Art direction: {action.imageDirection}</p>
      )}

      <button
        type="button"
        className="btn btn-primary b-approve"
        onClick={onCreate}
        data-testid="social-create"
      >
        Create posts
      </button>
    </div>
  );
}
