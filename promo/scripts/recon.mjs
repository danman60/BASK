// recon.mjs — read-only reconnaissance of the live Bask demo.
// Screenshots every surface at 1x and dumps a shallow DOM outline so the
// capture script can be written against real selectors (no guessing).
import { createRequire } from 'module';
const requireG = createRequire('/home/danman60/.nvm/versions/node/v22.22.1/lib/node_modules/');
const { chromium } = requireG('playwright');
import fs from 'fs';

const BASE = process.env.CAP_BASE;
if (!BASE) { console.error('CAP_BASE required'); process.exit(1); }
console.log('recon target:', BASE);

const OUT = process.argv[2] || '/tmp/recon';
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = ['/', '/floor', '/marketing', '/inventory', '/insights', '/customers', '/compass', '/settings/data-sharing'];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

const outline = {};
for (const r of ROUTES) {
  const name = r === '/' ? 'today' : r.replace(/^\//, '').replace(/\//g, '-');
  await page.goto(`${BASE}${r}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  outline[name] = await page.evaluate(() => {
    const walk = (el, depth) => {
      if (depth > 4) return null;
      const kids = [...el.children]
        .filter((c) => !['SCRIPT', 'STYLE', 'SVG', 'PATH'].includes(c.tagName))
        .map((c) => walk(c, depth + 1))
        .filter(Boolean);
      const r = el.getBoundingClientRect();
      return {
        t: el.tagName.toLowerCase(),
        c: (el.className && typeof el.className === 'string' ? el.className : '').slice(0, 90),
        box: [Math.round(r.x + scrollX), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)],
        txt: kids.length === 0 ? (el.textContent || '').trim().slice(0, 60) : undefined,
        k: kids.length ? kids : undefined,
      };
    };
    return { pageH: document.documentElement.scrollHeight, tree: walk(document.body, 0) };
  });
  console.log(name, 'pageH', outline[name].pageH);
}
fs.writeFileSync(`${OUT}/outline.json`, JSON.stringify(outline, null, 1));
console.log('wrote', `${OUT}/outline.json`);
await browser.close();
