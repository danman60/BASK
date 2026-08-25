/**
 * Clipping regression check.
 *
 * TWO MEASUREMENTS, because the first one alone missed a bug six times:
 *
 *   1. PAGE overflow — body.scrollWidth vs clientWidth. Catches a layout wider
 *      than the viewport.
 *   2. CARD overflow — any element whose right edge passes its nearest card's
 *      content box. This is the one that matters and the one a page-level check
 *      CANNOT see: when a button overruns its card, the CARD clips it, so the
 *      page reports zero overflow while the user plainly sees text cut off at
 *      the side of the card.
 *
 * AND ACROSS A RANGE OF WIDTHS, because checking only 390px reported "all 17
 * routes clean" while the topbar was losing 236px at 768px and the insight
 * action row was losing 77px at 320px.
 *
 * Usage:
 *   node scripts/qa/mobile-clip-check.mjs                     # production
 *   BASE=http://localhost:3417 node scripts/qa/mobile-clip-check.mjs
 *   WIDTHS=360,768 ROUTES=/,/community node scripts/qa/...
 * Exit 1 if anything clips.
 */

import { chromium } from 'playwright';

const BASE = process.env.BASE || 'https://bask-psi.vercel.app';
const WIDTHS = (process.env.WIDTHS || '320,360,390,414,768,900,1024,1280,1440')
  .split(',')
  .map((n) => parseInt(n, 10));
const ROUTES = (
  process.env.ROUTES ||
  '/,/customers,/insights,/insights/peers,/monitor,/marketing,/inventory,/community,/settings/data-sharing'
).split(',');
const ROLE_ROUTES = ['/compass', '/compass/accounts', '/compass/coaching', '/compass/network'];

const browser = await chromium.launch();
const findings = [];

for (const route of [...ROUTES, ...ROLE_ROUTES]) {
  const q = route.startsWith('/compass') ? '?role=uvalux_rep' : '';
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({
      viewport: { width, height: 1000 },
      isMobile: width < 500,
      hasTouch: width < 500,
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
    let status = 0;
    try {
      const resp = await page.goto(BASE + route + q, { waitUntil: 'networkidle', timeout: 60000 });
      status = resp ? resp.status() : 0;
    } catch {
      findings.push({ route, width, kind: 'NAV_FAIL' });
      await ctx.close();
      continue;
    }
    await page.waitForTimeout(900);

    const m = await page.evaluate(() => {
      const pageClip = document.body.scrollWidth - document.body.clientWidth;

      // An element inside a card whose right edge passes the card's content box
      // is clipped by the card — invisible to any page-level measurement.
      const cards = Array.from(
        document.querySelectorAll('.card,[class*="b-opp"],[class*="b-insight"],[class*="cp-card"],[class*="b-post"],[class*="b-win"]'),
      );
      let worst = null;
      let count = 0;
      for (const card of cards) {
        const cs = getComputedStyle(card);
        if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') continue; // scrolls on purpose
        const cardRight =
          card.getBoundingClientRect().right -
          parseFloat(cs.paddingRight || '0') -
          parseFloat(cs.borderRightWidth || '0');
        for (const el of Array.from(card.querySelectorAll('*'))) {
          const r = el.getBoundingClientRect();
          if (!r.width) continue;
          // Skip anything sitting inside a scroll container BETWEEN it and the
          // card — a table in .b-etable-scroll is meant to overrun and scroll.
          // Checking only the card itself reported that as a 242px clip.
          let n = el.parentElement;
          let contained = false;
          while (n && n !== card.parentElement) {
            const ox = getComputedStyle(n).overflowX;
            if (ox === 'auto' || ox === 'scroll') { contained = true; break; }
            n = n.parentElement;
          }
          if (contained) continue;
          // SVG internals report sub-pixel geometry off a viewBox; 1–2px there
          // is rounding, not a clip. Anything a user can actually see is bigger.
          if (el instanceof SVGElement) continue;
          const over = r.right - cardRight;
          if (over > 2) {
            count++;
            if (!worst || over > worst.over) {
              worst = {
                cls: String(el.className || el.tagName).slice(0, 30),
                txt: (el.textContent || '').trim().slice(0, 30),
                over: Math.round(over),
              };
            }
          }
        }
      }
      return { pageClip, cardOverflow: count, worst };
    });

    if (status !== 200) findings.push({ route, width, kind: `HTTP ${status}` });
    if (m.pageClip > 0) findings.push({ route, width, kind: `PAGE +${m.pageClip}px` });
    if (m.cardOverflow > 0)
      findings.push({
        route,
        width,
        kind: `CARD +${m.worst.over}px`,
        detail: `${m.worst.cls} "${m.worst.txt}"`,
      });
    if (errors.length) findings.push({ route, width, kind: 'JS ERROR', detail: errors[0] });

    await ctx.close();
  }
}
await browser.close();

console.log(`${BASE} · ${ROUTES.length + ROLE_ROUTES.length} routes × ${WIDTHS.length} widths`);
if (findings.length === 0) {
  console.log('clean — no page overflow, no card overflow, no errors');
  process.exit(0);
}
for (const f of findings) {
  console.log(`  ${String(f.route).padEnd(24)} ${String(f.width).padEnd(6)} ${f.kind}${f.detail ? '  ' + f.detail : ''}`);
}
console.log(`\n${findings.length} finding(s)`);
process.exit(1);
