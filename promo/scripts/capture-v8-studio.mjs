// capture-v8-studio.mjs — the INSTANT ACTION beat (2:06): the app writing the
// text, the email and the Instagram post, the list it goes to, and the button.
//
// Same conventions as capture-v8.mjs: 1600px wide, deviceScaleFactor 2, the
// AppShell topbar hidden on page captures, full-page PNG + element CROPS, boxes
// merged into layout-v8.json in page-space CSS px (texture px = x2). Modal
// sheets on Today are fixed overlays, so those are viewport captures and their
// boxes are viewport-space (noted per entry as `space`).
//
//   CAP_BASE=http://localhost:3517 node promo/scripts/capture-v8-studio.mjs
//   CAP_BASE=... ONLY=studio node ...      # studio | today
//
// UNLIKE capture-v8.mjs this one WRITES ONE ROW: pressing "Generate the
// campaign" calls the live AI and persists a DRAFT bask.campaign row (that is
// how the Studio works — see marketing.generate). The id is printed and stored
// in layout-v8.json (studio.createdCampaignId) so it can be removed.
// It NEVER presses "Schedule campaign" (marketing.schedule: draft->scheduled,
// writes activity_event, marks the insight actioned). The Today sheet confirms
// ("Create posts", "Approve & send") are pressed: they are client-only state
// (OpportunityFeed `done` -> setConfirmed), no request, no row, no message.
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
const VH = 1000;
console.log('v8 studio capture target:', BASE, '| only:', ONLY ?? 'all');

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../public/textures/v8');
const layoutPath = path.resolve(here, '../src/layout-v8.json');
fs.mkdirSync(outDir, { recursive: true });
const layout = fs.existsSync(layoutPath) ? JSON.parse(fs.readFileSync(layoutPath, 'utf8')) : {};

const HIDE_CSS = `
  #fw-btn, #fw-panel, [class*="guidance-fab"], [data-testid="guidance-fab"], .g-fab, .cp-toast, nextjs-portal { display: none !important; }
  * { scroll-behavior: auto !important; caret-color: transparent !important; }
  *, *::before, *::after { animation-play-state: paused !important; transition: none !important; }
`;
const NO_BAR = `.b-topbar { visibility: hidden !important; }`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: VH }, deviceScaleFactor: DSF });
await ctx.addInitScript(() => { window.__promoCapture = true; });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('  PAGEERROR', e.message));

const settle = async (extra = 0) => {
  await page.addStyleTag({ content: HIDE_CSS });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900 + extra);
};
const go = async (route, waitSel) => {
  await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 180000 });
  if (waitSel) await page.waitForSelector(waitSel, { timeout: 90000 });
  await settle();
};
const boxOf = (loc, space = 'page') => loc.evaluate((e, sp) => {
  const r = e.getBoundingClientRect();
  const sx = sp === 'page' ? window.scrollX : 0;
  const sy = sp === 'page' ? window.scrollY : 0;
  return { x: Math.round(r.x + sx), y: Math.round(r.y + sy), w: Math.round(r.width), h: Math.round(r.height) };
}, space);

/** One state: a full-page (or viewport) PNG plus crops, recorded under layout[key]. */
const shoot = async (key, { crops = {}, space = 'page', hover, note } = {}) => {
  await page.addStyleTag({ content: NO_BAR });
  await page.evaluate(() => window.scrollTo(0, 0));
  if (hover) { await page.locator(hover).first().hover(); }
  await page.waitForTimeout(250);
  const pageH = await page.evaluate(() => document.documentElement.scrollHeight);
  const entry = { route: page.url().replace(BASE, ''), source: BASE, space, note: note ?? null, capturedAt: new Date().toISOString(), pageH, w: W, full: null, boxes: {} };
  const name = `${key}-full`;
  if (space === 'page') await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
  else await page.screenshot({ path: `${outDir}/${name}.png` });
  entry.full = { name, h: space === 'page' ? pageH : VH };
  for (const [cropName, spec] of Object.entries(crops)) {
    const { sel, text, nth = 0, shoot: doShoot = true } = typeof spec === 'string' ? { sel: spec } : spec;
    let loc = page.locator(sel);
    if (text) loc = loc.filter({ hasText: text });
    loc = loc.nth(nth);
    if (await loc.count() === 0) { console.log(`  MISS ${cropName} (${sel}${text ? ` ~ "${text}"` : ''})`); continue; }
    entry.boxes[cropName] = await boxOf(loc, space);
    if (doShoot) await loc.screenshot({ path: `${outDir}/${key}-${cropName}.png` });
  }
  layout[key] = entry;
  console.log(`== ${key} pageH=${pageH} boxes=${Object.keys(entry.boxes).join(',')}`);
  return entry;
};

/* ---------------- Studio: insight -> audience -> offer -> generate -> review ---------------- */
if (!ONLY || ONLY.includes('studio')) {
  await go('/marketing', '.st-idea');
  await page.locator('.st-idea', { hasText: 'Retail attachment is slipping' }).getByRole('button', { name: 'Build this' }).click();
  await page.waitForSelector('#offer-headline', { timeout: 90000 });
  await settle(400);
  const insightRoute = page.url().replace(BASE, '');

  // The audience step (the list + its count). Entering from an insight lands on
  // Offer; the step bar lets you step back.
  await page.locator('.st-step', { hasText: 'Audience' }).click();
  await page.waitForSelector('.st-seg-list .st-seg', { timeout: 60000 });
  // The retail insight pre-selects Instagram + Facebook + Email only. The beat is
  // "a text to a list", so the owner adds Text message here — a real click on
  // the real channel chip, the same thing a person would do.
  const sms = page.locator('.st-channel', { hasText: 'Text message' });
  if (!(await sms.getAttribute('class')).includes('is-selected')) await sms.click();
  await settle(300);
  await shoot('studioAudience', {
    crops: {
      context: '.st-context',
      segList: '.st-seg-list',
      segSelected: '.st-seg.is-selected',
      channels: '.st-channels',
      reaching: '.st-side .card',
      next: { sel: '.st-actions .btn-primary', shoot: false },
    },
  });

  await page.locator('.st-actions .btn-primary').click(); // "Next — set the offer" (no request)
  await page.waitForSelector('#offer-headline', { timeout: 60000 });
  await settle(600);
  await shoot('studioOffer', {
    crops: {
      context: '.st-context',
      setup: '.st-setup > .card',
      side: '.st-side .card',
      generate: { sel: '.st-actions .btn-primary', shoot: false },
    },
  });

  // Generate: live AI + one DRAFT campaign row.
  const genResp = page.waitForResponse((r) => r.url().includes('marketing.generate'), { timeout: 240000 });
  await page.locator('.st-actions .btn-primary').click();
  const resp = await genResp;
  let createdCampaignId = null;
  try {
    const j = await resp.json();
    const r = Array.isArray(j) ? j[0] : j;
    const data = r?.result?.data?.json ?? r?.result?.data;
    createdCampaignId = data?.campaignId ?? null;
    console.log('  generate ->', resp.status(), 'campaignId', createdCampaignId, 'generation', JSON.stringify(data?.generation));
  } catch (e) { console.log('  generate response unparsed', resp.status(), e.message); }
  await page.waitForSelector('.st-grid .st-out', { timeout: 120000 });
  await settle(800);

  const review = await shoot('studioReview', {
    hover: '.st-side .btn-primary.st-cta',
    note: 'Schedule button HOVERED, never pressed.',
    crops: {
      context: '.st-context',
      tones: '.st-tones',
      instagram: { sel: '.st-grid > article.st-out', nth: 0 },
      igCanvas: '.st-canvas',
      sms: { sel: '.st-col > article.st-out', nth: 0 },
      smsBubble: '.st-sms-body',
      email: { sel: '.st-col > article.st-out', nth: 1 },
      audience: { sel: '.st-side > .card', nth: 0 },
      schedule: { sel: '.st-side > .card', nth: 1 },
      side: '.st-side',
      scheduleBtn: '.st-side .btn-primary.st-cta',
      previewBtn: { sel: '.st-side .btn-quiet.st-cta', shoot: false },
    },
  });
  review.insightRoute = insightRoute;
  review.createdCampaignId = createdCampaignId;
  review.provenance = await page.locator('.st-side .st-note').allInnerTexts();

  // Phone preview: Instagram / Text / Email as they land.
  await page.locator('.st-side .btn-quiet.st-cta').click();
  await page.waitForSelector('.st-phone', { timeout: 30000 });
  for (const [tab, key] of [['Instagram', 'studioPhoneIg'], ['Text', 'studioPhoneSms'], ['Email', 'studioPhoneEmail']]) {
    await page.locator('.st-phone-tab', { hasText: tab }).click();
    await settle(200);
    await shoot(key, {
      hover: '.st-phone-wrap .st-actions .btn-primary',
      note: 'Schedule button HOVERED, never pressed.',
      crops: {
        phone: '.st-phone',
        tabs: '.st-phone-tabs',
        panel: '.st-phone-wrap > div:nth-child(2) > .card',
        scheduleBtn: '.st-phone-wrap .st-actions .btn-primary',
      },
    });
  }
  layout.studioReview = review;
}

/* ---------------- Today: the one-click action sheets (fixtures, no DB, no AI) ---------------- */
if (!ONLY || ONLY.includes('today')) {
  const openSheet = async (oppTitle, label) => {
    await go('/', '[data-testid="opportunity-feed-wrap"]');
    const btns = page.locator('[data-testid="opportunity-feed-wrap"] button', { hasText: label });
    const n = await btns.count();
    let clicked = false;
    for (let i = 0; i < n; i += 1) {
      const b = btns.nth(i);
      const card = b.locator('xpath=ancestor::*[contains(@class,"card") or self::article][1]');
      const t = (await card.count()) ? await card.innerText() : '';
      if (!oppTitle || t.includes(oppTitle)) { await b.scrollIntoViewIfNeeded(); await b.click(); clicked = true; break; }
    }
    if (!clicked) { console.log(`  MISS opp button ${label} in ${oppTitle}`); return false; }
    await page.waitForSelector('[data-testid="action-sheet"]', { timeout: 30000 });
    await settle(500);
    return true;
  };

  if (await openSheet(null, 'Approve & post to Facebook and Instagram')) {
    await shoot('todaySocialIg', {
      space: 'viewport',
      hover: '[data-testid="social-create"]',
      crops: { sheet: '.b-postsheet-body', card: '[data-testid="social-post-card"]', preview: '.b-social-preview', create: '[data-testid="social-create"]' },
    });
    await page.locator('.b-social-tab', { hasText: 'Facebook' }).click();
    await settle(200);
    await shoot('todaySocialFb', {
      space: 'viewport',
      crops: { card: '[data-testid="social-post-card"]', preview: '.b-social-preview' },
    });
    // Client-only confirm: closes the sheet and shows the honest toast.
    await page.locator('[data-testid="social-create"]').click();
    await page.waitForSelector('[data-testid="opportunity-confirm"]', { timeout: 10000 });
    // HIDE_CSS pauses every animation, which freezes the toast at its fade-in
    // start (opacity 0). Let the toast's own entrance finish.
    await page.addStyleTag({ content: '[data-testid="opportunity-confirm"], [data-testid="opportunity-confirm"] * { animation-play-state: running !important; }' });
    await page.waitForTimeout(1200);
    await shoot('todaySocialDone', { space: 'viewport', crops: { toast: '[data-testid="opportunity-confirm"]' } });
  }

  if (await openSheet(null, 'Approve & text 17 customers')) {
    await shoot('todaySms', {
      space: 'viewport',
      hover: '[data-testid="sms-approve"]',
      crops: { sheet: '.b-postsheet-body', approve: '[data-testid="sms-approve"]' },
    });
    await page.locator('[data-testid="sms-approve"]').click();
    await page.waitForSelector('[data-testid="opportunity-confirm"]', { timeout: 10000 });
    // HIDE_CSS pauses every animation, which freezes the toast at its fade-in
    // start (opacity 0). Let the toast's own entrance finish.
    await page.addStyleTag({ content: '[data-testid="opportunity-confirm"], [data-testid="opportunity-confirm"] * { animation-play-state: running !important; }' });
    await page.waitForTimeout(1200);
    await shoot('todaySmsDone', { space: 'viewport', crops: { toast: '[data-testid="opportunity-confirm"]' } });
  }

  if (await openSheet(null, 'Approve & email 17 customers')) {
    await shoot('todayEmail', {
      space: 'viewport',
      hover: '.b-postsheet-body .b-approve',
      crops: { sheet: '.b-postsheet-body', send: '.b-postsheet-body .b-approve' },
    });
  }
}

fs.writeFileSync(layoutPath, JSON.stringify(layout, null, 2));
console.log('layout-v8.json written');
await browser.close();
