// Copied from template/src/aifl/PaperTitleCard.tsx (card: typography/paper-title-card)
// and re-skinned to Bask: Fraunces instead of a generic serif, terracotta accent
// instead of amber, warm-ivory paper from the product's own tokens. The tuned
// parameters are kept: per-word delay 4 + i*4 over 9f with the 1.28→1 letterpress
// scale + blur, underline 16→34f, 8f fade-out, one accent word per card.
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';

import { BODY, DISPLAY, E, T } from '../tokens';

export const PaperTitleCard: React.FC<{
  duration: number;
  words: { text: string; accent?: boolean }[];
  sub?: string;
  /** Compass palette. The second breathing card sits directly before the act
   *  break, so it changes light — two identical paper cards read as one device
   *  used twice, and this one is already leaving Bask. */
  dark?: boolean;
}> = ({ duration, words, sub, dark = false }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // The sentence must stand still for a full second after its last word
  // settles (R1). With per-word delays of 4 + i*4 + 9 and the rule finishing at
  // f34, that needs the card to be ~70f long, not the reference's 52.
  const fadeOut = interpolate(frame, [duration - 8, duration], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const underline = interpolate(frame, [16, 34], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1),
  });
  const subT = interpolate(frame, [12, 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark ? T.cPaper : T.paper,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: Math.min(fadeIn, fadeOut),
        backgroundImage: dark
          ? 'radial-gradient(1100px 750px at 50% 44%, oklch(26% 0.016 55 / 0.95), transparent 68%)'
          : 'radial-gradient(1100px 750px at 50% 44%, oklch(99.4% 0.012 88 / 0.9), transparent 66%)',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 1520 }}>
        <div
          style={{
            fontFamily: DISPLAY, fontSize: 108, fontWeight: 500, lineHeight: 1.12,
            color: dark ? T.cInk : T.ink, letterSpacing: '-0.014em',
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: '0.26em',
          }}
        >
          {words.map((w, i) => {
            const delay = 4 + i * 4;
            const t = interpolate(frame, [delay, delay + 9], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.letterpress,
            });
            return (
              <span
                key={i}
                style={{
                  opacity: t,
                  transform: `scale(${1.28 - 0.28 * t})`,
                  filter: `blur(${(1 - t) * 7}px)`,
                  display: 'inline-block',
                  fontStyle: w.accent ? 'italic' : 'normal',
                  paddingLeft: w.accent ? '0.08em' : undefined,
                  color: w.accent ? (dark ? T.cAmber : T.primary) : undefined,
                }}
              >
                {w.text}
              </span>
            );
          })}
        </div>
        <div
          style={{
            height: 6, width: 220, margin: '40px auto 0', borderRadius: 3,
            background: dark ? T.cAmber : T.primary, transform: `scaleX(${underline})`,
          }}
        />
        {sub ? (
          <div
            style={{
              fontFamily: BODY, fontSize: 34, fontWeight: 500, color: dark ? T.cInkFaint : T.inkFaint,
              marginTop: 32, opacity: subT, letterSpacing: '0.004em',
            }}
          >
            {sub}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
