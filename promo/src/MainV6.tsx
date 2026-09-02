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
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from 'remotion';

import {
  A10Flip,
  A11Network,
  A12Calls,
  A12bKnowledge,
  A13Outro,
  A1Open,
} from './shots/v5/AppActs';
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
import { SHOTS_V6, TOTAL_V6 } from './timelineV6';
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
      {/* THE MUSIC BED. Restored 2026-09-02 to the treatment the original VO cut
          used (Soundtrack.tsx, `BGM = { startSec: 43, bed: 0.26 }`) and that v5
          silently dropped: from v5 onward this was a bare
          `<Audio volume={0.2} />`, which plays the track from 0:00 at a flat
          level with no fades.

          Two things were wrong with that. The track's opening bars are its
          quietest (-21.2 dB measured, against -12.6 dB at 1:20), so the film was
          scored with the dullest 130 seconds of the piece. And a flat bed has no
          arc to match the film's. Starting at 0:43 opens on the quiet bar that
          then climbs for the next fifty seconds, which is why that number was
          chosen in the first place.

          `bgm-tech-house.mp3` is the other track on disk — it scored the first
          44s film. Swap the filename to use it; it needs no start offset. */}
      {bgm && (
        <Audio
          src={staticFile('audio/bgm-open-road.mp3')}
          startFrom={43 * 30}
          volume={(f) =>
            interpolate(f, [0, 60, TOTAL_V6 - 45, TOTAL_V6], [0, 0.26, 0.26, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      )}
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
      {/* the UVALUX side, at altitude — reused from v5 unchanged */}
      {shot('flip', A10Flip)}
      {shot('network', A11Network)}
      {shot('calls', A12Calls)}
      {shot('knowledge', A12bKnowledge)}
      {shot('signoff', A13Outro)}
    </AbsoluteFill>
  );
};
