// S4 — the till. Card: crash-zoom-punch (camera/crash-zoom-punch.md),
// reference implementation demos/camera/crash-zoom-punch/CrashZoomReal.tsx.
//
// Kept: the 6-frame ease-in punch with cx/cy converging on the target as the
// zoom accelerates, the ≥30f wide hold that has to exist before it (or there is
// nothing to punch away FROM), the ≥45f close hold after it, and the rebound
// variant — zoom overshoots and gives back ~4%, which is the "look at this"
// reading rather than the "it is this" slam. The card's 已知坑 about the target
// needing a hi-res slot is why the tile is re-laid from a 4x capture.
//
// Two punches, which is the card's stated ceiling for one film. The second is
// softer than the first on purpose: the first says "scan", the second says "and
// again", and matching them would read as a tic.
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import layout from '../layout.json';
import { PageCam, CamKey } from '../lib/PageCam';
import { E, T } from '../tokens';

const EMPTY = layout.pages['pos-empty'];
const CART = layout.pages['pos-cart'];
const T5 = CART.cutouts.postile5;
const T6 = CART.cutouts.postile6;

const PUNCH1 = 44;
const PUNCH2 = 96;
const CART_AT = 128; // the till catches up with what was scanned

const ease = Easing.bezier(0.6, 0, 0.9, 0.4); // ease-IN: the punch accelerates

const CAM_KEYS: CamKey[] = [
  { frame: 0, cx: 760, cy: 720, zoom: 0.82 },
  { frame: PUNCH1, cx: 760, cy: 720, zoom: 0.82 },
  { frame: PUNCH1 + 6, cx: T5.x + T5.w / 2, cy: T5.y + T5.h / 2, zoom: 2.5 },
  { frame: PUNCH1 + 11, cx: T5.x + T5.w / 2, cy: T5.y + T5.h / 2, zoom: 2.4 }, // rebound
  { frame: PUNCH2, cx: T5.x + T5.w / 2, cy: T5.y + T5.h / 2, zoom: 2.4 },
  { frame: PUNCH2 + 6, cx: T6.x + T6.w / 2, cy: T6.y + T6.h / 2, zoom: 2.3 },
  { frame: PUNCH2 + 11, cx: T6.x + T6.w / 2, cy: T6.y + T6.h / 2, zoom: 2.22 },
  { frame: CART_AT, cx: T6.x + T6.w / 2, cy: T6.y + T6.h / 2, zoom: 2.22 },
  { frame: CART_AT + 34, cx: 1180, cy: 640, zoom: 0.98 }, // out to the cart
  { frame: 200, cx: 1240, cy: 660, zoom: 1.04 },
];

/** The punched tile gets a terracotta edge for a beat — the product's own
 *  "this went in the cart" acknowledgement, not an invented effect. */
const Added: React.FC<{ box: { x: number; y: number; w: number; h: number }; at: number; frame: number }> = ({
  box, at, frame,
}) => {
  const t = interpolate(frame, [at, at + 4, at + 16], [0, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  if (t <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute', left: box.x - 3, top: box.y - 3, width: box.w + 6, height: box.h + 6,
        borderRadius: 14, border: `2.5px solid ${T.primary}`, opacity: t,
        boxShadow: `0 0 26px oklch(58% 0.14 42 / ${t * 0.45})`,
      }}
    />
  );
};

export const S4Pos: React.FC = () => {
  const frame = useCurrentFrame();

  // the cart fills once both items are scanned; the swap rides the camera move
  const cartIn = interpolate(frame, [CART_AT, CART_AT + 10], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: T.paper }}>
      {/* before: the wall, an empty till */}
      <PageCam src="textures/pos-empty.png" pageH={EMPTY.pageH} keys={CAM_KEYS} ease={ease}>
        {/* the punched tiles, re-laid at 4x so the close-up holds up (Q2) */}
        <Img
          src={staticFile('textures/postile5-4x.png')}
          style={{ position: 'absolute', left: T5.x, top: T5.y, width: T5.w, height: T5.h, display: 'block' }}
        />
        <Img
          src={staticFile('textures/postile6-4x.png')}
          style={{ position: 'absolute', left: T6.x, top: T6.y, width: T6.w, height: T6.h, display: 'block' }}
        />
        <Added box={T5} at={PUNCH1 + 8} frame={frame} />
        <Added box={T6} at={PUNCH2 + 8} frame={frame} />
      </PageCam>

      {/* after: the same page with the items on the receipt */}
      <AbsoluteFill style={{ opacity: cartIn }}>
        <PageCam src="textures/pos-cart.png" pageH={CART.pageH} keys={CAM_KEYS} ease={ease}>
          <Img
            src={staticFile('textures/pos-panel-4x.png')}
            style={{
              position: 'absolute',
              left: CART.cutouts['pos-panel'].x, top: CART.cutouts['pos-panel'].y,
              width: CART.cutouts['pos-panel'].w, height: CART.cutouts['pos-panel'].h,
              display: 'block',
            }}
          />
        </PageCam>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

void E;
