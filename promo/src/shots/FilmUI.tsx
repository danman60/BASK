// The animated-UI half of "The Quietest Register".
//
// These beats are the product's own surfaces, moved: the 2.5D camera flies over
// real captures of the insight report and the live /evidence page, and the
// numbers count up on landing. Nothing here is a mock-up of a page that exists —
// the textures are screenshots and the geometry in layout.json is measured off
// the same DOM, so the camera lands on the real element every time.
//
// The one hand-built beat is FourLists, which is not a reproduction of any page:
// it is the report's four recommended lists stated as cards, in the product's
// own tokens.
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { CamKey, PageCam } from '../lib/PageCam';
import { DigitRoll } from '../lib/DigitRoll';
import { BODY, DISPLAY, T } from '../tokens';
import geometry from '../../public/textures/film/layout.json';

const CAM_EASE = Easing.bezier(0.33, 0, 0.15, 1);

type PageName = 'report' | 'reportOpen' | 'evidence';
const page = (name: PageName) => (geometry as any).pages[name];

/** Centre of a measured element, in page space. */
const centre = (name: PageName, key: string) => {
  const b = page(name).boxes[key];
  if (!b) throw new Error(`layout.json has no box "${key}" on page "${name}" — re-run capture-film.mjs`);
  return { cx: b.x + b.w / 2, cy: b.y + b.h / 2 };
};

/* The report is 14,511 CSS px tall, so a whole-page texture is ~29,000 px at 2x —
   past what Chrome will decode, and every frame that touched one failed with
   "The source image cannot be decoded". The page is captured as strips instead,
   and these translate a page-space box into the strip's own coordinates. */
type SectionName = 'sec-report-head' | 'sec-report-killed' | 'sec-report-provenance'
  | 'sec-sachet-open';
const strip = (name: SectionName) => {
  const s = (geometry as any).shots[name];
  if (!s) throw new Error(`layout.json has no strip "${name}" — re-run capture-film.mjs`);
  return s as { top: number; height: number };
};

/** Centre of a measured element, expressed inside its strip. */
const centreIn = (section: SectionName, pageName: PageName, key: string) => {
  const c = centre(pageName, key);
  return { cx: c.cx, cy: c.cy - strip(section).top };
};

/** Zoom that fits a measured element's width into the 1920 frame, with air. */
const fitWidth = (name: PageName, key: string, air = 1.35) => {
  const b = page(name).boxes[key];
  return 1920 / (b.w * air);
};

/* ---- caption ------------------------------------------------------------ */
/* One line of context per UI beat, in the report's own voice. The figure rolls
   because a number that lands is read; a number that fades is skimmed. */
const Legend: React.FC<{
  value: string;
  label: string;
  source: string;
  delay?: number;
}> = ({ value, label, source, delay = 8 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 20 });
  const digits = /^[\d.,%$−+ ×→<>=e⁻¹²³⁴⁵⁶⁷⁸⁹]+$/u.test(value);
  return (
    <div
      style={{
        position: 'absolute',
        left: 88,
        bottom: 88,
        opacity: rise,
        transform: `translateY(${interpolate(rise, [0, 1], [12, 0])}px)`,
        padding: '20px 28px',
        borderRadius: 16,
        background: 'oklch(100% 0 0 / 0.92)',
        boxShadow: T.shadowPop,
        borderLeft: `3px solid ${T.primary}`,
        maxWidth: 760,
      }}
    >
      <div style={{ font: `600 52px/1.05 ${DISPLAY}`, color: T.ink, letterSpacing: '-0.015em' }}>
        {digits ? <DigitRoll value={value} fontSize={52} color={T.ink} delay={delay + 6} /> : value}
      </div>
      <div style={{ font: `400 20px/1.45 ${BODY}`, color: T.inkSoft, marginTop: 8 }}>{label}</div>
      <div style={{ font: `400 15px/1.4 ${BODY}`, color: T.inkFaint, marginTop: 10 }}>{source}</div>
    </div>
  );
};

/* ---- beat 1 · the paradox, on the live evidence page -------------------- */
export const UIYearBars: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const stat = centre('evidence', 'statRow');
  const bars = centre('evidence', 'yearBars');
  const keys: CamKey[] = [
    { frame: 0, cx: stat.cx, cy: stat.cy, zoom: 1.15 },
    { frame: durationInFrames, cx: bars.cx, cy: bars.cy + 90, zoom: fitWidth('evidence', 'firstYear', 1.15) },
  ];
  return (
    <>
      <PageCam src="textures/film/screenC-evidence-full.png" pageH={page('evidence').pageH} keys={keys} ease={CAM_EASE} />
      <Legend value="−37.7%" label="retail revenue, 2017 → 2019 — while visits fell 13.5%"
        source="recomputed from the register files, 2026-08-28" />
    </>
  );
};

/* ---- beat 2 · one brand carried the shelf ------------------------------- */
export const UIBrandBars: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const brand = centre('evidence', 'brandBars');
  const keys: CamKey[] = [
    { frame: 0, cx: brand.cx, cy: brand.cy - 60, zoom: 1.0 },
    { frame: durationInFrames, cx: brand.cx, cy: brand.cy + 40, zoom: 1.45 },
  ];
  return (
    <>
      <PageCam src="textures/film/screenC-evidence-full.png" pageH={page('evidence').pageH} keys={keys} ease={CAM_EASE} />
      <Legend value="63.3%" label="of retail revenue was a single brand — $123,916 of $195,826"
        source="product lines, 2016–2020" />
    </>
  );
};

/* ---- beat 3 · the report's own masthead and headline numbers ------------ */
export const UIReportProvenance: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const stats = centreIn('sec-report-head', 'report', 'headlineStats');
  const esc = centreIn('sec-report-head', 'report', 'escalator');
  const keys: CamKey[] = [
    { frame: 0, cx: stats.cx, cy: stats.cy, zoom: fitWidth('report', 'headlineStats', 1.2) },
    { frame: durationInFrames, cx: esc.cx, cy: esc.cy, zoom: fitWidth('report', 'escalator', 1.3) },
  ];
  return (
    <>
      <PageCam src="textures/film/sec-report-head.png" pageH={strip('sec-report-head').height}
        keys={keys} ease={CAM_EASE} />
      <Legend value="$2.09M" label="through the register — four salons, 2016 to 2020"
        source="every figure on the page opens to its cohort and caveat" />
    </>
  );
};

/* ---- beat 4 · the claims that did not survive --------------------------- */
export const UIKilledClaims: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const killed = centreIn('sec-report-killed', 'report', 'killed');
  const keys: CamKey[] = [
    { frame: 0, cx: killed.cx, cy: killed.cy + 120, zoom: 1.15 },
    { frame: durationInFrames, cx: killed.cx, cy: killed.cy + 640, zoom: 1.0 },
  ];
  return (
    <>
      <PageCam src="textures/film/sec-report-killed.png" pageH={strip('sec-report-killed').height}
        keys={keys} ease={CAM_EASE} />
      <Legend value="13" label="findings survived being attacked — four good-sounding ones did not"
        source="two of the four were the analysis's own" />
    </>
  );
};

/* ---- beat 5 · the sachet finding, opened -------------------------------- */
export const UISachetEvidence: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const card = centreIn('sec-sachet-open', 'reportOpen', 'sachet');
  const keys: CamKey[] = [
    { frame: 0, cx: card.cx, cy: card.cy - 380, zoom: fitWidth('reportOpen', 'sachet', 1.25) },
    { frame: durationInFrames, cx: card.cx, cy: card.cy + 420, zoom: 1.25 },
  ];
  return (
    <>
      <PageCam src="textures/film/sec-sachet-open.png" pageH={strip('sec-sachet-open').height}
        keys={keys} ease={CAM_EASE} />
      <Legend value="54.6% vs 14.1%" label="odds the next lotion is a bottle — bottle-first buyer vs sachet-first"
        source="conditional on buying lotion a second time at all" />
    </>
  );
};

/* ---- beat 10 · the escalator -------------------------------------------- */
export const UIEscalator: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const esc = centreIn('sec-report-head', 'report', 'escalator');
  const keys: CamKey[] = [
    { frame: 0, cx: esc.cx, cy: esc.cy, zoom: fitWidth('report', 'escalator', 1.6) },
    { frame: durationInFrames, cx: esc.cx, cy: esc.cy + 120, zoom: fitWidth('report', 'escalator', 1.1) },
  ];
  return (
    <>
      <PageCam src="textures/film/sec-report-head.png" pageH={strip('sec-report-head').height}
        keys={keys} ease={CAM_EASE} />
      <Legend value="28% → 87%" label="first renewal to fifteenth — all the loss is on the bottom step"
        source="n falls from 3,741 to 119 along the curve" />
    </>
  );
};

/* ---- beat 11 · the four lists ------------------------------------------- */
/* Not a screenshot of anything: the report's four recommendations, dealt in as
   cards. One motion, used once in the film. */
const LISTS = [
  { when: 'Day 5', who: 'the first-timer who has not come back', why: '61% → 27% once a week goes quiet' },
  { when: 'Day 15', who: 'the member you have barely seen', why: '15% renew at low use, 54% at high' },
  { when: 'Expiry + 7', who: 'the member whose month ran out', why: 'inside 14 days 53%, after 30 days 33%' },
  { when: '90 days quiet', who: 'the customer who stopped coming', why: '$93 expected year vs $63 for a stranger' },
];

export const UIFourLists: React.FC<{ durationInFrames: number }> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: T.paper, padding: '110px 120px', justifyContent: 'center' }}>
      <div style={{ font: `400 22px/1.4 ${BODY}`, color: T.inkFaint, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        The whole playbook
      </div>
      <div style={{ font: `600 62px/1.1 ${DISPLAY}`, color: T.ink, marginTop: 16, marginBottom: 54 }}>
        Four lists. Not one discount.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 26 }}>
        {LISTS.map((list, i) => {
          const enter = spring({
            frame: frame - 10 - i * 9,
            fps,
            config: { damping: 26, mass: 0.7 },
            durationInFrames: 34,
          });
          return (
            <div
              key={list.when}
              style={{
                opacity: enter,
                transform: `translateY(${interpolate(enter, [0, 1], [46, 0])}px) rotate(${interpolate(
                  enter, [0, 1], [i % 2 ? 1.4 : -1.4, 0],
                )}deg)`,
                background: T.card,
                borderRadius: T.radiusLg,
                boxShadow: T.shadowCard,
                border: `1px solid ${T.line}`,
                padding: '30px 34px',
              }}
            >
              <div style={{ font: `600 38px/1.1 ${DISPLAY}`, color: T.primary }}>{list.when}</div>
              <div style={{ font: `400 23px/1.45 ${BODY}`, color: T.ink, marginTop: 12 }}>{list.who}</div>
              <div style={{ font: `400 18px/1.5 ${BODY}`, color: T.inkFaint, marginTop: 14 }}>{list.why}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---- beat 13 · the method statement ------------------------------------- */
export const UIProvenanceClose: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const prov = centreIn('sec-report-provenance', 'report', 'provenance');
  const keys: CamKey[] = [
    { frame: 0, cx: prov.cx, cy: prov.cy, zoom: 1.5 },
    { frame: durationInFrames, cx: prov.cx, cy: prov.cy, zoom: 1.32 },
  ];
  return (
    <PageCam src="textures/film/sec-report-provenance.png"
      pageH={strip('sec-report-provenance').height} keys={keys} ease={CAM_EASE} />
  );
};
