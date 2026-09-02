// capture-v5.mjs — Phase 4 asset capture for the v5 shotcraft cut.
//
// Why a second capture script: v4 framed whole pages (2880px wide textures of
// 5188px-tall pages), which is why body copy lands at 8-14px on screen. v5
// frames ELEMENTS, so every asset here is a per-element cutout at
// deviceScaleFactor 3 — a 740px card becomes a 2220px texture, legible at 1080p
// even when it only fills half the frame.
//
// Target MUST be passed explicitly. Never a default.
//   CAP_BASE=https://bask-psi.vercel.app node scripts/capture-v5.mjs
//
// Writes to the demo: NOTHING that mutates state. It scrolls, expands
// "Show me why" (client-side toggle), and asks ONE question on /ask (a bounded
// read that costs an OpenAI call and writes no rows). Set ASK=0 to skip that.
import { createRequire } from 'module';
const requireG = createRequire('/home/danman60/.nvm/versions/node/v22.22.1/lib/node_modules/');
const { chromium } = requireG('playwright');
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = process.env.CAP_BASE;
if (!BASE) { console.error('CAP_BASE required (no default — never point a capture at an unnamed host)'); process.exit(1); }
const DO_ASK = process.env.ASK !== '0';
const DSF = Number(process.env.DSF || 3);
console.log('capture-v5 target:', BASE, '| dsf:', DSF, '| ask:', DO_ASK);

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../public/textures/v5');
fs.mkdirSync(outDir, { recursive: true });

const layout = { pageW: 1920, dsf: DSF, cutouts: {} };

// Product chrome that would read as a bug hovering in a promo frame.
const HIDE_CSS = `
  #fw-btn, #fw-panel, [class*="guidance-fab"], [data-testid="guidance-fab"], .g-fab, .cp-toast { display: none !important; }
  * { scroll-behavior: auto !important; }
`;

const settle = async (page, extra = 0) => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900 + extra);
};

const cut = async (page, name, selector, index = 0, opts = {}) => {
  const el = page.locator(selector).nth(index);
  if ((await el.count()) === 0) { console.log(`  MISS ${name}  (${selector})`); return null; }
  await el.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(250);
  const bb = await el.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { x: Math.round(r.x + window.scrollX), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
  });
  await el.screenshot({ path: `${outDir}/${name}.png`, ...(opts.omitBackground ? { omitBackground: true } : {}) });
  layout.cutouts[name] = bb;
  console.log(`  ${name}.png`, JSON.stringify(bb));
  return bb;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: DSF });
await ctx.addInitScript(() => { window.__promoCapture = true; });
const page = await ctx.newPage();
const go = async (route, extra = 0) => {
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: HIDE_CSS });
  await settle(page, extra);
  console.log(`\n-- ${route}`);
};

/* ---------------------------------------------------------------- ACT 1 */
/* /evidence — the real dataset. The film opens here because it is the only
   surface that is not a demo: 194,672 visits that actually happened. */
await go('/evidence', 600);
await cut(page, 'ev-h1', '.ev-h1');
await cut(page, 'ev-stats', '.ev-stats');
await cut(page, 'ev-block-kept', '.ev-block', 0);
await cut(page, 'ev-block-brand', '.ev-block', 1);

/* ---------------------------------------------------------------- ACT 2 */
await go('/', 900);
await cut(page, 'daybreak-letter', '[data-testid="daybreak-letter"], .b-daybreak');
await cut(page, 'daybreak-line', '.b-daybreak h1');
await cut(page, 'oppfeed-head', '.b-oppfeed-head', 0);
for (let i = 0; i < 6; i += 1) await cut(page, `opp${i + 1}`, '[data-testid="opportunity-card"], .b-opp', i);
await cut(page, 'outcome1', '[data-testid="outcome-card"], .b-outcome', 0);
await cut(page, 'outcome2', '[data-testid="outcome-card"], .b-outcome', 1);
await cut(page, 'winfeed-head', '.b-winfeed-title');
await cut(page, 'win1', '[data-testid="win-card"], .b-win', 0);
await cut(page, 'win2', '[data-testid="win-card"], .b-win', 1);
await cut(page, 'insight-retail', '[data-testid="insight-card"], .b-insight', 0);

/* "Show me why" — a client-side toggle. Opens the drilldown INLINE and, under
   it, the records panel: the actual visits the rate was counted from. */
const why = page.getByRole('button', { name: /show me why/i }).first();
if ((await why.count()) > 0) {
  await why.scrollIntoViewIfNeeded();
  await why.click();
  await page.waitForTimeout(1400);
  await cut(page, 'drill', '[data-testid="evidence-drilldown"]');
  await cut(page, 'records', '[data-testid="records-panel"]');
  await cut(page, 'records-head', '.b-records-head');
  // The table lives in a scroll container, so an element screenshot of it
  // captures whatever is painted in the clipped region — sibling cards, not
  // rows. Unclip the container first so the texture is only the table.
  await page.addStyleTag({ content: '.b-records-scroll { max-height: none !important; overflow: visible !important; }' });
  await page.waitForTimeout(500);
  await cut(page, 'records-table', '.b-dtable');
  await cut(page, 'insight-open', '[data-testid="insight-card"], .b-insight', 0);
} else {
  console.log('  MISS show-me-why button');
}

/* /insights — the report the drilldown belongs to: the priced sentence. */
await go('/insights', 700);
await cut(page, 'l4-title', '.l4-title');
await cut(page, 'l4-retail', '.l4-card', 0);
await cut(page, 'l4-failed', '.l4-card', 1);
await cut(page, 'l4-till', '.l4-card', 2);
await cut(page, 'l4-campaigns-money', '.l4-card', 3);
await cut(page, 'l4-heatmap', '.l4-card', 4);
await cut(page, 'l4-staff1', '.l4-card', 5);
await cut(page, 'l4-staff2', '.l4-card', 6);

/* /ask — one bounded question, one answer, no SQL, no database reach. */
await go('/ask', 500);
await cut(page, 'ask-empty', '.ask-page');
if (DO_ASK) {
  const input = page.locator('.ask-input');
  await input.fill('How much is the retail slip costing me?');
  await page.waitForTimeout(400);
  await cut(page, 'ask-typed', '.ask-form');
  await page.locator('.ask-go').click();
  await page.waitForSelector('.ask-answer[data-state="yes"], .ask-answer[data-state="no"]', { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await cut(page, 'ask-answer', '.ask-answer');
  const answered = await page.locator('.ask-a').first().innerText().catch(() => '');
  console.log('  ask answer:', answered.slice(0, 160));
  layout.askAnswer = answered;
}

/* ---------------------------------------------------------------- ACT 3 */
await go('/compass', 1200);
await cut(page, 'cp-title', 'h1', 0);
for (let i = 0; i < 3; i += 1) await cut(page, `callcard${i + 1}`, '.cp-call', i);

await go('/compass/network', 1500);
await cut(page, 'net-title', 'h1', 0);
await cut(page, 'net-bands', '.cp-section', 0);
await cut(page, 'net-telling', '.cp-section', 1);
await cut(page, 'net-soft-spot', '.cp-card', 0);
await cut(page, 'net-map', '.cp-map-card');
await cut(page, 'net-regions', '.cp-regions');

fs.writeFileSync(path.resolve(here, '../src/layout-v5.json'), JSON.stringify(layout, null, 2));
console.log('\nlayout-v5.json written:', Object.keys(layout.cutouts).length, 'cutouts');
await browser.close();
