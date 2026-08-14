// S4 — insight becomes a written campaign.
// Card: card-flip-reveal (transition/card-flip-reveal.md), reference
// implementation demos/transition/card-flip-reveal/CardFlipReveal.tsx.
//
// Kept: perspective 1200 + preserve-3d, both faces backfaceVisibility hidden
// with the back pre-rotated 180°, 18f Easing.bezier(0.55,0,0.3,1) drive to 192°
// then 8f Easing.out(poly(5)) settle to 180°, and the angle-linked sheen band
// that peaks at 90° as a DARKENING on light stock (the demo's white-ground
// judgement). Single card instead of three, because the pair here is one
// cause and one effect: the finding on the front, the campaign it wrote on the
// back. The face swap of aspect ratio happens at 90°, where both faces are
// edge-on and invisible.
//
// After the flip settles, the Studio review page fades in *behind* the card at
// exactly the scale and position where its own Instagram card sits, so the
// floating card and the page's card are the same object — then the camera pulls
// back to show what else was written (SMS, email subject, audience).
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import layout from '../layout.json';
import { PageCam, CamKey } from '../lib/PageCam';
import { E, T } from '../tokens';

// studio-review.png is not in layout.json (captured on the one-off GEN pass);
// its measured geometry is recorded here.
const PAGE_H = 1111;
const IG = { x: 410, y: 314, w: 401, h: 532 }; // Instagram post card, page CSS px
const INSIGHT = layout.pages['today-full'].cutouts.insight4;

const FLIP_START = 16;
const FLIP_DUR = 18;
const SETTLE = 8;
const OVERSHOOT = 12;
const FLIP_END = FLIP_START + FLIP_DUR + SETTLE; // 42

const angleAt = (f: number): number => {
  if (f < FLIP_START + FLIP_DUR) {
    return interpolate(f, [FLIP_START, FLIP_START + FLIP_DUR], [0, 180 + OVERSHOOT], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.55, 0, 0.3, 1),
    });
  }
  return interpolate(f, [FLIP_START + FLIP_DUR, FLIP_END], [180 + OVERSHOOT, 180], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.poly(5)),
  });
};

const Sheen: React.FC<{ angle: number; radius: number }> = ({ angle, radius }) => {
  const pos = interpolate(angle, [35, 145], [-25, 115], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const op = Math.max(0, 1 - Math.abs(angle - 90) / 55);
  if (op <= 0.004) return null;
  return (
    <div
      style={{
        position: 'absolute', inset: 0, borderRadius: radius, pointerEvents: 'none', opacity: op,
        background: `linear-gradient(105deg, rgba(0,0,0,0) ${pos - 14}%, rgba(0,0,0,0.32) ${pos}%, rgba(0,0,0,0) ${pos + 14}%)`,
      }}
    />
  );
};

// The page rides in at IG-card scale and then pulls back to the whole review.
const SCALE = 1.5;
const CAM_KEYS: CamKey[] = [
  { frame: 0, cx: IG.x + IG.w / 2, cy: IG.y + IG.h / 2, zoom: SCALE },
  { frame: 58, cx: IG.x + IG.w / 2, cy: IG.y + IG.h / 2, zoom: SCALE },
  { frame: 112, cx: 960, cy: PAGE_H / 2, zoom: 0.95 },
  { frame: 150, cx: 960, cy: PAGE_H / 2, zoom: 0.95 },
];

export const S4Studio: React.FC = () => {
  const frame = useCurrentFrame();
  const angle = angleAt(frame);

  // the page arrives once the card has landed on its result face
  const pageIn = interpolate(frame, [FLIP_END + 6, FLIP_END + 18], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1),
  });
  // …and the floating card hands over to the page's own card underneath it
  const cardOut = interpolate(frame, [FLIP_END + 12, FLIP_END + 20], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const lift = Math.sin(Math.min(Math.max(angle, 0), 180) * (Math.PI / 180));
  const frontW = INSIGHT.w * 1.5;
  const frontH = INSIGHT.h * 1.5;
  const backW = IG.w * SCALE;
  const backH = IG.h * SCALE;

  return (
    <AbsoluteFill style={{ backgroundColor: T.paper }}>
      {/* the review page, revealed behind the settled card */}
      <AbsoluteFill style={{ opacity: pageIn }}>
        <PageCam src="textures/studio-review.png" pageH={PAGE_H} keys={CAM_KEYS} ease={E.camera} />
      </AbsoluteFill>

      {/* the flipping card, screen-space, centred where the page's IG card is */}
      {cardOut > 0.01 ? (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: cardOut }}>
          <div style={{ width: backW, height: backH, perspective: 1200, position: 'relative' }}>
            <div
              style={{
                position: 'absolute', inset: 0, transformStyle: 'preserve-3d',
                transform: `rotateY(${angle}deg)`,
              }}
            >
              {/* front: the finding, as it stands on Today */}
              <div
                style={{
                  position: 'absolute', left: (backW - frontW) / 2, top: (backH - frontH) / 2,
                  width: frontW, height: frontH, backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden', borderRadius: T.radiusLg,
                  boxShadow: `0 ${6 + lift * 20}px ${18 + lift * 44}px rgba(46,32,26,${0.1 + lift * 0.14})`,
                }}
              >
                <Img
                  src={staticFile('textures/insight4-4x.png')}
                  style={{ width: '100%', height: '100%', display: 'block', borderRadius: T.radiusLg }}
                />
                <Sheen angle={angle} radius={T.radiusLg} />
              </div>

              {/* back: what Bask wrote from it */}
              <div
                style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                  borderRadius: T.radiusLg,
                  boxShadow: `0 ${6 + lift * 20}px ${18 + lift * 44}px rgba(46,32,26,${0.1 + lift * 0.14})`,
                }}
              >
                <Img
                  src={staticFile('textures/ig-card.png')}
                  style={{ width: '100%', height: '100%', display: 'block', borderRadius: T.radiusLg }}
                />
                <Sheen angle={angle} radius={T.radiusLg} />
              </div>
            </div>
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
