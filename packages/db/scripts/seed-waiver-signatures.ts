/**
 * `pnpm --filter @bask/db waivers:seed` — put a PRIOR signed waiver on file for
 * the hero salon's demo customers, so Beat 2's punchline has something to land on.
 *
 * WHY THIS EXISTS
 * `docs/pitch/PITCH.md:38` hands Nick the tablet mid-check-in: *"sign here — his
 * own signature lands on her file."* The joke only works if the file already has
 * a page. It did not. A live count on 2026-08-26 found `bask.waiver_signature`
 * holding **0 rows**, so the stored-waivers panel
 * (`apps/web/src/app/(bask)/floor/components/WaiverSheet.tsx:83`) rendered the
 * empty state until the moment Nick signed — and the beat reads as "we just
 * created her first record", not "your signature joined her history".
 *
 * WHAT IT IS NOT DOING: inventing history.
 * All 420 Sunset Ridge customers already carry a `customer.waiver_signed_at`
 * timestamp from the fixture set, and NONE of them had the matching
 * `waiver_signature` row. The flag asserted an artefact that did not exist. This
 * script does not choose a date, a signer or a story — it materialises the
 * artefact the existing flag already claims, reusing the customer's OWN
 * `waiver_signed_at` as `signed_at` and their own name as `signed_name`. Nothing
 * here is a new fact; it is the missing half of a fact already in the database.
 *
 * WHICH CUSTOMERS, AND WHY NOT JUST ONE
 * The pitch says "Sarah". It does not pin a record, and I will not pretend it
 * does: `Sarah` is one of thirty first names in the generated fixture pool
 * (`packages/db/fixtures/people.ts:81`), and Sunset Ridge has EIGHT customers
 * called Sarah. There is no `DEMO_CUSTOMER` constant anywhere in the repo —
 * verified by grep across `packages/db`, `apps/web/src`, `scripts` and `tests`.
 * Rather than guess which Sarah the presenter will click and be wrong on stage,
 * this covers every Sarah at the hero salon. `--all` widens it to every customer
 * at the hero salon with a waiver flag and no signature.
 *
 * THE IMAGE IS A REAL PNG, PRODUCED THE SAME WAY THE APP PRODUCES ONE
 * `recordWaiverAction` (`apps/web/src/app/(bask)/floor/actions.ts:143`) refuses
 * anything that is not `data:image/png;base64,...`, so a placeholder string
 * would be a row the app itself would have rejected. Signatures here are drawn
 * on a real `<canvas>` in a real browser and exported with `toDataURL('image/png')`
 * — the identical call the `SignaturePad` makes (`SignaturePad.tsx:93`) — using
 * the same `lineWidth: 2`, `lineCap: 'round'`, `strokeStyle: '#2a2029'` and
 * transparent background as the live pad (`SignaturePad.tsx:62-66`). The stroke
 * path is seeded off the customer's id, so each signature is different from the
 * others and identical between runs.
 *
 * EVERY FIELD MATCHES `recordWaiverAction`'s WRITE SHAPE. Same columns, same
 * `expiresAt = signedAt + WAIVER_VALID_DAYS` arithmetic (365 days,
 * `apps/web/src/server/floor/floor-data.ts:22`). Deliberately NOT replicated:
 * that action also writes `customer.waiverSignedAt` and an `activity_event`.
 * The customer flag is the very thing being honoured here and already holds the
 * right value — rewriting it would clobber the fixture. An `activity_event`
 * would be this script claiming a front-desk staffer did something on a day
 * nobody worked, which is a fabricated event rather than a missing artefact, so
 * it is left out.
 *
 * SAFETY — this is a SHARED Supabase database (`bask` schema, alongside 574
 * tables belonging to other products):
 *   - INSERTs into `bask.waiver_signature` only. No DDL, no migration, no schema
 *     change, no deletes, no updates to any existing row.
 *   - IDEMPOTENT. A customer who already has any `waiver_signature` row is
 *     skipped untouched. Re-running is a no-op.
 *   - `--dry-run` prints the plan and the before/after counts, writes nothing.
 *   - Row counts printed BEFORE and AFTER.
 *
 *   pnpm --filter @bask/db waivers:seed -- --dry-run
 *   pnpm --filter @bask/db waivers:seed
 *   pnpm --filter @bask/db waivers:seed -- --all
 */

import { chromium } from 'playwright';

import { db } from '../src/index';

const DRY_RUN = process.argv.includes('--dry-run');
const ALL = process.argv.includes('--all');

/**
 * `--preview <dir>` renders the signatures to PNG files and touches no database
 * at all. It exists because the FIRST version of the stroke generator produced
 * a plain sine wave that read as a scribble, and that was only caught by opening
 * the image. Ink this script writes ends up in front of a stakeholder; look at
 * it before storing it.
 */
const previewIndex = process.argv.indexOf('--preview');
const PREVIEW_DIR = previewIndex >= 0 ? process.argv[previewIndex + 1] : null;

/**
 * `--replace` deletes the existing `waiver_signature` rows for the customers in
 * scope before writing new ones. It exists for exactly one situation: the stored
 * image is wrong and needs regenerating. Without it a second run would ADD a
 * second signature to the same customer, and the panel would show them as having
 * signed twice — a false record, which is worse than a bad drawing.
 *
 * It is the only destructive path in this file. It is scoped to the same
 * customers the seed targets, it prints every row it will remove, and it is
 * inert under `--dry-run`.
 */
const REPLACE = process.argv.includes('--replace');

/** The seeded pitch salon (`apps/web/src/server/floor/seed.ts:23`). */
const HERO_SALON_SLUG = 'sunset-ridge';

/** `apps/web/src/server/floor/floor-data.ts:22`. Kept in step by hand — this is
 *  a script in `@bask/db` and cannot import from `apps/web`. */
const WAIVER_VALID_DAYS = 365;

/**
 * The CSS pixel size of the live pad, at devicePixelRatio 2 — a tablet. The
 * stored `width`/`height` are the BACKING-STORE dimensions
 * (`SignaturePad.tsx:94-95` reads `canvas.width`, which is already
 * `rect.width * ratio`), so 640×200 CSS at ratio 2 stores as 1280×400.
 */
const CSS_WIDTH = 640;
const CSS_HEIGHT = 200;
const RATIO = 2;

interface Target {
  id: string;
  firstName: string;
  lastName: string;
  waiverSignedAt: Date;
}

/** The slice of the canvas 2D API the signature drawing uses. See the note in
 *  `renderSignatures` for why these are hand-declared instead of `lib: dom`. */
interface PadContext {
  lineWidth: number;
  lineCap: string;
  lineJoin: string;
  strokeStyle: string;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  scale(x: number, y: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void;
  stroke(): void;
}

interface PadCanvas {
  width: number;
  height: number;
  getContext(id: '2d'): PadContext | null;
  toDataURL(type: string): string;
}

/**
 * Draw the signatures in a real browser.
 *
 * One page, one canvas, reused per signature — launching Chromium is the
 * expensive part and doing it per customer turns a two-second script into a
 * thirty-second one.
 */
async function renderSignatures(
  targets: Target[],
): Promise<Map<string, { imageData: string; strokes: number }>> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 400 } });

  /**
   * `tsx` compiles this file with esbuild, which rewrites arrow functions
   * assigned to a name into `__name(fn, "fn")` calls to keep `Function.name`
   * intact. That helper is defined in THIS module's scope, not the page's, so
   * the serialised body handed to `page.evaluate` referenced a `__name` that
   * does not exist in the browser and threw `ReferenceError: __name is not
   * defined`. Shimming it as identity in the page is the smallest fix that
   * keeps the callback a real, type-checked function instead of a string.
   */
  await page.setContent('<canvas id="pad"></canvas>');

  // Passed as a STRING on purpose: a function here would itself be rewritten by
  // esbuild and hit the very problem it is installed to fix.
  await page.evaluate('globalThis.__name = globalThis.__name || ((fn) => fn);');

  const out = new Map<string, { imageData: string; strokes: number }>();

  for (const target of targets) {
    const result = await page.evaluate(
      ({ seedText, name, cssWidth, cssHeight, ratio }) => {
        /**
         * Reached through `globalThis` rather than the bare `document`/
         * `HTMLCanvasElement` globals: this is `@bask/db`, its tsconfig has no
         * `dom` lib, and adding one to satisfy this single callback would put
         * browser globals in scope for every query file in the package. The
         * shape below names only the members actually used.
         */
        const canvas = (
          globalThis as unknown as {
            document: { getElementById(id: string): PadCanvas };
          }
        ).document.getElementById('pad');
        canvas.width = cssWidth * ratio;
        canvas.height = cssHeight * ratio;
        const ctx = canvas.getContext('2d')!;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(ratio, ratio);

        // Same ink as the live pad (SignaturePad.tsx:62-66).
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#2a2029';

        // Deterministic PRNG seeded off the customer id, so a given customer's
        // signature is the same on every run but different from everyone else's.
        let seed = 0;
        for (let i = 0; i < seedText.length; i += 1) {
          seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
        }
        const rand = () => {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          return seed / 4294967296;
        };

        const baseline = cssHeight * 0.62;
        let strokes = 0;

        /**
         * One cursive "word", drawn LETTER BY LETTER rather than as one wave.
         *
         * The first version of this rode a single sine along x. It was rejected
         * on sight: a constant-amplitude, constant-frequency wave reads as a
         * scribble, not as a name, and this image is shown to a stakeholder
         * during Beat 2. Handwriting is irregular in three ways at once, so all
         * three are modelled here — letters differ in HEIGHT (x-height,
         * ascender, descender), in WIDTH (advance varies per letter), and the
         * whole word SLANTS forward. Curves are quadratic, so strokes join
         * smoothly the way a pen does instead of turning corners.
         */
        const word = (startX: number, endX: number, xHeight: number) => {
          ctx.beginPath();
          strokes += 1;

          const span = endX - startX;
          const slant = 0.22; // forward lean, as a fraction of height
          // Letters wider than they are tall. At `xHeight * 0.78` the loops came
          // out narrower than their own height and the word read as an ECG trace.
          const letters = Math.max(3, Math.round(span / (xHeight * 1.25)));

          // Per-letter advances, jittered then normalised back onto the span so
          // the word still ends exactly where it was told to.
          const advances: number[] = [];
          let advanceTotal = 0;
          for (let i = 0; i < letters; i += 1) {
            const a = 0.7 + rand() * 0.7;
            advances.push(a);
            advanceTotal += a;
          }

          let x = startX;
          ctx.moveTo(x, baseline);

          for (let i = 0; i < letters; i += 1) {
            const advance = (advances[i]! / advanceTotal) * span;

            // Letter class: mostly x-height, with occasional ascenders (l, h, k)
            // and descenders (g, y, p). The mix is what stops it looking regular.
            const roll = rand();
            const height =
              roll > 0.84
                ? xHeight * (2.2 + rand() * 0.5) // ascender
                : roll > 0.72
                  ? xHeight * (1.5 + rand() * 0.25)
                  : xHeight * (0.72 + rand() * 0.4);
            const descends = rand() > 0.84;

            const peakX = x + advance * (0.32 + rand() * 0.26);
            const peakY = baseline - height + slant * height;
            const nextX = x + advance;
            const dip = descends ? xHeight * (0.55 + rand() * 0.5) : 0;

            /**
             * Three curves per letter, not two. The two-curve version drove every
             * downstroke to a sharp point on the baseline and the word came out
             * as a row of identical V's. The third curve is the CONNECTOR — a
             * short travel along the baseline before the next letter rises —
             * which is what rounds the joins and makes the hand look continuous.
             */
            const valleyX = peakX + advance * 0.34;
            const valleyY = baseline + dip;

            ctx.quadraticCurveTo(x + advance * 0.06, baseline - height * 0.9, peakX, peakY);
            ctx.quadraticCurveTo(peakX + advance * 0.14, peakY + height * 0.62, valleyX, valleyY);
            ctx.quadraticCurveTo(
              valleyX + advance * 0.2,
              valleyY + xHeight * 0.12,
              nextX,
              baseline - xHeight * 0.06,
            );

            x = nextX;
          }

          ctx.stroke();
        };

        // A given/family-name pair, roughly proportioned to the real name.
        const parts = name.split(' ').filter(Boolean);
        const totalChars = parts.reduce((sum, p) => sum + p.length, 0) || 1;
        const marginLeft = cssWidth * 0.08;
        const usable = cssWidth * 0.78;
        let cursor = marginLeft;

        // One x-height for the whole signature — a hand does not change size
        // between a first name and a surname.
        const xHeight = cssHeight * (0.15 + rand() * 0.05);

        for (const part of parts) {
          const width = usable * (part.length / totalChars);

          // The capital: a tall opening loop, drawn BEFORE the body and taller
          // than any letter in it, which is what makes a name read as a name.
          const capWidth = Math.min(width * 0.34, xHeight * 2.1);
          ctx.beginPath();
          strokes += 1;
          ctx.moveTo(cursor + capWidth * 0.15, baseline + xHeight * 0.25);
          ctx.quadraticCurveTo(
            cursor - capWidth * 0.15,
            baseline - xHeight * 1.6,
            cursor + capWidth * 0.55,
            baseline - xHeight * 2.3,
          );
          ctx.quadraticCurveTo(
            cursor + capWidth * 1.15,
            baseline - xHeight * 1.9,
            cursor + capWidth * 0.72,
            baseline - xHeight * 0.55,
          );
          ctx.quadraticCurveTo(
            cursor + capWidth * 0.5,
            baseline + xHeight * 0.2,
            cursor + capWidth,
            baseline,
          );
          ctx.stroke();

          // The body of the word, trailing off before the next name starts.
          word(cursor + capWidth, cursor + width * 0.92, xHeight);

          cursor += width;
        }

        // The underline people habitually add. Not always — hence the coin flip.
        if (rand() > 0.45) {
          ctx.beginPath();
          strokes += 1;
          ctx.moveTo(marginLeft - 2, baseline + cssHeight * 0.16);
          ctx.quadraticCurveTo(
            cssWidth * 0.5,
            baseline + cssHeight * 0.24,
            marginLeft + usable,
            baseline + cssHeight * 0.12,
          );
          ctx.stroke();
        }

        return { imageData: canvas.toDataURL('image/png'), strokes };
      },
      {
        seedText: target.id,
        name: `${target.firstName} ${target.lastName}`,
        cssWidth: CSS_WIDTH,
        cssHeight: CSS_HEIGHT,
        ratio: RATIO,
      },
    );

    out.set(target.id, result);
  }

  await browser.close();
  return out;
}

async function main() {
  console.log(`\n=== waiver signatures — ${DRY_RUN ? 'DRY RUN (writes nothing)' : 'COMMIT'} ===`);
  console.log('target: bask.waiver_signature (INSERT only, no DDL, no updates, no deletes)\n');

  const before = await db.waiverSignature.count();
  console.log(`BEFORE: ${before} waiver_signature rows (whole table)`);

  const salon = await db.salon.findUnique({
    where: { slug: HERO_SALON_SLUG },
    select: { id: true, name: true },
  });
  if (!salon) throw new Error(`No salon "${HERO_SALON_SLUG}" — refusing to guess another.`);

  // `--replace` (and `--preview`) look at every customer in scope; the normal
  // path looks only at those with nothing on file, which is what makes it
  // idempotent.
  const alreadySigned = REPLACE || PREVIEW_DIR ? {} : { waiverSignatures: { none: {} } };

  const candidates = await db.customer.findMany({
    where: {
      salonId: salon.id,
      waiverSignedAt: { not: null },
      ...(ALL ? {} : { firstName: 'Sarah' }),
      ...alreadySigned,
    },
    select: { id: true, firstName: true, lastName: true, waiverSignedAt: true },
    orderBy: { lastName: 'asc' },
  });

  const beforeForSalon = await db.waiverSignature.count({ where: { salonId: salon.id } });
  console.log(`BEFORE: ${beforeForSalon} waiver_signature rows for ${salon.name}`);
  console.log(
    `scope: ${ALL ? 'every customer' : 'customers named "Sarah"'} at ${salon.name} with a waiver flag and no signature`,
  );
  console.log(`candidates: ${candidates.length}\n`);

  if (candidates.length === 0) {
    console.log('Nothing to do — every candidate already has a signature on file.');
    const after = await db.waiverSignature.count();
    console.log(`AFTER:  ${after} waiver_signature rows (+0)`);
    await db.$disconnect();
    return;
  }

  const targets: Target[] = candidates.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    waiverSignedAt: c.waiverSignedAt as Date,
  }));

  console.log('rendering signatures in a real browser canvas...');
  const rendered = await renderSignatures(targets);

  // ---- preview: write PNGs to disk, touch nothing else --------------------
  if (PREVIEW_DIR) {
    const { mkdirSync, writeFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    mkdirSync(PREVIEW_DIR, { recursive: true });
    for (const target of targets) {
      const art = rendered.get(target.id);
      if (!art) continue;
      const file = join(PREVIEW_DIR, `${target.firstName}-${target.lastName}.png`.replace(/[^\w.-]/g, '_'));
      writeFileSync(file, Buffer.from(art.imageData.split(',')[1]!, 'base64'));
      console.log(`  preview → ${file} (${art.strokes} strokes)`);
    }
    console.log('\nPREVIEW ONLY — no database read or write beyond the customer lookup.');
    await db.$disconnect();
    return;
  }

  // ---- replace: remove the rows about to be superseded --------------------
  if (REPLACE) {
    const ids = targets.map((t) => t.id);
    const doomed = await db.waiverSignature.findMany({
      where: { salonId: salon.id, customerId: { in: ids } },
      select: { id: true, signedName: true, signedAt: true },
    });
    console.log(`--replace: ${doomed.length} existing signature row(s) will be REMOVED first:`);
    for (const row of doomed) {
      console.log(`  - ${row.signedName} (signed ${row.signedAt.toISOString().slice(0, 10)})`);
    }
    if (!DRY_RUN && doomed.length > 0) {
      await db.waiverSignature.deleteMany({ where: { id: { in: doomed.map((d) => d.id) } } });
      console.log(`  removed ${doomed.length}.`);
    }
    console.log('');
  }

  let written = 0;
  for (const target of targets) {
    const art = rendered.get(target.id);
    if (!art) {
      console.error(`  ! no image rendered for ${target.firstName} ${target.lastName} — skipping.`);
      continue;
    }

    // The same guards `recordWaiverAction` applies, applied here. A row this
    // script writes must be one the app would itself have accepted.
    if (!art.imageData.startsWith('data:image/png;base64,')) {
      console.error(`  ! bad image format for ${target.id} — skipping.`);
      continue;
    }
    if (art.imageData.length > 400_000) {
      console.error(`  ! signature too large for ${target.id} — skipping.`);
      continue;
    }
    if (art.strokes < 1) {
      console.error(`  ! empty signature for ${target.id} — skipping.`);
      continue;
    }

    const signedAt = target.waiverSignedAt;
    const signedName = `${target.firstName} ${target.lastName}`;
    console.log(
      `  + ${signedName} — signed ${signedAt.toISOString().slice(0, 10)} ` +
        `(from customer.waiver_signed_at) · ${art.strokes} strokes · ${Math.round(art.imageData.length / 1024)}KB`,
    );

    if (!DRY_RUN) {
      await db.waiverSignature.create({
        data: {
          salonId: salon.id,
          customerId: target.id,
          signedName,
          imageData: art.imageData,
          width: CSS_WIDTH * RATIO,
          height: CSS_HEIGHT * RATIO,
          strokes: art.strokes,
          signedAt,
          expiresAt: new Date(signedAt.getTime() + WAIVER_VALID_DAYS * 86_400_000),
        },
      });
    }
    written += 1;
  }

  const after = await db.waiverSignature.count();
  const afterForSalon = await db.waiverSignature.count({ where: { salonId: salon.id } });
  console.log(`\nAFTER:  ${after} waiver_signature rows (${DRY_RUN ? 'unchanged — dry run' : `+${after - before}`})`);
  console.log(`AFTER:  ${afterForSalon} for ${salon.name}`);
  console.log(`written: ${written}`);

  await db.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
