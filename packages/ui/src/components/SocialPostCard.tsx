/**
 * A prepared social campaign — both networks' copy side by side.
 *
 * The image line is art direction, not an image: the demo prepares words and
 * the owner supplies the photo. Copy arrives finished off the action; this
 * card never writes marketing.
 */
import type { SocialAction } from '@bask/core';

export interface SocialPostCardProps {
  action: SocialAction;
  /** Fired when the create button is pressed. */
  onCreate?: () => void;
  className?: string;
}

export function SocialPostCard({ action, onCreate, className }: SocialPostCardProps) {
  return (
    <div className={['card', 'b-social', className].filter(Boolean).join(' ')} data-testid="social-post-card">
      <div className="b-social-net">Facebook</div>
      <p className="b-social-copy">{action.facebook}</p>
      <div className="b-social-net">Instagram</div>
      <p className="b-social-copy">{action.instagram}</p>
      <div className="b-social-cta">{action.cta}</div>
      <p className="b-social-img">{action.imageDirection}</p>
      <button type="button" className="b-approve" onClick={onCreate} data-testid="social-create">
        Create posts
      </button>
    </div>
  );
}