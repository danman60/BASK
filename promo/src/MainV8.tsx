// MainV8 — the full-feature cut, built on the guiding chain (2026-10-03).
// Plan: docs/plans/2026-10-03-film-v8-full-feature.md. Timeline: timelineV8.ts
// (every cut derived from the read). v6/v7 are untouched and still render.
//
// Audio, all in the composition so one timeline renders both deliverables:
//   VO   — the read named by timelineV8's one import line
//   BGM  — bgm-open-road.mp3 (licensed library, v7's bed), ducked under the
//          voice from the read's own beat timing; `bgm: false` drops it and
//          keeps VO + SFX. Two passes spliced at the flip (see MUSIC).
//   SFX  — shots/v8/sfx8.ts
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from 'remotion';

import { A11Network, A12bKnowledge, A13Outro } from './shots/v5/AppActs';
import { B2Read, B3Chart, B6Community, B8Opens } from './shots/v6/Acts6';
import { V8Action, V8Bridge, V8Method } from './shots/v8/Acts8b';
import {
  V8Actions,
  V8Ask,
  V8Bottle,
  V8Calls,
  V8Chain,
  V8Flag,
  V8Flip,
  V8Health,
  V8Listen,
  V8Measured,
  V8Open,
  V8Recovery,
  V8Supply,
  V8Sync,
  V8Team,
} from './shots/v8/Acts8';
import { ChainStrip } from './shots/v8/kit';
import { SFX_V8 } from './shots/v8/sfx8';
import {
  CHAPTER,
  CUE,
  MUSIC,
  ORDER,
  SALON_CHAIN,
  SHOTS_V8,
  SPEECH,
  TOTAL_V8,
  UVALUX_CHAIN,
  VO_IS_ESTIMATE,
  VO_SEGMENTS,
  VO_SRC,
  type ShotV8,
} from './timelineV8';
import { T } from './tokens';

const V8Signoff: React.FC<{ duration: number }> = ({ duration }) => (
  <A13Outro duration={duration} line="It grows salons. It grows UVALUX." />
);

/** Bed level at an absolute frame: 0.38 in the clear, 0.19 under the voice. */
const BED_CLEAR = 0.38;
const BED_DUCK = 0.19;
const bed = (abs: number) => {
  let d = 0;
  for (const [s, e] of SPEECH) {
    if (abs < s - 8 || abs > e + 15) continue;
    d = Math.max(d, interpolate(abs, [s - 8, s, e, e + 15], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  }
  const edge = interpolate(abs, [0, 30, TOTAL_V8 - 60, TOTAL_V8], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (BED_CLEAR - (BED_CLEAR - BED_DUCK) * d) * edge;
};

type Comp = React.FC<{ duration: number; captions?: boolean; cut?: number; money?: { value: string; label: string } }>;
const SHOT: Record<ShotV8, { C: Comp; cut?: number; money?: { value: string; label: string } }> = {
  open: { C: V8Open },
  chain: { C: V8Chain },
  sync: { C: V8Sync },
  read: { C: B2Read },
  // After "Traffic never moved": the chart stays and the app's money figure
  // lands beside it. The insight plate is not used — its stored sentence still
  // reads "9% to 6%" until a demo reset (not approved).
  chart: { C: B3Chart, cut: CUE.chart.cut, money: { value: '≈ $5,354/mo', label: 'if the gap holds' } },
  health: { C: V8Health },
  recovery: { C: V8Recovery },
  listen: { C: V8Listen },
  team: { C: V8Team },
  method: { C: V8Method },
  bridge: { C: V8Bridge },
  bottle: { C: V8Bottle },
  flag: { C: V8Flag },
  action: { C: V8Action },
  actions: { C: V8Actions },
  measured: { C: V8Measured },
  opens: { C: B8Opens },
  community: { C: B6Community },
  flip: { C: V8Flip },
  network: { C: A11Network },
  calls: { C: V8Calls },
  knowledge: { C: A12bKnowledge },
  supply: { C: V8Supply },
  ask: { C: V8Ask },
  signoff: { C: V8Signoff },
};

export const MainV8: React.FC<{ bgm?: boolean }> = ({ bgm = true }) => {
  const S = SHOTS_V8;
  const x = MUSIC.xfade;
  return (
    <AbsoluteFill style={{ backgroundColor: T.paper }}>
      {/* The read, in pieces: it stops for the speakers and for the messages,
          and picks up where it left off. Never sped up, never trimmed. */}
      {!VO_IS_ESTIMATE &&
        VO_SEGMENTS.map((g) => (
          <Sequence key={g.from} from={g.at} durationInFrames={g.to - g.from}>
            <Audio src={staticFile(VO_SRC)} startFrom={g.from} volume={1} />
          </Sequence>
        ))}

      {bgm && (
        <Sequence from={0} durationInFrames={MUSIC.spliced ? MUSIC.splice + x : TOTAL_V8}>
          <Audio
            src={staticFile('audio/bgm-open-road.mp3')}
            startFrom={Math.round(MUSIC.aFromSec * 30)}
            volume={(f) =>
              bed(f) *
              (MUSIC.spliced ? interpolate(f, [MUSIC.splice, MUSIC.splice + x], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1)
            }
          />
        </Sequence>
      )}
      {bgm && MUSIC.spliced && (
        <Sequence from={MUSIC.splice} durationInFrames={TOTAL_V8 - MUSIC.splice}>
          <Audio
            src={staticFile('audio/bgm-open-road.mp3')}
            startFrom={Math.round(MUSIC.bFromSec * 30)}
            volume={(f) => bed(f + MUSIC.splice) * interpolate(f, [0, x], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
          />
        </Sequence>
      )}

      {SFX_V8.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.durationInFrames ?? 90}>
          <Audio src={staticFile(s.src)} volume={s.volume} />
        </Sequence>
      ))}

      {ORDER.map((k) => {
        const { C, cut, money } = SHOT[k];
        return (
          <Sequence key={k} from={S[k].from} durationInFrames={S[k].duration} name={`${S[k].beat} ${k}`}>
            <C duration={S[k].duration} captions={false} cut={cut} money={money} />
          </Sequence>
        );
      })}

      {/* The chain strip: where we are. A new link pulses on its first shot —
          the only chapter marker in the film. */}
      {ORDER.map((k, i) => {
        const ch = CHAPTER[k];
        if (!ch) return null;
        const prev = i > 0 ? CHAPTER[ORDER[i - 1]] : undefined;
        const pulse = !prev || prev.side !== ch.side || prev.link !== ch.link;
        const next = i + 1 < ORDER.length ? CHAPTER[ORDER[i + 1]] : undefined;
        const enter = !prev || prev.side !== ch.side;
        const exit = !next || next.side !== ch.side;
        return (
          <Sequence key={`strip-${k}`} from={S[k].from} durationInFrames={S[k].duration} layout="none">
            <ChainStrip
              labels={ch.side === 'salon' ? SALON_CHAIN : UVALUX_CHAIN}
              link={ch.link}
              dark={ch.side === 'uvalux'}
              pulse={pulse && !enter}
              enter={enter}
              exit={exit}
              duration={S[k].duration}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
