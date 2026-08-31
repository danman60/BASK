// The v5 cut, rebuilt as ONE running app.
//
// Daniel's note on the first pass: "elements too isolated, just show the app."
// So every shot here is the real product scrolling under its own pinned topbar,
// with a soft spot marking what the line is talking about. Nothing floats on
// cream any more.
//
// The spine he asked for, in order:
//   opportunity recognition → suggestion with its source → low-friction action
//   → measured growth — with the community as the place the suggestions are
//   pressure-tested by other owners.
//
// Page-space coordinates below are MEASURED off the running app at the 1600px
// capture width (scratchpad boxes.mjs), not eyeballed: the content column is
// x=250 (w=740) on Today, x=500 (w=600) in Community, x=256 (w=900) in Compass,
// x=304 (w=992) on /evidence. Guessing these put every highlight 180px right of
// the thing it was pointing at.
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import { BaskCaption } from '../../lib/BaskCaption';
import { BODY, DISPLAY, E, T } from '../../tokens';
import { AppScroll, Focus, Spot } from './AppScroll';

const ease = {
  drift: (t: number) => t,
  settle: (t: number) => 1 - Math.pow(1 - t, 3),
  push: (t: number) => Easing.inOut(Easing.cubic)(t),
};

type ShotProps = { duration: number; captions?: boolean };

/* ------------------------------------------------------------------ S1 */
/**
 * What it is, said plainly, over the app itself. No jargon: someone who has
 * never heard of Bask has to understand it from this one line.
 */
export const A1Open: React.FC<ShotProps> = ({ duration, captions = true }) => {
  const f = useCurrentFrame();
  const titleIn = interpolate(f, [8, 26], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.easeOut });
  const titleOut = interpolate(f, [duration - 24, duration - 8], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <AppScroll page="today" from={0} to={120} duration={duration} zoom={1.2} zoomTo={1.26} ease={ease.push} />
      <Focus opacity={0.62 * titleIn * titleOut} />
      <AbsoluteFill style={{ backgroundColor: T.paper, opacity: 0.82 * titleIn * titleOut }} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: titleIn * titleOut }}>
        <div style={{ textAlign: 'center', transform: `translateY(${(1 - titleIn) * 14}px)` }}>
          <div style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 150, fontWeight: 600, color: T.ink, lineHeight: 1 }}>
            Bask
          </div>
          <div style={{ fontFamily: BODY, fontSize: 44, color: T.inkSoft, marginTop: 26, maxWidth: 1180 }}>
            An app a salon owner opens when the salon is quiet — to make it less quiet.
          </div>
        </div>
      </AbsoluteFill>
      {captions && (
        <BaskCaption lead="It finds the work that " accent="fills the room" tail="." duration={duration} from={duration - 46} />
      )}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ S2 */
/** Opportunity recognition, part one: it tells you what changed overnight. */
export const A2Brief: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    <AppScroll page="today" from={0} to={150} duration={duration} zoom={1.24} ease={ease.drift}>
      <Spot x={250} y={103} w={740} h={261} from={12} />
    </AppScroll>
    {captions && (
      <BaskCaption lead="Every morning it says what changed, in " accent="plain English" tail="." duration={duration} from={16} />
    )}
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ S3 */
/** Opportunity recognition, part two: the ranked list of things worth doing. */
export const A3Feed: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    <AppScroll page="today" from={120} to={460} duration={duration} zoom={1.18} ease={ease.settle}>
      <Spot x={250} y={464} w={740} h={316} from={44} />
    </AppScroll>
    {captions && (
      <BaskCaption lead="Then six ways to grow, " accent="biggest first" tail="." duration={duration} from={12} />
    )}
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ S4 */
/**
 * Where the suggestion comes from. The product prints its own method line, so
 * this shot only has to hold still on it long enough to be read.
 */
export const A4Method: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    <AppScroll page="today" from={380} to={480} duration={duration} zoom={1.42} ease={ease.drift}>
      <Spot x={275} y={697} w={690} h={15} from={14} />
    </AppScroll>
    {captions && (
      <BaskCaption lead="Every one cites the method it came from — " accent="UVALUX’s own training" tail="." duration={duration} from={14} />
    )}
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ S5 */
/** Low-friction action: the row of one-click buttons the product already has. */
export const A5Action: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    <AppScroll page="today" from={420} to={500} duration={duration} zoom={1.46} ease={ease.drift}>
      <Spot x={275} y={724} w={690} h={35} from={10} />
    </AppScroll>
    {captions && (
      <BaskCaption lead="One button does it — the message is " accent="already written" tail="." duration={duration} from={10} />
    )}
  </AbsoluteFill>
);

/* ----------------------------------------------------------------- S5b */
/**
 * The advice becomes the campaign. Studio proposes the ideas ("build this"),
 * each one traced back to the number that raised it — this is the "advise on
 * actions and copy" link of the loop.
 */
export const A5bStudio: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    <AppScroll page="studio" from={40} to={190} duration={duration} zoom={1.2} ease={ease.settle}>
      <Spot x={250} y={286} w={353} h={211} from={22} />
    </AppScroll>
    {captions && (
      <BaskCaption lead="It drafts the campaign too — " accent="the words, the list, the timing" tail="." duration={duration} from={14} />
    )}
  </AbsoluteFill>
);

/* ----------------------------------------------------------------- S5c */
/**
 * And the campaigns that came out of it, with what each one returned — the
 * measured half of the same screen.
 */
export const A5cCampaigns: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    <AppScroll page="campaigns" from={60} to={210} duration={duration} zoom={1.2} ease={ease.drift} />
    {captions && (
      <BaskCaption lead="Nothing sends until she says so — then it " accent="counts what came back" tail="." duration={duration} from={14} />
    )}
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ S6 */
/**
 * The community. Other owners, in their own words — the part that makes a
 * suggestion believable rather than merely computed.
 *
 * Starts below page y=726: the composer prints "Nothing here is saved yet …
 * until the community room is connected to the server", which is honest in the
 * product and fatal in a promo. If this shot is ever reframed higher, that
 * banner comes back — check it.
 */
export const A6Community: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    <AppScroll page="community" from={760} to={1900} duration={duration} zoom={1.2} ease={ease.settle} />
    {captions && (
      <BaskCaption lead="And other owners say what " accent="actually worked" tail=" — in their own words." duration={duration} from={14} />
    )}
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ S7 */
/** Measured growth: what the last actions actually returned. */
export const A7Outcome: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    <AppScroll page="today" from={2150} to={2400} duration={duration} zoom={1.2} ease={ease.settle}>
      <Spot x={250} y={2447} w={740} h={196} from={30} />
    </AppScroll>
    {captions && (
      <BaskCaption lead="A week later it reports " accent="what came back" tail="." duration={duration} from={16} />
    )}
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ S8 */
/** The wins feed — the same loop, running at other salons. */
export const A8Wins: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    <AppScroll page="today" from={2790} to={2990} duration={duration} zoom={1.2} ease={ease.drift}>
      <Spot x={250} y={2956} w={740} h={298} from={20} />
    </AppScroll>
    {captions && (
      <BaskCaption lead="Ran at other salons, with the " accent="numbers attached" tail="." duration={duration} from={12} />
    )}
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ S9 */
/**
 * Why any of it can be trusted: the whole thing is read off a real till. The
 * page prints its own figures, so nothing is overlaid on top of them — an
 * earlier pass put pulled-out numbers straight through the chart.
 */
export const A9Evidence: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    <AppScroll page="evidence" from={40} to={560} duration={duration} zoom={1.16} ease={ease.settle} />
    {captions && (
      <BaskCaption lead="It reads the " accent="till" tail=" — 194,672 real visits, not a survey." duration={duration} from={12} />
    )}
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ S10 */
/** The role flip — the product's own dark sub-theme arriving as a wedge. */
export const A10Flip: React.FC<ShotProps> = ({ duration, captions = true }) => {
  const f = useCurrentFrame();
  const sweep = interpolate(f, [0, 26], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.heavyOut });
  return (
    <AbsoluteFill>
      <AppScroll page="today" from={600} to={660} duration={duration} zoom={1.2} ease={ease.drift} />
      <AbsoluteFill style={{ backgroundColor: T.cPaper, clipPath: `polygon(0 0, ${sweep * 150}% 0, ${sweep * 150 - 50}% 100%, 0 100%)` }} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(100deg, transparent ${Math.max(0, sweep * 150 - 6)}%, oklch(79% 0.125 78 / 0.5) ${sweep * 150}%, transparent ${sweep * 150 + 3}%)`,
          opacity: sweep > 0 && sweep < 1 ? 1 : 0,
        }}
      />
      {captions && (
        <BaskCaption lead="There is a " accent="second side" tail=" to it." duration={duration} from={20} dark />
      )}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ S11 */
/**
 * UVALUX, deliberately at altitude: how the network is doing, the rollups, the
 * map. No drilling into a single account — that level of detail belongs in a
 * demo, not here.
 */
export const A11Network: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    <AppScroll page="network" from={60} to={1240} duration={duration} zoom={1.16} dark bar={false} ease={ease.settle} />
    {captions && (
      <BaskCaption
        lead="UVALUX sees the same intelligence one level up — "
        accent="counts, never names"
        tail="."
        duration={duration}
        from={16}
        dark
      />
    )}
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ S12 */
/** One glance at what a rep does with it, then out. */
export const A12Calls: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    <AppScroll page="calls" from={0} to={170} duration={duration} zoom={1.24} dark bar={false} ease={ease.drift}>
      <Spot x={256} y={185} w={900} h={335} from={16} dark />
    </AppScroll>
    {captions && (
      <BaskCaption lead="So the rep calls knowing " accent="what to talk about" tail="." duration={duration} from={12} dark />
    )}
  </AbsoluteFill>
);

/* ----------------------------------------------------------------- S12b */
/**
 * The training corpus, on the UVALUX side: claims mined from their own expo
 * training rooms, sitting in the queue where UVALUX decides what is allowed to
 * coach anyone. This is what the METHOD line on a salon's card traces back to,
 * so the film shows it rather than asserting it.
 */
export const A12bKnowledge: React.FC<ShotProps> = ({ duration, captions = true }) => (
  <AbsoluteFill>
    <AppScroll page="knowledge" from={120} to={900} duration={duration} zoom={1.2} dark bar={false} ease={ease.settle}>
      {/* The Compass shell prints the signed-in rep's name here. Names are never
          shown app-facing (sources/experts.ts, owner directive 2026-08-22) and a
          promo frame is the last place to start. Covered in page space. */}
      <div style={{ position: 'absolute', left: 18, top: 908, width: 152, height: 66, background: 'oklch(19.5% 0.012 50)' }} />
    </AppScroll>
    {captions && (
      <BaskCaption
        lead="Their own training, turned into "
        accent="741 claims"
        tail=" — reviewed one at a time."
        duration={duration}
        from={16}
        dark
      />
    )}
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ S13 */
/** Sign-off. Held still, in the dark, for the last second and a half. */
export const A13Outro: React.FC<ShotProps> = ({ duration }) => {
  const f = useCurrentFrame();
  const markIn = interpolate(f, [10, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.heavyOut });
  const lineIn = interpolate(f, [26, 44], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.easeOut });
  // Last thing to arrive, and it arrives quietly — after the wordmark and the
  // line have both settled, so the eye reads Bask, then the promise, then whose
  // network it runs on.
  const logoIn = interpolate(f, [48, 72], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.easeOut });
  return (
    <AbsoluteFill style={{ backgroundColor: 'oklch(12% 0.008 50)' }}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: markIn }}>
        <div style={{ textAlign: 'center', transform: `scale(${0.92 + 0.08 * markIn})` }}>
          <div style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 178, fontWeight: 600, color: T.cInk, lineHeight: 1 }}>
            Bask
          </div>
          <div
            style={{
              fontFamily: BODY,
              fontSize: 34,
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: T.cAmber,
              marginTop: 26,
              opacity: lineIn,
            }}
          >
            Bask · Compass
          </div>
          <div style={{ fontFamily: BODY, fontSize: 38, color: T.cInkFaint, marginTop: 20, opacity: lineIn }}>
            Opens when the salon is quiet. Exists to make it less quiet.
          </div>

          {/* The UVALUX lockup. Absent from every v5 cut — the asset was on disk
              and referenced by nothing, which is why the film signed off with no
              sign of whose network it runs on.

              The 4x file is used and scaled down rather than the 330x100 one:
              a 330px-wide source blown up on a 1920 frame is visibly soft, and
              the sign-off is the frame people look at longest.

              The source art is dark ink on transparency, which would disappear
              on a 12%-lightness background — `brightness(0) invert(1)` flattens
              it to white through the existing alpha, then opacity carries it
              back to a quiet grey. Do not swap this for a colour fill: the alpha
              edge is the only thing keeping the mark from looking pasted on. */}
          <div
            style={{
              marginTop: 54,
              display: 'flex',
              justifyContent: 'center',
              opacity: logoIn * 0.85,
            }}
          >
            <Img
              src={staticFile('brand/uvalux-logo-4x.png')}
              style={{
                width: 300,
                height: 'auto',
                filter: 'brightness(0) invert(1)',
                transform: `translateY(${(1 - logoIn) * 10}px)`,
              }}
            />
          </div>
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, opacity: 0 }}>{duration}</div>
    </AbsoluteFill>
  );
};
