// Records which H3 clips have actually landed in promo/public/h3, so the film
// can be cut and reviewed before the last render finishes.
//
// It believes the file, not the render log: a clip counts as present only if
// ffprobe reads a non-zero duration out of it. An exit code from a renderer
// proves the process ended, not that there is video in the file.
//
//   node scripts/film-clips.mjs
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clipDir = path.resolve(here, '../public/h3');
const out = path.resolve(here, '../src/filmClips.json');

fs.mkdirSync(clipDir, { recursive: true });

const duration = (file) => {
  try {
    const s = execFileSync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', file,
    ], { encoding: 'utf8' }).trim();
    const d = Number(s);
    return Number.isFinite(d) && d > 0 ? d : 0;
  } catch {
    return 0;
  }
};

const present = [];
const rejected = [];
/* Real clip lengths, because the draft pass renders 5.167s clips into slots the
   final pass will fill with 15.083s ones. The assembly loops a clip that is
   shorter than its slot rather than freezing on its last frame — a freeze reads
   as a broken render, a loop reads as a placeholder. */
const seconds = {};
for (const name of fs.readdirSync(clipDir).filter((f) => f.endsWith('.mp4')).sort()) {
  const d = duration(path.join(clipDir, name));
  if (d > 0) {
    present.push(name);
    seconds[name] = Math.round(d * 1000) / 1000;
  } else {
    rejected.push(name);
  }
}

fs.writeFileSync(out, JSON.stringify({ present, seconds, rejected }, null, 2) + '\n');
console.log(`present: ${present.length}`, present.join(', ') || '(none)');
if (rejected.length) console.log(`UNREADABLE: ${rejected.join(', ')}`);
