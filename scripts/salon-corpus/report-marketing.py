#!/usr/bin/env python3
"""Turn the marketing lens output into a copywriter's document.

Different job from report.py. That one groups by category because a curator asks
"what do we know about memberships". A copywriter asks "give me the pain quotes",
so this groups by SHAPE and ranks by how quotable a line is on its own.

Every quote keeps file + stream + timecode, because a marketing claim sourced to
"someone said something like this once" is how a brand gets itself in trouble.
"""
import json, glob, os, re, collections, datetime

ROOT = "/home/danman60/projects/uvalux-platform/data/salon-transcripts"
MINED = f"{ROOT}/mined-marketing"
OUT = "/home/danman60/projects/uvalux-platform/docs/ingest/2026-08-23-marketing-voice-of-customer.md"

MAN = {s["stream"]: s for s in json.load(open(f"{ROOT}/manifest.json"))["streams"]}

SHAPE_ORDER = ["pain", "desire", "objection", "proof", "phrase", "market"]
SHAPE_TITLE = {
    "pain": "Pain — what they say is hard",
    "desire": "Desire — what they say they want",
    "objection": "Objection — why they push back",
    "proof": "Proof — results they report",
    "phrase": "Phrases — lines that stand on their own",
    "market": "Market — how they describe the industry changing",
}
SHAPE_USE = {
    "pain": "Opens. A cold email or a film's first ten seconds earns attention by naming the "
            "pain in the customer's own words before offering anything.",
    "desire": "The promise. Say back what they already told you they want; do not invent a want.",
    "objection": "Sales enablement and FAQ copy. Every one of these is a rebuttal you owe an answer to.",
    "proof": "Evidence blocks and the payback calculator. These are the only claims that survive a "
             "sceptical read, and each is sourced.",
    "phrase": "Headlines, slide titles, VO lines. Short enough to land without setup.",
    "market": "The why-now section. Urgency has to come from the market, not from adjectives.",
}


def hms(t):
    h, r = divmod(int(t), 3600)
    m, s = divmod(r, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def quotability(item):
    """Lower sorts first. Short, concrete, self-contained lines win."""
    words = len(item["quote"].split())
    length_penalty = abs(words - 14)          # ~14 words is the sweet spot for a pull quote
    vague = 0 if item["specificity"] == "concrete" else 6
    return (length_penalty + vague, words)


def main():
    files = sorted(glob.glob(f"{MINED}/*.advice.json"))
    if not files:
        print(f"FATAL: nothing in {MINED} yet")
        return 1

    items, stats = [], []
    for f in files:
        d = json.load(open(f))
        stats.append(d)
        for a in d.get("advice", []):
            m = MAN.get(a["source_stream"], {})
            a["event"] = m.get("event", "unknown")
            a["ref"] = f"{m.get('label_prefix', a['source_stream'])} · {hms(a['t_start'])}"
            a["source_file"] = m.get("source", "?")
            items.append(a)

    # Window overlap double-extracts; collapse identical anchors.
    seen, uniq = set(), []
    for it in items:
        k = (it["source_stream"], round(it["t_start"], 1), norm(it["quote"]))
        if k in seen:
            continue
        seen.add(k)
        uniq.append(it)
    dupes = len(items) - len(uniq)

    by_shape = collections.defaultdict(list)
    for it in uniq:
        by_shape[it.get("shape") or "phrase"].append(it)

    L = []
    w = L.append
    w("# UVALUX corpus → voice of the customer")
    w("")
    w(f"*{len(uniq)} verbatim quotes pulled from 13 h 27 m of UVALUX event audio "
      f"({dupes} overlap duplicates collapsed). Generated "
      f"{datetime.datetime.now().isoformat(timespec='minutes')}.*")
    w("")
    w("These are **real things real people said**, not copy. Every line keeps its source file, "
      "audio stream and timecode so any claim can be traced back to the recording before it is "
      "published.")
    w("")
    w("## Before using any of this")
    w("")
    w("- **Machine transcription.** The audio is hot and clipping (−8.6 LUFS, peak +1.3 dBFS). "
      "Whisper handled it well, but **proper nouns are the weak point** — verify every company "
      "name, product name and person's name against the recording before it goes in public copy.")
    w("- **No speaker attribution in this corpus.** These quotes are timecoded, not attributed. "
      "Do not publish any of them as *\"— Jane, salon owner\"* without going back to the audio and "
      "confirming who is speaking.")
    w("- **Consent and permission are separate from provenance.** Knowing who said it does not "
      "mean UVALUX has the right to quote them in marketing. That is a conversation, not a lookup.")
    w("- Quotes are lightly trimmed only at their own boundaries. Nothing is reworded. If a line "
      "needs an ellipsis to work, it is probably the wrong line.")
    w("- **A quote under PROOF is evidence that someone SAID a number, not that the number is "
      "true.** Much of this corpus is vendors and UVALUX staff presenting from a stage, so a line "
      "like *\"our current average is 11\"* is a seller's claim about their own product. Anything "
      "from PROOF that goes into public copy needs an independent source, or it needs to be "
      "attributed as a claim rather than stated as fact.")
    w("")
    w("### What this corpus cannot give you")
    w("")
    w("**DESIRE is nearly empty, and that is a finding about the source, not a bug.** These are "
      "conference talks — experts telling owners what to do. Almost nobody is recorded saying what "
      "they wish they had. So the *promise* half of any campaign cannot be written from this "
      "material; it has to come from customer conversations, support threads or interviews. "
      "Padding the section from adjacent quotes would have hidden that, so it is left thin on "
      "purpose.")
    w("")

    for shape in SHAPE_ORDER:
        rows = by_shape.get(shape)
        if not rows:
            continue
        rows.sort(key=quotability)
        w(f"## {SHAPE_TITLE[shape]} ({len(rows)})")
        w("")
        w(f"*{SHAPE_USE[shape]}*")
        w("")
        for it in rows:
            w(f"> {it['quote']}")
            w(">")
            w(f"> — `{it['ref']}` · {hms(it['t_start'])}–{hms(it['t_end'])} · "
              f"`{os.path.basename(it['source_file'])}`")
            w(f"")
            w(f"  {it['claim']}  ")
            w(f"  `{it['category']}` · {it['specificity']}")
            w("")
        w("")

    w("## Coverage")
    w("")
    w("| Stream | Event | Windows | Quotes kept | Rejected (not verbatim) |")
    w("|---|---|---|---|---|")
    kept = rej = 0
    for d in sorted(stats, key=lambda x: -x.get("items_kept", 0)):
        st = d["source_stream"]
        kept += d.get("items_kept", 0)
        rej += d.get("items_rejected_no_verbatim_match", 0)
        w(f"| `{st}` | {MAN.get(st, {}).get('event', '?')} | {d.get('windows_total', 0)} | "
          f"{d.get('items_kept', 0)} | {d.get('items_rejected_no_verbatim_match', 0)} |")
    w("")
    w(f"**{kept} kept · {rej} rejected** for quotes that did not appear verbatim in their own "
      f"transcript window. That gate is why these quotes can be trusted.")
    w("")
    w("Raw: `data/salon-transcripts/mined-marketing/*.advice.json`. "
      "Sibling corpora: `mined/` (advice), `mined-v2/` (advice, larger model), "
      "`mined-recall/` (war stories, mistakes, benchmarks).")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, "w").write("\n".join(L) + "\n")
    print(f"wrote {OUT} — {len(uniq)} quotes across {len(by_shape)} shapes")
    for s in SHAPE_ORDER:
        if by_shape.get(s):
            print(f"  {s:10s} {len(by_shape[s]):4d}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
