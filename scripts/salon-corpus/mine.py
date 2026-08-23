#!/usr/bin/env python3
"""Phase 4 — mine transcripts for salon ownership/management advice.

Read-heavy -> write-light extraction. The local model EXTRACTS and anchors; it never
judges whether the advice is good. Provenance is computed from segment ids the model
cites, not from timestamps the model invents.
"""
import json, os, glob, sys, time, datetime, urllib.request, re

TDIR = "/home/danman60/projects/uvalux-platform/data/salon-transcripts/transcripts"
ODIR = os.environ.get(
    "MINE_ODIR", "/home/danman60/projects/uvalux-platform/data/salon-transcripts/mined")
HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
MODEL = os.environ.get("MINE_MODEL", "gemma4:12b")
# "advice" = the original extraction lens. "recall" = a deliberately different lens over the
# same audio, to catch what a single pass misses (see RECALL_SYSTEM below).
LENS = os.environ.get("MINE_LENS", "advice")
WINDOW_S = float(os.environ.get("WINDOW_S", "480"))
OVERLAP_S = float(os.environ.get("OVERLAP_S", "45"))
MIN_WORDS = 120

os.makedirs(ODIR, exist_ok=True)

SYSTEM = """You extract business advice from transcripts of UVALUX tanning/salon industry events.

Your ONLY job: find statements that give ADVICE about OWNING or MANAGING a salon.

In scope: pricing, memberships and packages, retail and product sales, upselling,
consultations, hiring, staff training, compensation and commission, staff retention,
client retention and rebooking, marketing and social media, scheduling and capacity,
inventory and ordering, equipment and room utilization, KPIs and metrics, margins and
finances, customer experience, handling complaints, leadership and salon culture,
compliance and safety.

OUT of scope, return nothing for: greetings, housekeeping, mic checks, applause, small
talk, travel chat, raffle/prize talk, pure product spec recitation with no operating
advice, personal anecdotes with no transferable lesson, and anything you are unsure is
about running a salon.

Most windows contain NO advice. Returning an empty list is the CORRECT and expected
answer for those. Never invent advice to fill the list.

Return ONLY a JSON object of this exact shape:
{"advice": [{"claim": "...", "quote": "...", "segment_ids": [12,13],
             "category": "...", "moment": "...", "is_script": false,
             "specificity": "concrete|general"}]}

Rules:
- "quote" MUST be copied verbatim, word for word, from the transcript text given to you.
  If you cannot copy an exact quote, do not emit the item.
- "segment_ids" MUST be ids that appear in the transcript given to you.
- "claim" is one plain sentence stating the advice in your own words.
- "category" MUST be exactly one of:
  marketing, membership, retail, operations, customer, coaching
- "moment" is the front-desk sales moment this advice is about. MUST be exactly one of:
  greeting, needs, product, membership, close, none
  Use "none" when the advice is not about a front-desk conversation.
- "is_script": true only when the speaker gives actual words to say to a customer.
- "specificity": "concrete" if it names a number, script, step or threshold; else "general".
"""

CATEGORIES = {"marketing", "membership", "retail", "operations", "customer", "coaching"}
MOMENTS = {"greeting", "needs", "product", "membership", "close", "none"}

# A second, deliberately different lens. Pass 1 asked "what advice was given" and so it favours
# imperative, prescriptive statements. This one hunts the shapes pass 1 structurally cannot see:
# advice embedded in a story, a mistake, a number, or an owner's question from the floor.
RECALL_SYSTEM = """You extract operating knowledge from transcripts of UVALUX tanning/salon
industry events.

A previous pass already collected the obvious prescriptive advice ("do X", "you should Y").
Do NOT repeat that. Your job is the knowledge that pass MISSED, which takes these shapes:

1. WAR STORIES — something that happened at a real salon, where the outcome teaches a lesson.
2. MISTAKES AND FAILURES — what went wrong, what not to do, what someone regrets.
3. NUMBERS AND BENCHMARKS — any figure about a salon's operation: percentages, prices, margins,
   conversion rates, staff counts, session counts, timings, thresholds, "most salons do X".
4. QUESTIONS FROM THE FLOOR — a salon owner describing their own problem, and the answer given.
5. OBJECTIONS AND REBUTTALS — a customer objection and the response to it.
6. INDUSTRY CONTEXT — how the market, regulation or customer behaviour is changing, where that
   implies something an owner should do differently.

Out of scope: greetings, housekeeping, mic checks, applause, travel chat, raffle talk, and pure
product-spec recitation. Most windows contain none of this. An empty list is the CORRECT answer
for those — never invent an item to fill the list.

Return ONLY a JSON object of this exact shape:
{"advice": [{"claim": "...", "quote": "...", "segment_ids": [12,13],
             "category": "...", "moment": "...", "is_script": false,
             "specificity": "concrete|general", "shape": "..."}]}

Rules:
- "quote" MUST be copied verbatim, word for word, from the transcript given to you. If you cannot
  copy an exact quote, do not emit the item.
- "segment_ids" MUST be ids that appear in the transcript given to you.
- "claim" states the transferable lesson in one plain sentence.
- "category" MUST be exactly one of: marketing, membership, retail, operations, customer, coaching
- "moment" MUST be exactly one of: greeting, needs, product, membership, close, none
- "shape" MUST be exactly one of: war_story, mistake, benchmark, floor_question, objection, context
- "specificity": "concrete" if it names a number, script, step or threshold; else "general".
"""

# A third lens, pointed the other way. The advice and recall lenses ask "what should a salon
# owner DO" — they mine the corpus as a training base. This one asks "how do these people TALK",
# and mines the same audio as voice-of-customer material for promo/ and docs/pitch/.
# It collects language, not instructions.
MARKETING_SYSTEM = """You collect voice-of-customer material from transcripts of UVALUX
tanning/salon industry events. The audience for what you collect is a marketer writing copy about
software for salon owners.

You are NOT collecting advice. You are collecting the way real salon owners and industry people
actually SPEAK — their words, their complaints, their reasons. Six things qualify:

1. PAIN — a salon owner describing something hard, frustrating, expensive or time-wasting about
   running their salon. The more specific and the more it sounds like a real person, the better.
2. DESIRE — what they say they want, wish for, or would pay for.
3. OBJECTION — scepticism, pushback, or a reason someone gives for NOT doing something, including
   objections to software, data, price or change.
4. PROOF — a concrete result someone reports: a number, an outcome, a before-and-after, a
   testimonial about something that worked.
5. PHRASE — a short, vivid, quotable line that lands on its own. Something a person actually said
   that a marketer would want on a slide. Metaphors and plain-spoken bluntness both count.
6. MARKET — how the industry, competition or customer behaviour is described as changing.

Out of scope: greetings, housekeeping, mic checks, applause, travel chat, raffle talk, product spec
recitation, and generic motivational filler. Most windows contain none of this. An empty list is
the CORRECT answer — never invent a quote to fill it.

Return ONLY a JSON object of this exact shape:
{"advice": [{"claim": "...", "quote": "...", "segment_ids": [12,13],
             "category": "...", "moment": "none", "is_script": false,
             "specificity": "concrete|general", "shape": "..."}]}

Rules:
- "quote" MUST be copied verbatim, word for word. It is the whole product here — a paraphrase is
  worthless to a marketer. If you cannot copy it exactly, do not emit the item.
- "claim" says in one plain sentence what this quote shows about the customer.
- "segment_ids" MUST be ids that appear in the transcript given to you.
- "category" MUST be exactly one of: marketing, membership, retail, operations, customer, coaching
- "moment" MUST be exactly one of: greeting, needs, product, membership, close, none
- "shape" MUST be exactly one of: pain, desire, objection, proof, phrase, market
- "specificity": "concrete" if it names a number, a place, a person or a specific situation;
  else "general".
- Prefer SHORT quotes that stand alone over long ones that need setup.
"""

SHAPES = {"war_story", "mistake", "benchmark", "floor_question", "objection", "context",
          "pain", "desire", "proof", "phrase", "market"}
ACTIVE_SYSTEM = (
    RECALL_SYSTEM if LENS == "recall"
    else MARKETING_SYSTEM if LENS == "marketing"
    else SYSTEM
)


def log(m):
    print(f"{datetime.datetime.now().isoformat(timespec='seconds')} {m}", flush=True)


def call(prompt):
    body = json.dumps({
        "model": MODEL,
        "prompt": prompt,
        "system": ACTIVE_SYSTEM,
        "stream": False,
        "format": "json",
        "keep_alive": "30m",
        "think": False,
        "options": {"temperature": 0.1, "num_ctx": 8192, "num_predict": 1600},
    }).encode()
    req = urllib.request.Request(f"{HOST}/api/generate", data=body,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(r.read())


def windows(segs):
    """Yield (segments_slice) covering WINDOW_S with OVERLAP_S back-step."""
    if not segs:
        return
    end_t = segs[-1]["end"]
    start = 0.0
    while start < end_t:
        stop = start + WINDOW_S
        sl = [s for s in segs if s["end"] > start and s["start"] < stop]
        if sl:
            yield sl
        start = stop - OVERLAP_S


def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def main():
    files = sorted(glob.glob(os.path.join(TDIR, "*.json")))
    if not files:
        log("FATAL: no transcripts")
        return 1
    log(f"model={MODEL} lens={LENS} host={HOST} odir={ODIR} files={len(files)} window={WINDOW_S}s")

    for path in files:
        name = os.path.splitext(os.path.basename(path))[0]
        opath = os.path.join(ODIR, f"{name}.advice.json")
        if os.path.exists(opath):
            log(f"SKIP {name} (already mined)")
            continue

        data = json.load(open(path))
        segs = data["segments"]
        wins = list(windows(segs))
        log(f"START {name} segs={len(segs)} windows={len(wins)}")

        found, skipped_thin, bad_json, unverified = [], 0, 0, 0
        t0 = time.time()
        for wi, sl in enumerate(wins):
            text = "\n".join(f"[{s['id']}] {s['text']}" for s in sl)
            if len(text.split()) < MIN_WORDS:
                skipped_thin += 1
                continue
            prompt = (f"Transcript window {wi+1} of {len(wins)} from recording "
                      f"'{name}', covering {sl[0]['start']:.0f}s to {sl[-1]['end']:.0f}s.\n\n"
                      f"{text}\n\nExtract salon ownership/management advice as JSON.")
            try:
                resp = call(prompt)
                obj = json.loads(resp.get("response", "{}"))
            except Exception as e:
                bad_json += 1
                log(f"  w{wi+1} parse/call fail: {type(e).__name__}: {e}")
                continue

            seg_by_id = {s["id"]: s for s in sl}
            window_text = norm(" ".join(s["text"] for s in sl))
            for item in (obj.get("advice") or []):
                q = (item.get("quote") or "").strip()
                ids = [i for i in (item.get("segment_ids") or []) if i in seg_by_id]
                # provenance gate: quote must actually be in this window, ids must be real
                if not q or not ids or norm(q) not in window_text:
                    unverified += 1
                    continue
                cat = (item.get("category") or "").strip().lower()
                mom = (item.get("moment") or "none").strip().lower()
                found.append({
                    "claim": (item.get("claim") or "").strip(),
                    "quote": q,
                    "category": cat if cat in CATEGORIES else "unclassified",
                    "moment": mom if mom in MOMENTS else "none",
                    "is_script": bool(item.get("is_script")),
                    "specificity": item.get("specificity", "general"),
                    "shape": (item.get("shape") or "").strip().lower()
                             if (item.get("shape") or "").strip().lower() in SHAPES else None,
                    "lens": LENS,
                    "source_stream": name,
                    "segment_ids": ids,
                    "t_start": min(seg_by_id[i]["start"] for i in ids),
                    "t_end": max(seg_by_id[i]["end"] for i in ids),
                    "window": wi + 1,
                })
            if (wi + 1) % 10 == 0:
                log(f"  {name} w{wi+1}/{len(wins)} kept={len(found)} rejected={unverified}")

        json.dump({
            "source_stream": name,
            "media_duration_s": data.get("media_duration_s"),
            "windows_total": len(wins),
            "windows_too_thin": skipped_thin,
            "windows_bad_json": bad_json,
            "items_rejected_no_verbatim_match": unverified,
            "items_kept": len(found),
            "model": MODEL,
            "lens": LENS,
            "mined_at": datetime.datetime.now().isoformat(timespec="seconds"),
            "advice": found,
        }, open(opath, "w"), ensure_ascii=False, indent=1)
        log(f"DONE {name} kept={len(found)} rejected={unverified} thin={skipped_thin} "
            f"badjson={bad_json} wall={time.time()-t0:.0f}s")

    log("=== Phase 4 complete ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
