# Bask film — voiceover script (ElevenLabs-ready)

Film: 1327 frames · 44.2s · 30fps. Speech windows total ≈39s of the 44.2 (the two title cards and
the last beat of the outro are deliberately left silent). Script below is **92 words ≈ 141 wpm** —
an unhurried read, which is the register this brand wants.

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

## 3. Timing — where each line sits against the picture

Render the lines as separate clips and drop them at these frames (30fps). Every start is the frame
the shot's own idea becomes visible, so the read lands *with* the picture, not over its entrance.

| # | Line | Start frame | Start time | Window | Words |
|---|---|---|---|---|---|
| 1 | This is what a salon owner wakes up to. | 12 | 0.4s | 3.9s | 9 |
| 2 | Overnight, Bask read yesterday — and found the quiet Tuesday. | 146 | 4.9s | 5.4s | 10 |
| — | *(title card — silent)* | 300 | 10.0s | 2.5s | — |
| 3 | Studio turned that into a campaign. The offer, the post, the text. You still press send. | 396 | 13.2s | 5.4s | 16 |
| 4 | The floor runs live. Eight beds, one board. | 560 | 18.7s | 4.6s | 8 |
| 5 | It counts the shelf, and writes the UVALUX order — with a reason on every line. | 712 | 23.7s | 4.9s | 15 |
| — | *(title card — silent)* | 857 | 28.6s | 2.5s | — |
| 6 | The salon decides what crosses. Business signals. Never their customer list. | 940 | 31.3s | 3.4s | 11 |
| 7 | And every UVALUX rep calls knowing exactly what changed. | 1050 | 35.0s | 4.6s | 9 |
| 8 | Bask. The salon runs better. UVALUX sees the market it serves. | 1200 | 40.0s | 3.6s | 11 |

Line 8 should finish by frame ~1290 (43.0s) — the last 37 frames are the sign-off hold and should
carry no voice.

## 4. If you use the VO, render the caption-free master

The on-screen captions say roughly what the VO says; running both is a double read. The composition
takes a `captions` input prop for exactly this:

```bash
cd promo
npx remotion render src/index.ts BaskPromo out/promo-vo.mp4 --props=props-vo.json
```

`props-vo.json` is `{"bgm": true, "captions": false}`. There is also `props-nobgm.json`
(`{"bgm": false, "captions": true}`) for the music-free master.

Recommended VO mix: duck the bed to ~0.16 under speech (currently 0.26 flat), keep the SFX where
they are — they are pinned to picture, not to the read.

## 5. What the VO deliberately does not say

- No price, no percentage, no revenue claim. Every number in the film is a fictional seeded fixture
  and the film never asserts one as a UVALUX figure.
- No "AI" as a noun. The product's own copy voice states findings, not technology.
- Nothing about the partnership's commercial terms — that conversation belongs to the meeting, not
  to a 44-second film.
