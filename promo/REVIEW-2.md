# REVIEW-2 — independent final check, voiceover cut

**Film under review:** `out/promo-vo.mp4` — 1552f / 51.797s / 1920×1080 / 30fps, h264 + AAC 48k stereo.
**Delivered alongside:** `out/promo.mp4` (1383f / 46.14s), `out/promo-nobgm.mp4` (1383f / 46.10s).
**Reviewer context:** clean. Did not produce this film, did not read the production rationale before
measuring. Checklist = `references/final-review.md`; aesthetic rules = `references/aesthetic-rules.md`
(prefixed `AR-` below so `Q` numbering does not collide).
**Method:** every frame number cited was pulled from the render with `ffmpeg -vf select` and read.
Glyph heights measured on rendered frames by dark-row profile, not from source `fontSize`. Audio
decoded to PCM (48k f32 and s16), per-frame RMS/peak, and transcribed with faster-whisper `small`,
word timestamps on. **I cannot listen.** Anything needing ears is marked 无法验证.

## Timeline as delivered (measured, `src/timeline.ts` `voCut`)

| shot | frames | s | content |
|---|---|---|---|
| open | 0–130 | 0.0–4.3 | Daybreak letter |
| hero | 130–300 | 4.3–10.0 | the Tuesday insight card |
| floor | 300–450 | 10.0–15.0 | the room board |
| order | 450–640 | 15.0–21.3 | shelf → UVALUX order |
| titleB | 640–728 | 21.3–24.3 | "The salon decides what crosses. That's *consent*." (dark) |
| consent | 728–828 | 24.3–27.6 | consent screen (act-break push 798–828) |
| compass | 828–1044 | 27.6–34.8 | Compass call list |
| titleA | 1044–1132 | 34.8–37.7 | "And it writes the *marketing*." (paper) |
| studio | 1132–1372 | 37.7–45.7 | insight → campaign |
| outro | 1372–1552 | 45.7–51.7 | group photo + sign-off |

---

# The four changes — did they land?

### Change 1 — the real UVALUX logo under "BUILT FOR"

**Landed, technically clean. The line above it is the problem, and it is 22px.**

- **Genuine mark: yes.** `public/brand/uvalux-logo-4x.png`, 1320×400 RGBA, alpha bbox (14,41)–(1307,365)
  — nothing clipped at any edge. The wordmark, the swoosh through the U and the maple leaf in the
  terminal are all present and correct at f1540.
- **Proportion: exact.** Source aspect 3.3000; rendered box 264×80 = 3.3000. No distortion.
- **Sharpness: good.** 1320px source into a 264px box = 5× downsample; edges are clean at 4× crop.
- **Legibility of the mark: fine.** Ink extent measured 64px tall on the rendered frame.
- **✗ "BUILT FOR" is 22px (`S10Outro.tsx`), measured cap height 16px = 1.5% of frame height.** The
  Q11 support floor is ≥32px / ≥3%. It is the smallest type in the film and it is the line carrying
  the claim. See AR-Q11.
- **✗ The claim.** DESIGN_SPEC §0 states this film exists as "a pitch asset for Nick, President of
  UVALUX" — i.e. UVALUX has not adopted the product. "BUILT FOR" + UVALUX's registered mark, placed
  directly under the Bask wordmark and the `BASK · COMPASS` lockup, occupies the exact position and
  visual grammar that normally reads *"in partnership with / an official UVALUX product."* A dealer
  president watching a film he has not yet approved will see his own mark already in the sign-off.
  There is also no attribution/trademark line. This is an owner decision, not a bug — but it is a
  relationship claim the film has not earned, and the code comment ("a sign-off, not a claim about
  whose product this is") is the producer's reading, not the viewer's. Safer forms: "Prepared for
  UVALUX", "A proposal for UVALUX", or drop the mark and keep the words.
- Timing: mark reaches full opacity f1504, holds 38f (1.27s) before the 10f fade at f1542. Tight but
  adequate.

### Change 2 — title cards slowed

**Landed on the reveal. Fails R1 on the shorter of the two cards, in this cut.**

Measured by per-frame diff on the rendered file, not from code:

| card | frames | sentence settles | frozen at full opacity | verdict |
|---|---|---|---|---|
| titleB | 640–728 | rel 55 (f695) | **f695–720 = 25f = 0.83s** then 8f fade | **✗ R1** |
| titleA | 1044–1132 | rel 43–46 (f1090) | f1087–1124 = 37f = 1.23s | ✓ |

The slow-down itself is real and correct: per-word delay 6+i·6 over 13f, underline 22→46f, and the
reveal is not sluggish (titleB's seven words take 1.63s, titleA's five take 1.43s). But the VO cut
shortened both cards to 88f while the caption cut kept 104f — and 88f is not enough for a
seven-word card. In `out/promo.mp4` the same card holds f650–691 = 41f = **1.37s** and passes.
Fix is +9f on `titleB` in `voCut`, or move `fadeOut` later.

The code comment in `PaperTitleCard.tsx` claiming "a full second and a half of stillness" is wrong
for the 88f case by ~0.7s.

### Change 3 — the marketing beat moved to the end

**It landed. It has cost the film four specific things.** Detail in the ✗ items below; summary:

1. **The voiceover's "that" lost its referent** (AR-C1). Verified from the transcript with timestamps.
2. **A 193-point luminance flash-cut into an empty white frame at f1043→f1044** (AR-Q, A2, B2).
3. **The film's flattest 4.23 seconds is now its penultimate beat** (V2, AR-R3).
4. **The film no longer matches the pitch script it exists to preview** (P2/P4).

### Change 4 — VO clips moved with the reorder

**✓ Verified. Every one of the eight lines begins inside the shot it belongs to.**

Measured speech onset = pin frame + first sample above 2% of clip peak; content confirmed by
faster-whisper transcript of the finished mix.

| clip | line | speech starts | shot at that frame | ✓ |
|---|---|---|---|---|
| vo1 | "This is what a salon owner wakes up to." | f15.6 | open 0–130 | ✓ |
| vo2 | "Overnight, Bask read yesterday…" | f148.7 | hero 130–300 | ✓ |
| vo4 | "The floor runs live. Eight beds, one board." | f317.7 | floor 300–450 | ✓ |
| vo5 | "It counts the shelf…" | f465.4 | order 450–640 | ✓ |
| vo6 | "The salon decides what crosses…" | f743.2 | consent 728–828 | ✓ |
| vo7 | "And every UVALUX rep calls…" | f924.8 | compass 828–1044 | ✓ |
| vo3 | "Studio turned that into a campaign…" | f1149.8 | studio 1132–1372 | ✓ picture |
| vo8 | "Bask. The salon runs better…" | f1385.8 | outro 1372–1552 | ✓ |

Also ✓: every clip's declared `durationInFrames` exceeds its actual length (86≤92, 144≤150, 222≤228,
128≤132, 177≤182, 176≤180, 119≤124, 170≤174) — nothing is truncated, nothing rings past its shot
except vo6, which is deliberate (73 of its 81 frames of "Business signals. Never their customer
list." play over Compass, not over the consent screen; documented in VO-SCRIPT §3 and defensible —
Compass *is* the business signals — but the panel that says "What UVALUX sees" is off-screen for it).
vo8 ends f1542, exactly where the picture starts its fade. That is well done.

---

# Checklist

## P — product goal

- **P1 ✓** Positioning, user and core proposition are legible from the film alone: a salon operating
  system that reads the night's data, and a dealer-side view of the same signals.
- **P2 ✗ frame 1132.** The recorded feature→shot mapping (DESIGN_SPEC §2) ranks the campaign beat #4
  of 10 and `docs/pitch/PITCH.md` makes "Insight to action / the Tuesday campaign" **Beat 1** of the
  live demo. In the delivered film it is beat 9 of 10, after the entire UVALUX act. The film is the
  trailer for that meeting; it no longer previews it in order.
- **P3 ✗ frames 1244–1371 — "Written by gpt-4.1" is on screen for 4.23s, frozen, sharp.** Bottom
  right of the Studio review page (measured glyph band 9px). This was finding **#13** of the previous
  round and was not addressed; the reorder made it worse by moving that page to the film's last
  content beat and extending it from 150f to 240f. The project's own copy rule (VO-SCRIPT §5) is "No
  'AI' as a noun — the product's own copy voice states findings, not technology." The picture names a
  specific third-party model instead. Also `promo/CLAUDE.md` records that the deterministic fallback
  is what actually runs, which makes the label a claim about the product no one has checked.
- **P3 ✗ frame 1540 — "BUILT FOR" + the UVALUX mark.** See Change 1.
- **P4 ✗ — the recorded decision table no longer describes the film.**
  - "35–45s" → delivered **51.797s**. The caption cut is 46.14s. Both over the brief's ceiling; the
    VO cut by 6.8s.
  - "Two acts: warm Bask act, dark Compass act, **joined by the consent screen**" → the film is now
    Bask → consent → Compass → Bask → sign-off. Consent no longer joins two acts; it sits mid-film,
    and the Bask act resumes after Compass with no transition at all.
  - DESIGN_SPEC header still states "final 1327f = 44.2s" and "promo-vo.mp4 … 1466f / 48.9s". Neither
    number matches any delivered file.

## F — feature completeness

- **F1 ✓** All ten recorded shots are present and identifiable. Nothing was dropped in the reorder.
- **F2 ✓** No shot repeats another's information; the two breathing cards are now genuinely different
  beats (dark Compass palette vs paper) and carry different sentences. Note: the outro's on-screen
  tagline "The salon runs better. UVALUX sees the market it serves." is spoken **verbatim and
  simultaneously** by vo8 (f1478–1536 audio vs f1468→ on screen). Not a duplication across the film,
  but it is the one place the "captions off so the film is not read twice" rationale breaks.
- **F3 ✗ frames 343–389.** The Floor is the "live" shot, and its picture is **bit-identical for 46
  consecutive frames (1.53s)** — including the countdown, which does not tick. It reads 08:12 for
  1.53s, then rolls to 08:10 only when the camera moves. A board sold as live should not be frozen
  in its establishing hold.

## V — visual direction

- **V1 ✓** Fraunces/Inter, ivory paper, terracotta accent, gold eyebrow, sunset gradient used exactly
  twice (the in-session ring, the outro rule). Matches `mockups/tokens.css` and the recorded §1.
- **V2 ✗ — the energy curve is broken by the reorder.** Measured: **37.9% of the VO cut (588 of 1551
  frames, 19.6s) is bit-frozen picture** (frame-to-frame diff < 0.02 on a 240×135 grey decimation).
  The caption cut, from the same shots, is 26.4% / 12.2s. All 169 frames the VO cut adds are
  freeze-frame at the tail of an already-settled shot:
  - f558–639 = **81f (2.70s)** static inventory before titleB
  - f924–1043 = **119f (3.97s)** static Compass before the flash cut
  - f1244–1371 = **127f (4.23s)** static Studio, the film's penultimate beat
  R3 says default slower, and R1 wants breathing — but 4.2 seconds of an unmoving 1920×1080
  screenshot is not breathing, and it now sits immediately before the outro, where Q8 wants the
  film's energy peak to be approached, not walked into from a standstill.
- **V3 ✓** No drift to Ink Press / neon / any imported skin.
- **V4 ✓** No forbidden colour or brand feature. Compass's inverted palette is declared (§5.2) and is
  the product's own.

## S — shot cards and gallery variants

- **S1 ✓** Every card named in §2 is identifiable in its shot (crane-rise, spotlight-hero, paper-title
  ×2, card-flip, grid-wave-flip, list-stack-press, bottom-push seam, row-embed, outro-group-photo).
- **S2 无法验证** (agent-recorded mode; no user-named `card · style` to cross-check).
- **S3 ✗ — three cards are now outside their documented time envelope, none of it declared.**
  - `paper-title-card`: card says **时长 50–55f** and per-word `delay = 4 + i·4, 9f`, underline
    `16→34f`. Build runs 88f with `6 + i·6, 13f`, underline `22→46f`. The change is defensible (R1
    outranks), but DESIGN_SPEC §5 "Deviations" does not mention it, and the card's own 已知坑 —
    "长了拖节奏短了读不完" — is the exact tension being traded.
  - `card-flip-reveal`: card says 全程 ~4.9s including hold. Studio runs **240f = 8.0s**; its last
    camera key is at rel 112, so 128 frames (4.23s) are outside the card's grammar entirely.
  - `row-embed`: card says ~2s (12–68f). Compass runs **216f = 7.2s**, of which 3.97s is frozen.
- **S4 ✗** `paper-title-card` 已知坑 (duration is a fixed idiom) hit; `card-flip-reveal`'s hold budget
  exceeded. The row-embed 已知坑 (camera must move *with* the row rain, not after) is respected ✓.
- **S5 ✓** Adapted screenshots, coordinates and tokens sit naturally; no hand-rebuilt UI.
- **S6 无法验证** — `gallery/media/*.mp4` is not present locally. I judged every shot against the card
  doc and the named demo/template TSX and claim no sample parity anywhere.

## B — storyboard consistency

- **B1 ✗** DESIGN_SPEC §3 is a frame-level storyboard of the **old** order (S3 at 300–352, S4 at
  352–502, S9 at 949–1099, totals 1279f) and the header claims 1327f / 1466f. The film is 1383f /
  1552f in a different order. `VO-SCRIPT.md` §3's "Where each line actually sits" table is stale in
  every row (it places Studio at 11.50–19.50s; it is at 37.7–45.7s). The only accurate record of the
  film is `src/timeline.ts`.
- **B2 ✗ frame 1044.** The largest picture event in the film has no entry in the sound table (see A2).
  Also: S2's on-screen annotation reads **"Found overnight, nobody ran a report."**; §3 records
  "It read yesterday while the salon slept." Carried over from the previous round, still undeclared.
- **B3 ✗** Wordmark hold ✓ — Bask is static from f1452 to the f1542 fade = **90f / 3.0s**. Batch
  entrances all rest ≥0.5s ✓. Title card ✗ — titleB 0.83s (see Change 2).
- **B4 ✓** No key shot was silently deleted, replaced or added. The reorder is client-directed. It is
  not written into §5, which is the record that is supposed to carry exactly this.

## D — data and asset safety

- **D1 ✓ — improved.** The shelf shot (f530–639) frames On shelf / Days left / Selling / State and
  carries **no price column**, which is what the brief demands. The outro's `reorder-line` cutout
  does contain "suggested · $25 each" at 5–9px measured glyph height — texture, not a close-up, so
  the rule holds; flagging it only because it is the previous round's finding #13 and it is still on
  screen.
- **D2 ✗** "Written by gpt-4.1" (see P3) is an internal implementation detail rendered legible-ish
  and held 4.23s. No keys, no internal hosts, no customer PII.
- **D3 ✓** Every product surface is a real screenshot of `bask-psi.vercel.app`.
- **D4 ✓** All screenshots fully loaded — fonts, product photos, badges, tabular figures. The
  previously reported "08:12 eft" clip is fixed: f445 reads "08:10 left" cleanly.
- **D5 无法验证** — the fixtures ("Maple Glow Tanning, Burlington ON", "Aurora Collective — Beltline,
  Calgary AB", "Rosalind", "Nadia Carrow", `@sunsetridge`) are asserted fictional in §0. I have no way
  to confirm no real salon shares a name. Taking the brief at its word.

## A — audio and rhythm

- **A1 ✓** Bed windowed from 0:43, ducked to 0.13 under the voice. Measured: bed ≈ **−29.4 dBFS RMS**,
  VO speech **−18.7 to −20.8 dBFS RMS** — the read sits ~9–10 dB above the bed. Room exists for SFX.
- **A2 ✗ two misalignments.**
  - **f1043→f1044 has no cue at all.** The only nearby pin is `swoosh-quick` at f1046 (title-card-in,
    volume 0.28). The picture event there is a full-frame luminance jump of 193/255 — the hardest cut
    in the film — scored with the same soft swoosh used for a card that fades onto a matching ground.
  - **`transition-snap` at f348 ("last card overshoots and settles") fires 5 frames after all Floor
    motion has stopped.** Measured: the board is bit-frozen from f343.
  Everything else lands where the table says: crane `swoosh-slow` f22–106 exactly spans the crane
  (motion ends f106); the five order pops at f494/502/510/518/526 match the five landings; the
  `click-camera` at f524 precedes the counter lock at f526; the peak-compensated act-break
  `whoosh-big` (f792, +21f peak → ~f813) and `impact-deep-whoosh` (f812, +16f → ~f828) land inside
  and at the end of the 798–828 push.
- **A3 ✗** ≤3-frame tolerance met everywhere except the f348 snap (+5f).
- **A4 ✓** riser-cine f1406–1452 → impact f1429 (peak ≈f1445) → sparkle f1452–1536. Measured mix peak
  is at **f1446** — the film's loudest instant is the wordmark stamp. Correct.
- **A5 ✓** Every sample >5s carries an explicit `durationInFrames`; the two `impact-deep-whoosh` tails
  are left to ring by declared intent. No cue outlives its action.
- **A6 ✓ (headroom) / 无法验证 (audibility).** s16 decode: **max −1.02 dBFS, zero full-scale samples**
  (caption cut −3.07, no-BGM −2.20). No clipping. Whether each SFX is *audible* under bed + voice
  needs ears; `sparkle.mp3` at 0.28 under a voice-and-bed mix is the cue I would want listened to.
- **A7 ✓** The only `sfx/ui/` sample used is `switch-click-quick` — a real light switch, ✅ tier.
- **A8 ✗** The caption pair is correct: `framemd5` over both video streams is **byte-identical**, so
  `promo.mp4` and `promo-nobgm.mp4` are genuinely one timeline. But **the film under review has no
  no-BGM counterpart.** `promo-vo.mp4` carries a bed at 0.13 and there is no `promo-vo-nobgm.mp4`.
  The rule asks for both versions of any film that has a bed.

## Q — visual technical quality (`aesthetic-rules.md`)

### AR-R — rhythm
- **AR-R1 ✗ frame 720.** titleB holds its finished sentence 0.83s. Wordmark ✓ 3.0s.
- **AR-R2 ✓** Nothing moves at constant velocity except S2's lap-1 beam (previous round's finding #14,
  unchanged). Batch entrances accelerate and rest.
- **AR-R3 ✗ — inverted.** The rule's judgement is "first cut is always too fast." This one is now too
  slow in three specific places: 2.70s / 3.97s / 4.23s of frozen screenshot (see V2). The VO cut
  bought its extra 169 frames entirely in freeze-frame rather than in motion.

### AR-Q — texture, camera, composition
- **AR-Q1 ✓** Real screenshots throughout; the one hand-built element (the in-session ring/countdown)
  uses the product's own markup and is declared in §4.
- **AR-Q2 ✓** No pixel blocking on any 3D/zoom frame inspected (f220 annotation, f1160 flip, f1540
  logo at 4× crop).
- **AR-Q3 ✓** No camera shake anywhere.
- **AR-Q4** Unchanged conflict, previously declared (§5.7): grid-wave-flip's per-cell highlight and
  the outro's per-element landing glow are broadcast light, which Q4 forbids and both cards require.
  Reporting the conflict, not resolving it. 无法验证 whether they read cheap at speed.
- **AR-Q5 ✓** Single-subject opening with a complete arc.
- **AR-Q6 ✗ frame 445.** The Floor's held closing frame slices two room cards mid-word at the right
  edge — "KBL S…" and "Wellsystem Wave Hydro Mass…". The previous round flagged exactly this class
  (finding #7, the customer rail) and the fix widened the *establishing* framing; the push-in that
  ends the shot re-creates it, and this is the frame the shot rests on for its last 0.63s.
- **AR-Q7** n/a — no object close-up in this film.
- **AR-Q8 ✓** The outro is still the energy peak (measured audio peak f1446; crane + stage light +
  dust + seven flying elements). But it is now entered from a dead stop.
- **AR-Q9 ✓** Every flown element lands in a real slot.
- **AR-Q10 ✓** Every document-class frame is a real page at full density.
- **AR-Q11 ✗ two measured failures.** Measured on rendered frames.
  - **✗ frame 1540 — "BUILT FOR" is 22px, cap height 16px = 1.5% of frame height.** Floor for support
    text is 32px / 3%. For comparison, on the same frame: tagline 58px (ink band 43–45px) ✓,
    `BASK · COMPASS` 34px (ink band 25px) ✓ — both of those were fixed correctly last round. The new
    line is below both.
  - **✗ frames 1244–1371 — the Studio page is a 4.23s static reading test at 8–30px.** Headline ~30px,
    body copy 8–13px, "Written by gpt-4.1" 9px, all sharp, all unblurred, camera at rest, while the
    voice says "The offer, the post, the text." The rule's two-state test — texture (visibly
    softened so nobody tries to read it) or readable (≥ floor) — is failed in the middle: the film
    invites a read it cannot support. In the caption cut this shot is 150f with a moving camera; the
    reorder turned it into the film's longest static frame.

### AR-S — sound
- **AR-S1 ✓ (vocabulary) / 无法验证 (character).** Client-supplied bed; whoosh/impact/riser/sparkle/
  transition only; no game-pack timbre.
- **AR-S2 ✓** Declarative frame table, every cue annotated with its picture action, ladders and
  alternating samples on both burst sequences.
- **AR-S3 ✗** The rule is that a timeline change forces a full re-pin. Relative pinning carried the
  table correctly — but the reorder *created* one new picture event (f1044) that got no cue, and the
  re-pin pass did not catch that `transition-snap` at f348 is now 5 frames past its action.
- **AR-S4 ✓** Foley matches action: page-turn on the flip, camera click on the counter lock, laddered
  pops on the row landings, switch clicks on the tile embeds.

### AR-C — copy
- **AR-C1 ✗ frames 1044–1160 — the reorder broke the voiceover's pronoun.** This is the single most
  serious consequence of Change 3, and it is not a matter of taste.

  The line is *"**Studio turned that into a campaign.**"* Its referent is the Tuesday finding. Verified
  from the transcript of the finished mix:

  | | said | at |
  |---|---|---|
  | referent established | "…found the quiet Tuesday." | ends **8.78s** |
  | pronoun spoken | "Studio turned **that** into a campaign." | **37.96s** |

  **29.2 seconds and five complete sentences apart.** Everything the listener heard in between is a
  different subject — the floor, the shelf, the consent boundary, and a UVALUX rep. At the moment
  "that" is spoken, the nearest antecedent in the audio is *"exactly what changed"* from the Compass
  line. The sentence therefore parses, on first listen, as "Studio turned the rep's briefing into a
  campaign" — which is not what the product does, and which crosses the Bask/Compass boundary the
  consent beat spent 3.3 seconds establishing.

  The mitigations that were attempted are real but insufficient:
  - The title card was rewritten to "And it writes the marketing." — that supplies a topic, not an
    antecedent, and its subject is "it" (Bask) while the next sentence's subject is "Studio". Read
    together: "And it writes the marketing. Studio turned that into a campaign" — "that" now points
    at "the marketing", which is circular.
  - The picture does restate the referent: S4 opens on the insight card's front face. But the face is
    up for **f1132–1157 only (0.83s)**, and past f1148 it is rotating through 90° and effectively
    edge-on. The audience gets under a second of a foreshortened card, 27.7s after they last saw it,
    to recover a pronoun.

  This is fixable without re-cutting: re-record or re-edit vo3's first sentence to name the subject —
  *"Studio turned that quiet Tuesday into a campaign"* / *"And the finding? Studio turned it into a
  campaign."* One clip, no picture change.
- **AR-C2 ✓** Both cards name a function and a benefit; one accent word each; the lead-in card before
  the Studio beat is present, as the card requires.
- **AR-C3 ✓** S2's annotation lives in page space on the same camera.

### AR-P — process
- **AR-P1 ✓** `out/qa/vo/v01–v32.png` + contact sheet were rendered and archived before delivery.
- **AR-P4 ✓** Feature checklist mapped 1:1; no technique stars twice (rotateY flip and rotateX wall
  flip are on different axes and 800 frames apart).

---

# The reorder: has it damaged the film? Yes — in four measurable ways.

The client asked for it and is entitled to it. They are also entitled to the bill.

**1. The dark-to-light seam at f1043→f1044 is the worst cut in the film.** Measured full-frame
luminance jumps from **56 to 249 in a single frame (mean abs diff 193.5)**. It is not a stylistic
flash cut — the frame it lands on is *empty*: the title card's first word does not begin appearing
until f1050 and is not legible until ~f1058, so the audience gets **0.27s of blank ivory** after a
193-point slam, following **3.97s of a motionless dark screen**. And it is asymmetric: the film
*enters* the Compass act with a 30-frame bottom-push seam, a whoosh and an impact, and *leaves* it
with one frame and a soft swoosh. The same cut is in all three masters (caption cut f948→f949, diff
193.9). This is the one item I would not ship.

**2. The act structure is no longer legible as the structure the film declares.** The recorded design
is "two acts joined by the consent screen." Delivered, it is Bask → consent → Compass → Bask →
sign-off. Consent no longer sits at the hinge; the dark breathing card that was rebuilt to
"foreshadow the act break" now sits 100 frames and one full light-ground shot away from it. Coming
back from Compass to Bask is a genuine act change and it is marked by nothing at all.

**3. The film's climax is now its flattest beat.** The last content shot before the sign-off is a
frozen full-page screenshot for 4.23 seconds — the longest static frame in the film — carrying 8–30px
body copy and the words "Written by gpt-4.1". The reorder did not just move the beat; it inherited
240 frames of shot budget that the shot was choreographed for 150 of.

**4. The pronoun.** See AR-C1. This is the one a viewer will actually notice.

None of this is an argument against ending on marketing. If the client wants the campaign beat last,
the film can absorb it — but it needs (a) a real transition out of Compass, (b) vo3's first sentence
re-cut to name its subject, and (c) the Studio and Compass shot budgets trimmed back toward their
choreography instead of padded with freeze-frame.

---

# Must fix

1. **The f1043→f1044 seam.** Dark Compass → blank white in one frame, unscored, and it is the film's
   hardest visual event. Give it a real transition (the film already owns one — mirror the
   bottom-push, or a 8–10f dip/wipe) and a cue that matches its size. Also: extend the title card's
   `fadeIn` to cover an ink-bearing frame, so the cut does not land on an empty ground.
2. **"Studio turned **that** into a campaign" has no referent** — 29.2s and five sentences from its
   antecedent (AR-C1). Fix in the voice clip, not the picture.
3. **"Written by gpt-4.1", frames 1244–1371 (4.23s, held, sharp).** Previous round's finding #13,
   unaddressed, and now the last thing the audience reads before the sign-off. Re-capture the Studio
   page without the attribution line, crop it out of frame, or soften it. This goes to a dealer
   president.
4. **"BUILT FOR" + the UVALUX registered mark.** Two problems in one lockup: the type is 22px
   (1.5% frame height, below the 32px/3% floor) and the phrasing asserts a relationship the meeting
   has not produced. Decide the wording with the client before the meeting, and set it at ≥32px.
5. **titleB holds its finished sentence 0.83s (f695–720)** against the ≥1s rule the project's own
   motion-token table restates. +9f on `voCut.titleB`, or move `fadeOut`. (The caption cut passes at
   1.37s — this is a VO-cut-only regression.)
6. **The VO cut has no no-BGM master.** A8 asks for both versions of any film carrying a bed. The
   caption pair is done correctly — `framemd5` identical — so the method already exists.

# Should improve

7. **The three freeze-frames: f558–639 (2.70s), f924–1043 (3.97s), f1244–1371 (4.23s).** 37.9% of the
   film is a bit-identical picture, against 26.4% for the caption cut from the same shots. Every
   frame the VO cut added is a freeze. Extend the choreography (a continuing slow push costs nothing)
   or trim the shots and let the read breathe between lines instead of over a still.
8. **f348 `transition-snap` fires 5 frames after the Floor stops moving.** Outside the ≤3f tolerance.
9. **The Floor's countdown is frozen for 46 frames (f343–389) in the film's "live" shot.** A board
   whose whole claim is liveness should not hold 08:12 for a second and a half. Roll it through the
   hold.
10. **f445 slices two room cards mid-word at the right edge** in the shot's held closing frame. Same
    class as the previous round's finding #7; re-frame the push-in end.
11. **DESIGN_SPEC and VO-SCRIPT no longer describe the film.** §3's storyboard, the header frame
    counts (1327f / 1466f vs 1383f / 1552f), and VO-SCRIPT §3's entire timing table are all pre-reorder.
    §5 does not declare the reorder, the title-card timing change, or the three cards now outside
    their documented duration envelopes. The spec is supposed to be the production baseline a
    reviewer checks against; right now `src/timeline.ts` is the only true record.
12. **Duration.** 51.797s against a 35–45s brief. Items 7 and 9 above would recover ~5s of it without
    losing a single beat.
13. **Carried over, still open from the previous round:** S2's lap-1 beam on `Easing.linear` (f200–222,
    the only constant-velocity element in the film); `src/lib/Caption.tsx` and `src/lib/FlashCut.tsx`
    are dead files; `S9Compass.tsx:142-143` still ships the hidden "unused import guard" div.

# Cannot verify (无法验证)

- **Whether any SFX is audible in the finished mix.** I have levels, peaks, per-frame RMS and −1.02
  dBFS headroom, but no ears. The specific cue I would want listened to is `sparkle.mp3` at 0.28
  under a 0.13 bed *and* a voice; and the two hard-truncated `impact-deep-whoosh` tails, where a cut
  reverb can click.
- **Whether the bed's character suits the brand.** The rule requires auditioning the candidate inside
  the cut. The bed is client-supplied, which settles authorship but not fit.
- **Whether the film matches the Gallery reference clips.** `gallery/media/*.mp4` was never fetched
  for this project. Every shot was judged against its card doc and the named demo/template TSX; I
  claim sample parity nowhere.
- **Whether the two broadcast light effects (grid-wave-flip's per-cell highlights, the outro's seven
  landing glows) read as cheap at playback speed.** Statically they read as material specular. The
  card docs require them and Q4 forbids them; the conflict is declared in §5.7 and I am not
  overruling it from stills.
- **Whether the "Sunset Ridge" fixtures are genuinely fictional.** Asserted in DESIGN_SPEC §0;
  not independently checkable from here.
- **Whether the UVALUX mark in `public/brand/` is pixel-faithful to the current uvalux.com asset.**
  It is internally consistent, undistorted and complete (aspect 3.3000 source and rendered, alpha
  bbox clear of all four edges), and the wordmark, swoosh and maple leaf are all present — but I did
  not fetch the live original to diff against.
