// Which H3 b-roll clips exist right now, and how long each one is.
//
//   node scripts/h3-manifest-v8.mjs      ->  src/h3-v8.json
//
// Run before every still/render of PromoV8. A slot whose clip is missing (or
// unreadable) falls back to a held still of the next product plate — never a
// black frame — and this script prints which slots fell back.
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SLOTS = ['open', 'frontdesk', 'listen', 'yes', 'owner-review', 'rep', 'team'];
const out = {};
for (const s of SLOTS) {
  const f = join(root, 'public', 'h3', 'v8', `${s}.mp4`);
  if (!existsSync(f)) {
    out[s] = null;
    continue;
  }
  try {
    const p = JSON.parse(
      execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_packets',
        '-show_entries', 'stream=width,height,nb_read_packets,r_frame_rate:format=duration', '-of', 'json', f]).toString(),
    );
    const st = p.streams[0];
    const [n, d] = st.r_frame_rate.split('/').map(Number);
    const dur = Number(p.format.duration);
    out[s] = { src: `h3/v8/${s}.mp4`, seconds: dur, frames30: Math.floor(dur * 30), w: st.width, h: st.height, fps: n / d };
  } catch (e) {
    out[s] = null;
  }
}
writeFileSync(join(root, 'src', 'h3-v8.json'), JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out)) console.log(v ? `ok        ${k}  ${v.seconds.toFixed(2)}s ${v.w}x${v.h}` : `FALLBACK  ${k}  (missing — held still of next plate)`);
