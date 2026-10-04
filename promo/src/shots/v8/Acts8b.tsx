// v8 pass 3: the two places the narrator stops and the picture talks.
//
//   V8Method  — the citation page, then the UVALUX training speakers in their
//               own voices (real session footage, promo/public/corpus/v8), then
//               back to the citation page where the narration resumes.
//   V8Action  — the app's own text sheet, a press on "Approve & send", the real
//               toast, then (in the narration hole) the email, the Instagram
//               post and the Studio phone preview it also wrote.
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';

import { BODY, DISPLAY, E, T } from '../../tokens';
import { CUE, MONTAGE } from '../../timelineV8';
import { B4Method } from '../v6/Acts6';
import { Plate, tex } from './kit';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
type P = { duration: number };

/* ================================================================ speakers */
const Speaker: React.FC<{ clip: (typeof MONTAGE)[number]; frames: number }> = ({ clip, frames }) => {
  const f = useCurrentFrame();
  // 2026 clips are soft crops of a locked wide camera: framed at 75% so the
  // upscale does not show. 2025 is a program feed and can sit larger.
  const W = clip.year === 2026 ? 1440 : 1600;
  const H = (W * 9) / 16;
  const push = interpolate(f, [0, frames], [1, 1.03], clamp);
  const lt = interpolate(f, [6, 18], [0, 1], { ...clamp, easing: E.easeOut });
  return (
    <AbsoluteFill style={{ backgroundColor: 'oklch(16% 0.01 50)' }}>
      {/* the same footage, blurred and dimmed, as the plate behind the inset */}
      <AbsoluteFill style={{ filter: 'blur(28px) brightness(0.45)', transform: 'scale(1.12)' }}>
        <OffthreadVideo src={staticFile(clip.src)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 960 - W / 2,
          top: 540 - H / 2 - 20,
          width: W,
          height: H,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 6px 14px oklch(8% 0.01 50 / 0.35), 0 40px 110px oklch(8% 0.01 50 / 0.55)',
        }}
      >
        <OffthreadVideo src={staticFile(clip.src)} volume={1} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${push})` }} />
        {/* lower third: the verbatim line, no names */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 300,
            background: 'linear-gradient(to top, oklch(12% 0.01 50 / 0.86) 30%, transparent)',
            opacity: lt,
          }}
        />
        <div style={{ position: 'absolute', left: 56, right: 56, bottom: 40, opacity: lt, transform: `translateY(${(1 - lt) * 10}px)` }}>
          <div style={{ fontFamily: BODY, fontSize: 19, fontWeight: 600, letterSpacing: '0.16em', color: T.cAmber, marginBottom: 12 }}>
            {`UVALUX EXPO TRAINING · ${clip.year}`}
          </div>
          <div style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: clip.text.length > 110 ? 38 : 44, fontWeight: 500, lineHeight: 1.18, color: T.cInk }}>
            “{clip.text}”
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SpeakerMontage: React.FC = () => {
  let at = CUE.method.lead;
  return (
    <AbsoluteFill style={{ backgroundColor: 'oklch(16% 0.01 50)' }}>
      {MONTAGE.map((c) => {
        const from = at;
        at += c.frames;
        return (
          <Sequence key={c.src} from={from} durationInFrames={c.frames} layout="none">
            <Speaker clip={c} frames={c.frames} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/** "Bask finds the line that fits your problem" — held on the quote it found. */
export const V8Bridge: React.FC<P> = ({ duration }) => (
  <B4Method duration={duration} captions={false} travelFrom={-1060} travelTo={-1105} />
);

export const V8Method: React.FC<P> = ({ duration }) => {
  const c = CUE.method;
  const travel = c.speakers + (duration - c.resume); // the citation page's own time
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={c.speakers} layout="none">
        <B4Method duration={travel} captions={false} travelFrom={-190} />
      </Sequence>
      <Sequence from={c.speakers} durationInFrames={c.resume - c.speakers} layout="none">
        <SpeakerMontage />
      </Sequence>
      {duration - c.resume > 0 && (
        <Sequence from={c.resume} durationInFrames={duration - c.resume} layout="none">
          {/* continue the same travel from where it stopped */}
          <Sequence from={-c.speakers} layout="none">
            <B4Method duration={travel} captions={false} travelFrom={-190} />
          </Sequence>
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

/* ================================================================ messages */
/**
 * A viewport capture (1600x1000 CSS, 2x texture) under a camera: point (cx,cy)
 * in CSS px sits at frame centre at scale s. Children are placed in the same
 * CSS-px space, so a cursor or a press lands exactly on the captured button.
 */
const ViewportCam: React.FC<{
  src: string;
  cx: number;
  cy: number;
  s0: number;
  s1: number;
  frames: number;
  /** CSS-px box kept sharp; the rest of the capture is blurred (stale figures behind the sheet) */
  focus?: Bx;
  /** blur the whole capture */
  blurAll?: number;
  children?: React.ReactNode;
}> = ({ src, cx, cy, s0, s1, frames, focus, blurAll, children }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, frames], [s0, s1], { ...clamp, easing: E.camera });
  const o = interpolate(f, [0, 8], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: T.paper, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1600,
          height: 1000,
          transformOrigin: '0 0',
          transform: `translate(${960 - cx * s}px, ${540 - cy * s}px) scale(${s})`,
          opacity: o,
        }}
      >
        <Img
          src={tex(src)}
          style={{ position: 'absolute', left: 0, top: 0, width: 1600, height: 1000, filter: blurAll || focus ? `blur(${blurAll ?? 5}px)` : undefined }}
        />
        {focus && (
          <div style={{ position: 'absolute', left: focus.x, top: focus.y, width: focus.w, height: focus.h, overflow: 'hidden' }}>
            <Img src={tex(src)} style={{ position: 'absolute', left: -focus.x, top: -focus.y, width: 1600, height: 1000 }} />
          </div>
        )}
        {children}
      </div>
    </AbsoluteFill>
  );
};

type Bx = { x: number; y: number; w: number; h: number };
const PxRing: React.FC<Bx & { from: number }> = ({ x, y, w, h, from }) => {
  const f = useCurrentFrame();
  if (f < from) return null;
  const t = interpolate(f, [from, from + 12], [0, 1], { ...clamp, easing: E.easeOut });
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 5,
        top: y - 5,
        width: w + 10,
        height: h + 10,
        borderRadius: 999,
        boxShadow: `0 0 0 ${2 * t}px oklch(58% 0.14 42 / 0.65), 0 0 0 ${6 * t}px oklch(58% 0.14 42 / 0.14)`,
        opacity: t,
      }}
    />
  );
};

/** The cursor, and the press the capture could not show (hover has no state). */
const Press: React.FC<Bx & { at: number }> = ({ x, y, w, h, at }) => {
  const f = useCurrentFrame();
  const tx = x + w * 0.62;
  const ty = y + h * 0.62;
  const move = interpolate(f, [at - 30, at - 8], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.15, 1) });
  const cxp = tx + (1 - move) * 220;
  const cyp = ty + (1 - move) * 170;
  const show = interpolate(f, [at - 34, at - 28], [0, 1], clamp);
  const down = interpolate(f, [at, at + 3, at + 9], [0, 1, 0], clamp);
  const ripple = interpolate(f, [at, at + 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <>
      {/* the button going down: darken + 0.97 */}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: 999,
          background: `oklch(21% 0.012 320 / ${0.22 * down})`,
          transform: `scale(${1 - 0.03 * down})`,
        }}
      />
      {f >= at && f <= at + 20 && (
        <div
          style={{
            position: 'absolute',
            left: tx - 40 * ripple,
            top: ty - 40 * ripple,
            width: 80 * ripple,
            height: 80 * ripple,
            borderRadius: '50%',
            border: `2px solid oklch(58% 0.14 42 / ${0.7 * (1 - ripple)})`,
          }}
        />
      )}
      <svg
        width={22}
        height={30}
        viewBox="0 0 22 30"
        style={{ position: 'absolute', left: cxp, top: cyp, opacity: show, transform: `scale(${1 - 0.12 * down})`, transformOrigin: '0 0', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))' }}
      >
        <path d="M1 1 L1 24 L7 18.5 L11.5 28.5 L15 27 L10.6 17.2 L19 17.2 Z" fill="#fff" stroke="#1c1717" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </>
  );
};

export const V8Action: React.FC<P> = ({ duration }) => {
  const c = CUE.action;
  const f = useCurrentFrame();
  const m = c.messages;
  // inside the narration hole: email → post → phone (three tabs)
  const E1 = m;
  const E2 = m + 74;
  const E3 = m + 160;
  const phone = ['studioPhoneSms-full', 'studioPhoneIg-full', 'studioPhoneEmail-full'];
  const tab = Math.min(2, Math.floor(Math.max(0, f - E3) / 30));
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={c.toast} layout="none">
        <ViewportCam src="todaySms-full" cx={800} cy={505} s0={1.62} s1={1.78} frames={c.toast} focus={{ x: 578, y: 216, w: 444, h: 537 }}>
          <Press x={605} y={421} w={238} h={31} at={c.press} />
        </ViewportCam>
      </Sequence>
      <Sequence from={c.toast} durationInFrames={m - c.toast} layout="none">
        {/* framed so the page's own (small) toast sits below the frame edge —
            only the magnified one below is seen */}
        <ViewportCam src="todaySmsDone-full" cx={800} cy={400} s0={1.16} s1={1.19} frames={m - c.toast} blurAll={7} />
        <AbsoluteFill style={{ backgroundColor: T.paper, opacity: 0.45 }} />
        <ToastRise />
      </Sequence>
      <Sequence from={E1} durationInFrames={E2 - E1} layout="none">
        <ViewportCam src="todayEmail-full" cx={800} cy={500} s0={1.72} s1={1.8} frames={E2 - E1} focus={{ x: 578, y: 252, w: 444, h: 465 }}>
          <PxRing x={775} y={409} w={170} h={35} from={22} />
        </ViewportCam>
      </Sequence>
      <Sequence from={E2} durationInFrames={E3 - E2} layout="none">
        <ViewportCam src="todaySocialIg-full" cx={800} cy={498} s0={1.1} s1={1.16} frames={E3 - E2} focus={{ x: 578, y: 40, w: 444, h: 902 }} />
      </Sequence>
      <Sequence from={E3} durationInFrames={duration - E3} layout="none">
        <ViewportCam src={phone[tab]} cx={800} cy={590} s0={1.6} s1={1.66} frames={duration - E3} />
      </Sequence>
    </AbsoluteFill>
  );
};

/** The app's real toast, lifted and magnified the way v7 frames a cutout. */
const ToastRise: React.FC = () => {
  const f = useCurrentFrame();
  const t = interpolate(f, [4, 20], [0, 1], { ...clamp, easing: E.easeOut });
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - t) * 40}px)`, opacity: t }}>
      <Plate src="todaySmsDone-toast" width={1180} y={860} move="none" radius={22} />
    </div>
  );
};

