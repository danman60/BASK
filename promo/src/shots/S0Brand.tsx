// S0 — the opening statement. New: the film used to start mid-story, on the
// morning brief, and assume the viewer already knew what Bask was. This says it
// before anything moves: the wordmark, then one line naming the category.
//
// No recipe card — it is the brand's own letterpress treatment (the same
// per-glyph press used in the outro wordmark and the title cards), on the
// product's paper, with the sunset rule it is allowed exactly twice. Nothing
// here is invented styling; every value comes from tokens.ts.
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';

import { BODY, DISPLAY, T } from '../tokens';

const LETTERS = 'Bask'.split('');

export const S0Brand: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();

  // the wordmark presses in glyph by glyph, then the rule draws, then the line
  const rule = interpolate(frame, [34, 50], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1),
  });
  const line = interpolate(frame, [50, 66], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sub = interpolate(frame, [62, 78], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // hands over to the Daybreak page rather than cutting
  const out = interpolate(frame, [duration - 16, duration], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // a breath of scale so the card is never a dead still
  const drift = interpolate(frame, [0, duration], [1, 1.018], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.33, 0, 0.15, 1),
  });
  const wordSpacing = interpolate(frame, [30, 44], [-0.03, -0.018], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: T.paper,
        backgroundImage:
          'radial-gradient(1250px 800px at 50% 46%, oklch(99.4% 0.012 88 / 0.92), transparent 68%)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: out,
      }}
    >
      <div style={{ textAlign: 'center', transform: `scale(${drift})` }}>
        <div
          style={{
            fontFamily: DISPLAY, fontStyle: 'italic', fontWeight: 600, fontSize: 176,
            color: T.ink, letterSpacing: `${wordSpacing}em`, lineHeight: 1.04,
            display: 'flex', justifyContent: 'center',
          }}
        >
          {LETTERS.map((ch, i) => {
            const delay = 6 + i * 5;
            const t = interpolate(frame, [delay, delay + 14], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.2, 0.75, 0.3, 1),
            });
            return (
              <span
                key={i}
                style={{
                  opacity: t,
                  transform: `translateY(${(1 - t) * 26}px) scale(${1.3 - 0.3 * t})`,
                  filter: `blur(${(1 - t) * 8}px)`,
                  display: 'inline-block', whiteSpace: 'pre',
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>

        <div
          style={{
            width: 420, height: 7, margin: '34px auto 0', borderRadius: 4,
            background: T.gradSunset, transform: `scaleX(${rule})`,
          }}
        />

        <div
          style={{
            fontFamily: DISPLAY, fontSize: 62, fontWeight: 500, color: T.ink,
            letterSpacing: '-0.012em', marginTop: 42, opacity: line,
            transform: `translateY(${(1 - line) * 10}px)`,
          }}
        >
          Salon <span style={{ fontStyle: 'italic', color: T.primary }}>intelligence</span>.
        </div>

        <div
          style={{
            fontFamily: BODY, fontSize: 34, fontWeight: 500, color: T.inkFaint,
            marginTop: 18, opacity: sub,
          }}
        >
          Reads your data · finds the moves · ready to run
        </div>
      </div>
    </AbsoluteFill>
  );
};
