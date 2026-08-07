/**
 * The contrast gate: read the three token sets straight out of the CSS files and
 * assert WCAG AA on every text/surface pair the product actually renders.
 *
 * It parses the shipped CSS rather than a hand-maintained TS mirror on purpose —
 * a mirror drifts, and a drifted mirror turns the gate into theatre. Edit a token,
 * the gate re-reads it.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrastRatio, parseColor, type Rgb } from './color';

const HERE = dirname(fileURLToPath(import.meta.url));

export const THEMES = ['sunset', 'dusk', 'compass'] as const;
export type ThemeName = (typeof THEMES)[number];

/** Every custom property declared inside a given selector block, in source order. */
function readBlock(css: string, selector: string): Record<string, string> {
  const out: Record<string, string> = {};
  // Selectors here are literal (`:root`, `[data-theme='dusk']`) — no nesting in the
  // token files, so a brace-balanced slice from the selector is sufficient.
  const idx = css.indexOf(selector);
  if (idx === -1) return out;
  const open = css.indexOf('{', idx);
  if (open === -1) return out;
  let depth = 1;
  let i = open + 1;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  const body = css.slice(open + 1, i - 1);
  for (const decl of body.split(';')) {
    const c = decl.indexOf(':');
    if (c === -1) continue;
    const name = decl.slice(0, c).trim();
    if (!name.startsWith('--')) continue;
    // strip trailing comments so `--x: val; /* note */` doesn't poison the value
    out[name] = decl
      .slice(c + 1)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();
  }
  return out;
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Resolve the full custom-property map for one theme: Sunset `:root` as the base,
 * then the theme's override block layered on top (exactly how the cascade resolves
 * it in the browser), then `var()` indirection followed to a literal.
 */
export function resolveTheme(theme: ThemeName): Record<string, string> {
  const base = stripComments(readFileSync(join(HERE, 'tokens.css'), 'utf8'));
  const vars = readBlock(base, ':root');

  const semantic = stripComments(readFileSync(join(HERE, 'semantic.css'), 'utf8'));
  Object.assign(vars, readBlock(semantic, ':root'));

  if (theme === 'dusk') {
    const dusk = stripComments(readFileSync(join(HERE, 'dusk.css'), 'utf8'));
    Object.assign(vars, readBlock(dusk, "[data-theme='dusk']"));
    Object.assign(vars, readBlock(semantic, "[data-theme='dusk']"));
  } else if (theme === 'compass') {
    const compass = stripComments(readFileSync(join(HERE, 'compass.css'), 'utf8'));
    Object.assign(vars, readBlock(compass, "[data-theme='compass']"));
    Object.assign(vars, readBlock(semantic, "[data-theme='compass']"));
  }

  const seen = new Set<string>();
  const deref = (value: string, depth = 0): string => {
    if (depth > 16) throw new Error(`var() cycle resolving: ${value}`);
    const m = /^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/.exec(value.trim());
    if (!m) return value;
    const target = vars[m[1]] ?? m[2];
    if (target === undefined) throw new Error(`Unresolved var(${m[1]})`);
    return deref(target, depth + 1);
  };

  const resolved: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) {
    seen.clear();
    resolved[k] = deref(v);
  }
  return resolved;
}

export type PairKind = 'text' | 'large-text' | 'ui' | 'decorative';

/**
 * WCAG 2.1 minimums.
 *   text        1.4.3 AA — 4.5:1
 *   large-text  1.4.3 AA — 3:1 for ≥24px, or ≥18.7px bold
 *   ui          1.4.11   — 3:1 for controls and state-carrying boundaries
 *   decorative  1.4.11 explicitly EXEMPTS "pure decoration". Bask's hairlines
 *               (`--line`) sit at ~1.3:1 by design — DESIGN_SPEC §2.1 calls them
 *               hairlines and cards are delineated by fill + the two-layer soft
 *               shadow, not by the rule. Measured and reported, never gated;
 *               gating them would force a heavier border and break the look.
 */
export const AA_MIN: Record<PairKind, number> = {
  text: 4.5,
  'large-text': 3,
  ui: 3,
  decorative: 1,
};

/**
 * A pair whose ratio is below its AA threshold and is knowingly shipped.
 *
 * Every waiver here traces to a value in `mockups/tokens.css`, which is the locked
 * source of truth (IMPLEMENTATION_SPEC §4.1) and may not be edited from this package.
 * `floor` is the ratio measured at the time of waiving: the gate still asserts the
 * pair meets it, so a token edit that makes a known-marginal pair WORSE fails CI.
 * Waivers are debt with a receipt, not a lowered bar.
 */
export interface Waiver {
  floor: number;
  reason: string;
}

export const WAIVERS: Record<string, Waiver> = {
        'sunset:--success:--success-wash': {
    floor: 3.3,
    reason:
      'mockup 01 `.impact.up` ships --success on --success-wash at 3.36:1 for an 11px/600 chip. ' +
      'Both tokens are locked. Remedy is already in place: M1 components use --success-on-wash ' +
      '(7.0:1) for the LABEL and may keep --success for a non-essential dot. The mockup literal ' +
      'is the known-bad pairing, kept in the audit so the debt stays visible.',
  },
  'sunset:--risk:--risk-wash': {
    floor: 4.4,
    reason:
      'mockup 02 `.chip.maint` ships --risk on --risk-wash at 4.46:1 (AA wants 4.5 at 11px). ' +
      'Superseded by --risk-on-wash for labels.',
  },
  'compass:--risk:--risk-wash': {
    floor: 3.7,
    reason:
      'Same superseded pairing as Sunset, on the locked Compass palette: --c-risk ' +
      'oklch(68% .15 28) is verbatim from mockups/tokens.css and cannot be lifted here, so the ' +
      'raw pairing sits at 3.73:1. Compass labels use --risk-on-wash (6.9:1). Note Dusk hit the ' +
      'same problem and was FIXED rather than waived, because Dusk values are ours to derive.',
  },
  };

export interface Pair {
  fg: string;
  bg: string;
  kind: PairKind;
  /** where this pairing occurs on screen — keeps the gate honest about `kind` */
  usage: string;
  /** themes this pair does not apply to */
  skip?: ThemeName[];
}

/**
 * The pairs the product actually renders.
 *
 * `kind` is assigned from the real type size at the usage site (DESIGN_SPEC §2.2 type
 * scale), never from what would pass. Every `usage` below was read off the mockups —
 * e.g. `.impact` in mockup 01 is --primary-deep on --primary-wash, NOT --ink, and
 * mockup 02's `.chip.clean` proves chip labels use a darkened on-wash colour. Guessing
 * the pairings instead of reading them produces a gate that tests fictional UI.
 */
export const PAIRS: Pair[] = [
  // --- body copy on every surface ---
  { fg: '--ink', bg: '--paper', kind: 'text', usage: 'body copy on the page canvas' },
  { fg: '--ink', bg: '--paper-2', kind: 'text', usage: 'body copy on inset/hover surfaces' },
  { fg: '--ink', bg: '--card', kind: 'text', usage: 'card titles, StatRow values' },
  { fg: '--ink-soft', bg: '--paper', kind: 'text', usage: 'secondary prose, StatRow labels' },
  { fg: '--ink-soft', bg: '--card', kind: 'text', usage: 'evidence sentences inside cards' },
  { fg: '--ink-soft', bg: '--paper-2', kind: 'text', usage: 'quiet button label on hover' },
  { fg: '--ink-faint', bg: '--paper', kind: 'text', usage: 'timestamps, meta lines, WhisperNote' },
  { fg: '--ink-faint', bg: '--card', kind: 'text', usage: 'WhisperNote inside a card' },

  // --- primary action (mockups: .btn-primary, .svc.sel, .rm.sel, .tone.sel) ---
  { fg: '--on-primary', bg: '--primary', kind: 'text', usage: '.btn-primary label' },
  { fg: '--on-primary', bg: '--primary-deep', kind: 'text', usage: '.btn-primary:hover label' },
  { fg: '--primary', bg: '--paper', kind: 'ui', usage: 'focus ring, selected-pill border' },
  { fg: '--primary', bg: '--card', kind: 'ui', usage: 'accent rules and icons inside cards' },
  {
    fg: '--accent-on-wash',
    bg: '--primary-wash',
    kind: 'text',
    usage: 'ImpactChip / .impact / .pav / .svc.sel label (mockup 01 L53, mockup 04 .sig.watch)',
  },

  // --- semantic chips: label sits ON its own wash (mockup 02 .chip.*) ---
  {
    fg: '--success-on-wash',
    bg: '--success-wash',
    kind: 'text',
    usage: 'StatusChip "ready" label (mockup 02 .chip.ready)',
  },
  {
    fg: '--warn-on-wash',
    bg: '--warn-wash',
    kind: 'text',
    usage: 'StatusChip "cleaning" label + .flag copy (mockup 02 .chip.clean, .flag)',
  },
  {
    fg: '--risk-on-wash',
    bg: '--risk-wash',
    kind: 'text',
    usage: 'StatusChip "maintenance" / failed-payment label (mockup 02 .chip.maint)',
  },
  // The raw semantic colour on its own wash — what mockups 01 and 02 literally ship.
  // Both are below AA and both are waived with a pointer at the --*-on-wash token that
  // replaces them in M1 components. Kept in the audit so the debt stays visible rather
  // than being quietly deleted from the gate.
  {
    fg: '--success',
    bg: '--success-wash',
    kind: 'text',
    usage: 'mockup 01 `.impact.up` — SUPERSEDED by --success-on-wash',
  },
  {
    fg: '--risk',
    bg: '--risk-wash',
    kind: 'text',
    usage: 'mockup 02 `.chip.maint` — SUPERSEDED by --risk-on-wash',
  },

  // --- decorative hairlines: measured, reported, exempt from 1.4.11 ---
  { fg: '--line', bg: '--paper', kind: 'decorative', usage: 'card border against the canvas' },
  { fg: '--line', bg: '--card', kind: 'decorative', usage: 'hairline rules inside cards' },
];

export interface PairResult extends Pair {
  theme: ThemeName;
  ratio: number;
  min: number;
  pass: boolean;
  waived: boolean;
  waiver?: Waiver;
  fgValue: string;
  bgValue: string;
}

/** Stable key for the waiver table. */
export const pairKey = (theme: ThemeName, pair: Pick<Pair, 'fg' | 'bg'>) =>
  `${theme}:${pair.fg}:${pair.bg}`;

/** Run every pair against every theme. Pure — returns results, asserts nothing. */
export function auditThemes(themes: readonly ThemeName[] = THEMES): PairResult[] {
  const results: PairResult[] = [];
  for (const theme of themes) {
    const vars = resolveTheme(theme);
    // Translucent washes composite over the theme's own canvas, which is what the
    // browser does and what makes an alpha wash legal in the first place.
    const canvas = parseColor(vars['--paper']);
    if (!canvas) throw new Error(`[${theme}] --paper is not a parseable color`);

    for (const pair of PAIRS) {
      if (pair.skip?.includes(theme)) continue;
      const fgValue = vars[pair.fg];
      const bgValue = vars[pair.bg];
      if (!fgValue) throw new Error(`[${theme}] missing token ${pair.fg}`);
      if (!bgValue) throw new Error(`[${theme}] missing token ${pair.bg}`);
      const fg = parseColor(fgValue);
      const bg = parseColor(bgValue);
      if (!fg) throw new Error(`[${theme}] ${pair.fg} = "${fgValue}" is not a color`);
      if (!bg) throw new Error(`[${theme}] ${pair.bg} = "${bgValue}" is not a color`);

      const ratio = contrastRatio(fg as Rgb, bg as Rgb, canvas as Rgb);
      const aaMin = AA_MIN[pair.kind];
      const waiver = WAIVERS[pairKey(theme, pair)];
      // A waived pair is held to its recorded floor instead of the AA threshold, so
      // it can never silently regress further.
      const min = waiver ? waiver.floor : aaMin;
      results.push({
        ...pair,
        theme,
        ratio,
        min,
        pass: ratio + 1e-9 >= min,
        waived: Boolean(waiver) && ratio + 1e-9 < aaMin,
        waiver,
        fgValue,
        bgValue,
      });
    }
  }
  return results;
}

export function formatResults(results: PairResult[]): string {
  return results
    .map((r) => {
      const status = !r.pass ? 'FAIL ' : r.waived ? 'WAIVE' : 'PASS ';
      return (
        `${status} ${r.theme.padEnd(8)} ${`${r.fg} on ${r.bg}`.padEnd(38)} ` +
        `${r.ratio.toFixed(2).padStart(6)}:1  (min ${r.min}, ${r.kind}) — ${r.usage}`
      );
    })
    .join('\n');
}
