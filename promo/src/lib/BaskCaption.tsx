// Narration caption. The library's Caption.tsx is a 22px mono info-strip, which
// its own header flags as below the Q11 floor (≥56px for narration, ≥32px for
// support text); this one is written to the floor instead: Fraunces 62 over
// Inter 34, on a paper scrim so it stays legible over a light page. Dark
// variant for the Compass act.
import { interpolate, useCurrentFrame } from 'remotion';

import { BODY, CAP, DISPLAY, E, T } from '../tokens';

export const BaskCaption: React.FC<{
  lead: string;
  accent?: string; // italic accent word, appended to the lead
  tail?: string; // text after the accent word
  sub?: string;
  duration: number;
  from?: number; // local frame the caption appears
  dark?: boolean;
  align?: 'left' | 'center';
  /** Right margin in px — widen it when the page underneath has a control in
   *  the bottom-right that the caption would otherwise run through. */
  rightGutter?: number;
}> = ({ lead, accent, tail, sub, duration, from = 0, dark = false, align = 'left', rightGutter = 220 }) => {
  const frame = useCurrentFrame() - from;
  const span = duration - from;
  const inT = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.easeOut,
  });
  const outT = interpolate(frame, [span - 10, span], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  if (frame < -1) return null;
  const opacity = inT * outT;
  const scrim = dark
    ? 'linear-gradient(to top, oklch(19.5% 0.012 50 / 0.97) 42%, transparent)'
    : 'linear-gradient(to top, oklch(98.2% 0.004 84 / 0.97) 42%, transparent)';

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 430, background: scrim }} />
      <div
        style={{
          position: 'absolute',
          left: align === 'left' ? 120 : 0,
          right: align === 'left' ? rightGutter : 0,
          bottom: 104,
          textAlign: align,
          transform: `translateY(${(1 - inT) * 10}px)`,
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY, fontSize: CAP.lead, fontWeight: 500, lineHeight: 1.14,
            letterSpacing: '-0.012em', color: dark ? T.cInk : T.ink,
          }}
        >
          {lead}
          {accent ? (
            <span style={{ fontStyle: 'italic', color: dark ? T.cAmber : T.primary }}>{accent}</span>
          ) : null}
          {tail ?? ''}
        </div>
        {sub ? (
          <div
            style={{
              fontFamily: BODY, fontSize: CAP.sub, fontWeight: 500, marginTop: 16,
              color: dark ? T.cInkFaint : T.inkFaint,
            }}
          >
            {sub}
          </div>
        ) : null}
      </div>
    </div>
  );
};
