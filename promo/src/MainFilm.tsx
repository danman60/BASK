// "The Quietest Register" — assembly.
//
// Two kinds of picture cut against each other: H3 clips of a salon, and real
// screenshots of the report and the live /evidence page. Nothing here invents a
// figure — every number on screen comes from timelineFilm.ts, which carries the
// citation next to it.
//
// H3 clips that have not rendered yet show a slate naming the shot, so the cut
// can be reviewed end to end before the last render lands. A missing clip is
// visible and labelled, never a silent black frame.
import {
  AbsoluteFill,
  interpolate,
  Loop,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

import {
  UIBrandBars,
  UIEscalator,
  UIFourLists,
  UIKilledClaims,
  UIProvenanceClose,
  UIReportProvenance,
  UISachetEvidence,
  UIYearBars,
} from './shots/FilmUI';
import { BODY, DISPLAY, T } from './tokens';
import { FILM, type FilmSegment } from './timelineFilm';

/** Which H3 clips exist. Written by scripts/film-clips.mjs after each render. */
import clipManifest from './filmClips.json';

const have = (asset?: string) =>
  !!asset && (clipManifest as { present: string[] }).present.includes(asset);

/** One figure, bottom left, while the read says it. */
const Figure: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 18 });
  return (
    <div
      style={{
        position: 'absolute',
        right: 88,
        top: 84,
        opacity: rise,
        transform: `translateY(${interpolate(rise, [0, 1], [10, 0])}px)`,
        padding: '18px 26px',
        borderRadius: 14,
        background: 'oklch(21% 0.012 320 / 0.62)',
        backdropFilter: 'blur(10px)',
        borderLeft: `3px solid ${T.gold}`,
      }}
    >
      <div
        style={{
          font: `600 46px/1.05 ${DISPLAY}`,
          color: T.paper,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </div>
      <div style={{ font: `400 19px/1.4 ${BODY}`, color: 'oklch(88% 0.01 84)', marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
};

/** The animated-UI beats, keyed by the name the timeline asks for. */
const UI_SHOTS: Record<string, React.FC<{ durationInFrames: number }>> = {
  UIYearBars,
  UIBrandBars,
  UIReportProvenance,
  UIKilledClaims,
  UISachetEvidence,
  UIEscalator,
  UIFourLists,
  UIProvenanceClose,
};

/** An H3 clip. `hold` replays the tail of a clip already seen in full. */
const Clip: React.FC<{ asset: string; hold: boolean; slotFrames: number }> = ({
  asset,
  hold,
  slotFrames,
}) => {
  const { fps } = useVideoConfig();
  const clipSeconds = (clipManifest as { seconds?: Record<string, number> }).seconds?.[asset];
  const clipFrames = clipSeconds ? Math.floor(clipSeconds * fps) : slotFrames;
  const body = (
    <OffthreadVideo
      src={staticFile(`h3/${asset}`)}
      // A hold segment replays the clip's tail slowed, rather than freezing a
      // still — H3 clips carry their own room tone and a hard freeze kills it
      // mid-breath.
      playbackRate={hold ? 0.25 : 1}
      startFrom={hold ? Math.max(0, clipFrames - fps) : 0}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* Draft clips are 5.167s in slots the finals will fill at 15.083s. Loop
          rather than freeze: a frozen frame reads as a broken render. */}
      {!hold && clipFrames < slotFrames - 2 ? (
        <Loop durationInFrames={clipFrames}>{body}</Loop>
      ) : (
        body
      )}
    </AbsoluteFill>
  );
};


/* The narration, on screen. Cut 1 had none of this and played as footage with no
   story; the words are the spine until a voice-over exists to carry them. Two
   lines maximum, held for the whole segment so it can actually be read. */
const CaptionBand: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 16 });
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', pointerEvents: 'none' }}>
      <div
        style={{
          margin: '0 0 96px 0',
          padding: '0 120px',
          opacity: rise,
          transform: `translateY(${interpolate(rise, [0, 1], [16, 0])}px)`,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            background: 'oklch(21% 0.012 320 / 0.72)',
            backdropFilter: 'blur(12px)',
            borderRadius: 18,
            padding: '26px 34px',
            font: `600 46px/1.28 ${DISPLAY}`,
            color: T.paper,
            letterSpacing: '-0.01em',
            whiteSpace: 'pre-line',
            maxWidth: 1320,
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** A full-frame statement, on the product's paper. Opens and closes the film. */
const StatementCard: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 24 });
  return (
    <AbsoluteFill
      style={{
        background: T.paper,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 160,
      }}
    >
      <div
        style={{
          font: `600 62px/1.32 ${DISPLAY}`,
          color: T.ink,
          textAlign: 'center',
          whiteSpace: 'pre-line',
          letterSpacing: '-0.015em',
          opacity: rise,
          transform: `translateY(${interpolate(rise, [0, 1], [18, 0])}px)`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/** Named placeholder for a shot that has not rendered yet. */
const Slate: React.FC<{ segment: FilmSegment }> = ({ segment }) => (
  <AbsoluteFill
    style={{
      background: T.cPaper,
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 120,
    }}
  >
    <div style={{ font: `600 34px/1.2 ${DISPLAY}`, color: T.cAmber }}>{segment.id}</div>
    <div
      style={{
        font: `400 21px/1.6 ${BODY}`,
        color: T.cInkFaint,
        marginTop: 18,
        maxWidth: 900,
      }}
    >
      {segment.note}
    </div>
    <div style={{ font: `400 16px/1.4 ${BODY}`, color: T.cLine, marginTop: 26 }}>
      not yet rendered · {segment.seconds.toFixed(3)}s
    </div>
  </AbsoluteFill>
);

const BrandCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 22 });
  return (
    <AbsoluteFill
      style={{ background: T.paper, alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        style={{
          font: `600 96px/1 ${DISPLAY}`,
          color: T.ink,
          opacity: rise,
          transform: `translateY(${interpolate(rise, [0, 1], [14, 0])}px)`,
        }}
      >
        Bask
      </div>
    </AbsoluteFill>
  );
};

export const MainFilm: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    {FILM.cues.map((cue) => {
      const Ui = cue.kind === 'ui' ? UI_SHOTS[cue.asset!] : undefined;
      return (
      <Sequence key={cue.id} from={cue.from} durationInFrames={cue.durationInFrames}>
        {cue.kind === 'brand' ? (
          <BrandCard />
        ) : cue.kind === 'card' ? (
          <StatementCard text={cue.caption ?? ''} />
        ) : Ui ? (
          <Ui durationInFrames={cue.durationInFrames} />
        ) : have(cue.asset) ? (
          <Clip asset={cue.asset!} hold={false} slotFrames={cue.durationInFrames} />
        ) : (
          <Slate segment={cue} />
        )}
        {cue.figure && <Figure value={cue.figure.value} label={cue.figure.label} />}
        {cue.kind !== 'card' && cue.caption && <CaptionBand text={cue.caption} />}
      </Sequence>
      );
    })}
  </AbsoluteFill>
);
