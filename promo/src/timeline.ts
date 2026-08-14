// Frame-level timeline (DESIGN_SPEC §3). Every SFX pin and every shot start is
// expressed relative to these, never as a bare frame number — so a shot can
// change length without re-pinning the whole sound table (sound-design 4.4).
export const FPS = 30;

const seq = <K extends string>(spec: [K, number][]) => {
  let at = 0;
  const out = {} as Record<K, { from: number; duration: number }>;
  for (const [name, duration] of spec) {
    out[name] = { from: at, duration };
    at += duration;
  }
  return { shots: out, total: at };
};

const built = seq([
  ['open', 130], // S1  Daybreak letter — crane-rise-reveal
  ['hero', 170], // S2  the insight card — spotlight-hero-card
  ['titleA', 76], // S3  breathing card
  ['studio', 150], // S4  insight → campaign — card-flip-reveal
  ['floor', 150], // S5  the room board — grid-wave-flip
  ['order', 145], // S6  UVALUX draft order — list-stack-press
  ['titleB', 76], // S7  breathing card
  ['consent', 100], // S8  what UVALUX sees (last 30f = the act-break push)
  ['compass', 150], // S9  Compass call list — row-embed
  ['outro', 180], // S10 group photo + wordmark
]);

export const SHOTS = built.shots;
export const TOTAL = built.total; // 1327f ≈ 44.2s
