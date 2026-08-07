import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  EMPTY_STATES,
  GUIDED_UI,
  METRICS,
  TIPS,
  TOURS,
  TOUR_UI,
  WHISPERS,
} from '../src/guidance/guidance';

const GUIDANCE_DIR = join(import.meta.dirname, '..', 'src', 'guidance');

/* --------------------------------------------------------- readability ---- */

/** Syllable estimate — vowel groups, minus silent trailing "e", floor of 1. */
function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w
    .replace(/e\b/, '')
    .replace(/[aeiouy]{2,}/g, 'a')
    .match(/[aeiouy]/g);
  return Math.max(1, groups ? groups.length : 1);
}

/**
 * Flesch–Kincaid grade level. IMPLEMENTATION_SPEC §3.1 asks for ~grade 7 copy for
 * salon owners and front-desk staff; this makes that reviewable instead of a vibe.
 */
function gradeLevel(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => /[a-z]/i.test(w));
  if (!sentences.length || !words.length) return 0;
  const syl = words.reduce((sum, w) => sum + syllables(w), 0);
  return 0.39 * (words.length / sentences.length) + 11.8 * (syl / words.length) - 15.59;
}

/** Every user-facing string in the dictionary, with a label for failure messages. */
function allCopy(): { key: string; text: string }[] {
  const out: { key: string; text: string }[] = [];
  for (const [k, m] of Object.entries(METRICS)) {
    out.push({ key: `METRICS.${k}.what`, text: m.what });
    out.push({ key: `METRICS.${k}.how`, text: m.how });
    out.push({ key: `METRICS.${k}.why`, text: m.why });
  }
  for (const [k, t] of Object.entries(TIPS)) out.push({ key: `TIPS.${k}.body`, text: t.body });
  for (const [k, e] of Object.entries(EMPTY_STATES)) {
    out.push({ key: `EMPTY_STATES.${k}.title`, text: e.title });
    out.push({ key: `EMPTY_STATES.${k}.body`, text: e.body });
  }
  for (const [k, tour] of Object.entries(TOURS)) {
    tour.steps.forEach((s, i) => {
      out.push({ key: `TOURS.${k}.steps[${i}].title`, text: s.title });
      out.push({ key: `TOURS.${k}.steps[${i}].body`, text: s.body });
    });
  }
  for (const [k, w] of Object.entries(WHISPERS)) {
    out.push({ key: `WHISPERS.${k}`, text: typeof w === 'function' ? w(43) : w });
  }
  return out;
}

describe('guidance dictionary is seeded and reviewable', () => {
  it('carries at least 10 real entries', () => {
    const entries =
      Object.keys(METRICS).length +
      Object.keys(TIPS).length +
      Object.keys(EMPTY_STATES).length +
      Object.keys(TOURS).length +
      Object.keys(WHISPERS).length;
    expect(entries).toBeGreaterThanOrEqual(10);
  });

  it('every metric explains what, how and why', () => {
    for (const [key, m] of Object.entries(METRICS)) {
      expect(m.what.length, `${key}.what`).toBeGreaterThan(20);
      expect(m.how.length, `${key}.how`).toBeGreaterThan(20);
      expect(m.why.length, `${key}.why`).toBeGreaterThan(20);
      // the plain-language name must not itself be the jargon
      expect(m.label).not.toMatch(/\bMRR\b|\battachment rate\b/i);
    }
  });

  it('jargon only ever appears after the plain-language explanation', () => {
    // IMPLEMENTATION_SPEC §3.4: "MRR only in the explain-popover".
    for (const [key, m] of Object.entries(METRICS)) {
      for (const field of ['label', 'what', 'why'] as const) {
        expect(m[field], `${key}.${field} leaks jargon`).not.toMatch(
          /\bMRR\b|\battachment rate\b|\bchurn\b|\bARPU\b|\bLTV\b/i
        );
      }
    }
  });

  it('reads at roughly a grade-7 level', () => {
    const scored = allCopy().map((c) => ({ ...c, grade: gradeLevel(c.text) }));
    const avg = scored.reduce((s, c) => s + c.grade, 0) / scored.length;
    const worst = scored.reduce((a, b) => (a.grade > b.grade ? a : b));
    expect(avg, `average grade ${avg.toFixed(1)}`).toBeLessThan(9);
    expect(worst.grade, `hardest string is ${worst.key} at ${worst.grade.toFixed(1)}`).toBeLessThan(
      12
    );
  });

  it('buttons state outcomes — no Submit / OK / Confirm / Execute', () => {
    // DESIGN_SPEC §5 bans these outright.
    const banned = /^(submit|ok|confirm|execute|done!?)$/i;
    const labels = [
      ...Object.values(EMPTY_STATES).map((e) => e.action),
      TOUR_UI.next,
      TOUR_UI.back,
      TOUR_UI.skip,
      TOUR_UI.replay,
      GUIDED_UI.close,
    ];
    for (const label of labels) {
      expect(label, `"${label}" is a banned button word`).not.toMatch(banned);
    }
  });

  it('consequence whispers count real people rather than saying "your list"', () => {
    expect(WHISPERS.campaignAudience(43)).toContain('43');
    expect(WHISPERS.campaignAudience(1)).toContain('1 person');
    expect(WHISPERS.campaignAudience(43)).toContain('people');
  });
});

describe('no user-facing copy is inline in the components', () => {
  // IMPLEMENTATION_SPEC §3.7. The dictionary is only a single source of truth if the
  // components cannot bypass it, so this greps the primitives for JSX text nodes.
  const componentFiles = readdirSync(GUIDANCE_DIR).filter(
    (f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx')
  );

  it('finds the guidance components', () => {
    expect(componentFiles.length).toBeGreaterThanOrEqual(4);
  });

  it.each(
    readdirSync(GUIDANCE_DIR).filter((f) => f.endsWith('.tsx'))
  )('%s renders no hardcoded sentence', (file) => {
    const src = readFileSync(join(GUIDANCE_DIR, file), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

    // JSX text nodes: content between > and < on ONE line. Restricted to a prose
    // charset so TypeScript generics and comparisons (`useState<'start'>`, `a > b ?`)
    // are not mistaken for copy — an earlier version of this regex flagged exactly
    // that and the failure looked like a real violation.
    const textNodes = [...src.matchAll(/>([^<>{}\n]+)</g)]
      .map((m) => m[1].trim())
      .filter((t) => /^[A-Za-z0-9 ,.'’!?—–-]+$/.test(t))
      .filter((t) => /[a-z]{3,}/i.test(t))
      // single glyphs and marks are chrome, not copy
      .filter((t) => t.split(/\s+/).length > 2);

    expect(textNodes, `${file} has inline copy: ${JSON.stringify(textNodes)}`).toEqual([]);
  });
});
