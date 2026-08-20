/**
 * `tsx scripts/knowledge/extract-expo.ts` — turn the UVALUX 2026 Expo recordings
 * into the normalized document corpus the knowledge base ingests.
 *
 * READ-ONLY against the source, and it writes nothing but its own output file.
 * No database, no network, no LLM. Safe to run any time.
 *
 * WHY THIS EXISTS
 * Nick named the moat himself: the coaching knowledge nobody else has — Elaine's
 * material, Mike Blore's numbers, Sarah's product sessions. Two of those three are
 * already on the record in the 2026 expo recordings. This turns 9.6 hours of room
 * audio into per-session documents that carry WHO said it, WHICH session, and WHEN,
 * because an answer that can cite "Mike Blore, Room B, 2:50 PM" is UVALUX's
 * knowledge base. An answer that can't is a generic tanning chatbot.
 *
 * ANCHORING
 * The published agendas (photographed at the event) are ground truth for what was
 * said when. Room A's talk titles are brand names that appear verbatim in speech,
 * so sessions anchor on keywords. Room B's titles ("The Power of Numbers") have no
 * repeatable spoken keyword, so its sessions anchor proportionally on the clock.
 * That split is not a preference — it is what the gallery's own `gen-insights.py`
 * established, and changing it silently re-cuts every session boundary.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../../..');

/** The gallery that owns the transcripts. Overridable for a different checkout. */
const SOURCE_DIR =
  process.env.EXPO_SOURCE_DIR ??
  resolve(REPO, '../CommandCentered/client-galleries/uvalux26-expo');

const OUT_PATH = resolve(REPO, 'packages/db/fixtures/knowledge/uvalux26-expo.jsonl');

/**
 * Agenda rows that are not content. Matches the gallery's own skip list so the
 * corpus and the published gallery agree on what counts as a session.
 */
const SKIP = new Set([
  'lunch',
  'break',
  'afternoon break',
  'wrap up',
  'meet & greet',
  'housekeeping / uvalux icons',
  'yoga / sun salutation',
]);

type Segment = { id: number; start: number; end: number; text: string };
type Transcript = { wav: string; duration: number; segment_count: number; segments: Segment[] };
type AgendaRow = { time: string; title: string; speaker?: string };
type Agenda = { room: string; sessions: AgendaRow[] };

type Room = {
  key: 'room1' | 'room2';
  /** Who was in the room. Drives retrieval filtering: staff training vs owner coaching. */
  audience: 'employees' | 'owners';
  mode: 'keyword' | 'clock';
};

const ROOMS: Room[] = [
  { key: 'room1', audience: 'employees', mode: 'keyword' },
  { key: 'room2', audience: 'owners', mode: 'clock' },
];

/**
 * How much to trust this document's SESSION ATTRIBUTION (its title and speaker).
 *
 * `anchored` — the slice begins where the talk's own title was spoken aloud.
 *   Safe to cite as "<speaker> said this, in <title>".
 * `interpolated` — the slice was positioned by clock arithmetic off the published
 *   agenda. The TEXT is verbatim either way, but the title/speaker on it is a best
 *   guess and is known to drift: Room B's clock mapping put "The Power of Numbers"
 *   over a New Sunshine rep talking about Marty Sperry. Cite room and timestamp
 *   (both exact); do NOT put words in a named person's mouth from one of these.
 */
type TitleConfidence = 'anchored' | 'interpolated';

/** A session document: one agenda row's worth of speech, with provenance. */
type KnowledgeDoc = {
  corpus: 'uvalux26-expo';
  source: string;
  room: string;
  audience: Room['audience'];
  title: string;
  speaker: string | null;
  /** See TitleConfidence. Retrieval must respect this before attributing a quote. */
  titleConfidence: TitleConfidence;
  scheduledTime: string;
  startSec: number;
  endSec: number;
  words: number;
  text: string;
};

function loadJson<T>(path: string): T {
  if (!existsSync(path)) {
    throw new Error(
      `Source file missing: ${path}\n` +
        `Set EXPO_SOURCE_DIR if the gallery lives elsewhere. Nothing was written.`,
    );
  }
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

/** "2:50 PM" -> minutes since midnight. Returns null on anything unparseable. */
function parseClock(s: string): number | null {
  const m = /^(\d+):(\d+)\s*(AM|PM)$/i.exec(s.trim());
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
}

/**
 * Split a title into searchable keywords, mirroring the gallery's splitter: on
 * `/` and `&`, which is what separates co-presenting brands.
 *
 * Deliberately PHRASE-level, not word-level. Splitting into individual words was
 * tried and made anchoring worse, not better: "skin" out of "Designer Skin"
 * matches mid-sentence in an unrelated talk, and because anchors are monotonic
 * one false hit cascades through the rest of the day (it collapsed Designer Skin
 * to 115 words and let California Tan swallow 15,605). Titles that no phrase can
 * reach are handled by the clock fallback below instead.
 */
function keywords(title: string): string[] {
  return title
    .split(/[/&]/)
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.length >= 4);
}

/** Earliest segment at or after `from` whose text contains any keyword. */
function findAnchor(lowered: string[], kws: string[], from: number): number | null {
  for (let i = from; i < lowered.length; i++) {
    for (const kw of kws) {
      if (lowered[i].includes(kw)) return i;
    }
  }
  return null;
}

/** Index of the first segment starting at or after `sec`. */
function secToIdx(segs: Segment[], sec: number): number {
  for (let i = 0; i < segs.length; i++) {
    if (segs[i].start >= sec) return i;
  }
  return Math.max(0, segs.length - 1);
}

/**
 * Resolve each agenda row to a [startIdx, endIdx) slice of the transcript.
 * Rows that cannot be anchored come back null and are reported, never silently
 * dropped — a missing session is a finding about the anchoring, not a non-event.
 */
function sliceSessions(
  segs: Segment[],
  agenda: Agenda,
  mode: Room['mode'],
  duration: number,
): Array<{ row: AgendaRow; startIdx: number; endIdx: number; confidence: TitleConfidence } | null> {
  const rows = agenda.sessions;
  const lowered = segs.map((s) => s.text.toLowerCase());
  const starts: Array<number | null> = new Array(rows.length).fill(null);
  // Clock mode never anchors on spoken content, so nothing in it is `anchored`.
  const confidence: TitleConfidence[] = new Array(rows.length).fill('interpolated');

  if (mode === 'clock') {
    // Map clock times proportionally onto the recording. The first agenda row is
    // t=0 of the recording and the last row is the end, which is what the room's
    // published schedule implies when the recorder ran for the whole day.
    const times = rows.map((r) => parseClock(r.time));
    const first = times.find((t) => t !== null) ?? 0;
    const lastIdx = [...times].reverse().findIndex((t) => t !== null);
    const last = lastIdx === -1 ? first + 1 : (times[times.length - 1 - lastIdx] as number);
    const span = Math.max(1, last - first);
    for (let i = 0; i < rows.length; i++) {
      const t = times[i];
      if (t === null) continue;
      starts[i] = secToIdx(segs, ((t - first) / span) * duration);
    }
  } else {
    // Keyword: each session must anchor at or after the previous one, so the
    // day cannot run backwards even if a brand is named in an earlier talk.
    let cursor = 0;
    for (let i = 0; i < rows.length; i++) {
      const kws = keywords(rows[i].title);
      const at = kws.length ? findAnchor(lowered, kws, cursor) : null;
      if (at !== null) {
        starts[i] = at;
        confidence[i] = 'anchored';
        cursor = at + 1;
      }
    }

    // Fallback for rows no keyword could reach — a phrase title like "Guess That
    // Lotion with Sarah", or anything scheduled after the last brand name in the
    // room. Interpolate them on the clock BETWEEN their nearest anchored
    // neighbours, so a keyword hit always wins and the clock only fills gaps.
    // Without this the tail of the day is silently lost, which cost us Sarah's
    // session on the first run.
    const times = rows.map((r) => parseClock(r.time));
    for (let i = 0; i < rows.length; i++) {
      if (starts[i] !== null || times[i] === null) continue;

      let prev = -1;
      for (let j = i - 1; j >= 0; j--) {
        if (starts[j] !== null && times[j] !== null) { prev = j; break; }
      }
      let next = -1;
      for (let j = i + 1; j < rows.length; j++) {
        if (starts[j] !== null && times[j] !== null) { next = j; break; }
      }

      if (prev !== -1 && next !== -1) {
        // Between two known points: position proportionally by clock.
        const span = (times[next] as number) - (times[prev] as number);
        const frac = span > 0 ? ((times[i] as number) - (times[prev] as number)) / span : 0;
        const a = starts[prev] as number;
        const b = starts[next] as number;
        starts[i] = Math.min(b, Math.max(a, Math.round(a + frac * (b - a))));
      } else if (next !== -1) {
        // Before the first anchored row — this is the top of the recording.
        starts[i] = 0;
      } else if (prev !== -1) {
        // After the last anchored row: extrapolate at the day's average pace.
        const anchored = rows
          .map((_, j) => ({ j, idx: starts[j], t: times[j] }))
          .filter((x) => x.idx !== null && x.t !== null) as Array<{ j: number; idx: number; t: number }>;
        const firstA = anchored[0];
        const lastA = anchored[anchored.length - 1];
        const dt = lastA.t - firstA.t;
        const perMin = dt > 0 ? (lastA.idx - firstA.idx) / dt : 0;
        const projected = Math.round(lastA.idx + perMin * ((times[i] as number) - lastA.t));
        starts[i] = Math.min(segs.length - 1, Math.max(lastA.idx, projected));
      }
    }
  }

  return rows.map((row, i) => {
    const startIdx = starts[i];
    if (startIdx === null) return null;
    // The slice runs to the next anchored row, whatever it is — including a
    // skipped row like Lunch, which correctly ends the talk before it.
    let endIdx = segs.length;
    for (let j = i + 1; j < rows.length; j++) {
      if (starts[j] !== null) {
        endIdx = starts[j] as number;
        break;
      }
    }
    return { row, startIdx, endIdx: Math.max(startIdx, endIdx), confidence: confidence[i] };
  });
}

function countWords(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

function main(): void {
  const docs: KnowledgeDoc[] = [];
  const unanchored: string[] = [];
  let corpusWords = 0;

  for (const room of ROOMS) {
    const tPath = join(SOURCE_DIR, `${room.key}-transcript.json`);
    const aPath = join(SOURCE_DIR, `${room.key}-agenda.json`);
    const transcript = loadJson<Transcript>(tPath);
    const agenda = loadJson<Agenda>(aPath);
    const segs = transcript.segments;
    const duration = transcript.duration || (segs.length ? segs[segs.length - 1].end : 0);

    corpusWords += segs.reduce((n, s) => n + countWords(s.text), 0);

    const sliced = sliceSessions(segs, agenda, room.mode, duration);

    sliced.forEach((slice, i) => {
      const row = agenda.sessions[i];
      const isSkip = SKIP.has(row.title.trim().toLowerCase());
      if (!slice) {
        if (!isSkip) unanchored.push(`${room.key} "${row.title}" (${row.time})`);
        return;
      }
      if (isSkip) return;

      const window = segs.slice(slice.startIdx, slice.endIdx);
      const text = window
        .map((s) => s.text.trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (!text) {
        unanchored.push(`${room.key} "${row.title}" (empty slice)`);
        return;
      }

      docs.push({
        corpus: 'uvalux26-expo',
        source: `${room.key}-transcript.json`,
        room: agenda.room,
        audience: room.audience,
        title: row.title.trim(),
        speaker: row.speaker?.trim() ? row.speaker.trim() : null,
        titleConfidence: slice.confidence,
        scheduledTime: row.time,
        startSec: window[0].start,
        endSec: window[window.length - 1].end,
        words: countWords(text),
        text,
      });
    });
  }

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, docs.map((d) => JSON.stringify(d)).join('\n') + '\n', 'utf8');

  const kept = docs.reduce((n, d) => n + d.words, 0);
  const pct = corpusWords ? ((kept / corpusWords) * 100).toFixed(1) : '0.0';

  console.log(`\nUVALUX 2026 Expo → ${OUT_PATH}`);
  console.log(`${docs.length} session documents · ${kept.toLocaleString()} words kept ` +
    `of ${corpusWords.toLocaleString()} transcribed (${pct}%)\n`);

  for (const d of docs) {
    const mins = (sec: number) => `${Math.floor(sec / 3600)}h${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}m`;
    const who = d.speaker ? ` — ${d.speaker}` : '';
    const flag = d.titleConfidence === 'anchored' ? ' ' : '~';
    console.log(
      `${flag} ${d.audience.padEnd(9)} ${mins(d.startSec)}–${mins(d.endSec)}  ` +
        `${String(d.words).padStart(6)}w  ${d.title}${who}`,
    );
  }
  const approx = docs.filter((d) => d.titleConfidence === 'interpolated').length;
  console.log(
    `\n~ = session attribution is INTERPOLATED (${approx} of ${docs.length}); the text is ` +
      `verbatim but the title/speaker on it is a clock-derived guess. Do not attribute\n` +
      `    a quote to a named person from one of these — cite room + timestamp instead.`,
  );

  if (unanchored.length) {
    console.log(`\n${unanchored.length} agenda row(s) could not be anchored:`);
    for (const u of unanchored) console.log(`  - ${u}`);
    console.log('These are reported, not dropped silently. Check the agenda against the audio.');
  }
  console.log('');
}

main();
