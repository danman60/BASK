#!/usr/bin/env python3
"""Phase 5b — render the morning report from advice-corpus.json.

Every claim printed here carries discrete provenance: source file, audio stream index,
timecode, and the verbatim quote it was extracted from. Nothing is asserted that a
quote cannot back.
"""
import json, os, glob, datetime, collections

ROOT = "/home/danman60/projects/uvalux-platform/data/salon-transcripts"
OUT = "/home/danman60/projects/uvalux-platform/docs/ingest/2026-08-22-salon-advice-corpus.md"

man = json.load(open(f"{ROOT}/manifest.json"))
MAN = {s["stream"]: s for s in man["streams"]}
corpus = json.load(open(f"{ROOT}/advice-corpus.json"))
per_stream = {s["source_stream"]: s for s in corpus["per_stream"]}

CAT_LABEL = {"marketing": "Marketing", "membership": "Memberships", "retail": "Retail",
             "operations": "Operations", "customer": "Customers", "coaching": "Coaching",
             "unclassified": "Unclassified"}
MOMENT_LABEL = {"greeting": "Greeting", "needs": "Asked needs", "product": "Product",
                "membership": "Membership", "close": "Close", "none": "—"}


def hms(t):
    h, r = divmod(int(t), 3600)
    m, s = divmod(r, 60)
    return f"{h}:{m:02d}:{s:02d}"


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    clusters = corpus["clusters"]
    L = []
    w = L.append

    w("# UVALUX audio corpus → salon ownership & management advice")
    w("")
    w(f"*Generated {corpus['generated_at']} · "
      f"{corpus['raw_item_count']} extracted statements → **{corpus['cluster_count']} distinct pieces of advice***")
    w("")
    w("Every row below carries discrete provenance: source file, audio stream, timecode, and the "
      "verbatim quote it came from. A claim that could not be anchored to a verbatim quote in its "
      "own transcript window was **rejected**, not kept — rejection counts are in the QA table.")
    w("")

    # ---- what this is and is not -----------------------------------------
    w("## Read this first")
    w("")
    w("- **Speaker attribution is not available.** No diarization stack is installed on either "
      "machine, so this corpus says *what was said and when*, never *who said it*. Do not ingest "
      "these as attributed quotes.")
    w("- **Transcription is machine-made.** Source audio is hot and clipping "
      "(−8.6 LUFS, true peak +1.3 dBFS). `large-v3` handled it well, but proper nouns — company "
      "names in particular — are the weak point. Verify any name before it reaches a customer-facing "
      "surface.")
    w("- **Most of the corpus is not advice.** That was expected. Windows returning nothing are "
      "counted below rather than hidden, so you can see the signal-to-junk ratio honestly.")
    w("")

    # ---- the advice ------------------------------------------------------
    by_cat = collections.defaultdict(list)
    for c in clusters:
        by_cat[c["category"]].append(c)

    w("## The advice, by category")
    w("")
    w("Ranked by corroboration first (said at the most separate events), then concreteness. "
      "`×N` = how many separate times it was said across the corpus.")
    w("")

    for cat in ["operations", "membership", "retail", "marketing", "customer", "coaching",
                "unclassified"]:
        items = by_cat.get(cat)
        if not items:
            continue
        w(f"### {CAT_LABEL[cat]} ({len(items)})")
        w("")
        for i, c in enumerate(items, 1):
            badge = f"`{CAT_LABEL[c['category']]}`"
            if c["moment"] != "none":
                badge += f" · moment: `{MOMENT_LABEL[c['moment']]}`"
            if c["is_script"]:
                badge += " · **front-desk script**"
            if c["specificity"] == "concrete":
                badge += " · concrete"
            w(f"**{i}. {c['claim']}**  ")
            w(f"{badge} · ×{c['times_said']} across {c['distinct_events']} event(s)")
            w("")
            for p in c["provenance"]:
                w(f"> {p['quote']}")
                w(f">")
                w(f"> — `{p['knowledge_ref']}` · {p['timecode']} · "
                  f"`{os.path.basename(p['source_file'] or '?')}` stream {p['audio_stream_index']}")
                w("")
        w("")

    # ---- ingest targets --------------------------------------------------
    w("## Where each of these can be ingested")
    w("")
    w("These are surfaces that **already exist** in the codebase — nothing new was invented to "
      "hold this content.")
    w("")
    w("| Target | Field / file | What goes there | Count available |")
    w("|---|---|---|---|")
    scripts = sum(1 for c in clusters if c["is_script"])
    moments = sum(1 for c in clusters if c["moment"] != "none")
    coaching = len(by_cat.get("coaching", []))
    w(f"| Monitor coaching insights | `MonitorInsight.knowledgeRef` in "
      f"`packages/core/src/monitor/types.ts` — documented as *\"pointer into the UVALUX knowledge "
      f"corpus, e.g. `Room A · 10:42`\"* | Every item here already emits that exact ref shape | "
      f"{len(clusters)} |")
    w(f"| Front-desk scripts | `FrontDeskScriptAction.script` in "
      f"`packages/core/src/opportunities/types.ts` | Advice that is literal words to say to a "
      f"customer | {scripts} |")
    w(f"| Coachable-moment scoring | `MOMENT_KEYS` in `monitor/types.ts` | Advice tagged to one of "
      f"the five scored moments — the rubric behind a score | {moments} |")
    w(f"| Opportunity plays | `OPPORTUNITY_CATEGORIES` in `opportunities/types.ts` | Advice already "
      f"carries a valid category, so it maps without a translation layer | {len(clusters)} |")
    w(f"| Guidance dictionary | `packages/ui/src/guidance/guidance.ts` | Grade-7 rewrites of the "
      f"general advice, as `why`/`how` copy | {len(clusters) - scripts} |")
    w("")
    w("**Not a target:** `packages/db/scripts/salon-ingest/` is the POS-data ETL "
      "(customers, visits, transactions). Advice content does not belong there.")
    w("")

    # ---- coverage / QA ---------------------------------------------------
    w("## Coverage and QA — what actually got processed")
    w("")
    w("| Stream | Event | Duration | Transcript | Windows | Advice kept | Rejected (no verbatim match) |")
    w("|---|---|---|---|---|---|---|")
    total_dur = kept_all = rej_all = 0
    for s in man["streams"]:
        st = s["stream"]
        tj = f"{ROOT}/transcripts/{st}.json"
        ps = per_stream.get(st)
        if os.path.exists(tj):
            t = json.load(open(tj))
            cov = f"{t['segment_count']} segs"
            if t["segment_count"] == 0:
                cov = "**0 segs — silent**"
            total_dur += s["duration_s"]
        else:
            cov = "*not transcribed*"
        kept = ps["items_kept"] if ps else "—"
        rej = ps["items_rejected_no_verbatim_match"] if ps else "—"
        win = ps["windows_total"] if ps else "—"
        if isinstance(kept, int):
            kept_all += kept
            rej_all += rej
        w(f"| `{st}` | {s['event']} | {hms(s['duration_s'])} | {cov} | {win} | {kept} | {rej} |")
    w("")
    w(f"**Totals:** {hms(total_dur)} of audio transcribed · {kept_all} anchored statements kept "
      f"· {rej_all} rejected for failing the verbatim-quote gate · "
      f"{kept_all - corpus['raw_item_count']} more collapsed as window-overlap duplicates "
      f"· **{corpus['raw_item_count']} unique statements → {corpus['cluster_count']} distinct "
      f"pieces of advice**.")
    w("")

    # ---- exclusions ------------------------------------------------------
    w("## Excluded, and why")
    w("")
    for e in man["excluded"]:
        w(f"- **`{os.path.basename(e['source'])}`** — {e['status']}. {e['reason']}")
    w("- **`uvalux26_P1060689_a1`** — SKIP. Same room, same moment as `a0`, second microphone. "
      "Transcribing it would double compute and manufacture false corroboration in the clustering.")
    w("- **`uvalux26_P1060689_a2` / `a3`** — transcribed, **0 segments across 54 minutes each**. "
      "Confirmed digital silence; that camera recorded 2 real channels, not 4.")
    w("")
    w("## How this was produced")
    w("")
    w("1. `ffmpeg` on FIRMAMENT extracted 16 kHz mono FLAC from 148 GB of source on `J:`/`M:` — "
      "the source never crossed the network.")
    w("2. `faster-whisper large-v3` (int8, unbatched) on the SPYBALLOON 3060, VAD-filtered, with "
      "word timestamps. Unbatched because the card is shared with the broker's resident "
      "`gemma4:12b` and only ~2.8 GB was free.")
    w("3. `gemma4:12b` read 8-minute windows (45 s overlap) and extracted advice into the app's own "
      "taxonomies. The model **extracts and anchors; it never judges** whether advice is good.")
    w("4. Every extracted item was gated: the quote must appear verbatim in that window's text and "
      "the cited segment ids must be real. Failures were dropped and counted.")
    w("5. Near-duplicate claims were clustered with `all-MiniLM-L6-v2` so advice repeated across "
      "the 2024/2025/2026 events is one item with several provenance anchors.")
    w("")
    w(f"Raw data: `data/salon-transcripts/` — `manifest.json` (ground truth), `transcripts/*.json` "
      f"(full text + word timings), `mined/*.advice.json`, `advice-corpus.json`.")

    open(OUT, "w").write("\n".join(L) + "\n")
    print(f"wrote {OUT} ({len(L)} lines, {len(clusters)} clusters)")


if __name__ == "__main__":
    main()
