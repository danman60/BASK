# Thursday 2026-09-03 — demo briefing

**Room: Elaine (product training), possibly Wilfred (data).** Not Nick. `PITCH.md` is the Nick
script and its spine still works, but the questions in this room are different: Elaine owns the
coaching corpus, Wilfred owns whether the numbers are real.

**State verified 2026-09-02 10:1x EDT against https://bask-psi.vercel.app** — `demo:verify`
**12 passed · 0 failed · 0 not built**, including the beat that asserts the coaching citations
render AND open. Every number below was read off the live production page this morning, not from
notes.

---

## 1. The one thing to be clear about before you start

Three surfaces on the very first screen. Two are computed from the salon's data, two are
illustrative. **Know which is which, out loud, before Wilfred asks.**

| On screen, top to bottom | Where it comes from |
|---|---|
| **Daybreak letter** — "Yesterday finished 12% above your usual Wednesday" | **Computed.** `loadToday()` off real visit rows |
| **"6 ways to grow your business today"** | **Illustrative.** `DEMO_OPPORTUNITIES` fixtures |
| **Wins feed** (what other owners tried) | **Illustrative.** `DEMO_WINS` fixtures |
| **"What needs your attention"** queue | **Computed.** Real derived insights, each opens to its rows |

The safe sentence, said once, early, unprompted:

> "Two things on this page are illustrative and I'll tell you which as we go — the growth tiles and
> the community feed are content, not measurement. Everything below them, and everything with a
> *Show me why*, is computed off the till."

Saying it first costs you nothing. Being caught on it costs the meeting.

---

## 2. The spine — six clicks

You do not have to show everything. This is the whole story and it takes about six minutes.

1. **Today.** Let them read the Daybreak letter. Say nothing.
   > "Nobody ran a report. The software did the analysis overnight and wrote it in plain English."

2. **The retail card in the attention queue.** It reads *attachment fell from 8.3% to 5.9%, most of
   it evening shifts, about $4,260 a month.*
   > "It found this in her own numbers. It also priced it."

3. **Show me why.** The evidence — the chart, then the visits behind it.
   > "Every figure opens. This is the actual list of visits the percentage was counted from."

4. **What this drew on.** The coaching citations. Open one to the quote and the timecode.
   > "And the advice isn't invented. It's your training, retrieved, with the words somebody actually
   > said on a stage and where in the session they said it."
   **This is Elaine's beat. Slow down here.**

5. **Fix this → Studio.** The campaign arrives pre-filled. Edit one line live.
   > "I never started from a blank page, and nothing sends until she says so."

6. **Switch to Compass.** Theme flips dark. Network, then the Call List.
   > "Same nervous system, opposite end. The rep doesn't call asking if you need anything. They call
   > knowing what's wrong and what to suggest."

---

## 3. Elaine's questions, and the true answers

**"How much of our training is in there?"**
1,007 claims, all embedded and searchable. The review queue header reads **741** because it shows
two lenses, advice (469) and recall (272); the third lens, marketing (266), is the remainder. Every
one carries the quote it came from and a timecode into the session.

**"Who checked these? How many are approved?"**
Say the real number: **3 of 741 decided.** Do not soften it.
> "Almost none, and that's deliberate — it's your queue, not mine. The mining is done and the
> retrieval works; what's missing is exactly the judgment you'd own. That's the part I'd want you to
> take."
This is the strongest thing you can say to her. The unowned queue is the invitation.

**"What if a claim is wrong?"**
Reject it and it stops reaching salons immediately. The retrieval function excludes rejected claims
at the database level, so it is a real gate, not a label.

**"Do the trainers' names show anywhere?"**
No. Never rendered, and not in the type — the citation shape has no speaker field at all.

---

## 4. Wilfred's questions, and the true answers

**"Is this our data?"**
The visits are real, 194,672 of them, ingested from SalonTouch. The salon and customer names are
synthetic. Percentages and dollar figures are computed from those visit rows, and every one of them
opens to the rows it was counted from.

**"Show me a number reconciling."**
Do this rather than answer it. Retail card → *Show me why* → the records table. The page prints its
own working: *84 of 1,441 visits over the last 14 days included a product — 5.8%*, and then lists
them.

**"What does UVALUX see about a specific salon?"**
Counts and health bands, never a customer list. There is one consent filter every Compass read goes
through, in `packages/core/consent`, and no query routes around it. There is a settings screen for
it; it is not in this walkthrough.

**"Can I move the clock?"**
Yes, and let him. Presenter Panel is **⌘⇧D**. The pipeline recomputes — campaign settles, rollups,
insight sweep, brief regenerates. This is the most convincing thing in the demo for a data person,
because the numbers move together.

---

## 5. Numbers cheat sheet

| | |
|---|---|
| Daybreak headline, right now | 12% above your usual Wednesday |
| Retail attachment | 8.3% → 5.9%, ≈$4,260/mo |
| Real visits ingested | 194,672 |
| Claims total / embedded | 1,007 / 1,007 |
| Review queue header | 741 (advice 469 + recall 272); marketing 266 is the third lens |
| Claims decided | 3 |
| Retrieval | excludes rejected at the DB level |

---

## 6. Do not open

- **Floor and Inventory.** Off-nav on purpose. They demo a salon operating system, which Nick ruled
  out. The word is **intelligence**, never "operating system", "all-in-one" or "salon management".
- **A campaign generate against production**, unless you have decided to. It persists a draft row in
  the database you are presenting from.
- The Compass sidebar prints the signed-in rep's name, **Fintan H.**, bottom left. Harmless, but if
  someone asks whether that is a real person: it is demo data.

---

## 7. If something breaks

Presenter Panel **⌘⇧D** jumps to any of the seven bookmarks, so any beat can be recovered without
navigating. If a surface is slow, talk over it — the Daybreak letter and the citations are the two
moments worth waiting for; everything else you can narrate past.

If the AI path fails on a campaign generate, the deterministic fallback still writes a campaign —
but it carries **no citations**, by design, because it never saw a claim. If you notice the "what
this drew on" block missing after a generate, that is what happened. Do not explain it as a bug;
say the model call failed and the system fell back to templates, which is true and is the honest
behaviour.
