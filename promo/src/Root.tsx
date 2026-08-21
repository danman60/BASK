import { Composition } from 'remotion';
import { z } from 'zod';

import './fonts';
import { Main } from './Main';
import { MainV3 } from './MainV3';
import { FPS, SHOTS, SHOTS_VO, TOTAL, TOTAL_VO } from './timeline';
import { TOTAL_V3 } from './timelineV3';

export const schema = z.object({
  // Wraps the BGM <Audio> only; SFX stay. Renders the no-BGM deliverable from
  // the same timeline (pipeline phase 7 step 1).
  bgm: z.boolean(),
  // Off for a voiceover master: the captions and the VO say the same things,
  // and running both is a double read (see VO-SCRIPT.md).
  captions: z.boolean(),
});

export const RemotionRoot: React.FC = () => (
  <>
    {/* v3 salon-intelligence cut (2026-08-21) — picture-only review cut, no
        Soundtrack, no captions. VO comes from Daniel's ElevenLabs record of
        VO-SCRIPT-V3.md; SFX re-pin after. */}
    <Composition
      id="BaskPromoV3"
      component={MainV3}
      durationInFrames={TOTAL_V3}
      fps={FPS}
      width={1920}
      height={1080}
    />
    {/* Caption cut — no voiceover. */}
    <Composition
      id="BaskPromo"
      component={Main}
      durationInFrames={TOTAL}
      fps={FPS}
      width={1920}
      height={1080}
      schema={schema}
      defaultProps={{ bgm: true, captions: true, vo: false, shots: SHOTS, total: TOTAL }}
    />
    {/* Voiceover cut — the picture is held longer where the read needs it, and
        the captions are off so the film is not read twice. */}
    <Composition
      id="BaskPromoVO"
      component={Main}
      durationInFrames={TOTAL_VO}
      fps={FPS}
      width={1920}
      height={1080}
      schema={schema}
      defaultProps={{ bgm: true, captions: false, vo: true, shots: SHOTS_VO, total: TOTAL_VO }}
    />
  </>
);
