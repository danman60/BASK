import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AA_MIN,
  PAIRS,
  THEMES,
  WAIVERS,
  auditThemes,
  formatResults,
  pairKey,
  resolveTheme,
} from '../src/contrast';
import { contrast, parseColor, readableForeground, toHex } from '../src/color';

const ROOT = join(import.meta.dirname, '..', '..', '..');

describe('token source integrity', () => {
  it('packages/tokens/src/tokens.css is a byte-identical copy of mockups/tokens.css', () => {
    // IMPLEMENTATION_SPEC §4.1: the mockup file IS the source of truth. Theme work
    // is additive override blocks; the moment this drifts, the design system has two
    // sources and the mockups stop being reviewable.
    const source = readFileSync(join(ROOT, 'mockups', 'tokens.css'));
    const copy = readFileSync(join(ROOT, 'packages', 'tokens', 'src', 'tokens.css'));
    expect(copy.equals(source)).toBe(true);
  });

  it('every Sunset color token has a Dusk companion', () => {
    const sunset = resolveTheme('sunset');
    const dusk = resolveTheme('dusk');
    const colorTokens = Object.entries(sunset)
      .filter(([k, v]) => !k.startsWith('--c-') && parseColor(v) !== null)
      .map(([k]) => k);
    expect(colorTokens.length).toBeGreaterThan(10);
    for (const token of colorTokens) {
      expect(dusk[token], `${token} has no Dusk value`).toBeDefined();
      expect(dusk[token], `${token} was not re-derived for Dusk`).not.toBe(sunset[token]);
    }
  });

  it('Compass maps the semantic tokens onto the --c-* set, never onto terracotta', () => {
    const compass = resolveTheme('compass');
    const sunset = resolveTheme('sunset');
    // DESIGN_SPEC §2.1 — "Compass never uses terracotta; Bask never uses Compass amber."
    expect(compass['--primary']).toBe(sunset['--c-amber']);
    expect(compass['--paper']).toBe(sunset['--c-paper']);
    expect(compass['--ink']).toBe(sunset['--c-ink']);
    expect(compass['--primary']).not.toBe(sunset['--primary']);
  });
});

describe('WCAG AA contrast gate', () => {
  const results = auditThemes();

  it('covers all three themes', () => {
    expect(new Set(results.map((r) => r.theme))).toEqual(new Set(THEMES));
    expect(results.length).toBe(THEMES.length * PAIRS.length);
  });

  it.each(THEMES)('%s passes AA on every text and UI pair', (theme) => {
    const failures = results.filter((r) => r.theme === theme && !r.pass);
    expect(formatResults(failures)).toBe('');
  });

  it('every waiver is still needed — no dead entries in the table', () => {
    // A waiver that has started passing must be deleted, or the table stops
    // describing reality and the next reader trusts a stale excuse.
    const actuallyWaived = new Set(results.filter((r) => r.waived).map((r) => pairKey(r.theme, r)));
    const declared = Object.keys(WAIVERS);
    expect(declared.filter((k) => !actuallyWaived.has(k))).toEqual([]);
  });

  it('every waiver carries a reason that names the constraint', () => {
    for (const [key, waiver] of Object.entries(WAIVERS)) {
      expect(waiver.reason.length, `${key} reason is too thin`).toBeGreaterThan(60);
      expect(waiver.floor).toBeGreaterThan(1);
    }
  });

  it('nothing is waived except against the locked mockup token set', () => {
    // Dusk and Compass values are OURS — we derived them, so we can fix them.
    // A waiver on a token we control is us lowering our own bar.
    const ours = results.filter((r) => r.waived && r.theme === 'dusk');
    for (const r of ours) {
      expect(
        r.waiver!.reason.toLowerCase(),
        `dusk waiver on ${r.fg}/${r.bg} must justify why it is not simply fixed`
      ).toMatch(/superseded|locked/);
    }
  });

  it('reports the full audit (visible in CI output)', () => {
    // eslint-disable-next-line no-console
    console.log('\n' + formatResults(results) + '\n');
    expect(results.every((r) => r.pass)).toBe(true);
  });
});

describe('color math', () => {
  it('converts oklch to sRGB', () => {
    // white and black are exact fixed points in both directions
    expect(toHex(parseColor('oklch(100% 0 0)')!)).toBe('#ffffff');
    expect(toHex(parseColor('oklch(0% 0 0)')!)).toBe('#000000');
  });

  it('computes the canonical WCAG ratio for black on white', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  it('composites translucent foregrounds onto the backdrop', () => {
    // a 0-alpha color must resolve to exactly the backdrop → ratio 1
    expect(contrast('oklch(0% 0 0 / 0)', '#ffffff')).toBeCloseTo(1, 5);
  });

  it('picks the readable foreground for user-configurable brand colors', () => {
    const onLight = readableForeground('#ffe08a');
    expect(onLight.color).toBe('#000000');
    expect(onLight.ratio).toBeGreaterThan(AA_MIN.text);

    const onDark = readableForeground('#3a1f12');
    expect(onDark.color).toBe('#ffffff');
    expect(onDark.ratio).toBeGreaterThan(AA_MIN.text);
  });

  it('never returns a foreground worse than the alternative', () => {
    for (const bg of ['#e1306c', '#c86a3f', '#79a8ff', '#111111', '#fafafa']) {
      const chosen = readableForeground(bg);
      const other = chosen.color === '#ffffff' ? '#000000' : '#ffffff';
      expect(chosen.ratio).toBeGreaterThanOrEqual(contrast(other, bg));
    }
  });
});
