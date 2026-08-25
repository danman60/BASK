#!/usr/bin/env node
/**
 * Coaching-corpus coverage audit.
 *
 * Reads the 224 advice clusters in the mined UVALUX corpus and asks a LOCAL
 * model, one cluster at a time, which Bask signal each piece of coaching can
 * actually back — and whether it is concrete enough to generate an action from.
 *
 * The output this exists for is the INVERSE: which signals Bask can detect but
 * has no coaching to act on. That gap list tells us what to record next.
 *
 * Read-heavy → write-light classification: the measured-good local workload.
 * Dispatched through the broker (`--kind bulk`), never by hand.
 *
 *   node scripts/corpus/signal-coverage.mjs [--limit N]
 *
 * Env: OLLAMA_HOST (default the 3060), OLLAMA_MODEL (default gemma4:12b).
 * Writes docs/research/salontouch-corpus-coverage.json (gitignored).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CORPUS = path.join(ROOT, 'docs/ingest/2026-08-22-salon-advice-corpus.md');
const OUT = path.join(ROOT, 'docs/research/salontouch-corpus-coverage.json');

const HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'gemma4:12b';
const LIMIT = Number(process.argv[process.argv.indexOf('--limit') + 1]) || Infinity;

/**
 * The signals Bask can detect, or could detect from the SalonTouch data.
 * These are the app's OWN vocabulary (detectors.ts types + the health engine +
 * the two signals the real dataset newly supports). Not invented categories.
 */
const SIGNALS = [
  ['retail_attachment_slip', 'retail attachment is falling — visits that buy no product'],
  ['staff_coaching_gap', 'one staff member sells far less than another on the same shifts'],
  ['customer_slipping', 'a regular customer is going quiet but is not gone yet'],
  ['customer_reactivation', 'a customer has been gone a long time and needs winning back'],
  ['membership_upgrade', 'a customer on a session pack should move to unlimited/membership'],
  ['membership_retention', 'a member is freezing, cancelling or about to lapse'],
  ['failed_payments', 'a membership payment failed and needs recovering'],
  ['soft_capacity', 'a recurring time window is quiet and could be filled'],
  ['stock', 'a product is running out, or is dead stock sitting on the shelf'],
  ['category_anomaly', 'a product category moved sharply up or down'],
  ['equipment_modality', 'bed/modality mix, equipment payback, how long customers stay'],
  ['none', 'this advice does not map to any data signal the app can detect'],
];

const MOMENTS = ['greeting', 'needs', 'product', 'membership', 'close', 'none'];

/** Split the corpus markdown into its numbered advice clusters. */
function parseClusters(md) {
  const lines = md.split('\n');
  const clusters = [];
  let category = null;
  let cur = null;
  for (const line of lines) {
    const cat = line.match(/^### (\w[\w ]*?) \(\d+\)/);
    if (cat) { category = cat[1].trim(); continue; }
    const head = line.match(/^\*\*(\d+)\. (.+?)\*\*\s*$/);
    if (head) {
      if (cur) clusters.push(cur);
      cur = { n: Number(head[1]), category, advice: head[2].trim(), meta: '', quotes: [] };
      continue;
    }
    if (!cur) continue;
    if (/^`\w+` · /.test(line)) { cur.meta = line.trim(); continue; }
    const quote = line.match(/^> (?!—)(.+)$/);
    if (quote && cur.quotes.length < 2) cur.quotes.push(quote[1].trim());
  }
  if (cur) clusters.push(cur);
  return clusters;
}

const PROMPT = (c) => `You are auditing a corpus of salon-business coaching advice against the signals a salon analytics app can detect in point-of-sale data.

SIGNALS:
${SIGNALS.map(([k, d]) => `- ${k}: ${d}`).join('\n')}

FRONT-DESK MOMENTS (only if this advice is something a staff member SAYS to a customer): ${MOMENTS.join(', ')}

THE ADVICE (category "${c.category}"):
${c.advice}

VERBATIM SOURCE QUOTES:
${c.quotes.map((q) => `"${q}"`).join('\n')}

"usable" means:
- "direct": names a concrete thing a staff member says or does, or a concrete offer. Copy can be written straight from it. ("Put the product in the customer's hands." "Ask why they've never bought lotion.")
- "supporting": a real technique or reason that strengthens a recommendation but needs wording. ("Lotions give a darker, longer-lasting tan.")
- "principle": a general business belief with no concrete behaviour in it. ("Customer service matters.")

Answer ONLY with JSON:
{
  "signal": "<the single best matching signal key, or none>",
  "secondary": "<a second signal key, or none>",
  "moment": "<a moment key, or none>",
  "actionable": "<script|campaign|challenge|order|coaching|policy|none>",
  "usable": "<direct|supporting|principle>",
  "why": "<one short sentence>"
}`;

/*
 * "usable" replaced an earlier boolean "specific", which the model read so
 * strictly that only 6 of 222 clusters survived — it rejected concrete staff
 * behaviour like "put the product in the customer's hands" as a mere principle.
 * That understated real coverage badly, so the rating is now three-level and
 * the definitions are spelled out below.
 */

async function classify(c) {
  const res = await fetch(`${HOST}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt: PROMPT(c),
      format: 'json',
      stream: false,
      keep_alive: '30m', // top-level, NOT inside options — nested it is silently ignored
      options: { temperature: 0 },
    }),
  });
  if (!res.ok) throw new Error(`ollama ${res.status}: ${await res.text()}`);
  const body = await res.json();
  let parsed;
  try {
    parsed = JSON.parse(body.response);
  } catch {
    return { ...c, error: 'unparseable', raw: String(body.response).slice(0, 300) };
  }
  const known = new Set(SIGNALS.map(([k]) => k));
  return {
    n: c.n,
    category: c.category,
    advice: c.advice,
    signal: known.has(parsed.signal) ? parsed.signal : 'none',
    secondary: known.has(parsed.secondary) ? parsed.secondary : 'none',
    moment: MOMENTS.includes(parsed.moment) ? parsed.moment : 'none',
    actionable: String(parsed.actionable ?? 'none'),
    usable: ['direct', 'supporting', 'principle'].includes(parsed.usable) ? parsed.usable : 'principle',
    why: String(parsed.why ?? '').slice(0, 240),
  };
}

async function main() {
  const clusters = parseClusters(fs.readFileSync(CORPUS, 'utf8')).slice(0, LIMIT);
  console.log(`parsed ${clusters.length} clusters · model ${MODEL} @ ${HOST}`);
  if (clusters.length === 0) { console.error('parsed 0 clusters — parser is wrong, not the corpus'); process.exit(1); }

  const rows = [];
  const t0 = Date.now();
  for (const c of clusters) {
    try {
      rows.push(await classify(c));
    } catch (e) {
      rows.push({ n: c.n, category: c.category, advice: c.advice, error: String(e.message).slice(0, 200) });
    }
    if (rows.length % 20 === 0) {
      const rate = (Date.now() - t0) / rows.length / 1000;
      console.log(`  ${rows.length}/${clusters.length} · ${rate.toFixed(1)}s each`);
    }
  }

  const errors = rows.filter((r) => r.error).length;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({
    generatedAt: new Date().toISOString(),
    model: MODEL,
    corpus: path.relative(ROOT, CORPUS),
    total: rows.length,
    errors,
    rows,
  }, null, 2));
  console.log(`\nwrote ${OUT} · ${rows.length} rows · ${errors} errors`);
}

main();
