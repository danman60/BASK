// MainV5 — the app cut (2026-08-29). Thirteen shots, 52s.
//
// One running application, scrolling under its own chrome, telling one story:
// a data opportunity, paired with coaching that is specific to this trade,
// wrapped in other owners' support — then what UVALUX sees from above it.
//
// `captions` off renders the master to read a recorded VO over
// (docs/pitch/2026-08-29-v5-vo-script.md); `bgm` off renders the SFX-only
// master from the same timeline.
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';

import {
  A10Flip,
  A11Network,
  A12Calls,
  A12bKnowledge,
  A13Outro,
  A1Open,
  A2Brief,
  A3Feed,
  A4Method,
  A5Action,
  A5bStudio,
  A5cCampaigns,
  A6Community,
  A7Outcome,
  A8Wins,
  A9Evidence,
} from './shots/v5/AppActs';
import { SFX } from './shots/v5/sfx';
import { SHOTS_V5 } from './timelineV5';
import { T } from './tokens';

export const MainV5: React.FC<{ bgm?: boolean; captions?: boolean }> = ({ bgm = true, captions = true }) => {
  const S = SHOTS_V5;
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
      {SFX.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.durationInFrames ?? 90}>
          <Audio src={staticFile(s.src)} volume={s.volume} />
        </Sequence>
      ))}

      {/* what it is */}
      {shot('open', A1Open)}
      {/* the data opportunity */}
      {shot('brief', A2Brief)}
      {shot('feed', A3Feed)}
      {/* coaching, specific to this trade */}
      {shot('method', A4Method)}
      {shot('action', A5Action)}
      {shot('studio', A5bStudio)}
      {shot('campaigns', A5cCampaigns)}
      {/* wrapped in community */}
      {shot('community', A6Community)}
      {/* measured growth */}
      {shot('outcome', A7Outcome)}
      {shot('wins', A8Wins)}
      {shot('evidence', A9Evidence)}
      {/* the UVALUX side, at altitude */}
      {shot('flip', A10Flip)}
      {shot('network', A11Network)}
      {shot('calls', A12Calls)}
      {shot('knowledge', A12bKnowledge)}
      {shot('outro', A13Outro)}
    </AbsoluteFill>
  );
};
