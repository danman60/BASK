# Bask film — voiceover script (v4)

**What changed in this pass, at the client's direction:**
- **The consent beat is gone.** No "the salon decides what crosses", no consent screen. UVALUX
  supplies the software; the salon runs on it; the data reaching UVALUX is the point of the
  arrangement, not something the film stops to negotiate. The old `vo6.mp3` is retired.
- **The film now opens by saying what Bask is** before anything moves — a wordmark card, then the
  positioning line, then the morning brief.
- **Three new lines need recording: A, B and C.** Everything else is already in the can and
  re-used unchanged.

Until the new takes land, `voA/voB/voC.mp3` are SILENT files of the estimated length, so the
picture is already cut to the right shape and the real takes drop straight in with no re-timing.

---

## 0. TWO MORE TO RECORD (this pass)

The film now spends real time on the salon's operational layer before it gets to
marketing, and the UVALUX-data line moved to the very end. Two new shots need voice —
the front desk and the till. Same voice and settings.

**Do NOT paste the labels this time** — the last takes had "A, 4.4 seconds," read aloud
and I had to cut them off. Just the sentence.

**D — 5.0s target · plays over the check-in screen**
```
A name at the desk brings up everything about them. Last visit, package, whether their waiver is good, and which rooms are free.
```

**E — 6.0s target · plays over the till**
```
Staff scan a bottle, it rings up, and the shelf count moves with it. Nobody types a catalogue — it is already UVALUX's.
```

Until they land, `voD/voE.mp3` are silent files of the estimated length and the picture is
already cut to fit them.

## 1. The earlier three (recorded, in the cut)

Same voice, same settings as the existing take (ElevenLabs, "Tessa", speed 1.00, stability 56,
similarity 40, style 50). Record as three separate clips if you can; if it comes as one file, say so
and I will split it at the pauses like last time.

**A — 4.4s target**
```
Bask is all-in-one management software for a tanning salon.
```

**B — 7.4s target**
```
It takes the friction out of booking and coming back for the customer, and out of stock, promotions and staff for the owner.
```

**C — 6.4s target**
```
And most of all, it gives UVALUX the data behind every salon — to grow distribution, and keep every one of them succeeding.
```

Save them as anything; tell me the paths and I will drop them in as `voA/voB/voC.mp3`.

## 2. The full read, in order, as delivered

| # | line | clip | status | lands on |
|---|---|---|---|---|
| A | Bask is all-in-one management software for a tanning salon. | voA | **to record** | the opening wordmark card |
| B | It takes the friction out of booking and coming back for the customer, and out of stock, promotions and staff for the owner. | voB | **to record** | the Daybreak page, camera craning back |
| 2 | Overnight, Bask read yesterday — and found the quiet Tuesday. | vo2 | recorded | the insight card lifting |
| 4 | The floor runs live. Eight beds, one board. | vo4 | recorded | the room board |
| 5 | It counts the shelf, and writes the UVALUX order — with a reason on every line. | vo5 | recorded | the shelf and the order |
| C | And most of all, it gives UVALUX the data behind every salon — to grow distribution, and keep every one of them succeeding. | voC | **to record** | lands exactly as Compass pushes up over the Bask screen |
| 7 | And every UVALUX rep calls knowing exactly what changed. | vo7 | recorded | the Compass call list |
| 3 | Studio turned that into a campaign. The offer, the post, the text. You still press send. | vo3 | recorded | the campaign beat |
| 8 | Bask. The salon runs better. UVALUX sees the market it serves. | vo8 | recorded | the sign-off |

Retired: **vo1** ("This is what a salon owner wakes up to.") — A and B now do the opening work, and
three lines in the first ten seconds is one too many. **vo6** (the consent line) — beat removed.

## 3. Where each line sits (VO cut, 1714f / 57.1s)

| clip | starts | ends | shot |
|---|---|---|---|
| voA | 0.40s | 4.80s | brand card 0.00–4.67 |
| voB | 5.13s | 12.53s | Daybreak 4.67–12.67 |
| vo2 | 13.03s | 17.83s | insight card 12.67–17.83 |
| vo4 | 18.23s | 22.48s | the Floor 17.83–22.50 |
| vo5 | 22.77s | 28.67s | inventory 22.50–29.00 |
| voC | 29.03s | 35.43s | starts on the act break, runs over Compass |
| vo7 | 35.70s | 39.67s | Compass 29.00–39.67 |
| vo3 | 43.47s | 50.87s | campaign 43.13–51.13 |
| vo8 | 51.33s | 56.98s | sign-off 51.13–57.13 |

Pins live in `src/Soundtrack.tsx` (`buildVo`) and are relative to the shot, so a shot changing
length carries its line with it.

## 4. Rendering

```bash
cd promo
npx remotion render src/index.ts BaskPromoVO out/promo-vo.mp4   # voice + bed + SFX, no captions
npx remotion render src/index.ts BaskPromo   out/promo.mp4      # caption cut, no voice
```

Bed ducked to 0.13 under the voice, 0.26 in the caption cut. SFX unchanged — pinned to picture.

## 5. What the VO deliberately does not say

- No price, no percentage, no revenue claim. Every number on screen is a fictional seeded fixture
  and the film never asserts one as a UVALUX figure.
- No "AI" as a noun. The product's own copy voice states findings, not technology.
- Nothing about commercial terms — that belongs in the meeting, not in a 57-second film.

## 6. Still worth re-recording (carried over)

Line 3 was written for position three and now plays last: *"Studio turned **that** into a campaign"*
reaches back ~14s for its antecedent. The title card immediately before it says "Back to that quiet
Tuesday.", which patches it. If you are recording A/B/C anyway, add:

```
Studio turns a quiet Tuesday into a campaign. The offer, the post, the text. You still press send.
```
