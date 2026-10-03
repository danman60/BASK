// capture-v8.mjs — real-app textures for the v8 beats whose features are BUILT
// but never made it into v7: Front Desk Monitor, customer health + recovery,
// the staff section on /insights, peers, data sharing, the UVALUX draft order.
//
// Same conventions as capture-v5-app.mjs: 1600px wide, deviceScaleFactor 2,
// sticky topbar hidden on page captures (captured once on its own), contiguous
// 1300px STRIPS so no texture crosses Chrome's decode limit, plus a full-page
// PNG where the page is short enough to decode, plus hero-element CROPS.
// Every box in layout-v8.json is page-space CSS px (multiply by 2 for texture px).
//
//   CAP_BASE=http://localhost:3517 node promo/scripts/capture-v8.mjs
//   CAP_BASE=... ONLY=monitor node promo/scripts/capture-v8.mjs   # one page, merged into the json
//
// Read-only: navigates, scrolls and screenshots. No clicks that write rows
// (the recovery "write the messages" button is NOT pressed).
import { createRequire } from 'module';
const requireG = createRequire('/home/danman60/.nvm/versions/node/v22.22.1/lib/node_modules/');
const { chromium } = requireG('playwright');
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = process.env.CAP_BASE;
if (!BASE) { console.error('CAP_BASE required (no default — never point a capture at an unnamed host)'); process.exit(1); }
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const DSF = 2;
const W = 1600;
const STRIP = 1300;
const FULL_MAX = 7000; // CSS px; 2x => 14000 px, under the decode ceiling
console.log('v8 capture target:', BASE, '| only:', ONLY ?? 'all');

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../public/textures/v8');
const layoutPath = path.resolve(here, '../src/layout-v8.json');
fs.mkdirSync(outDir, { recursive: true });
const layout = fs.existsSync(layoutPath) ? JSON.parse(fs.readFileSync(layoutPath, 'utf8')) : {};
layout.meta = { ...(layout.meta ?? {}), w: W, dsf: DSF, strip: STRIP, coords: 'page-space CSS px; texture px = x2' };

const HIDE_CSS = `
  #fw-btn, #fw-panel, [class*="guidance-fab"], [data-testid="guidance-fab"], .g-fab, .cp-toast, nextjs-portal { display: none !important; }
  * { scroll-behavior: auto !important; caret-color: transparent !important; }
  *, *::before, *::after { animation-play-state: paused !important; transition: none !important; }
`;
const NO_BAR = `.b-topbar { visibility: hidden !important; }`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: 1000 }, deviceScaleFactor: DSF });
await ctx.addInitScript(() => { window.__promoCapture = true; });
const page = await ctx.newPage();

const go = async (route, waitSel, extra = 0) => {
  await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 180000 });
  if (waitSel) await page.waitForSelector(waitSel, { timeout: 60000 });
  await page.addStyleTag({ content: HIDE_CSS });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1300 + extra);
};

const boxOf = (loc) => loc.evaluate((e) => {
  const r = e.getBoundingClientRect();
  return { x: Math.round(r.x + window.scrollX), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
});

/** Full page (if decodable) + strips + crops + boxes for one route. */
const capture = async (key, route, { waitSel, extra = 0, crops = {}, maxH, patchCss, patchJs, patchNote } = {}) => {
  if (ONLY && !ONLY.includes(key)) return;
  console.log(`== ${key}  ${route}`);
  await go(route, waitSel, extra);
  /* Capture-time presentation patches for app layout bugs that would read as
     broken on screen. They change pixels only in the texture, never app code;
     each one is recorded in layout-v8.json (`patch`) and reported upstream. */
  if (patchCss) await page.addStyleTag({ content: patchCss });
  if (patchJs) await page.evaluate(patchJs);
  await page.addStyleTag({ content: NO_BAR });
  await page.waitForTimeout(200);
  const theme = await page.evaluate(() => document.documentElement.dataset.theme ?? null);
  const pageH = await page.evaluate(() => document.documentElement.scrollHeight);
  const h = Math.min(maxH ?? pageH, pageH);
  const entry = { route, source: BASE, patch: patchNote ?? null, theme, capturedAt: new Date().toISOString(), pageH, w: W, full: null, strips: [], boxes: {} };

  if (h <= FULL_MAX) {
    const name = `${key}-full`;
    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true, clip: { x: 0, y: 0, width: W, height: h } });
    entry.full = { name, h };
  }
  for (let top = 0, i = 0; top < h; top += STRIP, i += 1) {
    const sh = Math.min(STRIP, h - top);
    if (sh < 80) break;
    const name = `${key}-s${i}`;
    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true, clip: { x: 0, y: top, width: W, height: sh } });
    entry.strips.push({ name, top, h: sh });
  }

  for (const [cropName, spec] of Object.entries(crops)) {
    const { sel, text, nth = 0, shoot = true } = typeof spec === 'string' ? { sel: spec } : spec;
    let loc = page.locator(sel);
    if (text) loc = loc.filter({ hasText: text });
    loc = loc.nth(nth);
    if (await loc.count() === 0) { console.log(`  MISS ${cropName} (${sel}${text ? ` ~ "${text}"` : ''})`); continue; }
    entry.boxes[cropName] = await boxOf(loc);
    if (shoot) await loc.screenshot({ path: `${outDir}/${key}-${cropName}.png` });
  }
  layout[key] = entry;
  console.log(`  pageH=${pageH} theme=${theme} full=${entry.full ? 'yes' : 'no'} strips=${entry.strips.length} boxes=${Object.keys(entry.boxes).join(',')}`);
};

/* The chrome, once. */
if (!ONLY || ONLY.includes('topbar')) {
  await go('/');
  const bar = page.locator('.b-topbar');
  const bb = await boxOf(bar);
  await bar.screenshot({ path: `${outDir}/topbar.png` });
  layout.topbar = { source: BASE, w: bb.w, h: bb.h };
  console.log('== topbar', bb);
}

/* Beat 7 — health: every customer by their own rhythm. */
await capture('customers', '/customers', {
  waitSel: '[data-testid="health-band-tiles"]',
  extra: 400,
  maxH: 1700,
  crops: {
    bands: '[data-testid="health-band-tiles"]',
    healthgrid: '.b-healthgrid',
    healthgridWrap: '.b-healthgrid-wrap',
    slipping: '[data-testid="slipping-list"]',
  },
});

/* Beat 8 — recovery: failed memberships, recoverable ones first. Client-fetched,
   so wait for the list itself, not networkidle. */
await capture('recovery', '/customers?view=recovery', {
  waitSel: '.cu-rec-list .cu-rec',
  extra: 400,
  crops: {
    summary: '.cu-rec-summary',
    list: '.cu-rec-list',
    first: { sel: '.cu-rec', nth: 0 },
  },
});

/* Beat 13 — staff: "Your team at the counter", no leaderboard. */
await capture('insights', '/insights', {
  extra: 300,
  crops: {
    staff: { sel: 'section.l4-section', text: 'Your team at the counter' },
    staffCard1: { sel: 'section.l4-section:has-text("Your team at the counter") .l4-card', nth: 0 },
    staffCard2: { sel: 'section.l4-section:has-text("Your team at the counter") .l4-card', nth: 1 },
  },
});

/* Beat 14 — peers: where you stand, as a rank. */
await capture('peers', '/insights/peers', {
  extra: 400,
  crops: {
    head: 'header.l4-head',
    scoreboard: { sel: 'section.l4-section', text: 'Scoreboard' },
    metrics: '.b-metrics',
    cohortTable: '[data-testid="cohort-table"]',
    gapCard1: { sel: 'article.l4-card', nth: 0 },
  },
});

/* Beat 18 — consent: you choose what UVALUX sees. */
await capture('datasharing', '/settings/data-sharing', {
  extra: 300,
  crops: {
    head: '.ds-head',
    tiers: '.ds-tiers',
    previewYou: { sel: '.ds-preview', nth: 0 },
    previewUvalux: { sel: '.ds-preview', nth: 1 },
    audit: '.ds-audit',
  },
});

/* Beat 21 — supply: low stock becomes a draft order. */
await capture('order', '/inventory/order', {
  extra: 300,
  crops: {
    head: 'header.l4-head',
    line1: { sel: '.l4-order-line', nth: 0 },
    total: '.l4-total-row',
    suggests: { sel: 'section.l4-section', text: 'Bask also suggests' },
  },
});

/* Beats 10, 11, 13 — the Front Desk Monitor. Captured LAST on purpose: the
   main session was mid-fix on this page when v8 started. */
await capture('monitor', '/monitor', {
  waitSel: '[data-testid="monitor-surface"], [data-testid="monitor-client"]',
  extra: 600,
  crops: {
    rail: '.b-monitor-rail',
    listener: '[data-testid="listener-status-card"]',
    pledge: '[data-testid="consent-pledge-card"]',
    conv1: { sel: '[data-testid="interaction-card"]', nth: 0 },
    mayaMethod: { sel: '[data-testid="monitor-insight-card"]', text: 'Maya' },
    insight1: { sel: '[data-testid="monitor-insight-card"]', nth: 0 },
    team: '[data-testid="employee-sales-table"]',
    teamCard: '.card:has([data-testid="employee-sales-table"])',
  },
});

fs.writeFileSync(layoutPath, JSON.stringify(layout, null, 2));
console.log('layout-v8.json written');
await browser.close();
