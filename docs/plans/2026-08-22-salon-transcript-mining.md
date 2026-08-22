# Plan — UVALUX audio corpus → salon ownership/management advice, ingestible into Bask

**Purpose line (verbatim):** *This exists so that Daniel has, by the morning of 2026-08-22, a fully
analysed/parsed report of what can be ingested into the app, with discrete provenance, from
transcribing all the local UVALUX audio/video and searching it for good salon ownership/management
advice.*

Checked against THAT line, not against this plan.

---

## Source corpus (verified 2026-08-22 00:00 EDT via ffprobe on FIRMAMENT)

| # | File | Dur | Streams | Notes |
|---|---|---|---|---|
| 1 | `J:\Uva25\Uvalux46RoomB_All_Presentations.mov` | 3:56:19 | hevc + pcm_s24le 48k **stereo** | 38.0 GB. Longest single asset. |
| 2 | `J:\UvaSummer25\REC00241.WAV` | 31:00 | pcm_s24le 48k mono | field recorder |
| 3 | `J:\UvaSummer25\REC00242.WAV` | 31:00 | " | |
| 4 | `J:\UvaSummer25\REC00243.WAV` | 31:00 | " | |
| 5 | `J:\UvaSummer25\REC00244.WAV` | 5:38 | " | tail of the 241–244 set |
| 6 | `J:\UvaSummer25\REC00334.WAV` | 31:00 | " | |
| 7 | `J:\UvaSummer25\REC00335.WAV` | 31:00 | " | |
| 8 | `J:\UvaSummer25\REC00336.WAV` | 31:00 | " | |
| 9 | `J:\UvaSummer25\REC00337.WAV` | 7:18 | " | tail of the 334–337 set |
| 10 | `J:\Uvalux26\RoomBLocked\P1060686.MOV` | 1:11:36 | hevc + pcm_s24be mono | 5.0 GB |
| 11 | `…\P1060687.MOV` | 54:12 | " | 3.9 GB |
| 12 | `…\P1060688.MOV` | 1:18:57 | " | 5.3 GB |
| 13 | `…\P1060689.MOV` | 53:58 | hevc + **4× pcm_s24be mono** | **57.3 GB** — size/duration implies 142 Mbps; header duration is SUSPECT (companion `.reclaimtmp` implies a filesystem recovery). All 4 audio streams extracted separately. |
| 14 | `…\P1060690.MOV` | 1:07:28 | hevc + pcm_s24be mono | 7.4 GB |
| 15 | `M:\UVASummer24\FullAudio.wav` | 46:21 | pcm_s32le 48k stereo | |
| — | `…\P1060689.MOV.reclaimtmp.mov` | — | — | **UNUSABLE.** `moov atom not found` — 874 MB recovery fragment with no index. Reported as SKIP with reason, never as PASS. |

**Total usable: 13 h 27 m 53 s across 15 files (18 audio streams).**

## Environment (verified, not assumed)

- FIRMAMENT: `ffmpeg`/`ffprobe` present. **No torch / faster-whisper / whisperx / pyannote** — GPU
  work there is ollama-only.
- SPYBALLOON: `faster_whisper 1.2.1`, `torch 2.11.0+cu130`, CUDA OK, **RTX 3060 12 GB**.
- Broker (`:3110`): both cards **paused**, 5 tasks pending, `current: null`. 3060 holds
  `gemma4:12b` (8991 MB) with keep_alive expiring ~00:28 EDT. **Do not unpause, do not evict** —
  the extraction phase costs no local GPU and the model self-expires before Whisper needs the card.
- `J:` = "ColdestStorage", sequential read measured **223.9 MB/s**; 1.79 TB free. `C:` 898 GB free.
- SPYBALLOON `/` has **26 GB free (90 % used)** — the reason audio lands as 16 kHz mono FLAC
  (~0.6 GB for the whole corpus) rather than WAV (~1.9 GB) and the 148 GB of source never crosses
  the network.

## Phases

### Phase 1 — audio extraction (FIRMAMENT, running)
`ffmpeg -map 0:a:N -vn -ac 1 -ar 16000 -c:a flac` per stream → `C:\uvalux-audio\<name>.flac`.
`-vn` means no HEVC decode; the cost is the 148 GB sequential read (~11 min at measured speed) plus
demux. Log: `data/salon-transcripts/extract.log`, one `DONE <name> rc= secs= bytes=` line per stream.

**Acceptance:** 18 FLACs exist with non-zero size; every `rc=0`; sum of decoded durations within
1 % of the ffprobe table above. Any `rc!=0` is named in the report, not silently dropped.

### Phase 2 — transfer
`rsync` the FLAC set to `data/salon-transcripts/audio/`. **Acceptance:** byte counts match Phase 1's
logged sizes.

### Phase 3 — transcription (SPYBALLOON 3060)
`faster-whisper large-v3`, `int8_float16`, VAD filter on, word timestamps on, English.
Per stream → `transcripts/<name>.json` (segments + words) and `<name>.srt`.

**Acceptance:** per file, a JSON with ≥1 segment and a last-segment `end` within 2 % of the ffprobe
duration. A file whose transcript ends early is a **truncation finding**, reported as such —
especially `P1060689`, whose header duration is already suspect.

### Phase 4 — advice mining (local model via the broker's 3060 lane, `gemma4:12b`)
Transcripts chunked into ~8-minute windows with 45 s overlap. Each window is a read-heavy →
write-light extraction (the shape the locals are measurably good at): return **only** advice about
salon ownership or management, each as a record:

```
{ claim, verbatim_quote, source_file, stream, t_start, t_end, topic, confidence }
```

Hard rules in the prompt: quote must be verbatim from the window; no claim without a quote; return
`[]` for junk (a large fraction of this corpus is junk by the user's own statement, and an empty
window is a correct answer, not a failed one). **The local model extracts; it never judges whether
advice is good** — same reason locals run gates but never grade them.

### Phase 5 — synthesis + ingest mapping (me)
Dedupe near-identical claims across files, cluster by topic, and map each cluster to the surface it
could actually feed. Candidate targets, all of which already exist — no new machinery:
- `packages/ui/src/guidance/guidance.ts` — the guidance dictionary (grade-7 register).
- Monitor **coaching patterns** (`packages/core/src/monitor/types.ts`).
- Opportunity Engine **plays** (`packages/core/src/opportunities/types.ts`).
- Pitch/marketing copy.
Anything with no existing home is listed as *no target — needs a decision*, never invented.

`packages/db/scripts/salon-ingest/` is the **POS-data ETL** (customers, visits, transactions) and is
NOT the target for advice content. Checked, not assumed.

### Deliverable
`docs/ingest/2026-08-22-salon-advice-corpus.md` — the morning report. Every row carries discrete
provenance: source file, audio stream, `t_start–t_end`, verbatim quote. Plus a coverage table
(what transcribed clean, what was junk, what failed and why), and the raw records as JSON beside it.

## Risks logged up front
- `P1060689.MOV` size/duration mismatch → likely truncated or mis-indexed. Verified at Phase 3, not
  assumed either way.
- The `.reclaimtmp` fragment is unrecoverable without a `moov` atom; `untrunc` is not installed.
  It is a fragment of #13. Listed as SKIP.
- Room recordings are multi-speaker with no diarization installed (`pyannote` absent everywhere).
  Speaker attribution is therefore **out of scope** and will not be claimed. Provenance is
  file+timestamp, which is what was asked for.
- Whisper will hallucinate over silence; VAD filtering on, and every mined claim is anchored to a
  verbatim quote so a hallucinated span can be checked against the audio.
