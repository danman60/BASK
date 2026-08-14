// capture.mjs — Phase 4 asset capture for the Bask promo (video-shotcraft).
// Pattern from the skill's assets/scripts/capture-template.mjs, ported to Playwright.
//
// Target MUST be passed explicitly (CAP_BASE). Never a default — a capture run
// that silently points somewhere is how a test ends up writing to production.
// For this project the target is the public pitch demo:
//   CAP_BASE=https://bask-psi.vercel.app node scripts/capture.mjs
//
// Produces into ../public/textures/: full-page @2x textures, element cutouts,
// a handful of @4x hero crops (Q2 sharpness chain), and layout.json (page-space
// bboxes so Remotion overlays share the page coordinate system).
//
// Writes to the demo: exactly one — GEN_CAMPAIGN=1 walks the pitch's own
// Beat 1 (Create a Tuesday promo → Generate the campaign) because the Studio
// review screen does not rehydrate from an existing campaign row. Off by default.
import { createRequire } from 'module';
const requireG = createRequire('/home/danman60/.nvm/versions/node/v22.22.1/lib/node_modules/');
const { chromium } = requireG('playwright');
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = process.env.CAP_BASE;
if (!BASE) { console.error('CAP_BASE required (no default — never point a capture at an unnamed host)'); process.exit(1); }
const GEN = process.env.GEN_CAMPAIGN === '1';
console.log('capture target:', BASE, '| generate campaign:', GEN);

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../public/textures');
fs.mkdirSync(outDir, { recursive: true });

const layout = { pageW: 1920, pages: {} };

const settle = async (page, extra = 0) => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900 + extra);
};

const boxOf = (el) =>
  el.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { x: Math.round(r.x + window.scrollX), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
  });

// Chrome's lightbulb guidance FAB and any toast are product chrome that would
// read as a bug hovering in a promo frame. Hidden for capture only.
const HIDE_CSS = `
  #fw-btn, #fw-panel, [class*="guidance-fab"], [data-testid="guidance-fab"], .g-fab, .cp-toast { display: none !important; }
`;

const shoot = async (page, name, opts = {}) => {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: opts.fullPage !== false });
  const pageH = await page.evaluate(() => document.documentElement.scrollHeight);
  layout.pages[name] = { pageH, cutouts: {} };
  console.log(`  ${name}.png  pageH=${pageH}`);
  return pageH;
};

const cut = async (page, pageKey, name, selector, index = 0) => {
  const el = page.locator(selector).nth(index);
  if (await el.count() === 0) { console.log(`  MISS ${name} (${selector})`); return null; }
  const bb = await boxOf(el);
  await el.screenshot({ path: `${outDir}/${name}.png` });
  if (layout.pages[pageKey]) layout.pages[pageKey].cutouts[name] = bb;
  console.log(`  ${name}.png`, JSON.stringify(bb));
  return bb;
};

const browser = await chromium.launch();

const newCtx = async (scale) => {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
  await ctx.addInitScript(() => { window.__promoCapture = true; });
  return ctx;
};

// ───────────────────────────────────────────────────────── pass 1: @2x pages
{
  const ctx = await newCtx(2);
  const page = await ctx.newPage();
  await page.addStyleTag; // noop guard for older versions

  // ---- Today / Daybreak ----
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await settle(page);
  await page.addStyleTag({ content: HIDE_CSS });
  console.log('today');
  await shoot(page, 'today-full');
  await cut(page, 'today-full', 'letter', '.b-daybreak');
  for (let i = 0; i < 5; i++) await cut(page, 'today-full', `insight${i + 1}`, '.b-insight', i);
  await cut(page, 'today-full', 'rail-pulse', '.b-rail-card', 0);
  await cut(page, 'today-full', 'rail-next', '[data-testid="next-up"]');
  await cut(page, 'today-full', 'story-tile', '.b-story');
  // empty backplate: the queue slots with the cards hidden, so a card can fly in
  await page.evaluate(() => document.querySelectorAll('.b-insight').forEach((el) => { el.style.visibility = 'hidden'; }));
  await page.waitForTimeout(200);
  await shoot(page, 'today-empty');
  await page.evaluate(() => document.querySelectorAll('.b-insight').forEach((el) => { el.style.visibility = ''; }));

  // ---- The Floor, with one room put into its in-session state ----
  // The live clock has every bed Ready/Cleaning, so the product's signature
  // .in-session-ring never appears. Rather than start a real session (a write
  // that would leave a bed running for the real pitch), we render the product's
  // OWN running-room markup — same component classes, same CSS, same pixels.
  await page.goto(`${BASE}/floor`, { waitUntil: 'networkidle' });
  await settle(page);
  await page.addStyleTag({ content: HIDE_CSS });
  console.log('floor');
  await shoot(page, 'floor-ready');   // untouched board, for reference
  await page.evaluate(() => {
    const slots = document.querySelectorAll('.room-slot');
    const target = slots[1];               // KBL 6800 Alpha Pearl
    if (!target) return;
    const room = target.querySelector('.room');
    if (!room) return;
    const ring = document.createElement('div');
    ring.className = 'in-session-ring';
    room.replaceWith(ring);
    ring.appendChild(room);
    const state = room.querySelector('.state');
    state.innerHTML = '<span class="countdown num">08:12</span><span class="mins">left</span>';
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = 'Rosalind';
    state.after(who);
    // freeze the shimmer at a stable phase so the texture is deterministic
    ring.style.animation = 'none';
    ring.style.backgroundPosition = '35% 50%';
  });
  await page.waitForTimeout(400);
  await shoot(page, 'floor-full');
  const slotCount = await page.locator('.room-slot').count();
  for (let i = 0; i < Math.min(slotCount, 8); i++) await cut(page, 'floor-full', `room${i + 1}`, '.room-slot', i);
  await cut(page, 'floor-full', 'floor-grid', '.floor-grid');

  // ---- Inventory (overview) ----
  await page.goto(`${BASE}/inventory`, { waitUntil: 'networkidle' });
  await settle(page);
  await page.addStyleTag({ content: HIDE_CSS });
  console.log('inventory');
  await shoot(page, 'inventory-full');

  // ---- Inventory → the UVALUX draft order ----
  await page.goto(`${BASE}/inventory/order`, { waitUntil: 'networkidle' });
  await settle(page);
  await page.addStyleTag({ content: HIDE_CSS });
  console.log('order');
  await shoot(page, 'order-full');
  const lines = await page.locator('.l4-order-line').count();
  for (let i = 0; i < Math.min(lines, 6); i++) await cut(page, 'order-full', `orderline${i + 1}`, '.l4-order-line', i);
  const cards = await page.locator('.l4-card').count();
  for (let i = 0; i < Math.min(cards, 4); i++) await cut(page, 'order-full', `ordercard${i + 1}`, '.l4-card', i);

  // ---- Consent ----
  await page.goto(`${BASE}/settings/data-sharing`, { waitUntil: 'networkidle' });
  await settle(page);
  await page.addStyleTag({ content: HIDE_CSS });
  console.log('consent');
  await shoot(page, 'consent-full');
  await cut(page, 'consent-full', 'consent-tiers', '.ds-tiers');
  await cut(page, 'consent-full', 'consent-you', '.ds-preview', 0);
  await cut(page, 'consent-full', 'consent-uvalux', '.ds-preview', 1);

  // ---- Compass ----
  await page.goto(`${BASE}/compass`, { waitUntil: 'networkidle' });
  await settle(page, 600);
  await page.addStyleTag({ content: HIDE_CSS });
  console.log('compass');
  await shoot(page, 'compass-full');
  await cut(page, 'compass-full', 'compass-head', '.cp-head');
  for (let i = 0; i < 3; i++) await cut(page, 'compass-full', `callcard${i + 1}`, '.cp-call', i);
  for (let i = 0; i < 3; i++) await cut(page, 'compass-full', `ctile${i + 1}`, '.cp-call:first-of-type .cp-ev-item', i);
  // the call card with its evidence tiles hidden — tiles fly in and embed
  await page.evaluate(() => {
    const c = document.querySelector('.cp-call');
    if (c) c.querySelectorAll('.cp-ev-item').forEach((el) => { el.style.visibility = 'hidden'; });
  });
  await page.waitForTimeout(200);
  await shoot(page, 'compass-empty');

  await ctx.close();
}

// ────────────────────────────────────────── pass 2: the generated campaign
if (GEN) {
  const ctx = await newCtx(2);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await settle(page);
  await page.getByText('Create a Tuesday promo').first().click();
  await page.waitForTimeout(3500);
  await page.addStyleTag({ content: HIDE_CSS });
  console.log('studio (offer step)');
  await shoot(page, 'studio-offer');
  await page.getByText('Generate the campaign').first().click();
  // generation runs server-side (AI or the deterministic fallback) — give it room
  await page.waitForTimeout(20000);
  await page.addStyleTag({ content: HIDE_CSS });
  console.log('studio (review step)');
  await shoot(page, 'studio-review');
  const t = await page.evaluate(() => document.body.innerText.slice(0, 400));
  console.log('  review text:', t.replace(/\n+/g, ' | ').slice(0, 300));
  await cut(page, 'studio-review', 'studio-banner', '[class*="context"], .b-ctx, .card', 0);
  await ctx.close();
}

// ────────────────────────────────────────── pass 3: @4x hero crops (Q2 chain)
{
  const ctx = await newCtx(4);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await settle(page);
  await page.addStyleTag({ content: HIDE_CSS });
  console.log('4x crops');
  await page.locator('.b-daybreak').first().screenshot({ path: `${outDir}/letter-4x.png` });
  const n = await page.locator('.b-insight').count();
  for (let i = 0; i < Math.min(n, 5); i++) {
    await page.locator('.b-insight').nth(i).screenshot({ path: `${outDir}/insight${i + 1}-4x.png` });
  }
  console.log(`  letter-4x + ${Math.min(n, 5)} insight 4x`);

  await page.goto(`${BASE}/compass`, { waitUntil: 'networkidle' });
  await settle(page, 600);
  await page.addStyleTag({ content: HIDE_CSS });
  await page.locator('.cp-call').first().screenshot({ path: `${outDir}/callcard1-4x.png` });
  for (let i = 0; i < 3; i++) {
    await page.locator('.cp-call').first().locator('.cp-ev-item').nth(i)
      .screenshot({ path: `${outDir}/ctile${i + 1}-4x.png` });
  }
  console.log('  callcard1-4x + 3 evidence tiles 4x');

  await ctx.close();
}

fs.writeFileSync(path.resolve(here, '../src/layout.json'), JSON.stringify(layout, null, 1));
console.log('wrote src/layout.json');
await browser.close();
