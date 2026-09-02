// recon-v5.mjs — read-only structure dump for the v5 shotcraft cut.
// Prints candidate element selectors + text for the surfaces the current film
// never shows (/evidence, /ask, the insight drill-down) so capture-v5 can frame
// elements instead of whole pages.
//
//   CAP_BASE=https://bask-psi.vercel.app node scripts/recon-v5.mjs
import { createRequire } from 'module';
const requireG = createRequire('/home/danman60/.nvm/versions/node/v22.22.1/lib/node_modules/');
const { chromium } = requireG('playwright');

const BASE = process.env.CAP_BASE;
if (!BASE) { console.error('CAP_BASE required (no default)'); process.exit(1); }
console.log('recon target:', BASE, '(read-only)');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

const dump = async (route) => {
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  const rows = await page.evaluate(() => {
    const out = [];
    const seen = new Set();
    document.querySelectorAll('section, article, [class*="card"], [class*="Card"], h1, h2, h3, [data-testid], table, ul > li').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 120 || r.height < 24) return;
      const cls = (typeof el.className === 'string' ? el.className : '').slice(0, 60);
      const key = `${el.tagName}.${cls}.${Math.round(r.y)}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({
        tag: el.tagName.toLowerCase(),
        cls,
        tid: el.getAttribute('data-testid') || '',
        box: [Math.round(r.x + scrollX), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)],
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 110),
      });
    });
    return { pageH: document.documentElement.scrollHeight, out };
  });
  console.log(`\n===== ${route}  pageH=${rows.pageH} =====`);
  for (const r of rows.out) console.log(`${r.box.join(',')} | ${r.tag}${r.tid ? '#' + r.tid : ''} .${r.cls} | ${r.text}`);
};

for (const route of (process.env.ROUTES || '/,/evidence,/ask,/insights').split(',')) {
  await dump(route.trim());
}

await browser.close();
