// 48 element cutouts already sit in promo/public/textures/v5 and the v5 cut framed almost none of them.
//
// TWO THINGS WERE FIXED HERE ON 2026-09-02, both found by pulling frames out of
// the shipped v6 master rather than by reading the code:
//
// 1. THE BACKDROP WAS NEVER VISIBLE. This component painted an opaque
//    `backgroundColor: T.paper` over the whole frame, so the dimmed page that
//    `Backdrop` renders behind every plate was covered completely. Every plate
//    shot in v6 played as an element floating on blank cream — which is exactly
//    the "elements too isolated" note the v6 rebuild existed to answer, and the
//    header of Acts6.tsx claims it was answered. The fill is now transparent.
//
// 2. TALL PAGE CAPTURES WERE ILLEGIBLE. `maxHeight: 742` is right for a wide
//    cutout like `daybreak-letter` (it fills the frame and reads beautifully at
//    1920x1080) and wrong for a portrait page. `citation.png` is 740x1350 and
//    landed at 407x742 — a postage stamp of body text in the middle of a 1920
//    frame. `records-table` is 2052x4170 and lands at 365x742, worse. Those two
//    now use `move="travel"`: scaled up past the frame and panned down, so the
//    page is read rather than glanced at.
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { T, BODY, E } from '../../tokens';

export type FigurePlateProps = {
  src: string;
  caption?: string;
  move?: 'push' | 'drift' | 'settle' | 'travel';
  delay?: number;
  /**
   * How long the move takes. Defaults to the old fixed windows (90f for push and
   * drift, 30f for settle) so nothing that does not pass it changes.
   *
   * WHY IT EXISTS: the windows used to be hardcoded, which was invisible while
   * every shot was about three seconds long. Re-cutting to the 2026-09-02 read
   * stretched `method` to 619f, and a plate that finished pushing at frame 90
   * would have sat frozen for 17.6 of its 20.6 seconds. Pass the shot's own
   * duration and the move fills the beat it actually has.
   */
  moveFrames?: number;
  /** `travel` only: rendered width in output px. The image keeps its aspect. */
  travelWidth?: number;
  /** `travel` only: vertical offset in output px at the first frame. */
  travelFrom?: number;
  /** `travel` only: vertical offset in output px at the last frame. Negative pans down the page. */
  travelTo?: number;
};

export const FigurePlate: React.FC<FigurePlateProps> = ({
  src,
  caption,
  move = 'push',
  delay = 0,
  moveFrames,
  travelWidth = 1180,
  travelFrom = 0,
  travelTo = -900,
}) => {
  const frame = useCurrentFrame();
  const startFrame = delay;
  const href = staticFile(src.includes('/') ? src : `textures/v5/${src}.png`);

  // Image fade in over 12 frames
  const imageOpacity = interpolate(frame - startFrame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Caption fade in after image (10 frames after image fades in)
  const captionStartFrame = startFrame + 12 + 10;
  const captionOpacity = interpolate(frame - captionStartFrame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  /* ------------------------------------------------------------------ travel
     A page too tall to fit the frame, scaled up and panned down it. This is the
     only move that reveals content instead of just breathing on it, so it is
     the one to reach for when the beat is long AND the plate is a whole page.
     Top-anchored rather than centre-anchored: a centred transform makes the
     offsets impossible to reason about once the image is taller than the frame. */
  if (move === 'travel') {
    const t = interpolate(frame - startFrame, [0, Math.max(1, (moveFrames ?? 90) - 1)], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: E.camera,
    });
    const y = travelFrom + (travelTo - travelFrom) * t;
    return (
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            transform: `translateX(-50%) translateY(${y}px)`,
          }}
        >
          <Img
            src={href}
            style={{
              display: 'block',
              width: travelWidth,
              height: 'auto',
              borderRadius: 14,
              opacity: imageOpacity,
              boxShadow: T.shadowPop,
            }}
          />
        </div>
      </AbsoluteFill>
    );
  }

  // Motion based on move prop
  let scale = 1;
  let translateX = 0;

  if (move === 'push') {
    // Scale from 1.0 to 1.06 over `moveFrames` (default 90)
    const pushProgress = interpolate(frame - startFrame, [0, moveFrames ?? 90], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    scale = interpolate(pushProgress, [0, 1], [1, 1.06], {
      easing: E.push,
    });
  } else if (move === 'drift') {
    // Translate horizontally by 22px over `moveFrames` (default 90)
    const driftProgress = interpolate(frame - startFrame, [0, moveFrames ?? 90], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    translateX = interpolate(driftProgress, [0, 1], [0, 22], {
      easing: E.camera,
    });
  } else if (move === 'settle') {
    // Scale from 1.04 to 1.0 over `moveFrames` (default 30)
    const settleProgress = interpolate(frame - startFrame, [0, moveFrames ?? 30], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    scale = interpolate(settleProgress, [0, 1], [1.04, 1], {
      easing: E.easeOut,
    });
  }

  return (
    /* NO background fill. It used to be `T.paper`, opaque, which hid the dimmed
       page `Backdrop` draws behind every plate — see the header. */
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale})`,
        transformOrigin: 'center',
      }}>
        {/* `src` takes EITHER a bare v5 texture name ("daybreak-letter") or a
            full path under public ("textures/v6/citation.png"). The generated
            version hardcoded the v5 folder, which locked the component out of
            every capture taken since — including the coaching citation, which
            is the one shot in this film showing a feature that did not exist
            when the v5 textures were shot. */}
        <Img
          src={href}
          style={{
            display: 'block',
            borderRadius: 14,
            opacity: imageOpacity,
            boxShadow: T.shadowPop,
            /* The cutouts are 3x captures — `records-table` is 2052x4170 and
               `net-map` is 2700 wide. Rendered at natural size they hang off a
               1920x1080 frame in every direction and the shot reads as a crop
               of nothing. Fit inside the frame with margin, and let the camera
               move do the rest.

               This is correct for a WIDE cutout and wrong for a whole page —
               a portrait capture gets squeezed to ~400px and its body text
               becomes unreadable. Those use `move="travel"` instead. */
            maxWidth: 1420,
            maxHeight: 742,
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
          }}
        />
        {caption && (
          <div
            style={{
              fontFamily: BODY,
              fontSize: 16,
              fontWeight: 400,
              lineHeight: 1.4,
              color: T.ink,
              marginTop: 12,
              textAlign: 'center',
              opacity: captionOpacity,
              width: '100%',
            }}
          >
            {caption}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
