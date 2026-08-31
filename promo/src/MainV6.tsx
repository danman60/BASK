// MainV6 — the composed cut (2026-08-31). Nine shots, 73s.
//
// v5 is untouched and still renders: `promo/out/promo-v5*.mp4` are delivered
// masters and this composition writes to different filenames.
//
// What changed, and why, in one line each:
//   · inner shots FRAME cutouts again (push / drift / settle) instead of running
//     a camera down stacked page strips
//   · a chart beat inside the first 20 seconds — the figure v5 never had
//   · the coaching citation, from a real capture of production
//   · no impact sting at the end; the UVALUX lockup on both ends
//
// The open and the sign-off are REUSED from the v5 act file rather than
// rewritten: both already carry the lockup, and re-authoring a title card that
// works is how you lose one.
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';

import { A13Outro, A1Open } from './shots/v5/AppActs';
import { SFX_V6 } from './shots/v6/sfx6';
import {
  B2Read,
  B3Chart,
  B4Method,
  B5Action,
  B6Community,
  B7Measured,
  B8Opens,
} from './shots/v6/Acts6';
import { SHOTS_V6 } from './timelineV6';
import { T } from './tokens';

export const MainV6: React.FC<{ bgm?: boolean; captions?: boolean }> = ({
  bgm = true,
  captions = true,
}) => {
  const S = SHOTS_V6;
  const shot = (
    key: keyof typeof S,
    Comp: React.FC<{ duration: number; captions?: boolean }>,
  ) => (
    <Sequence from={S[key].from} durationInFrames={S[key].duration}>
      <Comp duration={S[key].duration} captions={captions} />
    </Sequence>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: T.paper }}>
      {bgm && <Audio src={staticFile('audio/bgm-open-road.mp3')} volume={0.2} />}
      {SFX_V6.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.durationInFrames ?? 90}>
          <Audio src={staticFile(s.src)} volume={s.volume} />
        </Sequence>
      ))}

      {shot('open', A1Open)}
      {shot('read', B2Read)}
      {shot('chart', B3Chart)}
      {shot('method', B4Method)}
      {shot('action', B5Action)}
      {shot('community', B6Community)}
      {shot('measured', B7Measured)}
      {shot('opens', B8Opens)}
      {shot('signoff', A13Outro)}
    </AbsoluteFill>
  );
};
