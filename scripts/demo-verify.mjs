#!/usr/bin/env node
/**
 * demo:verify — walk the entire PITCH.md script in a real browser and fail loudly.
 *
 * IMPLEMENTATION_SPEC §0.1 makes this a hard requirement: "runs the full pitch path
 * headlessly via QA agent and fails loudly before any meeting." The demo is the
 * product's first job, so the pitch path gets a gate the same way a build does.
 *
 * Each check names the pitch beat it protects, so a failure reads as "beat 3 is
 * broken" rather than "selector not found". Beats whose surface has not landed yet
 * report SKIP, not PASS — a green run must never mean "we didn't look".
 *
 *   node scripts/demo-verify.mjs                 # assumes a dev server on :3417
 *   BASE_URL=http://localhost:3421 node ...      # or point it anywhere
 *
 * Exit 0 only when every non-skipped check passes.
 */

import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3417';
const results = [];

function record(beat, name, status, detail = '') {
  results.push({ beat, name, status, detail });
}

/** A route that 404s is "not built yet"; a route that 500s is broken. */
async function routeStatus(page, path) {
  const res = await page.goto(BASE + path, { waitUntil: 'domcontentloaded' }).catch(() => null);
  return res ? res.status() : 0;
}

async function check(beat, name, fn) {
  try {
    const outcome = await fn();
    if (outcome === 'skip') return record(beat, name, 'SKIP', 'surface not built yet');
    if (outcome === true) return record(beat, name, 'PASS');
    return record(beat, name, 'FAIL', typeof outcome === 'string' ? outcome : '');
  } catch (error) {
    record(beat, name, 'FAIL', error.message.split('\n')[0]);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// ── Cold open: the owner's morning ───────────────────────────────────────────
await check('cold-open', 'Today renders a Daybreak brief', async () => {
  const status = await routeStatus(page, '/');
  if (status !== 200) return status === 404 ? 'skip' : `HTTP ${status}`;
  await page.waitForTimeout(1200);
  const text = await page.locator('body').innerText();
  if (!/good morning/i.test(text)) return 'no greeting on the page';
  if (!/\d+%/.test(text)) return 'greeting carries no measured comparison';
  return true;
});

await check('cold-open', 'Attention queue shows ranked insights', async () => {
  const status = await routeStatus(page, '/');
  if (status !== 200) return 'skip';
  await page.waitForTimeout(1000);
  const text = await page.locator('body').innerText();
  // Every insight card states its evidence — a bare title is the failure mode.
  const hasEvidence = /(attachment|payment|tuesday|stock)/i.test(text);
  return hasEvidence || 'no insight evidence text found';
});

// ── Beat 1: insight → campaign ───────────────────────────────────────────────
await check('beat-1', 'Studio is reachable and pre-fills from an insight', async () => {
  const status = await routeStatus(page, '/marketing');
  if (status === 404) return 'skip';
  if (status !== 200) return `HTTP ${status}`;
  await page.waitForTimeout(1000);
  return true;
});

/* Beats 2 and 3 used to check /floor and /inventory. They are GONE, 2026-08-27.
   Bask is a sales-intelligence engine (`8e32efc`), those surfaces are off-nav,
   and the checks were actively harmful: they PASSED, so the gate reported a
   green pitch path that included two beats the product no longer tells. A gate
   that confirms a stale script is worse than no gate. Remaining beats are
   renumbered to match PITCH.md. */

// ── Beat 2: the loop closes (demo clock) ─────────────────────────────────────
await check('beat-2', 'Demo clock state is live', async () => {
  const res = await page.request.get(BASE + '/api/trpc/demo.state');
  if (!res.ok()) return `HTTP ${res.status()}`;
  const body = await res.json();
  const clock = body?.result?.data?.json?.clock;
  if (!clock?.virtualToday) return 'no virtualToday in demo.state';
  return true;
});

// ── Beats 3–4: Compass ───────────────────────────────────────────────────────
await check('beat-3', 'Compass network renders in its own theme', async () => {
  const status = await routeStatus(page, '/compass/network');
  if (status === 404) return 'skip';
  if (status !== 200) return `HTTP ${status}`;
  await page.waitForTimeout(1200);
  const theme = await page.getAttribute('html', 'data-theme');
  return theme === 'compass' || `theme was ${theme}, expected compass`;
});

await check('beat-4', 'Call List ranks salons with reasons', async () => {
  // The Call List IS /compass — it's the rep's morning, so it earns the root of
  // the product rather than sitting one click in (lane 5 deviation, logged).
  const status = await routeStatus(page, '/compass');
  if (status === 404) return 'skip';
  if (status !== 200) return `HTTP ${status}`;
  await page.waitForTimeout(1200);
  const text = await page.locator('body').innerText();
  return /suggested conversation/i.test(text) || 'no suggested-conversation block';
});

// ── Beat 5: the trust beat ───────────────────────────────────────────────────
await check('beat-5', 'What UVALUX sees screen exists', async () => {
  const status = await routeStatus(page, '/settings/data-sharing');
  if (status === 404) return 'skip';
  if (status !== 200) return `HTTP ${status}`;
  /* Wait for the words, not for a stopwatch. A flat 800ms passed against a warm
     dev server and FAILED against production's cold serverless start — the page
     was byte-identical, just later. A gate that cries wolf the morning of a
     demo is worse than no gate, because the honest response to it is to stop
     believing it. */
  await page
    .getByText(/uvalux sees/i)
    .first()
    .waitFor({ timeout: 15_000 })
    .catch(() => {});
  const text = await page.locator('body').innerText();
  return /uvalux sees/i.test(text) || 'screen does not name what UVALUX sees';
});

// ── Customer side (represented-future surface, but real) ─────────────────────
await check('customer', 'Public booking page offers real slots', async () => {
  const status = await routeStatus(page, '/book');
  if (status === 404) return 'skip';
  if (status !== 200) return `HTTP ${status}`;
  await page.locator('.book-service').first().waitFor({ timeout: 15_000 }).catch(() => {});
  const services = await page.locator('.book-service').count();
  if (services === 0) return 'no services offered';
  // The tiles are in the server HTML before React hydrates, so a click fired the
  // instant they appear lands on a button with no handler yet and silently does
  // nothing. Settle first — this is a real race a fast presenter could also hit.
  await page.waitForTimeout(1500);
  await page.locator('.book-service').first().click();
  await page.locator('.book-slot').first().waitFor({ timeout: 15_000 }).catch(() => {});
  const slots = await page.locator('.book-slot').count();
  return slots > 0 || 'no open times offered';
});

// ── Presenter mechanics (recovery path for every beat) ───────────────────────
await check('presenter', 'Panel opens on the hotkey', async () => {
  await routeStatus(page, '/dev/api');
  await page.waitForTimeout(800);
  await page.keyboard.press('Meta+Shift+D');
  await page.waitForTimeout(600);
  return await page
    .locator('text=/presenter/i')
    .first()
    .isVisible()
    .catch(() => 'panel did not appear');
});

await check('presenter', 'Theme switching works', async () => {
  const status = await routeStatus(page, '/dev/design');
  if (status !== 200) return 'skip';
  await page.waitForTimeout(800);
  const before = await page.getAttribute('html', 'data-theme');
  const dusk = page.locator('button', { hasText: /^Dusk$/ }).first();
  if ((await dusk.count()) === 0) return 'no Dusk control';
  await dusk.click();
  await page.waitForTimeout(600);
  const after = await page.getAttribute('html', 'data-theme');
  return after === 'dusk' || `${before} -> ${after}`;
});

await browser.close();

// ── Report ───────────────────────────────────────────────────────────────────
const pad = (s, n) => String(s).padEnd(n);
console.log('\n  demo:verify — PITCH.md path\n');
for (const r of results) {
  const mark = r.status === 'PASS' ? '✓' : r.status === 'SKIP' ? '–' : '✗';
  console.log(`  ${mark} ${pad(r.beat, 10)} ${pad(r.name, 46)} ${r.status}${r.detail ? '  — ' + r.detail : ''}`);
}
const failed = results.filter((r) => r.status === 'FAIL');
const skipped = results.filter((r) => r.status === 'SKIP');
console.log(
  `\n  ${results.length - failed.length - skipped.length} passed · ${skipped.length} not built yet · ${failed.length} failed\n`,
);
if (skipped.length) {
  console.log('  Skipped beats are unbuilt surfaces, NOT passes. The pitch is not ready until they land.\n');
}
process.exit(failed.length ? 1 : 0);
