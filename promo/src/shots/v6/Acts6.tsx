/**
 * v6 shots — composed, not scrolled.
 *
 * The rule this file follows, and the reason it exists: every inner shot FRAMES
 * something. A cutout is pushed into, drifted across or settled onto, over the
 * page it came from — never a bare camera run down a stacked screenshot, which
 * is what made v5 read as "just scrolling a site".
 *
 * The page underneath is still there, dimmed, in most shots. That is the other
 * half of the note: the first v5 pass floated elements on empty cream and got
 * "elements too isolated" back. Framed IN CONTEXT satisfies both.
 */
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import { BaskCaption } from '../../lib/BaskCaption';
import { E, T } from '../../tokens';
import { AppScroll, Focus } from '../v5/AppScroll';
import { Figure } from '../v5/Plate';
import { ChartPlate } from './ChartPlate';
import { FigurePlate } from './FigurePlate';

export interface ShotProps {
  duration: number;
  captions?: boolean;
}

const ease = {
  push: (t: number) => t * t * (3 - 2 * t),
  drift: (t: number) => t,
};

/**
 * The page, held behind a framed figure. Dimmed AND BLURRED so the figure reads
 * first.
 *
 * The blur was added 2026-09-02, at the same time FigurePlate stopped painting
 * an opaque fill over this. Until then none of this was visible at all, so the
 * problem it solves had never appeared: a plate is a cutout OF the page behind
 * it, so at full sharpness the same card renders twice in one frame — the
 * daybreak letter showed its own headline ghosted directly above the plate
 * framing it, which reads as a rendering fault rather than as context.
 *
 * Blur fixes it for every shot at once and is the honest treatment anyway: the
 * backdrop is depth, not content. Do not remove it without re-checking every
 * plate against the region of the page it was cut from.
 */
const Backdrop: React.FC<{ page: string; from: number; to: number; duration: number; dim?: number }> = ({
  page,
  from,
  to,
  duration,
  dim = 0.72,
}) => (
  <>
    <AbsoluteFill style={{ filter: 'blur(10px)', transform: 'scale(1.03)' }}>
      <AppScroll page={page} from={from} to={to} duration={duration} zoom={1.05} ease={ease.drift} />
    </AbsoluteFill>
    <AbsoluteFill style={{ backgroundColor: T.paper, opacity: dim }} />
  </>
);

/* ------------------------------------------------------------------ 2 */
/** The morning letter, framed. The first thing the film says it does. */
export const B2Read: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    {/* 260 -> 380, not 0 -> 90. The plate IS the letter at the top of this
        page, so the original range put the shot's own headline in the backdrop
        directly behind it. This sits it over the opportunity feed underneath. */}
    <Backdrop page="today" from={260} to={380} duration={duration} />
    <FigurePlate src="daybreak-letter" move="settle" moveFrames={duration} />
    {captions && (
      <BaskCaption
        lead="It reads last night's numbers "
        accent="before anyone unlocks the door"
        tail="."
        duration={duration}
        from={26}
      />
    )}
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ 3 */
/**
 * THE CHART BEAT — the shot v5 does not have.
 *
 * Two halves inside one shot: the line draws itself on, then the card it came
 * from is framed beside the number. Split by frame rather than by two timeline
 * entries so the cut lands mid-beat rather than on a shot boundary.
 *
 * The series is the real one the product shows: attachment easing from 8.8% to
 * 5.7% over a fortnight.
 */
export const B3Chart: React.FC<ShotProps> = ({ duration, captions = true }) => {
  const f = useCurrentFrame();
  // Pinned to the silence at 24.3s in the read ("Traffic never moved"), not
  // scaled from v6's 200. See docs/pitch/2026-09-02-v7-beatmap.md.
  const CUT = 196;
  return (
    <AbsoluteFill>
      {f < CUT ? (
        <>
          <Backdrop page="today" from={120} to={190} duration={duration} dim={0.88} />
          <ChartPlate
            series={[8.8, 8.7, 8.4, 8.1, 7.6, 7.2, 6.8, 6.3, 6.0, 5.7]}
            label="Lotion per visit"
            fromLabel="the 28 days before"
            toLabel="the last 14 days"
            fromValue="8.8%"
            toValue="5.7%"
            accent
          />
        </>
      ) : (
        <>
          <Backdrop page="today" from={220} to={300} duration={duration} dim={0.78} />
          {/* delay MUST be CUT, not 0. This plate mounts at frame CUT while
              `useCurrentFrame` still reports the shot's frame, so delay={0}
              meant its 90-frame push window had already expired before it
              appeared: it arrived fully pushed, with no fade-in at all. */}
          <FigurePlate src="insight-retail" move="push" delay={CUT} moveFrames={duration - CUT} />
        </>
      )}
      {captions && (
        <BaskCaption
          lead="Not everywhere — "
          accent="Thursday afternoons, and Friday nights"
          tail="."
          duration={duration}
          from={CUT + 26}
        />
      )}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ 4 */
/**
 * Where the advice came from — the coaching citation, opened.
 *
 * This is the only shot in the film built on a capture taken AFTER the v5
 * shoot, because the feature did not exist then. It is a real frame of
 * production: three retrieved claims with one open to the words somebody said
 * on a stage.
 */
export const B4Method: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    <Backdrop page="today" from={300} to={420} duration={duration} dim={0.8} />
    {/* TRAVEL, not push. This is the longest beat in the film (20.6s) and
        citation.png is a whole 740x1350 drill-down page: fitted inside the
        frame it rendered 407px wide and its body text was unreadable, and a
        push would have finished in 3s and left it frozen for the other 17.6.
        Scaled to 1180 wide (h 2153) and panned down, the shot reads the page
        the way the line describes it — the insight, the chart, the visits
        behind it, then the coaching it drew on, opened to the quote. */}
    <FigurePlate
      src="textures/v6/citation.png"
      move="travel"
      moveFrames={duration}
      travelWidth={1180}
      travelFrom={30}
      travelTo={-1105}
    />
    {captions && (
      <BaskCaption
        lead="It shows you "
        accent="the words somebody actually said"
        tail=" about this exact problem."
        duration={duration}
        from={30}
      />
    )}
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ 5 */
/** One button, and the campaign is already written. */
export const B5Action: React.FC<ShotProps> = ({ duration, captions = true }) => {
  const f = useCurrentFrame();
  // Pinned to the silence at 62.5s ("You read it, you change what you want"),
  // which is the frame the campaigns page belongs under.
  const CUT = 270;
  return (
    <AbsoluteFill>
      {f < CUT ? (
        <>
          <Backdrop page="today" from={140} to={220} duration={duration} dim={0.74} />
          <FigurePlate src="opp1" move="settle" moveFrames={CUT} />
        </>
      ) : (
        <>
          <Backdrop page="campaigns" from={80} to={200} duration={duration} dim={0.76} />
          {/* delay={CUT} for the same reason as the chart's second plate. */}
          <FigurePlate src="l4-campaigns-money" move="drift" delay={CUT} moveFrames={duration - CUT} />
        </>
      )}
      {captions && (
        <BaskCaption
          lead="One button. "
          accent="Nothing leaves without you"
          tail="."
          duration={duration}
          from={CUT + 24}
        />
      )}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ 6 */
/** Other owners, working the same week. A slower move — people, not machinery. */
export const B6Community: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    <Backdrop page="community" from={120} to={260} duration={duration} dim={0.6} />
    <FigurePlate src="win1" move="drift" moveFrames={duration} />
    {captions && (
      <BaskCaption lead="And you are " accent="not doing it alone" tail="." duration={duration} from={24} />
    )}
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ 7 */
/** What it was worth — a measured number, beside the coaching that suggested it. */
export const B7Measured: React.FC<ShotProps> = ({ duration, captions = true }) => {
  const f = useCurrentFrame();
  const lift = interpolate(f, [20, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: E.easeOut,
  });
  return (
    <AbsoluteFill>
      <Backdrop page="today" from={520} to={620} duration={duration} dim={0.76} />
      <FigurePlate src="outcome1" move="push" moveFrames={duration} />
      <Figure value="+$1,840" label="brought back, measured" x={230} y={742} from={22} />
      <Focus opacity={0.18 * lift} />
      {captions && (
        <BaskCaption
          lead="Then it tells you "
          accent="what it was worth"
          tail="."
          duration={duration}
          from={28}
        />
      )}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ 8 */
/** Every figure goes back to the visits behind it. Fast, confident. */
export const B8Opens: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    <Backdrop page="today" from={700} to={860} duration={duration} dim={0.82} />
    {/* Same problem as the citation, same fix: records-table is 2052x4170 and
        fitted inside the frame it landed 365px wide — a table nobody can read,
        under a line that is literally about being able to read it. Panned. */}
    <FigurePlate
      src="records-table"
      move="travel"
      moveFrames={duration}
      travelWidth={1150}
      travelFrom={30}
      travelTo={-1286}
    />
    {captions && (
      <BaskCaption
        lead="Every figure opens to "
        accent="the visits behind it"
        tail="."
        duration={duration}
        from={26}
      />
    )}
  </AbsoluteFill>
);
