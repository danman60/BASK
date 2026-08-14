# Bask film — voiceover script (ElevenLabs-ready)

> **Recorded and cut in.** The take used is the client's ElevenLabs "Tessa"
> read (41.82s), split at its own natural pauses into eight line clips
> (`public/audio/vo/vo1..vo8.mp3`) and pinned per shot in `src/Soundtrack.tsx`.
> The film's **VO cut is `BaskPromoVO` — 1466f, 48.9s** (the caption cut stays
> 44.2s): the read is 41.8s of near-continuous speech, and the caption cut only
> has ~39s of room once the two title cards are silent, so the shots carrying the
> longest lines are held longer. No animation was re-timed; the extra frames land
> in each shot's closing still.
>
> Note: a second file in the phone's Downloads (`ElevenLabs_..._Holly...`) is a
> different project's read — the ADAPT exam-capture VO — not this script.

Script: **92 words**. Recorded length 41.82s. VO cut: 1466 frames · 48.9s · 30fps.

---

## 1. Paste this into ElevenLabs

Nothing below is a stage direction — it is all spoken. Punctuation is doing the pacing; em-dashes
are half-beats, full stops are full beats. Do not add brackets or names to this block.

```
This is what a salon owner wakes up to.

Overnight, Bask read yesterday — and found the quiet Tuesday.

Studio turned that into a campaign. The offer, the post, the text. You still press send.

The floor runs live. Eight beds, one board.

It counts the shelf, and writes the UVALUX order — with a reason on every line.

The salon decides what crosses. Business signals. Never their customer list.

And every UVALUX rep calls knowing exactly what changed.

Bask. The salon runs better. UVALUX sees the market it serves.
```

## 2. Voice settings (not spoken — for the ElevenLabs panel)

| Setting | Value | Why |
|---|---|---|
| Voice | warm, mid-low, unhurried — a considered narrator, not an announcer | the film's register is a morning letter, not a trailer |
| Model | Eleven Multilingual v2 (or Turbo v2.5 if you need speed) | v2 holds the pauses better |
| Stability | 45–55 | low enough to keep colour, high enough not to drift on the numbers |
| Similarity | 75 | |
| Style exaggeration | 0–15 | anything higher reads as an ad |
| Speaker boost | on | |
| Speed | 0.95 | the read should sit *behind* the picture, not push it |

If the take comes back rushed, split the block at the blank lines and generate line by line — the
timing table below assumes each line is its own clip anyway.

## 3. Where each line actually sits (VO cut, as rendered)

Clips are `public/audio/vo/vo1..vo8.mp3`, cut from the take at its own pauses. Pins live in
`src/Soundtrack.tsx` (`buildVo`) and are relative to the shot, so the timing survives a re-time.

| # | Line | Clip | Starts | Ends | Shot it sits in |
|---|---|---|---|---|---|
| 1 | This is what a salon owner wakes up to. | vo1 2.90s | 0.40s | 3.30s | Daybreak 0.00–4.33 |
| 2 | Overnight, Bask read yesterday — and found the quiet Tuesday. | vo2 4.83s | 4.70s | 9.53s | the insight card 4.33–10.00 |
| — | *(title card — silent)* | — | 10.00s | 11.50s | — |
| 3 | Studio turned that into a campaign. The offer, the post, the text. You still press send. | vo3 7.44s | 11.83s | 19.27s | Studio 11.50–19.50 |
| 4 | The floor runs live. Eight beds, one board. | vo4 4.28s | 19.90s | 24.18s | the Floor 19.50–24.50 |
| 5 | It counts the shelf, and writes the UVALUX order — with a reason on every line. | vo5 5.93s | 24.77s | 30.70s | Inventory 24.50–30.83 |
| — | *(title card — silent)* | — | 30.83s | 32.33s | — |
| 6 | The salon decides what crosses. Business signals. Never their customer list. | vo6 5.88s | 32.60s | 38.48s | consent 32.33–35.67, **finishing over Compass** — deliberate: the consent line pays off as Compass arrives |
| 7 | And every UVALUX rep calls knowing exactly what changed. | vo7 4.00s | 38.67s | 42.67s | Compass 35.67–42.87 |
| 8 | Bask. The salon runs better. UVALUX sees the market it serves. | vo8 5.69s | 43.07s | 48.76s | outro 42.87–48.87 |

## 4. Rendering

```bash
cd promo
npx remotion render src/index.ts BaskPromoVO out/promo-vo.mp4   # voice + bed + SFX, no captions
npx remotion render src/index.ts BaskPromo   out/promo.mp4      # caption cut, no voice
```

Mix: bed ducked to 0.13 under the voice (0.26 in the caption cut), SFX unchanged — they are pinned
to picture, not to the read.

## 6. One line worth re-recording

The campaign beat now plays **last**, at the client's direction. Its line —

> "Studio turned **that** into a campaign. The offer, the post, the text. You still press send."

— was written for position 3, right after "…found the quiet Tuesday". In the delivered order that
antecedent is ~30 seconds and five sentences back, and the nearest thing "that" can attach to is the
Compass line about the rep. The title card before it now says **"Back to that quiet Tuesday."**, which
puts the referent on screen, but the sentence still leans on a pronoun reaching across an act break.

If you re-record one line, make it this one, self-contained:

```
Studio turns a quiet Tuesday into a campaign. The offer, the post, the text. You still press send.
```

Same voice, same settings. Drop the file in and tell me — it replaces `vo/vo3.mp3`, and nothing else
moves, because the pins are per shot.

## 5. What the VO deliberately does not say

- No price, no percentage, no revenue claim. Every number in the film is a fictional seeded fixture
  and the film never asserts one as a UVALUX figure.
- No "AI" as a noun. The product's own copy voice states findings, not technology.
- Nothing about the partnership's commercial terms — that conversation belongs to the meeting, not
  to a 44-second film.
