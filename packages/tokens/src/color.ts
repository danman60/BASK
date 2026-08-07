/**
 * Color math for the token system: parse the CSS color forms tokens.css actually
 * uses (oklch + hex), convert to sRGB, and answer WCAG questions about them.
 *
 * Why hand-rolled rather than a culori-class dependency: the contrast gate has to
 * run in CI on a package with no runtime deps, and the only two color forms in the
 * token files are `oklch()` and `#rrggbb`. ~80 lines beats a transitive tree.
 */

export interface Rgb {
  /** linear-light sRGB, 0..1, NOT gamma-encoded */
  r: number;
  g: number;
  b: number;
  /** 0..1 */
  a: number;
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** #rgb / #rrggbb / #rrggbbaa → linear-light sRGB. */
function parseHex(input: string): Rgb | null {
  const m = /^#([0-9a-f]{3,8})$/i.exec(input.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3 || h.length === 4) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (h.length !== 6 && h.length !== 8) return null;
  const byte = (i: number) => parseInt(h.slice(i * 2, i * 2 + 2), 16) / 255;
  return {
    r: srgbToLinear(byte(0)),
    g: srgbToLinear(byte(1)),
    b: srgbToLinear(byte(2)),
    a: h.length === 8 ? byte(3) : 1,
  };
}

/** sRGB transfer function and its inverse (IEC 61966-2-1). */
export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
export function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/**
 * oklch(L C H) / oklch(L% C H / A) → linear-light sRGB.
 * Oklab→LMS→linear-sRGB matrices per Björn Ottosson's reference implementation.
 */
function parseOklch(input: string): Rgb | null {
  const m = /^oklch\(\s*([^)]+)\)$/i.exec(input.trim());
  if (!m) return null;
  const [coords, alphaPart] = m[1].split('/');
  const parts = coords.trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length < 3) return null;

  const num = (s: string, pctBase = 1) =>
    s.endsWith('%') ? (parseFloat(s) / 100) * pctBase : parseFloat(s);

  const L = num(parts[0]);
  const C = num(parts[1], 0.4);
  const H = parts[2] === 'none' ? 0 : parseFloat(parts[2]);
  const a = alphaPart === undefined ? 1 : clamp01(num(alphaPart.trim()));
  if ([L, C, H, a].some((n) => Number.isNaN(n))) return null;

  const hr = (H * Math.PI) / 180;
  const oa = C * Math.cos(hr);
  const ob = C * Math.sin(hr);

  const l_ = L + 0.3963377774 * oa + 0.2158037573 * ob;
  const m_ = L - 0.1055613458 * oa - 0.0638541728 * ob;
  const s_ = L - 0.0894841775 * oa - 1.291485548 * ob;
  const l = l_ * l_ * l_;
  const mm = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return {
    // clamped: out-of-gamut oklch would otherwise produce negative luminance
    r: clamp01(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s),
    g: clamp01(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s),
    b: clamp01(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s),
    a,
  };
}

/** Parse any color form the token files use. Returns null for gradients/keywords. */
export function parseColor(input: string): Rgb | null {
  const v = input.trim();
  if (v.startsWith('#')) return parseHex(v);
  if (v.toLowerCase().startsWith('oklch(')) return parseOklch(v);
  return null;
}

/** Source-over composite of a translucent color onto an opaque backdrop. */
export function composite(fg: Rgb, bg: Rgb): Rgb {
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

/** WCAG 2.x relative luminance (ITU-R BT.709 coefficients over linear-light sRGB). */
export function relativeLuminance(c: Rgb): number {
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

/** WCAG 2.x contrast ratio, 1..21. Translucent inputs are composited onto `over`. */
export function contrastRatio(fg: Rgb, bg: Rgb, over: Rgb = bg): number {
  const bgOpaque = bg.a < 1 ? composite(bg, over) : bg;
  const fgOpaque = fg.a < 1 ? composite(fg, bgOpaque) : fg;
  const l1 = relativeLuminance(fgOpaque);
  const l2 = relativeLuminance(bgOpaque);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Convenience: contrast between two CSS color strings. Throws on unparseable input. */
export function contrast(fg: string, bg: string, over?: string): number {
  const f = parseColor(fg);
  const b = parseColor(bg);
  if (!f) throw new Error(`Unparseable foreground color: ${fg}`);
  if (!b) throw new Error(`Unparseable background color: ${bg}`);
  const o = over ? parseColor(over) : undefined;
  return contrastRatio(f, b, o ?? b);
}

export function toHex(c: Rgb): string {
  const ch = (n: number) =>
    Math.round(clamp01(linearToSrgb(n)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${ch(c.r)}${ch(c.g)}${ch(c.b)}`;
}

/**
 * WCAG-computed foreground for a background — the CompPortal `contrastColor()`
 * idea, but measured rather than thresholded.
 *
 * CompPortal picks black/white off a fixed luminance crossover (≈0.179). That is
 * fast and right most of the time, but it can't see the two Bask-specific cases:
 * (a) the readable answer is often the brand's own ink, not pure black — DESIGN_SPEC
 * §2.1 bans pure white/black as surfaces, and (b) mid-lightness terracotta/amber sit
 * close enough to the crossover that the thresholded pick can lose to the other
 * candidate. So: score every candidate, take the winner.
 */
export function readableForeground(
  background: string,
  candidates: string[] = ['#ffffff', '#000000']
): { color: string; ratio: number } {
  const bg = parseColor(background);
  if (!bg) throw new Error(`Unparseable background color: ${background}`);
  let best = { color: candidates[0], ratio: -1 };
  for (const cand of candidates) {
    const c = parseColor(cand);
    if (!c) continue;
    const ratio = contrastRatio(c, bg);
    if (ratio > best.ratio) best = { color: cand, ratio };
  }
  return best;
}

/** Nudge an oklch color's lightness while keeping chroma/hue. Returns a CSS string. */
export function shiftLightness(input: string, delta: number): string {
  const m = /^oklch\(\s*([^)]+)\)$/i.exec(input.trim());
  if (!m) return input;
  const [coords, alphaPart] = m[1].split('/');
  const parts = coords.trim().split(/[\s,]+/).filter(Boolean);
  const isPct = parts[0].endsWith('%');
  const L = isPct ? parseFloat(parts[0]) / 100 : parseFloat(parts[0]);
  const next = clamp01(L + delta);
  parts[0] = isPct ? `${(next * 100).toFixed(2)}%` : next.toFixed(4);
  const tail = alphaPart ? ` / ${alphaPart.trim()}` : '';
  return `oklch(${parts.join(' ')}${tail})`;
}
