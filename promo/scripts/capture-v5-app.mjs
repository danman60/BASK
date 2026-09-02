// capture-v5-app.mjs — the app, captured as an app.
//
// The first v5 cut framed isolated cards on paper. That reads as a deck, not as
// software. This captures each surface as CONTIGUOUS PAGE STRIPS at 1600px wide,
// deviceScaleFactor 2, plus the sticky topbar on its own — so a shot can pin the
// chrome, scroll the content underneath it, and look like somebody using the
// product. Strips (not one tall image) because a whole page above ~16k px fails
// Chrome's decode ("The source image cannot be decoded").
//
//   CAP_BASE=https://bask-psi.vercel.app node scripts/capture-v5-app.mjs
//
// Read-only. It navigates, scrolls and screenshots; the single /ask question is
// a bounded read that writes no rows.
import { createRequire } from 'module';
const requireG = createRequire('/home/danman60/.nvm/versions/node/v22.22.1/lib/node_modules/');
const { chromium } = requireG('playwright');
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = process.env.CAP_BASE;
if (!BASE) { console.error('CAP_BASE required (no default)'); process.exit(1); }
const DSF = Number(process.env.DSF || 2);
const W = 1600;
const STRIP = 1300;
console.log('app capture:', BASE, '| dsf:', DSF);

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../public/textures/v5app');
fs.mkdirSync(outDir, { recursive: true });

const HIDE_CSS = `
  #fw-btn, #fw-panel, [class*="guidance-fab"], [data-testid="guidance-fab"], .g-fab, .cp-toast { display: none !important; }
  * { scroll-behavior: auto !important; }
`;
/* The topbar is sticky, so on a fullPage shot it would be baked into the very
   top of the texture AND pinned by the shot. Hidden for the strips, captured
   once on its own. */
const NO_BAR = `.b-topbar { visibility: hidden !important; }`;

const pages = {};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: 1000 }, deviceScaleFactor: DSF });
const page = await ctx.newPage();

const go = async (route, extra = 0) => {
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: HIDE_CSS });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1300 + extra);
};

/** Contiguous page strips for `key`, covering page space 0..maxH. */
const strips = async (key, maxH) => {
  const pageH = await page.evaluate(() => document.documentElement.scrollHeight);
  const h = Math.min(maxH ?? pageH, pageH);
  await page.addStyleTag({ content: NO_BAR });
  const out = [];
  for (let top = 0, i = 0; top < h; top += STRIP, i += 1) {
    const sh = Math.min(STRIP, h - top);
    if (sh < 80) break;
    const name = `${key}-s${i}`;
    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true, clip: { x: 0, y: top, width: W, height: sh } });
    out.push({ name, top, h: sh });
  }
  pages[key] = { pageH, w: W, strips: out };
  console.log(`  ${key}: pageH=${pageH} -> ${out.length} strips`);
};

/* The chrome, once. Everything else scrolls under it. */
await go('/');
const barBox = await page.locator('.b-topbar').boundingBox();
await page.locator('.b-topbar').screenshot({ path: `${outDir}/topbar.png` });
pages.topbar = { w: Math.round(barBox.width), h: Math.round(barBox.height) };
console.log('  topbar.png', pages.topbar);

/* Today — the screen a salon owner opens: the brief, then what to do about it. */
await strips('today', 3400);

/* The report behind the brief. */
await go('/insights', 200);
await strips('insights', 2600);

/* The community: what other owners actually did, in their own words. */
await go('/community', 400);
await strips('community', 3900);

/* Compass, at altitude — the network, not a tour of its screens. */
await go('/compass/network', 500);
await strips('network', 2600);
await go('/compass', 400);
await strips('calls', 1600);

/* The training corpus itself: claims mined from UVALUX's own expo training
   rooms, in the review queue where UVALUX decides what is allowed to coach. */
await go('/compass/knowledge', 600);
await strips('knowledge', 1900);

/* Studio: the ideas Bask proposes, and the campaigns that came out of them.
   NOTE: the review screen does NOT rehydrate from an existing campaign row
   (same gotcha capture.mjs documents), so the generated COPY cannot be shot
   read-only — it only exists on screen straight after a generate run, which
   writes a draft row. Not done here without the owner's say-so. */
await go('/marketing', 500);
await strips('studio', 1000);
{
  const tab = page.getByRole('button', { name: /campaigns/i }).first();
  if (await tab.count()) { await tab.click(); await page.waitForTimeout(1800); }
  await strips('campaigns', 1000);
}

/* The dataset the whole argument rests on. */
await go('/evidence', 300);
await strips('evidence', 1400);

/* /ask, answered. */
await go('/ask', 200);
await page.locator('.ask-input').fill('What should I do about my slow Tuesdays?');
await page.waitForTimeout(300);
await page.locator('.ask-go').click();
await page.waitForSelector('.ask-answer[data-state="yes"], .ask-answer[data-state="no"]', { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(1500);
const answer = await page.locator('.ask-a').first().innerText().catch(() => '');
console.log('  ask answer:', answer.slice(0, 160));
await strips('ask', 1100);
pages.askAnswer = answer;

fs.writeFileSync(path.resolve(here, '../src/layout-v5app.json'), JSON.stringify(pages, null, 2));
console.log('layout-v5app.json written');
await browser.close();
