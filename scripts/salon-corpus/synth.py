#!/usr/bin/env python3
"""Phase 5 — dedupe + cluster mined advice, emit the ingestible JSON payload.

Clusters near-identical claims that recur across recordings (the same advice given at
the 2024, 2025 and 2026 events is ONE item with three provenance anchors, not three
items). Writes advice-corpus.json; the human report is written on top of it.
"""
import json, glob, os, re, sys, datetime, collections

ROOT = "/home/danman60/projects/uvalux-platform/data/salon-transcripts"
MINED = f"{ROOT}/mined"
OUT = f"{ROOT}/advice-corpus.json"
SIM_THRESHOLD = 0.78

MAN = {s["stream"]: s for s in json.load(open(f"{ROOT}/manifest.json"))["streams"]}


def hhmmss(t):
    h, rem = divmod(int(t), 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def knowledge_ref(item):
    """The `Room A · 10:42` shape MonitorInsight.knowledgeRef already documents."""
    m = MAN.get(item["source_stream"], {})
    return f"{m.get('label_prefix', item['source_stream'])} · {hhmmss(item['t_start'])}"


def main():
    files = sorted(glob.glob(f"{MINED}/*.advice.json"))
    if not files:
        print("FATAL: nothing mined yet")
        return 1

    items, stats = [], []
    for f in files:
        d = json.load(open(f))
        stats.append({k: d.get(k) for k in (
            "source_stream", "media_duration_s", "windows_total", "windows_too_thin",
            "windows_bad_json", "items_rejected_no_verbatim_match", "items_kept")})
        for a in d.get("advice", []):
            a["knowledge_ref"] = knowledge_ref(a)
            a["event"] = MAN.get(a["source_stream"], {}).get("event", "unknown")
            items.append(a)

    # Adjacent windows overlap by 45s, so the same sentence can be extracted twice.
    # Collapse identical (stream, span, quote) anchors or `times_said` lies.
    seen, deduped = set(), []
    for it in items:
        key = (it["source_stream"], round(it["t_start"], 1), round(it["t_end"], 1),
               re.sub(r"[^a-z0-9]+", " ", it["quote"].lower()).strip())
        if key in seen:
            continue
        seen.add(key)
        deduped.append(it)
    overlap_dupes = len(items) - len(deduped)
    items = deduped
    print(f"loaded {len(items)} raw items from {len(files)} streams "
          f"({overlap_dupes} overlap duplicates collapsed)")
    if not items:
        json.dump({"generated_at": datetime.datetime.now().isoformat(timespec="seconds"),
                   "clusters": [], "per_stream": stats, "raw_item_count": 0},
                  open(OUT, "w"), ensure_ascii=False, indent=1)
        print("no advice extracted; wrote empty corpus")
        return 0

    # --- cluster near-duplicate claims -------------------------------------
    from sentence_transformers import SentenceTransformer
    import numpy as np

    model = SentenceTransformer("all-MiniLM-L6-v2")
    emb = model.encode([i["claim"] for i in items], normalize_embeddings=True,
                       batch_size=64, show_progress_bar=False)
    sim = emb @ emb.T

    n = len(items)
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[max(ra, rb)] = min(ra, rb)

    for i in range(n):
        for j in np.where(sim[i] >= SIM_THRESHOLD)[0]:
            if j > i:
                union(i, int(j))

    groups = collections.defaultdict(list)
    for i in range(n):
        groups[find(i)].append(items[i])

    clusters = []
    for members in groups.values():
        # representative = the most concrete claim, longest quote as tiebreak
        rep = sorted(members, key=lambda m: (m["specificity"] != "concrete",
                                             -len(m["quote"])))[0]
        cats = collections.Counter(m["category"] for m in members)
        moms = collections.Counter(m["moment"] for m in members)
        events = sorted({m["event"] for m in members})
        clusters.append({
            "claim": rep["claim"],
            "category": cats.most_common(1)[0][0],
            "moment": moms.most_common(1)[0][0],
            "is_script": any(m["is_script"] for m in members),
            "specificity": "concrete" if any(m["specificity"] == "concrete" for m in members) else "general",
            "times_said": len(members),
            "distinct_events": len(events),
            "events": events,
            "provenance": [{
                "knowledge_ref": m["knowledge_ref"],
                "source_stream": m["source_stream"],
                "source_file": MAN.get(m["source_stream"], {}).get("source"),
                "audio_stream_index": MAN.get(m["source_stream"], {}).get("audio_stream_index"),
                "t_start": m["t_start"], "t_end": m["t_end"],
                "timecode": f"{hhmmss(m['t_start'])}–{hhmmss(m['t_end'])}",
                "quote": m["quote"],
            } for m in sorted(members, key=lambda m: (m["source_stream"], m["t_start"]))],
        })

    # rank: corroborated across separate events first, then concrete, then frequency
    clusters.sort(key=lambda c: (-c["distinct_events"], c["specificity"] != "concrete",
                                 -c["times_said"], c["claim"]))

    payload = {
        "generated_at": datetime.datetime.now().isoformat(timespec="seconds"),
        "raw_item_count": len(items),
        "cluster_count": len(clusters),
        "similarity_threshold": SIM_THRESHOLD,
        "per_stream": stats,
        "clusters": clusters,
    }
    json.dump(payload, open(OUT, "w"), ensure_ascii=False, indent=1)
    print(f"{len(items)} items -> {len(clusters)} clusters -> {OUT}")
    for c in clusters[:15]:
        print(f"  [{c['category']}/{c['moment']}] x{c['times_said']} "
              f"({c['distinct_events']} events) {c['claim'][:90]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
