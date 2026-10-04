// v8 motion graphics. Each one is a video-shotcraft card, re-skinned in Bask's
// own tokens (Fraunces / Inter, terracotta on paper; amber on the Compass dark).
// Parameters are the cards' demo values unless a comment says otherwise.
//
//   ChainHero      glow-flyline-moves · flyline-arc   (22f out-cubic growth, lit head,
//                  head-to-tail opacity, landing pulse; relayed node to node)
//   DataFlow       integration-hub-map                (two-beat connect: tiles same
//                  frame → pipe grows 9f → transport pulses 4.6px/f)
//   ListenWave     voice-waveform-live                (64-bar value-noise, talk/stop
//                  envelope, 5px dotted silence, 12f Easing.in collapse on submit)
//   Odometer       odometer-digit-roll                (per-digit reels, half-row overshoot,
//                  2 speed-gated ghosts, darken + 1.035 pulse on lock)
//   FlipChain      card-flip-reveal                   (rotateY 18f to 192° + 8f settle,
//                  angle-linked sheen peaking at 90°)
//   dealPose       deck-deal-flyin single-card flight (8f dive bezier(.3,0,.2,1), z-arc +90,
//                  scale 1.06, 4f settle bezier(.3,0,.25,1.15), press .996, ghost)
import { AbsoluteFill, Easing, interpolate, interpolateColors, useCurrentFrame } from 'remotion';

import { BODY, DISPLAY, E, T } from '../../tokens';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
type Pt = { x: number; y: number };

const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
};

const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const noiseAt = (x: number) => {
  const i = Math.floor(x);
  const fr = x - i;
  const a = mulberry32(i * 7919 + 13)();
  const b = mulberry32((i + 1) * 7919 + 13)();
  const s = fr * fr * (3 - 2 * fr);
  return a + (b - a) * s;
};

/* ------------------------------------------------------------- flyline-arc */
const N = 100;
const Flyline: React.FC<{ frame: number; start: number; p0: Pt; p1: Pt; p2: Pt; p3: Pt; color: string; under: string }> = ({
  frame,
  start,
  p0,
  p1,
  p2,
  p3,
  color,
  under,
}) => {
  const DUR = 22;
  if (frame < start) return null;
  const e = interpolate(frame, [start, start + DUR], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const growing = frame < start + DUR;
  const settle = interpolate(frame, [start + DUR, start + DUR + 10], [0, 1], clamp);
  const pts: Pt[] = [];
  const nDrawn = Math.max(2, Math.ceil(e * N) + 1);
  for (let i = 0; i < nDrawn; i++) pts.push(bez(p0, p1, p2, p3, Math.min(i / N, e)));
  const head = bez(p0, p1, p2, p3, e);
  pts[pts.length - 1] = head;
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const tSeg = Math.min(i / N, e) / Math.max(e, 0.001);
    const grad = 0.4 + 0.6 * tSeg * tSeg;
    segs.push(
      <line
        key={i}
        x1={pts[i].x}
        y1={pts[i].y}
        x2={pts[i + 1].x}
        y2={pts[i + 1].y}
        stroke={color}
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeOpacity={grad + (1 - grad) * settle}
      />,
    );
  }
  return (
    <g>
      {/* Light-ground underlay (card: "浅底无衬底白线直接消失"). A paper halo, not
          the demo's near-black one — on Bask paper a dark casing reads as a cable. */}
      <polyline
        points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke={under}
        strokeWidth={11}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={0.9}
      />
      {segs}
      {growing && (
        <g>
          <circle cx={head.x} cy={head.y} r={24} fill="url(#flyHalo)" />
          <circle cx={head.x} cy={head.y} r={8} fill="#ffffff" stroke={color} strokeWidth={3} />
        </g>
      )}
    </g>
  );
};

/** Landing pulse: darken + stroke, out-cubic 6f up, linear 12f down (white ground: never brighten). */
const pulseAmp = (frame: number, at: number) => {
  if (frame < at || frame > at + 18) return 0;
  return frame <= at + 6
    ? interpolate(frame, [at, at + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })
    : interpolate(frame, [at + 6, at + 18], [1, 0], clamp);
};

/* --------------------------------------------------------------- ChainHero */
/**
 * THE SPINE. Six links, ghosted from the first frame so the shape of the idea
 * is visible before it is explained, then lit one by one on the word that
 * names each — the line arriving exactly as the word lands.
 */
export const ChainHero: React.FC<{
  labels: readonly string[];
  nodes: number[];
  duration: number;
  /** the growth payoff: the chain lifts away and two rising lines draw on */
  payoff?: { at: number; visits: number; spend: number };
}> = ({ labels, nodes, duration, payoff }) => {
  const f = useCurrentFrame();
  const lift = payoff ? interpolate(f, [payoff.at, payoff.at + 20], [0, 1], { ...clamp, easing: E.camera }) : 0;
  const W = 222;
  const H = 152;
  const GAP = 56;
  const x0 = (1920 - (labels.length * W + (labels.length - 1) * GAP)) / 2;
  const cx = (i: number) => x0 + i * (W + GAP) + W / 2;
  // a gentle zigzag, so each link is a visible stroke rather than a hook
  const ny = (i: number) => 530 + (i % 2 ? 120 : 0);
  const titleIn = interpolate(f, [4, 22], [0, 1], { ...clamp, easing: E.easeOut });
  const ghostIn = interpolate(f, [10, 30], [0, 1], { ...clamp, easing: E.easeOut });
  const camZ = interpolate(f, [0, duration], [1, 1.02], { ...clamp, easing: E.camera });
  return (
    <AbsoluteFill style={{ backgroundColor: T.paper }}>
      <AbsoluteFill
        style={{
          transform: `translateY(${-250 * lift}px) scale(${camZ * (1 - 0.18 * lift)})`,
          opacity: 1 - 0.35 * lift,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 300,
            width: '100%',
            textAlign: 'center',
            fontFamily: DISPLAY,
            fontSize: 66,
            fontWeight: 500,
            letterSpacing: '-0.012em',
            color: T.ink,
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 12}px)`,
          }}
        >
          Everything in Bask works <span style={{ fontStyle: 'italic', color: T.primary }}>the same way</span>.
        </div>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id="flyHalo">
              <stop offset="0%" stopColor="oklch(58% 0.14 42 / 0.35)" />
              <stop offset="60%" stopColor="oklch(58% 0.14 42 / 0.12)" />
              <stop offset="100%" stopColor="oklch(58% 0.14 42 / 0)" />
            </radialGradient>
          </defs>
          {nodes.slice(1).map((land, k) => {
            const a = cx(k) + W / 2 + 6;
            const b = cx(k + 1) - W / 2 - 6;
            const ya = ny(k) + H / 2;
            const yb = ny(k + 1) + H / 2;
            return (
              <Flyline
                key={k}
                frame={f}
                start={land - 22}
                p0={{ x: a, y: ya }}
                p1={{ x: a + 40, y: ya }}
                p2={{ x: b - 40, y: yb }}
                p3={{ x: b, y: yb }}
                color={T.primary}
                under={T.paper}
              />
            );
          })}
        </svg>
        {labels.map((lab, i) => {
          const lit = interpolate(f, [nodes[i], nodes[i] + 10], [0, 1], { ...clamp, easing: E.easeOut });
          const amp = pulseAmp(f, nodes[i]);
          return (
            <div
              key={lab}
              style={{
                position: 'absolute',
                left: cx(i) - W / 2,
                top: ny(i),
                width: W,
                height: H,
                borderRadius: 18,
                background: interpolateColors(lit, [0, 1], ['oklch(98.2% 0.004 84)', '#ffffff']),
                boxShadow: `0 0 0 ${1.5 + 1.5 * lit}px ${lit > 0.5 ? 'oklch(58% 0.14 42 / 0.55)' : T.line}, ${lit > 0 ? T.shadowPop : 'none'}`,
                opacity: ghostIn * (0.42 + 0.58 * lit),
                transform: `translateY(${-8 * lit}px) scale(${1 + 0.015 * amp})`,
                padding: '22px 22px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  fontFamily: BODY,
                  fontSize: 17,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  color: lit > 0.5 ? T.primary : T.inkFaint,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 500, lineHeight: 1.05, color: lit > 0.5 ? T.ink : T.inkFaint }}>
                {lab}
              </div>
              {amp > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 18,
                    background: `oklch(21% 0.012 320 / ${0.08 * amp})`,
                    boxShadow: `0 0 0 ${3 * amp}px oklch(52% 0.14 40 / ${amp})`,
                  }}
                />
              )}
            </div>
          );
        })}
      </AbsoluteFill>
      {payoff && <Rising at={payoff.visits} x={640} label="Visits" sub="the same customers, more often" />}
      {payoff && <Rising at={payoff.spend} x={1280} label="Spend per visit" sub="more every time they come" />}
    </AbsoluteFill>
  );
};

/** One rising line with its label — labels and arrows only, no invented numbers. */
const Rising: React.FC<{ at: number; x: number; label: string; sub: string }> = ({ at, x, label, sub }) => {
  const f = useCurrentFrame();
  const inT = interpolate(f, [at - 6, at + 8], [0, 1], { ...clamp, easing: E.easeOut });
  const draw = interpolate(f, [at, at + 26], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (f < at - 6) return null;
  const x0 = x - 210;
  const x1 = x + 210;
  const y0 = 930;
  const y1 = 690;
  const d = `M ${x0} ${y0} C ${x0 + 140} ${y0 - 10}, ${x1 - 170} ${y1 + 90}, ${x1} ${y1}`;
  const len = 560;
  const head = draw > 0.98;
  return (
    <>
      <div style={{ position: 'absolute', left: x0, top: 600, opacity: inT, transform: `translateY(${(1 - inT) * 10}px)` }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 46, fontWeight: 500, color: T.ink, lineHeight: 1 }}>{label}</div>
        <div style={{ fontFamily: BODY, fontSize: 22, color: T.inkFaint, marginTop: 8 }}>{sub}</div>
      </div>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <line x1={x0} y1={y0 + 14} x2={x1 + 20} y2={y0 + 14} stroke={T.line} strokeWidth={2} opacity={inT} />
        <path d={d} fill="none" stroke={T.primary} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${len * draw} ${len + 40}`} />
        {head && (
          <path
            d={`M ${x1 - 26} ${y1 + 2} L ${x1 + 4} ${y1 - 4} L ${x1 - 10} ${y1 + 24}`}
            fill="none"
            stroke={T.primary}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </>
  );
};
/* ---------------------------------------------------------------- DataFlow */
const RECORDS = ['Visits', 'Memberships', 'Product sales', 'Bookings'];
export const DataFlow: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const tIcon = 6;
  const tPipe = tIcon + 10;
  const GROW = 9;
  const A = { x: 560, y: 540 };
  const B = { x: 1360, y: 540 };
  const pipe = `M ${A.x + 200} ${A.y} C ${A.x + 380} ${A.y - 70}, ${B.x - 380} ${B.y - 70}, ${B.x - 200} ${B.y}`;
  const len = 460;
  const grow = interpolate(f, [tPipe, tPipe + GROW], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const flowIn = interpolate(f, [tPipe + GROW, tPipe + GROW + 8], [0, 1], clamp);
  const appear = interpolate(f, [tIcon, tIcon + 12], [0, 1], { ...clamp, easing: E.easeOut });
  const out = interpolate(f, [duration - 10, duration], [1, 0], clamp);
  const breathe = f > tPipe + GROW ? 1 + 0.012 * Math.sin((f - tPipe - GROW) * 0.12) : 1;
  const tile = (x: number, y: number, children: React.ReactNode, s = 1) => (
    <div
      style={{
        position: 'absolute',
        left: x - 200,
        top: y - 130,
        width: 400,
        height: 260,
        borderRadius: 22,
        background: '#ffffff',
        boxShadow: `0 0 0 1px ${T.line}, ${T.shadowPop}`,
        opacity: appear,
        transform: `scale(${(0.94 + 0.06 * appear) * s})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      {children}
    </div>
  );
  // record chips riding the pipe, one every 13 frames, cycling the four kinds
  const chips = [];
  for (let k = 0; k < 40; k++) {
    const t0 = tPipe + GROW + 4 + k * 13;
    const t = (f - t0) / 46;
    if (t < 0 || t > 1) continue;
    const p = bez({ x: A.x + 200, y: A.y }, { x: A.x + 380, y: A.y - 70 }, { x: B.x - 380, y: B.y - 70 }, { x: B.x - 200, y: B.y }, t);
    const o = interpolate(t, [0, 0.12, 0.85, 1], [0, 1, 1, 0], clamp);
    chips.push(
      <div
        key={k}
        style={{
          position: 'absolute',
          left: p.x,
          top: p.y - 40,
          transform: 'translate(-50%, -50%)',
          padding: '6px 14px',
          borderRadius: 999,
          background: T.primaryWash,
          boxShadow: `0 0 0 1px oklch(58% 0.14 42 / 0.35)`,
          fontFamily: BODY,
          fontSize: 18,
          fontWeight: 600,
          color: T.primaryDeep,
          opacity: o,
          whiteSpace: 'nowrap',
        }}
      >
        {RECORDS[k % RECORDS.length]}
      </div>,
    );
  }
  return (
    <AbsoluteFill style={{ backgroundColor: T.paper, opacity: out }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="pipeGrad" gradientUnits="userSpaceOnUse" x1={A.x + 200} y1={A.y} x2={B.x - 200} y2={B.y}>
            <stop offset="0%" stopColor="oklch(72% 0.084 85)" />
            <stop offset="100%" stopColor="oklch(58% 0.14 42)" />
          </linearGradient>
          {/* userSpaceOnUse — a flat pipe's bbox collapses a % filter region (card: three pipes vanished) */}
          <filter id="pipeGlowV8" filterUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {grow > 0 && (
          <g filter="url(#pipeGlowV8)">
            <path d={pipe} fill="none" stroke="url(#pipeGrad)" strokeWidth={15} strokeLinecap="round" strokeDasharray={`${len * grow} ${len + 60}`} />
            <path d={pipe} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={4} strokeLinecap="round" strokeDasharray={`${len * grow} ${len + 60}`} />
            {grow >= 1 && flowIn > 0 && (
              <path
                d={pipe}
                fill="none"
                stroke="#ffffff"
                strokeWidth={9}
                strokeLinecap="round"
                strokeDasharray="18 56"
                strokeDashoffset={-((f - tPipe) * 4.6)}
                opacity={0.9 * flowIn}
              />
            )}
          </g>
        )}
      </svg>
      {chips}
      {tile(
        A.x,
        A.y,
        <>
          <div style={{ fontFamily: BODY, fontSize: 18, fontWeight: 600, letterSpacing: '0.14em', color: T.inkFaint }}>YOUR SOFTWARE</div>
          <div style={{ fontFamily: BODY, fontSize: 40, fontWeight: 600, color: T.ink }}>SalonTouch</div>
          <div style={{ fontFamily: BODY, fontSize: 20, color: T.inkFaint }}>unchanged</div>
        </>,
      )}
      {tile(
        B.x,
        B.y,
        <>
          <div style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 92, fontWeight: 600, color: T.ink, lineHeight: 1 }}>Bask</div>
          <div style={{ fontFamily: BODY, fontSize: 20, color: T.inkFaint }}>reads, never writes back</div>
        </>,
        breathe,
      )}
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------- ListenWave */
/**
 * The front-desk conversation as a waveform. The card's rule — "the envelope
 * must follow a real voice" — is kept by tying it to the TRANSCRIPT, not the
 * narrator: each talk segment ends on the frame its line lands in the plate
 * below, so the eye reads "it heard that, and wrote it down".
 */
export const ListenWave: React.FC<{ lines: number[]; submitAt: number; width?: number; y?: number }> = ({
  lines,
  submitAt,
  width = 1100,
  y = 186,
}) => {
  const f = useCurrentFrame();
  const BARS = 64;
  const SCROLL = 1.6;
  const env = (t: number) => {
    let talk = 0;
    for (let k = 0; k < lines.length; k++) {
      const a = k === 0 ? lines[0] - 26 : lines[k - 1] + 5;
      const b = lines[k];
      const span = Math.max(4, b - a);
      const r = Math.min(5, span / 3);
      const fl = Math.min(7, span / 3);
      talk = Math.max(talk, interpolate(t, [a, a + r, a + span - fl, a + span], [0, 1, 1, 0], clamp));
    }
    return talk * (0.55 + 0.45 * noiseAt(t / 4.5 + 200));
  };
  const collapse = interpolate(f, [submitAt, submitAt + 12], [1, 0.06], { ...clamp, easing: Easing.in(Easing.ease) });
  const inO = interpolate(f, [0, 12], [0, 1], clamp);
  const outO = interpolate(f, [submitAt + 10, submitAt + 22], [1, 0], clamp);
  const press = interpolate(f, [submitAt, submitAt + 3, submitAt + 9], [1, 0.82, 1], clamp);
  const now = f >= submitAt ? 0 : env(f);
  return (
    <div
      style={{
        position: 'absolute',
        left: 960 - width / 2,
        top: y - 62,
        width,
        height: 124,
        borderRadius: 62,
        background: '#ffffff',
        boxShadow: `0 0 0 1px ${T.line}, ${T.shadowPop}`,
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        padding: '0 30px',
        boxSizing: 'border-box',
        opacity: inO * outO,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          flexShrink: 0,
          background: `oklch(58% 0.14 42 / ${0.1 + 0.22 * now})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${press})`,
        }}
      >
        {/* mic, drawn — the card's emoji is a placeholder */}
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={T.primaryDeep} strokeWidth={2.2} strokeLinecap="round">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
        </svg>
      </div>
      <div style={{ flex: 1, height: 96, display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
        {Array.from({ length: BARS }).map((_, i) => {
          const st = f - (BARS - 1 - i) * SCROLL;
          const e = st < 0 ? 0 : env(st);
          const center = Math.pow(Math.sin((i / (BARS - 1)) * Math.PI), 0.8);
          const jit = 0.35 + 0.65 * noiseAt(st * 1.7 + i * 0.13);
          const h = Math.max(5, e * center * jit * 92 * collapse);
          return <div key={i} style={{ flex: 1, height: h, borderRadius: 3, background: T.primary, opacity: 0.35 + (h / 92) * 0.65 }} />;
        })}
      </div>
      <div style={{ fontFamily: BODY, fontSize: 18, fontWeight: 600, letterSpacing: '0.12em', color: T.inkFaint, flexShrink: 0 }}>
        FRONT DESK
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- Odometer */
const ROW = 190;
const DW = 112;
const FS = 172;
const SPIN = 0.85;
export const Odometer: React.FC<{ digits: number[]; prefix: string; sep?: number; label: string; color?: string; start?: number }> = ({
  digits,
  prefix,
  sep,
  label,
  color = T.success,
  start = 4,
}) => {
  const f = useCurrentFrame();
  const posAt = (fr: number, i: number) => {
    const d = digits[i];
    const s = start + 16 + i * 7;
    const p0 = SPIN * s;
    const Tg = Math.ceil((p0 + 6 - d) / 10) * 10 + d;
    if (fr < s) return SPIN * Math.max(fr, 0);
    if (fr < s + 16) return interpolate(fr, [s, s + 16], [p0, Tg + 0.5], { ...clamp, easing: Easing.out(Easing.cubic) });
    if (fr < s + 22) return interpolate(fr, [s + 16, s + 22], [Tg + 0.5, Tg], { ...clamp, easing: Easing.out(Easing.cubic) });
    return Tg;
  };
  const lock = start + 16 + (digits.length - 1) * 7 + 22;
  const deep = 'oklch(42% 0.11 155)';
  const ink = interpolateColors(f, [lock, lock + 4, lock + 8], [color, deep, color]);
  const pulse = interpolate(f, [lock, lock + 4, lock + 8], [1, 1.035, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const labelO = interpolate(f, [lock + 3, lock + 21], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const inO = interpolate(f, [0, 8], [0, 1], clamp);
  const glyph = (ch: string, w?: number) => (
    <div style={{ width: w, height: ROW, lineHeight: `${ROW}px`, textAlign: 'center', fontSize: FS, fontWeight: 600, color: ink }}>{ch}</div>
  );
  const strip = (pos: number, op = 1, dy = 0) => (
    <div style={{ position: 'absolute', left: 0, top: 0, width: DW, transform: `translateY(${-(pos % 10) * ROW + dy}px)`, opacity: op }}>
      {Array.from({ length: 20 }).map((_, k) => (
        <div key={k} style={{ width: DW, height: ROW, lineHeight: `${ROW}px`, textAlign: 'center', fontSize: FS, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: ink }}>
          {k % 10}
        </div>
      ))}
    </div>
  );
  const reels = digits.map((_, i) => {
    const pos = posAt(f, i);
    const speed = Math.abs(pos - posAt(f - 1, i));
    const gate = interpolate(speed, [0.06, 0.5], [0, 1], clamp);
    return (
      <div key={i} style={{ position: 'relative', width: DW, height: ROW, overflow: 'hidden' }}>
        {gate > 0.001 && (
          <>
            {strip(pos, 0.25 * gate, ROW * 0.5)}
            {strip(pos, 0.12 * gate, -ROW * 0.5)}
          </>
        )}
        {strip(pos)}
      </div>
    );
  });
  return (
    <AbsoluteFill style={{ opacity: inO }}>
      <div
        style={{
          position: 'absolute',
          top: 360,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          fontFamily: DISPLAY,
          transform: `scale(${pulse})`,
          transformOrigin: `960px ${ROW / 2}px`,
        }}
      >
        {glyph(prefix)}
        {reels.map((r, i) => (
          <div key={i} style={{ display: 'flex' }}>
            {r}
            {sep !== undefined && i === sep - 1 ? glyph(',', 44) : null}
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 590,
          width: '100%',
          textAlign: 'center',
          fontFamily: BODY,
          fontSize: 38,
          color: T.inkSoft,
          opacity: labelO,
          transform: `translateY(${(1 - labelO) * 8}px)`,
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- FlipChain */
const flipAngle = (f: number, s: number) =>
  f < s + 18
    ? interpolate(f, [s, s + 18], [0, 192], { ...clamp, easing: Easing.bezier(0.55, 0, 0.3, 1) })
    : interpolate(f, [s + 18, s + 26], [192, 180], { ...clamp, easing: Easing.out(Easing.poly(5)) });

const Sheen: React.FC<{ angle: number; light: boolean }> = ({ angle, light }) => {
  const pos = interpolate(angle, [35, 145], [-25, 115], clamp);
  const op = Math.max(0, 1 - Math.abs(angle - 90) / 55);
  if (op <= 0.004) return null;
  const c = light ? 'oklch(21% 0.012 320 / 0.32)' : 'oklch(94% 0.008 84 / 0.22)';
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 26,
        opacity: op,
        background: `linear-gradient(105deg, transparent ${pos - 14}%, ${c} ${pos}%, transparent ${pos + 14}%)`,
      }}
    />
  );
};

const ChainRow: React.FC<{ labels: readonly string[]; dark: boolean }> = ({ labels, dark }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
    {labels.map((l, i) => (
      <div key={l} style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            padding: dark ? '22px 30px' : '16px 22px',
            borderRadius: 16,
            background: dark ? T.cCard : '#ffffff',
            boxShadow: `0 0 0 1.5px ${dark ? 'oklch(79% 0.125 78 / 0.45)' : 'oklch(58% 0.14 42 / 0.45)'}`,
            fontFamily: DISPLAY,
            fontSize: dark ? 40 : 30,
            fontWeight: 500,
            color: dark ? T.cInk : T.ink,
            whiteSpace: 'nowrap',
          }}
        >
          {l}
        </div>
        {i < labels.length - 1 && (
          <div style={{ width: dark ? 70 : 34, height: 3, background: dark ? T.cAmber : T.primary, opacity: 0.8 }} />
        )}
      </div>
    ))}
  </div>
);

export const FlipChain: React.FC<{
  salon: readonly string[];
  uvalux: readonly string[];
  flipAt: number;
  riseAt: number;
  duration: number;
}> = ({ salon, uvalux, flipAt, riseAt, duration }) => {
  const f = useCurrentFrame();
  const angle = flipAngle(f, flipAt);
  const bg = interpolateColors(f, [flipAt + 4, flipAt + 22], [T.paper, T.cPaper]);
  const inO = interpolate(f, [0, 10], [0, 1], clamp);
  const camZ = interpolate(f, [0, duration], [1.0, 1.04], { ...clamp, easing: E.camera });
  const CW = 1640;
  const CH = 360;
  const top = 380;
  const card = (dark: boolean, children: React.ReactNode, back = false) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backfaceVisibility: 'hidden',
        transform: back ? 'rotateY(180deg)' : undefined,
        borderRadius: 26,
        background: dark ? T.cPaper2 : '#ffffff',
        boxShadow: dark ? '0 0 0 1px oklch(31% 0.014 55), 0 40px 100px oklch(8% 0.01 50 / 0.6)' : `0 0 0 1px ${T.line}, ${T.shadowPop}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 34,
      }}
    >
      {children}
      <Sheen angle={angle} light={!dark} />
    </div>
  );
  // salon nodes rising as dots into the network (deterministic)
  const dots = [];
  for (let k = 0; k < 44; k++) {
    const r = mulberry32(k * 977 + 5);
    const sx = 260 + r() * 1400;
    const delay = riseAt - 6 + k * 2 + Math.floor(r() * 4);
    const t = interpolate(f, [delay, delay + 30], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    if (t <= 0) continue;
    const tx = 960 + (r() - 0.5) * 900;
    const x = sx + (tx - sx) * t;
    const y = 1110 - (1110 - (top + CH - 30)) * t;
    const o = interpolate(t, [0, 0.15, 0.8, 1], [0, 1, 1, 0.0], clamp);
    dots.push(
      <div
        key={k}
        style={{
          position: 'absolute',
          left: x - 8,
          top: y - 8,
          width: 16,
          height: 16,
          borderRadius: 8,
          background: T.cAmber,
          boxShadow: '0 0 14px oklch(79% 0.125 78 / 0.6)',
          opacity: o,
        }}
      />,
    );
  }
  return (
    <AbsoluteFill style={{ backgroundColor: bg, opacity: inO }}>
      <AbsoluteFill style={{ transform: `scale(${camZ})` }}>
        {dots}
        <div style={{ position: 'absolute', left: (1920 - CW) / 2, top, width: CW, height: CH, perspective: 1600 }}>
          <div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transform: `rotateY(${angle}deg)` }}>
            {card(
              false,
              <>
                <div style={{ textAlign: 'center', fontFamily: BODY, fontSize: 20, fontWeight: 600, letterSpacing: '0.16em', color: T.primary }}>
                  THE SALON
                </div>
                <ChainRow labels={salon} dark={false} />
              </>,
            )}
            {card(
              true,
              <>
                <div style={{ textAlign: 'center', fontFamily: BODY, fontSize: 20, fontWeight: 600, letterSpacing: '0.16em', color: T.cAmber }}>
                  UVALUX · FROM ABOVE
                </div>
                <ChainRow labels={uvalux} dark />
              </>,
              true,
            )}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------- deck-deal single flight */
/** Pose of one dealt card at frame f for cue `cue`, flying from (px,py) to its slot. */
export const dealPose = (f: number, cue: number, px: number, py: number, protZ = -6) => {
  const dive = interpolate(f, [cue, cue + 8], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const settle = interpolate(f, [cue + 8, cue + 12], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.25, 1.15) });
  const press = interpolate(f, [cue + 10, cue + 11, cue + 12], [1, 0.996, 1], clamp);
  const arc = Math.sin(dive * Math.PI) * 90;
  const z = (30 + arc) * (1 - settle);
  const scale = (1 + Math.sin(dive * Math.PI) * 0.06) * press;
  const dx = px * (1 - dive);
  const dy = py * (1 - dive);
  const rot = protZ * (1 - dive);
  const landed = f >= cue + 12;
  return {
    started: f >= cue,
    landed,
    transform: landed ? 'translate3d(0,0,0)' : `translate3d(${dx}px, ${dy}px, ${z}px) rotateZ(${rot}deg) scale(${scale})`,
    ghost: dive > 0.02 && dive < 0.98 ? { dx: dx + px * 0.05, dy: dy + py * 0.05, o: 0.25 * (1 - dive) } : null,
    shadow: landed ? T.shadowPop : `0 ${36 - 30 * settle}px ${70 - 60 * settle}px oklch(21% 0.012 320 / ${0.3 - 0.2 * settle})`,
  };
};
