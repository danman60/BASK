// Key-frame stills for PromoV8, one bundle, many frames.
//   node scripts/v8-stills.mjs <outDir> <frame> [<frame> ...]
//   node scripts/v8-stills.mjs <outDir> --keys     (frames listed in out/v8-keys.json)
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [outDir, ...rest] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
let frames;
if (rest[0] === '--keys') frames = JSON.parse(readFileSync(rest[1], 'utf8'));
else frames = rest.map((x) => ({ frame: Number(x), name: `f${x}` }));
const serveUrl = await bundle({ entryPoint: join(root, 'src/index.ts'), publicDir: join(root, 'public') });
const composition = await selectComposition({ serveUrl, id: 'PromoV8', inputProps: { bgm: false } });
for (const { frame, name } of frames) {
  const out = join(outDir, `${String(frame).padStart(5, '0')}-${name}.jpg`);
  await renderStill({ composition, serveUrl, output: out, frame, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.5, inputProps: { bgm: false } });
  console.log(out);
}
