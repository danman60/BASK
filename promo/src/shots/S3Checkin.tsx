// S3 — the front desk. Card: type-and-filter (interaction/type-and-filter.md),
// reference implementation template/src/aifl/live/SceneFlyIn.tsx.
//
// Kept from the card: the camera goes to the search field first, typing runs at
// 3 frames per character (its "unhurried"定稿 value — interaction shots are
// paced to a real hand, R3), a ~11f breath after the last character before the
// page responds, the caret is solid while typing and only starts blinking when
// the typing stops (that switch IS the "done" signal), and the click is a
// double concentric ripple, not a single one.
//
// Adapted: Bask's check-in does not hold a 26-card grid to collapse — it holds a
// results list and a customer panel. So the "grid converges to one card" beat is
// the panel arriving: results appear under the field, then the customer's own
// card takes the right rail. The card's Q9 rule still governs — the panel lands
// in its real page slot, it does not float.
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import layout from '../layout.json';
import { PageCam, CamKey } from '../lib/PageCam';
import { BODY, E, T } from '../tokens';

const EMPTY = layout.pages['checkin-empty'];
const CARD = layout.pages['checkin-card'];
const PANEL = CARD.cutouts['checkin-panel'];
const RESULTS = layout.pages['checkin-search'].cutouts['checkin-results'];

const QUERY = 'Rosalind';
const TYPE_START = 26;
const PER_CHAR = 3; // the card's value — a hand, not a script
const TYPE_END = TYPE_START + QUERY.length * PER_CHAR; // 50
const RESPOND = TYPE_END + 11; // the breath the card insists on
const CLICK = RESPOND + 34;

// the search field, in page space (from the empty capture)
const FIELD = { x: 53, y: 214, w: 1418, h: 46 };

const CAM_KEYS: CamKey[] = [
  { frame: 0, cx: 760, cy: 300, zoom: 1.18 }, // the field
  { frame: 60, cx: 760, cy: 300, zoom: 1.18 },
  { frame: 96, cx: 1180, cy: 430, zoom: 1.05 }, // widen as the card arrives
  { frame: 170, cx: 1300, cy: 470, zoom: 1.12 }, // settle on the customer
];

export const S3Checkin: React.FC = () => {
  const frame = useCurrentFrame();

  const typed = Math.max(0, Math.min(QUERY.length, Math.floor((frame - TYPE_START) / PER_CHAR)));
  const caretOn = (() => {
    if (frame < TYPE_START) return false;
    if (frame < TYPE_END) return true; // solid while typing
    if (frame > CLICK) return false;
    return Math.floor((frame - TYPE_END) / 8) % 2 === 0; // then blinks
  })();

  // the results list, then the customer's panel
  const resultsIn = interpolate(frame, [RESPOND, RESPOND + 10], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.easeOut,
  });
  const resultsOut = interpolate(frame, [CLICK, CLICK + 8], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const panelIn = interpolate(frame, [CLICK + 4, CLICK + 18], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.easeOut,
  });
  const panelRise = interpolate(frame, [CLICK + 4, CLICK + 18], [18, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.easeOut,
  });

  // double concentric ripple on the click — a single ring reads as nothing
  const ripple = (delay: number) => {
    const t = interpolate(frame, [CLICK + delay, CLICK + delay + 10], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
    });
    return { r: 14 + t * 64, o: (1 - t) * 0.5 };
  };
  const r1 = ripple(0);
  const r2 = ripple(3);

  return (
    <AbsoluteFill style={{ backgroundColor: T.paper }}>
      <PageCam src="textures/checkin-empty.png" pageH={EMPTY.pageH} keys={CAM_KEYS} ease={E.camera}>
        {/* paper patch over the baked-in placeholder, then the typed text on top
            — typing straight onto the texture double-exposes with the原 placeholder */}
        <div
          style={{
            position: 'absolute', left: FIELD.x + 1, top: FIELD.y + 1,
            width: FIELD.w - 2, height: FIELD.h - 2, background: T.card, borderRadius: 10,
          }}
        />
        <div
          style={{
            position: 'absolute', left: FIELD.x + 16, top: FIELD.y + 11,
            fontFamily: BODY, fontSize: 15, color: T.ink, display: 'flex', alignItems: 'center',
          }}
        >
          <span>{QUERY.slice(0, typed)}</span>
          <span
            style={{
              display: 'inline-block', width: 2, height: 19, marginLeft: 2,
              background: T.ink, opacity: caretOn ? 0.9 : 0,
            }}
          />
        </div>

        {/* the results list the query produced */}
        {resultsIn > 0.01 && resultsOut > 0.01 ? (
          <div
            style={{
              position: 'absolute', left: RESULTS.x, top: RESULTS.y,
              width: RESULTS.w, height: RESULTS.h, opacity: resultsIn * resultsOut,
              transform: `translateY(${(1 - resultsIn) * 10}px)`,
            }}
          >
            <Img
              src={staticFile('textures/checkin-results.png')}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </div>
        ) : null}

        {/* the customer's own card, landing in the rail's real slot */}
        {panelIn > 0.01 ? (
          <div
            style={{
              position: 'absolute', left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h,
              opacity: panelIn, transform: `translateY(${panelRise}px)`,
              borderRadius: T.radiusLg, overflow: 'hidden', boxShadow: T.shadowPop,
            }}
          >
            <Img
              src={staticFile('textures/checkin-panel-4x.png')}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </div>
        ) : null}

        {/* click confirmation on the result that was picked */}
        {frame >= CLICK && frame < CLICK + 16
          ? [r1, r2].map((r, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: RESULTS.x + 120 - r.r, top: RESULTS.y + RESULTS.h / 2 - r.r,
                  width: r.r * 2, height: r.r * 2, borderRadius: '50%',
                  border: `3px solid ${T.primary}`, opacity: r.o,
                  boxShadow: `0 0 40px oklch(58% 0.14 42 / ${r.o * 0.5})`,
                }}
              />
            ))
          : null}
      </PageCam>
    </AbsoluteFill>
  );
};
