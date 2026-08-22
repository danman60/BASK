#!/usr/bin/env python3
"""Phase 3 — transcribe the UVALUX corpus with faster-whisper on the local 3060.

Writes <name>.json (segments + word timestamps) and <name>.srt per audio stream.
Resumable: a stream whose .json already exists and parses is skipped.
"""
import json, os, sys, time, glob, datetime

AUDIO = "/home/danman60/projects/uvalux-platform/data/salon-transcripts/audio"
OUT = "/home/danman60/projects/uvalux-platform/data/salon-transcripts/transcripts"
MODEL = os.environ.get("WHISPER_MODEL", "large-v3")
COMPUTE = os.environ.get("WHISPER_COMPUTE", "int8")

# The 3060 is shared with the broker's standing gemma4:12b (~8.9 GB resident, and it does
# NOT self-expire -- the broker keeps refreshing it). Measured headroom is ~2.8 GB, of which
# large-v3 int8 takes ~1.9 GB. Batched inference OOMs in that space; unbatched runs at
# 4.8x realtime and fits with ~900 MB spare. Do not reintroduce BatchedInferencePipeline
# here without re-measuring free VRAM first.
#
# P1060689_a1 is the SAME room and moment as a0, recorded on a second mic. Transcribing it
# would double compute and manufacture false corroboration in the Phase 5 clustering.
SKIP_STREAMS = set(filter(None, os.environ.get(
    "SKIP_STREAMS", "uvalux26_P1060689_a1").split(",")))

os.makedirs(OUT, exist_ok=True)


def log(msg):
    print(f"{datetime.datetime.now().isoformat(timespec='seconds')} {msg}", flush=True)


def srt_ts(t):
    h, rem = divmod(t, 3600)
    m, s = divmod(rem, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):06.3f}".replace(".", ",")


def main():
    from faster_whisper import WhisperModel

    # Smallest first: bank completed transcripts early so a late failure costs the least.
    files = sorted(glob.glob(os.path.join(AUDIO, "*.flac")), key=os.path.getsize)
    files = [f for f in files
             if os.path.splitext(os.path.basename(f))[0] not in SKIP_STREAMS]
    if not files:
        log("FATAL: no .flac in audio dir")
        return 1
    log(f"model={MODEL} compute={COMPUTE} unbatched files={len(files)} "
        f"skipped={sorted(SKIP_STREAMS)}")

    t0 = time.time()
    model = WhisperModel(MODEL, device="cuda", compute_type=COMPUTE)
    log(f"model loaded in {time.time()-t0:.1f}s")

    for path in files:
        name = os.path.splitext(os.path.basename(path))[0]
        jpath = os.path.join(OUT, f"{name}.json")
        if os.path.exists(jpath):
            try:
                json.load(open(jpath))
                log(f"SKIP {name} (already transcribed)")
                continue
            except Exception:
                log(f"REDO {name} (existing json unparseable)")

        log(f"START {name}")
        t = time.time()
        try:
            # OOM here means the broker grabbed more of the card. Back off and retry
            # rather than burning through the whole corpus emitting failures.
            for attempt in range(1, 5):
                try:
                    segments, info = model.transcribe(
                        path,
                        language="en",
                        vad_filter=True,
                        vad_parameters={"min_silence_duration_ms": 500},
                        word_timestamps=True,
                        condition_on_previous_text=False,
                    )
                    segs = []
                    for s in segments:  # generator: OOM surfaces during consumption
                        segs.append(s)
                    segments = segs
                    break
                except RuntimeError as e:
                    if "out of memory" not in str(e).lower() or attempt == 4:
                        raise
                    log(f"  {name} OOM on attempt {attempt}, backing off 180s")
                    time.sleep(180)
            segs = []
            for s in segments:
                segs.append({
                    "id": s.id, "start": round(s.start, 3), "end": round(s.end, 3),
                    "text": s.text.strip(),
                    "no_speech_prob": round(getattr(s, "no_speech_prob", 0.0), 4),
                    "avg_logprob": round(getattr(s, "avg_logprob", 0.0), 4),
                    "words": [
                        {"w": w.word, "s": round(w.start, 3), "e": round(w.end, 3),
                         "p": round(w.probability, 3)}
                        for w in (s.words or [])
                    ],
                })
            payload = {
                "source_stream": name,
                "audio_path": path,
                "media_duration_s": round(info.duration, 3),
                "language": info.language,
                "language_probability": round(info.language_probability, 4),
                "model": MODEL,
                "compute_type": COMPUTE,
                "segment_count": len(segs),
                "last_segment_end_s": segs[-1]["end"] if segs else 0.0,
                "transcribed_at": datetime.datetime.now().isoformat(timespec="seconds"),
                "wall_seconds": round(time.time() - t, 1),
                "segments": segs,
            }
            with open(jpath, "w") as f:
                json.dump(payload, f, ensure_ascii=False)
            with open(os.path.join(OUT, f"{name}.srt"), "w") as f:
                for i, s in enumerate(segs, 1):
                    f.write(f"{i}\n{srt_ts(s['start'])} --> {srt_ts(s['end'])}\n{s['text']}\n\n")

            dur = info.duration or 1
            cov = (payload["last_segment_end_s"] / dur) * 100
            log(f"DONE {name} segs={len(segs)} dur={dur:.0f}s "
                f"wall={payload['wall_seconds']:.0f}s speed={dur/max(payload['wall_seconds'],1):.1f}x "
                f"coverage={cov:.1f}%")
        except Exception as e:
            log(f"FAIL {name}: {type(e).__name__}: {e}")

    log("=== Phase 3 complete ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
