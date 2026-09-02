// capture-v5-mobile.mjs — the phone captures for the v5 opening.
//
// The film now opens by saying, plainly, that Bask is an APP a salon owner
// opens. That only reads if the picture is a phone, so these are shot at a
// phone viewport rather than cropped down from the desktop textures.
//
//   CAP_BASE=https://bask-psi.vercel.app node scripts/capture-v5-mobile.mjs
//
// Read-only: navigates, scrolls, screenshots. Nothing is clicked that mutates.
import { createRequire } from 'module';
const requireG = createRequire('/home/danman60/.nvm/versions/node/v22.22.1/lib/node_modules/');
const { chromium } = requireG('playwright');
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = process.env.CAP_BASE;
if (!BASE) { console.error('CAP_BASE required (no default)'); process.exit(1); }
const DSF = Number(process.env.DSF || 3);
console.log('mobile capture:', BASE, '| dsf:', DSF);

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../public/textures/v5');
fs.mkdirSync(outDir, { recursive: true });

const layoutPath = path.resolve(here, '../src/layout-v5.json');
const layout = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));

const HIDE_CSS = `
  #fw-btn, #fw-panel, [class*="guidance-fab"], [data-testid="guidance-fab"], .g-fab, .cp-toast { display: none !important; }
  * { scroll-behavior: auto !important; }
`;

const PHONE = { width: 390, height: 844 };

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: PHONE,
  deviceScaleFactor: DSF,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
const page = await ctx.newPage();

const shoot = async (name, route, opts = {}) => {
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: HIDE_CSS });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1400);
  if (opts.scrollTo) await page.evaluate((y) => window.scrollTo(0, y), opts.scrollTo);
  await page.waitForTimeout(600);
  const clipH = Math.min(opts.h ?? PHONE.height, PHONE.height);
  await page.screenshot({ path: `${outDir}/${name}.png`, clip: { x: 0, y: 0, width: PHONE.width, height: clipH } });
  layout.cutouts[name] = { x: 0, y: opts.scrollTo ?? 0, w: PHONE.width, h: clipH };
  console.log(`  ${name}.png  ${PHONE.width}x${clipH} @${DSF}x`);
};

// The screen a salon owner actually opens: the morning brief, then the list of
// things to do about it.
await shoot('phone-today', '/');
await shoot('phone-feed', '/', { scrollTo: 430 });
await shoot('phone-feed2', '/', { scrollTo: 980 });

fs.writeFileSync(layoutPath, JSON.stringify(layout, null, 2));
console.log('layout-v5.json updated:', Object.keys(layout.cutouts).length, 'cutouts');
await browser.close();
