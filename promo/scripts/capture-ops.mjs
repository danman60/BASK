// capture-ops.mjs — the operational surfaces the film needed once the client
// asked for more of the salon's day: Check-in (search → the customer's card)
// and POS (tiles → a cart). Read-only: it searches and it clicks product tiles,
// which is client state. It never starts a session and never completes a sale.
import { createRequire } from 'module';
const requireG = createRequire('/home/danman60/.nvm/versions/node/v22.22.1/lib/node_modules/');
const { chromium } = requireG('playwright');
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = process.env.CAP_BASE;
if (!BASE) { console.error('CAP_BASE required'); process.exit(1); }
const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../public/textures');
const layoutPath = path.resolve(here, '../src/layout.json');
const layout = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
const HIDE = '#fw-btn,#fw-panel{display:none!important}';

const box = (el) => el.evaluate((e) => {
  const r = e.getBoundingClientRect();
  return { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
});

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const shoot = async (name) => {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
  const pageH = await page.evaluate(() => document.documentElement.scrollHeight);
  layout.pages[name] = { pageH, cutouts: {} };
  console.log(`  ${name}.png pageH=${pageH}`);
};
const cut = async (pageKey, name, selector, index = 0) => {
  const el = page.locator(selector).nth(index);
  if (await el.count() === 0) { console.log(`  MISS ${name} (${selector})`); return; }
  const bb = await box(el);
  await el.screenshot({ path: `${outDir}/${name}.png` });
  layout.pages[pageKey].cutouts[name] = bb;
  console.log(`  ${name}.png`, JSON.stringify(bb));
};

// ---------- Check-in ----------
await page.goto(`${BASE}/floor`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);
await page.addStyleTag({ content: HIDE });
await page.getByText('Check-in', { exact: true }).first().click();
await page.waitForTimeout(900);
console.log('checkin (empty)');
await shoot('checkin-empty');

const search = page.locator('.floor-search input, .floor-field input').first();
await search.click();
await search.type('Rosalind', { delay: 90 });
await page.waitForTimeout(1400);
console.log('checkin (searched)');
await shoot('checkin-search');
await cut('checkin-search', 'checkin-results', '.floor-results');

const firstResult = page.locator('.floor-results li, .floor-results button').first();
if (await firstResult.count()) {
  await firstResult.click();
  await page.waitForTimeout(1500);
  console.log('checkin (customer)');
  await shoot('checkin-card');
  await cut('checkin-card', 'checkin-panel', '.panel');
}

// ---------- POS ----------
await page.getByText('POS', { exact: true }).first().click();
await page.waitForTimeout(1000);
console.log('pos (empty)');
await shoot('pos-empty');
const tiles = page.locator('.pos-tile');
const n = await tiles.count();
console.log('  pos tiles:', n);
for (let i = 1; i < Math.min(n, 4); i++) {
  await tiles.nth(i).click();
  await page.waitForTimeout(500);
}
await page.waitForTimeout(900);
console.log('pos (cart)');
await shoot('pos-cart');
await cut('pos-cart', 'pos-grid', '.pos-grid');
for (let i = 0; i < Math.min(n, 6); i++) await cut('pos-cart', `postile${i + 1}`, '.pos-tile', i);
await cut('pos-cart', 'pos-panel', '.panel');

fs.writeFileSync(layoutPath, JSON.stringify(layout, null, 1));
console.log('layout.json updated');
await browser.close();
