/**
 * Seeded PRNG. The whole determinism story rests on this file.
 *
 * `Math.random()` and `Date.now()` are banned everywhere downstream of here:
 * one call to either and `demo:reset` stops reproducing the PRODUCT_SPEC §20
 * story arcs, which means the demo stops being rehearsable.
 *
 * sfc32 seeded through cyrb128 — small, fast, and (unlike a naive LCG) with no
 * visible structure in the low bits, which matters because we sample weekday
 * and hour buckets straight off it.
 */

/** Expand a string seed to the four 32-bit words sfc32 needs. */
function cyrb128(seed: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < seed.length; i += 1) {
    const k = seed.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(public readonly seed: string) {
    const [a, b, c, d] = cyrb128(seed);
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    // Discard the first few outputs — early sfc32 state correlates with seed.
    for (let i = 0; i < 12; i += 1) this.float();
  }

  /** Uniform in [0, 1). */
  float(): number {
    this.a >>>= 0;
    this.b >>>= 0;
    this.c >>>= 0;
    this.d >>>= 0;
    let t = (this.a + this.b) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.d = (this.d + 1) | 0;
    t = (t + this.d) | 0;
    this.c = (this.c + t) | 0;
    return (t >>> 0) / 4294967296;
  }

  /** Integer in [min, max], inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.float() * (max - min + 1));
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + this.float() * (max - min);
  }

  bool(probability = 0.5): boolean {
    return this.float() < probability;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('pick() from an empty list');
    return items[Math.floor(this.float() * items.length)]!;
  }

  /** Weighted choice. Weights need not sum to 1. */
  weighted<T>(entries: ReadonlyArray<readonly [T, number]>): T {
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = this.float() * total;
    for (const [item, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return item;
    }
    return entries[entries.length - 1]![0];
  }

  /** Fisher-Yates on a copy. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.float() * (i + 1));
      [out[i], out[j]] = [out[j]!, out[i]!];
    }
    return out;
  }

  /** `count` distinct items. Throws if `count` exceeds the pool. */
  sample<T>(items: readonly T[], count: number): T[] {
    if (count > items.length) throw new Error(`sample(${count}) from ${items.length} items`);
    return this.shuffle(items).slice(0, count);
  }

  /** Box-Muller normal, clamped to ±4σ so outliers can't produce nonsense. */
  normal(mean: number, sd: number): number {
    const u = Math.max(this.float(), 1e-9);
    const v = this.float();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return mean + sd * Math.max(-4, Math.min(4, z));
  }

  /** A child generator keyed by `label`. Lets one sub-stream change without
   *  shifting every downstream draw — the reason a tweak to staff shifts
   *  doesn't renumber every customer. */
  child(label: string): Rng {
    return new Rng(`${this.seed}::${label}`);
  }
}

/** Round to cents. Money never carries float dust into the database. */
export function money(value: number): number {
  return Math.round(value * 100) / 100;
}
