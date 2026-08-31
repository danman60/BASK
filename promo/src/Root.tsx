import { Composition } from 'remotion';
import { z } from 'zod';

import './fonts';
import { Main } from './Main';
import { MainFilm } from './MainFilm';
import { MainV3 } from './MainV3';
import { MainV5 } from './MainV5';
import { MainV6 } from './MainV6';
import { FPS, SHOTS, SHOTS_VO, TOTAL, TOTAL_VO } from './timeline';
import { TOTAL_FILM } from './timelineFilm';
import { TOTAL_V3 } from './timelineV3';
import { TOTAL_V5 } from './timelineV5';
import { TOTAL_V6 } from './timelineV6';

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
    {/* v5 shotcraft redo (2026-08-28) — 43.9s, fourteen shots, element-level
        framing off 3x captures of production. Storyboard:
        docs/pitch/2026-08-28-shotcraft-v5-spec.md. `bgm` off renders the same
        timeline with SFX only. */}
    {/* v6 composed cut (2026-08-31). Cutouts FRAMED again — push/drift/settle —
        over the page they came from, plus a chart beat in the first 20s and the
        coaching citation from a real production capture. No impact at the end;
        UVALUX lockup on both ends. v5 stays renderable and its masters stay on
        disk: this writes to different filenames. */}
    <Composition
      id="BaskPromoV6"
      component={MainV6}
      durationInFrames={TOTAL_V6}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ bgm: true, captions: true }}
    />
    <Composition
      id="BaskPromoV5"
      component={MainV5}
      durationInFrames={TOTAL_V5}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ bgm: true }}
    />
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
    {/* Same picture, with the new ElevenLabs VO over the old open-road bed. */}
    <Composition
      id="BaskPromoV3VO"
      component={MainV3}
      durationInFrames={2512}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ audio: true }}
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
    {/* "The Quietest Register" (2026-08-28) — the long-form data film: 13 H3
        clips cut against real captures of the insight report and /evidence.
        Picture only; the read is Daniel's recording of
        docs/pitch/2026-08-28-film-vo-script.md, pinned with BEAT_STARTS. H3
        clips that have not rendered yet appear as named slates. */}
    <Composition
      id="QuietestRegister"
      component={MainFilm}
      durationInFrames={TOTAL_FILM}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
);
