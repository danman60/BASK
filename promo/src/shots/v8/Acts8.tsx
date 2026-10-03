// v8 shots. Every new shot keeps v7's grammar — a plate framed over the page it
// came from, blurred behind it — and every cue is a word in the read
// (CUE in timelineV8.ts). The reused v7 shots are imported, not copied.
//
// Plate-relative highlight boxes (fractions) were measured off the captures
// of 2026-10-03; re-check stills after any recapture.
import { AbsoluteFill, Img, interpolate, Sequence, useCurrentFrame } from 'remotion';

import { BaskCaption } from '../../lib/BaskCaption';
import { BODY, DISPLAY, T } from '../../tokens';
import { CUE, SALON_CHAIN, UVALUX_CHAIN } from '../../timelineV8';
import { A1Open, A12Calls } from '../v5/AppActs';
import { B7Measured } from '../v6/Acts6';
import { BRoll, Dimmer, Hi, PageBack, Plate, tex, Veil } from './kit';
import { ChainHero, DataFlow, dealPose, FlipChain, ListenWave, Odometer } from './mg';

type P = { duration: number };
const Seg: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) =>
  to - from > 0 ? (
    <Sequence from={from} durationInFrames={to - from} layout="none">
      <AbsoluteFill>{children}</AbsoluteFill>
    </Sequence>
  ) : null;

/* ------------------------------------------------------------- b01 open */
export const V8Open: React.FC<P> = ({ duration }) => {
  const c = CUE.open;
  return (
    <AbsoluteFill>
      {c.roll && (
        <Seg from={0} to={c.title}>
          <PageBack src="textures/v5app/today-s0.png" duration={c.title} dim={0.6} />
          <BRoll src={c.roll.src} rate={c.roll.rate} duration={c.title} />
        </Seg>
      )}
      <Seg from={c.title} to={duration}>
        <A1Open
          duration={duration - c.title}
          captions={false}
          tagline={
            <>
              An app a salon owner opens when the salon is quiet.
              <br />
              It doesn&apos;t run your salon. It grows it.
            </>
          }
        />
      </Seg>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------- b02 the chain (spine) */
export const V8Chain: React.FC<P> = ({ duration }) => (
  <ChainHero labels={SALON_CHAIN} nodes={CUE.chain.nodes} duration={duration} />
);

/* ------------------------------------------------------------- b03 sync */
export const V8Sync: React.FC<P> = ({ duration }) => {
  const c = CUE.sync;
  return (
    <AbsoluteFill style={{ backgroundColor: T.paper }}>
      <Seg from={0} to={c.card}>
        <DataFlow duration={c.card} />
      </Seg>
      <Seg from={c.card} to={duration}>
        <PageBack src="concept-sync" duration={duration - c.card} />
        <Plate src="concept-sync-card" width={1120} move="settle" moveFrames={duration - c.card}>
          <Hi x={0.03} y={0.18} w={0.94} h={0.52} from={16} />
        </Plate>
      </Seg>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------- b06 health */
export const V8Health: React.FC<P> = ({ duration }) => {
  const c = CUE.health;
  const [h, s, q] = c.lit.map((x) => x - c.bands);
  return (
    <AbsoluteFill>
      <Seg from={0} to={c.bands}>
        <PageBack src="customers-full" duration={c.bands} yFrom={-200} yTo={-260} />
        <Plate src="customers-healthgridWrap" width={1600} move="push" moveFrames={c.bands} />
      </Seg>
      <Seg from={c.bands} to={c.minutes}>
        <PageBack src="customers-full" duration={c.minutes - c.bands} yFrom={-120} yTo={-180} />
        <Plate src="customers-bands" width={1600} y={400} move="none">
          <Dimmer x={0} y={0} w={0.325} h={1} lit={h} />
          <Dimmer x={0.342} y={0} w={0.318} h={1} lit={s} />
          <Dimmer x={0.683} y={0} w={0.317} h={1} lit={q} />
        </Plate>
        <Plate src="customers-healthgridWrap" width={1600} y={680} move="none" delay={-20} />
      </Seg>
      <Seg from={c.minutes} to={duration}>
        <PageBack src="concept-minutes" duration={duration - c.minutes} />
        <Plate src="concept-minutes-card" width={1600} move="push" moveFrames={duration - c.minutes} />
      </Seg>
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------- b07 recovery */
export const V8Recovery: React.FC<P> = ({ duration }) => {
  const c = CUE.recovery;
  return (
    <AbsoluteFill>
      <PageBack src="recovery-full" duration={duration} yFrom={-80} yTo={-140} />
      <Plate src="recovery-summary" width={1700} move="settle" moveFrames={duration}>
        <Hi x={0.0} y={0.08} w={0.12} h={0.84} from={Math.max(6, c.seven)} to={c.recoverable - 4} />
        <Hi x={0.14} y={0.08} w={0.2} h={0.84} from={c.recoverable} />
      </Plate>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------- b08 listen */
// conv1 (Maya, 10:05 AM) rows as fractions of the capture
const CONV_LINES = [0.165, 0.245, 0.328, 0.41, 0.49, 0.57];
const CONV_LINE_H = 0.078;
const SCORE_COLS = [
  [0.015, 0.075],
  [0.1, 0.11],
  [0.215, 0.08],
  [0.3, 0.1],
  [0.41, 0.08],
];
export const V8Listen: React.FC<P> = ({ duration }) => {
  const c = CUE.listen;
  const conv = c.conv;
  const sc = c.scores.map((x) => x - conv);
  const W = sc[0] - 14;
  const lines = CONV_LINES.map((_, k) => 10 + Math.round(((k + 1) * (W - 10)) / CONV_LINES.length));
  return (
    <AbsoluteFill>
      <Seg from={0} to={conv}>
        <PageBack src="monitor-full" duration={conv} yFrom={-240} yTo={-320} />
        {c.roll ? (
          <>
            <BRoll src={c.roll.src} rate={c.roll.rate} duration={conv} width={1120} x={700} />
            <Plate src="monitor-pledge" width={520} x={1500} y={600} move="settle" delay={Math.max(8, c.pledge - 6)} moveFrames={40} />
          </>
        ) : (
          <>
            <Plate src="monitor-listener" width={560} x={640} move="settle" moveFrames={conv} />
            <Plate src="monitor-pledge" width={600} x={1240} move="settle" delay={Math.max(8, c.pledge - 6)} moveFrames={40} />
          </>
        )}
      </Seg>
      <Seg from={conv} to={duration}>
        <PageBack src="monitor-full" duration={duration - conv} yFrom={-860} yTo={-920} />
        <ListenWave lines={lines} submitAt={sc[0] - 6} y={190} />
        <Plate src="monitor-conv1" width={1400} y={620} move="push" moveFrames={duration - conv}>
          {CONV_LINES.map((y, k) => (
            <Veil key={k} x={0.01} y={y} w={0.98} h={CONV_LINE_H} until={lines[k]} />
          ))}
          {SCORE_COLS.map(([x, w], k) => (
            <Veil key={`s${k}`} x={x} y={0.66} w={w} h={0.11} until={sc[k]} wipe fade={10} />
          ))}
          <Veil x={0.01} y={0.775} w={0.98} h={0.2} until={sc[4] + 14} fade={12} />
          {sc.map((t, k) => (
            <Hi key={`h${k}`} x={SCORE_COLS[k][0]} y={0.665} w={SCORE_COLS[k][1]} h={0.1} from={t} to={t + 22} pad={6} />
          ))}
        </Plate>
      </Seg>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------- b09 team + peers */
export const V8Team: React.FC<P> = ({ duration }) => {
  const c = CUE.team;
  return (
    <AbsoluteFill>
      <Seg from={0} to={c.peers}>
        <PageBack src="monitor-full" duration={c.peers} yFrom={-3300} yTo={-3360} />
        <Plate src="monitor-teamCard" width={1640} move="push" moveFrames={c.peers}>
          <Hi x={0.008} y={0.265} w={0.985} h={0.165} from={c.improving} to={c.hand - 4} pad={4} />
          <Hi x={0.008} y={0.44} w={0.985} h={0.165} from={c.hand} pad={4} />
        </Plate>
      </Seg>
      <Seg from={c.peers} to={duration}>
        <PageBack src="peers-full" duration={duration - c.peers} yFrom={-300} yTo={-360} />
        <Plate src="peers-scoreboard" width={1440} move="push" moveFrames={duration - c.peers}>
          <Hi x={0.742} y={0.718} w={0.105} h={0.165} from={c.rank - c.peers} pad={6} />
        </Plate>
      </Seg>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------- b11 bottle */
/** A crop of a texture, as its own card (the playbook is the bottle card's practice box). */
const Crop: React.FC<{ src: string; nat: [number, number]; box: [number, number, number, number]; width: number; style?: React.CSSProperties }> = ({
  src,
  nat,
  box,
  width,
  style,
}) => {
  const [bx, by, bw, bh] = box;
  const scale = width / (bw * nat[0]);
  return (
    <div style={{ width, height: bh * nat[1] * scale, overflow: 'hidden', borderRadius: 14, position: 'relative', background: '#fff', ...style }}>
      <Img src={tex(src)} style={{ position: 'absolute', width: nat[0] * scale, left: -bx * nat[0] * scale, top: -by * nat[1] * scale }} />
    </div>
  );
};
const PRACTICE: [number, number, number, number] = [0.548, 0.463, 0.422, 0.212];
const SEATS = [
  { name: 'Jordan', role: 'Evenings', x: 500 },
  { name: 'Priya', role: 'Part-time', x: 1420 },
];
export const V8Bottle: React.FC<P> = ({ duration }) => {
  const c = CUE.bottle;
  const f = useCurrentFrame();
  const d = c.deal - c.card; // local to the card segment
  const lf = f - c.card;
  const shrink = interpolate(lf, [d, d + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const PW = 880;
  const seatsIn = interpolate(lf, [d + 6, d + 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <Seg from={0} to={c.card}>
        <PageBack src="monitor-full" duration={c.card} yFrom={-400} yTo={-460} />
        <Plate src="monitor-mayaMethod" width={1440} move="push" moveFrames={c.card} />
      </Seg>
      <Seg from={c.card} to={duration}>
        <PageBack src="concept-bottle" duration={duration - c.card} />
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - shrink, transform: `scale(${1 - 0.1 * shrink})` }}>
          <Plate src="concept-bottle-card" width={1600} move="settle" moveFrames={Math.max(30, d)}>
            <Hi x={0.04} y={0.415} w={0.47} h={0.1} from={12} to={d - 2} pad={4} />
          </Plate>
        </div>
        {lf >= d && (
          <AbsoluteFill style={{ perspective: 1400 }}>
            {/* the playbook: what the winning conversation condensed into */}
            <div
              style={{
                position: 'absolute',
                left: 960 - PW / 2,
                top: 200,
                opacity: shrink,
                transform: `scale(${0.9 + 0.1 * shrink})`,
              }}
            >
              <div style={{ fontFamily: BODY, fontSize: 18, fontWeight: 600, letterSpacing: '0.14em', color: T.primary, marginBottom: 12 }}>
                MAYA&apos;S METHOD · PLAYBOOK
              </div>
              <Crop src="concept-bottle-card" nat={[2200, 972]} box={PRACTICE} width={PW} style={{ boxShadow: T.shadowPop }} />
            </div>
            {SEATS.map((s, i) => {
              const cue = d + 16 + i * 6;
              const pose = dealPose(lf, cue, 960 - s.x, 200 - 610, i ? 6 : -6);
              const CW = 700;
              return (
                <div key={s.name} style={{ position: 'absolute', left: s.x - CW / 2, top: 610, width: CW, opacity: seatsIn }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontFamily: DISPLAY, fontSize: 40, fontWeight: 500, color: T.ink }}>{s.name}</span>
                    <span style={{ fontFamily: BODY, fontSize: 20, color: T.inkFaint }}>{s.role}</span>
                  </div>
                  <div style={{ position: 'relative', width: CW, height: (CW * PRACTICE[3] * 972) / (PRACTICE[2] * 2200), borderRadius: 14, boxShadow: `inset 0 0 0 2px ${T.line}` }}>
                    {pose.started && (
                      <>
                        {pose.ghost && (
                          <div style={{ position: 'absolute', inset: 0, transform: `translate(${pose.ghost.dx}px, ${pose.ghost.dy}px)`, opacity: pose.ghost.o, filter: 'blur(6px)' }}>
                            <Crop src="concept-bottle-card" nat={[2200, 972]} box={PRACTICE} width={CW} />
                          </div>
                        )}
                        <div style={{ position: 'absolute', inset: 0, transform: pose.transform, borderRadius: 14, boxShadow: pose.shadow }}>
                          <Crop src="concept-bottle-card" nat={[2200, 972]} box={PRACTICE} width={CW} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </AbsoluteFill>
        )}
      </Seg>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------- b12 flag */
export const V8Flag: React.FC<P> = ({ duration }) => (
  <AbsoluteFill>
    <PageBack src="concept-flag" duration={duration} />
    <Plate src="concept-flag-card" width={1260} move="push" moveFrames={duration}>
      <Hi x={0.012} y={0.255} w={0.55} h={0.062} from={10} to={CUE.flag.why - 4} pad={5} />
      <Hi x={0.015} y={0.385} w={0.97} h={0.34} from={CUE.flag.why} />
    </Plate>
  </AbsoluteFill>
);

/* ------------------------------------------- b14 every insight, its action */
export const V8Actions: React.FC<P> = ({ duration }) => {
  const c = CUE.actions;
  const cardFrom = c.roll ? c.card : c.walk;
  return (
    <AbsoluteFill>
      <Seg from={0} to={c.message}>
        <PageBack src="concept-minutes" duration={c.message} />
        <Plate src="concept-minutes-card" width={1600} move="drift" moveFrames={c.message}>
          <Hi x={0.505} y={0.14} w={0.44} h={0.36} from={c.note} />
        </Plate>
      </Seg>
      <Seg from={c.message} to={c.walk}>
        <PageBack src="recovery-full" duration={c.walk - c.message} yFrom={-80} yTo={-120} />
        <Plate src="recovery-summary" width={1700} move="push" moveFrames={c.walk - c.message}>
          <Hi x={0.765} y={0.16} w={0.16} h={0.33} from={8} />
        </Plate>
      </Seg>
      {c.roll && (
        <Seg from={c.walk} to={c.card}>
          <PageBack src="concept-frontdesk" duration={c.card - c.walk} dim={0.62} />
          <BRoll src={c.roll.src} rate={c.roll.rate} duration={c.card - c.walk} y={470} width={1180} />
          <BaskCaption lead="When someone walks in, " accent="the front desk already knows" tail="." duration={c.card - c.walk} from={10} />
        </Seg>
      )}
      <Seg from={cardFrom} to={duration}>
        <PageBack src="concept-frontdesk" duration={duration - cardFrom} />
        <Plate src="concept-frontdesk-card" width={1000} move="push" moveFrames={duration - cardFrom}>
          <Hi x={0.05} y={0.345} w={0.44} h={0.235} from={c.eighty - cardFrom} />
          <Hi x={0.515} y={0.345} w={0.44} h={0.235} from={c.lotion - cardFrom} />
        </Plate>
      </Seg>
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------- b15 measured */
export const V8Measured: React.FC<P> = ({ duration }) => {
  const c = CUE.measured;
  return (
    <AbsoluteFill>
      <Seg from={0} to={c.odo}>
        {/* Dana, reading what it was worth — the person, not the plumbing.
            Falls back to v7's measured plate if the clip is missing. */}
        {c.roll ? (
          <>
            <PageBack src="concept-headline" duration={c.odo} dim={0.62} />
            <BRoll src={c.roll.src} rate={c.roll.rate} duration={c.odo} />
          </>
        ) : (
          <B7Measured duration={c.odo} captions={false} />
        )}
      </Seg>
      <Seg from={c.odo} to={c.card}>
        <AbsoluteFill style={{ backgroundColor: T.paper }} />
        <Odometer digits={[1, 8, 4, 0]} prefix="+$" sep={1} label="brought back · measured, not promised" />
      </Seg>
      <Seg from={c.card} to={duration}>
        <PageBack src="concept-headline" duration={duration - c.card} />
        <Plate src="concept-headline-card" width={1600} move="push" moveFrames={duration - c.card} />
      </Seg>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------- b19 flip */
export const V8Flip: React.FC<P> = ({ duration }) => (
  <FlipChain salon={SALON_CHAIN} uvalux={UVALUX_CHAIN} flipAt={CUE.flip.flip} riseAt={CUE.flip.rise} duration={duration} />
);

/* ------------------------------------------------------------ b21 calls */
export const V8Calls: React.FC<P> = ({ duration }) => {
  const r = CUE.calls.roll;
  const cut = r ? r.frames : 0;
  return (
    <AbsoluteFill>
      {r && (
        <Seg from={0} to={cut}>
          <PageBack src="textures/v5app/calls-s0.png" duration={cut} dark dim={0.6} />
          <BRoll src={r.src} rate={r.rate} duration={cut} />
        </Seg>
      )}
      <Seg from={cut} to={duration}>
        <A12Calls duration={duration - cut} captions={false} />
      </Seg>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------- b23 supply */
export const V8Supply: React.FC<P> = ({ duration }) => {
  const c = CUE.supply;
  return (
    <AbsoluteFill>
      <Seg from={0} to={c.lamps}>
        <PageBack src="concept-lamps" duration={c.lamps} dark dim={0.55} />
        <Plate src="order-line1" width={1400} move="settle" moveFrames={c.lamps} />
      </Seg>
      <Seg from={c.lamps} to={c.util}>
        <PageBack src="concept-lamps" duration={c.util - c.lamps} dark dim={0.55} />
        <Plate src="concept-lamps-card" width={1300} move="push" moveFrames={c.util - c.lamps}>
          <Hi x={0.83} y={0.6} w={0.15} h={0.1} from={30} dark />
        </Plate>
      </Seg>
      <Seg from={c.util} to={duration}>
        <PageBack src="concept-utilization" duration={duration - c.util} dark dim={0.55} />
        <Plate src="concept-utilization-card" width={1120} move="push" moveFrames={duration - c.util} />
      </Seg>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------- b24 ask */
export const V8Ask: React.FC<P> = ({ duration }) => (
  <AbsoluteFill>
    <PageBack src="concept-ask" duration={duration} />
    <Plate src="concept-ask-card" width={1640} move="push" moveFrames={duration}>
      <Hi x={0.515} y={0.02} w={0.48} h={0.96} from={CUE.ask.customers} />
    </Plate>
  </AbsoluteFill>
);
