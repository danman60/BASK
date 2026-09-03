import './video.css';

/**
 * The product film, on its own page.
 *
 * Outside the (bask) group on purpose — see video.css. The asset lives on R2
 * because it is 66 MB; only the 720p cut is streamed by default so the page
 * starts fast on a room's wifi, with the 1080p master one click away.
 */
export const metadata = {
  title: 'Bask — the film',
  description: 'Two minutes on what Bask does for a salon.',
};

const R2 = 'https://pub-626d1637ca4c4f34a7916019aaa3efce.r2.dev/bask';

export default function VideoPage() {
  return (
    <main className="film-page">
      <div className="film-head">
        <div className="film-mark">Bask</div>
        <h1 className="film-title">Salon intelligence, in two minutes.</h1>
        <p className="film-sub">
          What the numbers in your own system already know, and what to do about it tomorrow morning.
        </p>
      </div>

      <div className="film-stage">
        {/* poster keeps the first frame up while the file buffers */}
        <video controls playsInline preload="metadata" poster={`${R2}/promo-v7-poster.jpg`}>
          <source src={`${R2}/promo-v7-720.mp4`} type="video/mp4" />
          Your browser cannot play this video.{' '}
          <a href={`${R2}/promo-v7-1080.mp4`}>Download it instead.</a>
        </video>
      </div>

      <div className="film-meta">
        <span>2 min 10 sec</span>
        <span>&middot;</span>
        <a href={`${R2}/promo-v7-1080.mp4`} target="_blank" rel="noreferrer">
          Watch in 1080p
        </a>
      </div>

      <div className="film-cta">
        <a className="film-btn" href="/">Open the product</a>
        <a className="film-btn ghost" href="/compass">Compass, for UVALUX</a>
      </div>
    </main>
  );
}
