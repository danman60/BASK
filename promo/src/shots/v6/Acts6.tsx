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

/** The page, held behind a framed figure. Dimmed so the figure reads first. */
const Backdrop: React.FC<{ page: string; from: number; to: number; duration: number; dim?: number }> = ({
  page,
  from,
  to,
  duration,
  dim = 0.72,
}) => (
  <>
    <AppScroll page={page} from={from} to={to} duration={duration} zoom={1.05} ease={ease.drift} />
    <AbsoluteFill style={{ backgroundColor: T.paper, opacity: dim }} />
  </>
);

/* ------------------------------------------------------------------ 2 */
/** The morning letter, framed. The first thing the film says it does. */
export const B2Read: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    <Backdrop page="today" from={0} to={90} duration={duration} />
    <FigurePlate src="daybreak-letter" move="settle" />
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
  const CUT = 200;
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
          <FigurePlate src="insight-retail" move="push" delay={0} />
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
    <FigurePlate src="textures/v6/citation.png" move="push" />
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
  const CUT = 150;
  return (
    <AbsoluteFill>
      {f < CUT ? (
        <>
          <Backdrop page="today" from={140} to={220} duration={duration} dim={0.74} />
          <FigurePlate src="opp1" move="settle" />
        </>
      ) : (
        <>
          <Backdrop page="campaigns" from={80} to={200} duration={duration} dim={0.76} />
          <FigurePlate src="l4-campaigns-money" move="drift" />
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
    <FigurePlate src="win1" move="drift" />
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
      <FigurePlate src="outcome1" move="push" />
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
    <FigurePlate src="records-table" move="push" />
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
