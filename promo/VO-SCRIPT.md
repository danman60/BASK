# VO script — re-derived from the cut, 2026-08-14

**This document is derived, not authored.** Every frame number below comes from
`src/timeline.ts` (`voCut`) and `src/Soundtrack.tsx` (`buildVo`), read back after the
network-map beat landed. The previous version of this file described a 57.1s cut that
has not existed for two rebuilds — do not trust an old table, re-derive.

Current VO cut: **3144f · 104.8s**. Caption cut: 2550f · 85.0s (no voice).

Voice and settings, unchanged since the first take: ElevenLabs, **"Tessa"**, speed 1.00,
stability 56, similarity 40, style 50.

---

## 0. TO RECORD (two lines)

**Do NOT paste the labels.** The last two takes came back with "A, 4.4 seconds," read
aloud and had to be cut off with word timestamps. Just the sentence.

**The network page — ~9.5s · plays over the whole-page descent, 72.5–82.5s**
```
Every salon on one page. What changed, what it means, and what to do about it — so the order grows, and so does the salon.
```

**The analytics wall — ~8.0s · plays over the wall lighting up, 83.5–91.5s**
```
Every account, every signal, in one place — and every one of them points at something a rep can actually do on Monday.
```

Both lines are the 2026-08-14 pass. Two decisions are baked into them:
- The consent / "who is sharing" clause is OUT — the film assumes transparency across the
  network rather than making sharing a beat.
- Each line has to carry BOTH halves of the UVALUX value: units out the door AND the salon
  still succeeding. Hence "the order grows, and so does the salon", and "something a rep
  can actually do on Monday" — actionable and targeted, not a dashboard boast.

Why the network page needs one now: line C is pinned to the act break by design
(`S.studio.from + 308`), and the map beat took that slot. C therefore runs over the **map**
and ends at 70.9s, leaving the network descent silent. Nothing is wrong with C — the film
grew a screen in front of it.

Drop the mp3s anywhere and say the paths. VO pins are per shot, so placing them moves
nothing else. The wall clip replaces `public/audio/vo/voF.mp3` (today an 8.05s silent file,
measured max −91 dBFS); the network clip is new.

---

## 1. The full read, in order, as it sits in the cut

Times are absolute in `promo-vo.mp4`. "clip" is the file under `public/audio/vo/`.

| # | line | clip | in | out | over |
|---|---|---|---|---|---|
| A | Bask is all-in-one management software for a tanning salon. | voA | 0.40s | 4.27s | the opening wordmark card |
| B | It takes the friction out of booking and coming back for the customer, and out of stock, promotions and staff for the owner. | voB | 4.80s | 12.40s | Daybreak, camera craning back |
| 2 | Overnight, Bask read yesterday — and found the quiet Tuesday. | vo2 | 12.70s | 17.70s | the insight card lifting |
| 4 | The floor runs live. Eight beds, one board. | vo4 | 17.90s | 22.30s | the room board |
| D | A name at the desk brings up everything about them. Last visit, package, whether their waiver is good, and which rooms are free. | voD | 22.83s | 31.43s | the front desk |
| E | Staff scan a bottle, it rings up, and the shelf count moves with it. Nobody types a catalogue — it is already UVALUX's. | voE | 32.50s | 41.70s | the till |
| 5 | It counts the shelf, and writes the UVALUX order — with a reason on every line. | vo5 | 42.43s | 48.50s | the shelf and the order |
| 3 | Studio turned that into a campaign. The offer, the post, the text. You still press send. | vo3 | 52.47s | 62.33s | the campaign beat |
| C | And most of all, it gives UVALUX the data behind every salon — to grow distribution, and keep every one of them succeeding. | voC | 62.40s | 70.93s | starts ON the act break, runs over the map |
| — | *(the network page)* | **to record** | ~72.5s | ~82.0s | the whole-page descent |
| F | *(the analytics wall)* | voF **silent** | 83.47s | 91.47s | every Compass surface lighting up |
| 7 | And every UVALUX rep calls knowing exactly what changed. | vo7 | 91.80s | 95.93s | the Compass call list |
| 8 | Bask. The salon runs better. UVALUX sees the market it serves. | vo8 | 96.67s | 102.47s | the sign-off |

Unused takes still in the folder: `vo1`, `vo6`, `vo-tessa` / `vo-holly` (the two full reads),
`new-1838` / `new-DE` (the session masters the clips were split out of).

---

## 2. Shot map (VO cut), for pinning anything new

| shot | from | to | frames |
|---|---|---|---|
| brand | 0.00s | 4.33s | 130 |
| open (Daybreak) | 4.33s | 12.33s | 240 |
| hero (insight) | 12.33s | 17.50s | 155 |
| floor | 17.50s | 22.17s | 140 |
| checkin | 22.17s | 31.83s | 290 |
| pos (till) | 31.83s | 42.17s | 310 |
| order | 42.17s | 48.67s | 195 |
| titleA | 48.67s | 52.13s | 104 |
| studio | 52.13s | 62.47s | 310 |
| **map** | 62.47s | 72.47s | 300 |
| network | 72.47s | 82.47s | 300 |
| wall | 82.47s | 91.13s | 260 |
| compass (call list) | 91.13s | 96.47s | 160 |
| outro | 96.47s | 104.80s | 250 |

Pins are written relative to these (`S.<shot>.from + n`), never as bare frames — a shot can
change length without re-pinning the table.

---

## 3. Open, and needing Daniel

1. **"UVALUX" is pronounced "YUVALUX" in every take.** It is now in five spoken lines
   (B is clean; E, C, 7 and 8 all say it). If that reading is wrong this is a full
   re-record, not a patch. Flagged three times; I cannot hear the takes to judge.
2. **The "BUILT FOR / UVALUX" sign-off lockup** in `src/shots/S10Outro.tsx` reads as an
   official relationship the pitch has not been granted. Two reviewers and I flagged it.
3. Runtime is 104.8s against an original 35–45s brief. That is a consequence of the
   supplied read plus the client's slower title cards and the two added UVALUX screens.
   Flagged, not hidden.

## 4. Rendering

```
cd promo
npx remotion render src/index.ts BaskPromoVO out/promo-vo.mp4   # voice cut
npx remotion render src/index.ts BaskPromo  out/promo.mp4       # caption cut, no voice
```
Telegram bounces full-res masters — send a 720p copy:
`ffmpeg -y -i out/promo-vo.mp4 -crf 26 -vf scale=1280:720 -c:a aac -b:a 128k out/promo-vo-720.mp4`
