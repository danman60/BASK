// capture-film.mjs — screen beats for "The Quietest Register" (docs/pitch/2026-08-28-film-shot-plan.md).
//
// Two sources, both read-only:
//   1. the finished insight report, opened as a local file (no server, no network)
//   2. the live /evidence page, whose host MUST be passed as CAP_BASE — no default,
//      because a capture run that silently picks a host is how something writes to prod.
// This script never clicks anything that mutates state; it scrolls, expands <details>,
// and screenshots.
//
//   CAP_BASE=http://localhost:3417 node scripts/capture-film.mjs
import { createRequire } from 'module';
const requireG = createRequire('/home/danman60/.nvm/versions/node/v22.22.1/lib/node_modules/');
const { chromium } = requireG('playwright');
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = process.env.CAP_BASE;
if (!BASE) { console.error('CAP_BASE required (no default)'); process.exit(1); }

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const outDir = path.resolve(here, '../public/textures/film');
fs.mkdirSync(outDir, { recursive: true });
const REPORT = 'file://' + path.join(repo, 'docs/pitch/2026-08-27-insights-final.html');

console.log('report :', REPORT);
console.log('live   :', BASE, '(read-only)');

const layout = { pageW: 1920, shots: {}, pages: {} };

/* Page-space CSS boxes for the 2.5D camera. PageCam flies to a (cx, cy) in page
   coordinates, so a texture without its geometry is just a picture — these are
   what make the report a place the camera can move through. */
const measure = async (page, name, targets) => {
  const box = await page.evaluate((spec) => {
    const out = { pageH: document.body.scrollHeight, boxes: {} };
    for (const [key, sel] of Object.entries(spec)) {
      let el = null;
      if (sel.startsWith('text:')) {
        const needle = sel.slice(5).toLowerCase();
        el = Array.from(document.querySelectorAll('section,article,div,h2,h3,p,li'))
          .find((n) => (n.textContent || '').toLowerCase().includes(needle)
            && (n.textContent || '').length < 3000);
      } else {
        el = document.querySelector(sel);
      }
      if (!el) continue;
      const r = el.getBoundingClientRect();
      out.boxes[key] = {
        x: Math.round(r.x + window.scrollX),
        y: Math.round(r.y + window.scrollY),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    }
    return out;
  }, targets);
  layout.pages[name] = box;
  const missing = Object.keys(targets).filter((k) => !box.boxes[k]);
  console.log(`  measured ${name}: pageH=${box.pageH}, ${Object.keys(box.boxes).length}/${Object.keys(targets).length} boxes`
    + (missing.length ? ` MISSING: ${missing.join(', ')}` : ''));
};
const settle = async (page, extra = 0) => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700 + extra);
};

const shoot = async (page, id, opts = {}) => {
  const file = path.join(outDir, `${id}.png`);
  await page.screenshot({ path: file, fullPage: !!opts.fullPage, clip: opts.clip });
  const { size } = fs.statSync(file);
  console.log(`  ${id}.png  ${(size / 1024).toFixed(0)}KB`);
  return file;
};

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  // ---- SCREEN-A: the report, and one "Show me the numbers" block opened -----
  await page.goto(REPORT, { waitUntil: 'networkidle' });
  await settle(page, 400);
  await shoot(page, 'screenA-report-top');

  const fullH = await page.evaluate(() => document.body.scrollHeight);
  layout.shots.screenA = { fullHeight: fullH };
  await shoot(page, 'screenA-report-full', { fullPage: true });

  await measure(page, 'report', {
    masthead: 'text:What your registers have been trying to tell you',
    headlineStats: 'text:194,672',
    sachet: 'text:The $9 sachet is not a sample',
    sachetEvidence: 'text:First lotion purchase per customer',
    escalator: 'text:The first renewal is the only hard one',
    cliff: 'text:When a month runs out you have fourteen days',
    killed: 'text:Things we checked so you don',
    provenance: 'text:Nothing here was estimated',
  });

  // Finding No 2 (the sachet) carries the tightest evidence block — open it.
  const opened = await page.evaluate(() => {
    const ds = Array.from(document.querySelectorAll('details'));
    const t = ds.find((d) => /packette|sachet|\$9 sachet/i.test(d.closest('section,article,div')?.textContent || ''));
    const target = t || ds[1] || ds[0];
    if (!target) return null;
    target.open = true;
    target.scrollIntoView({ block: 'center' });
    return target.textContent.slice(0, 80);
  });
  console.log('  opened evidence block:', opened ? JSON.stringify(opened.trim().slice(0, 60)) : 'NONE FOUND');
  await settle(page, 500);
  await shoot(page, 'screenA-evidence-open');

  /* Section textures, not whole-page ones. The report is 14,511 CSS px tall, so a
     2x full-page capture is ~29,000 px — past what Chrome will decode, and the
     Remotion render dies with "The source image cannot be decoded" on every
     frame that touches it. Each section is a clipped strip with its page-space
     top recorded, so the camera works in section coordinates. */
  const section = async (page, name, top, height) => {
    const h = Math.min(height, 3000);
    await shoot(page, name, { fullPage: true, clip: { x: 0, y: top, width: 1920, height: h } });
    layout.shots[name] = { top, height: h };
  };
  await section(page, 'sec-report-head', 40, 1400);
  await section(page, 'sec-report-killed', 11400, 1200);
  await section(page, 'sec-report-provenance', 14000, 511);

  /* A second texture with every evidence block open, measured in its own
     coordinate space. Opening the <details> moves everything below them, so the
     closed-page boxes do not describe this image and the camera would fly to the
     wrong place. Two geometries, never mixed. */
  await page.evaluate(() => {
    document.querySelectorAll('details').forEach((d) => { d.open = true; });
    window.scrollTo(0, 0);
  });
  await settle(page, 700);
  await measure(page, 'reportOpen', {
    headlineStats: 'text:194,672',
    sachet: 'text:The $9 sachet is not a sample',
    sachetEvidence: 'text:First lotion purchase per customer',
    escalator: 'text:The first renewal is the only hard one',
    cliff: 'text:When a month runs out you have fourteen days',
    killed: 'text:Things we checked so you don',
    provenance: 'text:Nothing here was estimated',
  });
  // The sachet finding with its evidence block open, as its own strip.
  {
    const b = layout.pages.reportOpen.boxes.sachet;
    if (b) await section(page, 'sec-sachet-open', Math.max(0, b.y - 80), b.h + 220);
  }
  await page.evaluate(() => {
    document.querySelectorAll('details').forEach((d) => { d.open = false; });
  });
  await settle(page, 300);

  // ---- SCREEN-B: the renewal escalator (finding No 9) ----------------------
  const escalator = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('section,article,div'));
    const n = nodes.find((e) => /first renewal is the only hard one/i.test(e.textContent || '') && e.textContent.length < 4000);
    if (!n) return null;
    n.scrollIntoView({ block: 'center' });
    const r = n.getBoundingClientRect();
    return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, 1920), height: Math.min(r.height, 1080) };
  });
  await settle(page, 300);
  if (escalator && escalator.height > 40) {
    await shoot(page, 'screenB-escalator', { clip: escalator });
    layout.shots.screenB = escalator;
  } else {
    console.log('  escalator section not isolated — full viewport instead');
    await shoot(page, 'screenB-escalator');
  }

  // ---- SCREEN-D source a: the report footer / provenance -------------------
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await settle(page, 400);
  await shoot(page, 'screenD-provenance');

  // ---- SCREEN-C: the live evidence page ------------------------------------
  try {
    await page.goto(`${BASE}/evidence`, { waitUntil: 'networkidle', timeout: 45000 });
    await settle(page, 900);
    await shoot(page, 'screenC-evidence-top');
    await shoot(page, 'screenC-evidence-full', { fullPage: true });
    await measure(page, 'evidence', {
      statRow: '.ev-stat',
      yearBars: '.ev-bars',
      firstYear: '.ev-year',
      brandBars: '.ev-brand',
      brandTop: '.ev-brand-name',
      barRows: '.ev-bar-row',
    });
    await page.evaluate(() => window.scrollBy(0, 900));
    await settle(page, 500);
    await shoot(page, 'screenC-evidence-mid');
  } catch (e) {
    console.log('  live capture failed:', e.message);
  }

  fs.writeFileSync(path.join(outDir, 'layout.json'), JSON.stringify(layout, null, 2));
  await browser.close();
  console.log('done ->', outDir);
};

run().catch((e) => { console.error(e); process.exit(1); });
