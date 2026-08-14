# Bask promo — design spec & storyboard
**Mode:** video-shotcraft 自主自由创作 (autonomous free creation). Pipeline `references/pipeline.md` phases 0–7.
**Written:** 2026-08-13 · 30fps · 1920×1080 · **final 1327f = 44.2s** (brief: 35–45s)
**Masters:**
- `out/promo-vo.mp4` — **the voiceover cut**, 1466f / 48.9s: client VO + client music bed + SFX,
  captions off. Composition `BaskPromoVO`.
- `out/promo.mp4` — caption cut, 1327f / 44.2s, music + SFX, no voice. Composition `BaskPromo`.
- `out/promo-nobgm.mp4` — caption cut, SFX only, muxed onto the same video stream as `promo.mp4`.

**Audio, as supplied by the client (2026-08-13):** voice = ElevenLabs "Tessa", 41.82s, split into
eight line clips at its own pauses; bed = `bgm-open-road.mp3`, windowed from 0:43 (the quietest bar,
which then climbs for ~50s so the bed's arc matches the film's), ducked to 0.13 under the voice and
0.26 without it.

---

## 0. Product brief & requirement → execution decisions

**Purpose line (verbatim from the task):** *This exists so that a ~35–45s cinematic product video exists
for Bask (UVALUX salon OS), as a pitch asset for Nick, President of UVALUX.*

| Requirement | Source | Execution decision |
|---|---|---|
| Product = Bask (salon OS) + Compass (UVALUX dealer intelligence) | PRODUCT_SPEC, PITCH.md | Two acts: warm Bask act, dark Compass act, joined by the consent screen |
| Hero feature = Daybreak morning brief | task, PITCH 0:00 | Opens the film; the real headline is the film's first line of copy |
| Audience = dealer president, pitch asset | task | Editorial/restrained register, not startup-hype. Evidence over adjectives |
| 35–45s, 1920×1080, 30fps | task | 1327f = 44.2s |
| BGM + no-BGM deliverables | task | `bgm` boolean inputProp wraps the `<Audio>`; the video is rendered once and the music-free master is muxed from an audio-only render, so both masters carry a bit-identical video stream |
| Deterministic renders | task, skill §9 | No `Date.now()`/`Math.random()`; all jitter from `mulberry32(index)` |
| Data safety | task | All figures are the fictional seeded Sunset Ridge fixtures on the public demo. **No price close-ups** (UVALUX publishes wholesale only; Bask retail is derived) — the `$52,542 retail on the shelf` tile and per-item prices are never the subject of a close-up; the inventory shot frames reorder *reasons*, not price columns |
| Repo hygiene | task | `promo/` sits outside the pnpm workspace (`pnpm-workspace.yaml` globs `apps/*` + `packages/*` only), own package.json, own node_modules |
| Capture source | task | The **live** deploy `https://bask-psi.vercel.app` (never `bask.vercel.app`). No `demo:reset`, no local DB writes |

**One write to the demo DB, deliberate:** the Studio review screen (the generated campaign) does not
rehydrate from an existing campaign row — `/marketing?campaign=<id>` renders the step tracker and an
empty body (product bug, logged in CURRENT_WORK). The only way to photograph the real screen is to walk
the pitch's own Beat 1 (`Create a Tuesday promo` → `Generate the campaign`), which creates one campaign
row. That is the same action the presenter performs live, and `demo:reset` restores determinism.

## 1. Visual direction (chosen, not asked)

**"Morning letter, serious instrument."** The film inherits the product's own language, per skill rule 2:
warm ivory paper ground, ink type, one terracotta accent, gold eyebrows, and the sunset gradient kept
*scarce* — it appears exactly twice (the in-session ring on the Floor, the outro wordmark rule), which is
the product's own rule ("sacred and scarce", DESIGN_SPEC §2.1). Compass is the same system in evening
light: warm charcoal + amber, never terracotta.

Rejected directions: (a) dark-场 neon "product internals" (graze-face-tour / steep-tilt-glide family) —
handsome but it is an imported promo skin, and Bask is a light editorial product; (b) high-energy
startup montage (beat-cut / slam-entrance) — wrong register for a dealer president.

### Tokens (lifted verbatim from `mockups/tokens.css`, not re-derived)
```
paper       oklch(98.2% .004 84)      ink        oklch(21% .012 320)
paper-2     oklch(96.2% .004 84)      ink-soft   oklch(42% .014 320)
card        #ffffff                   ink-faint  oklch(55% .014 320)
primary     oklch(58% .14 42)  terracotta        line  oklch(90% .006 84)
gold        oklch(72% .084 85)        success    oklch(60% .12 155)
grad-sunset linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)
COMPASS  paper oklch(19.5% .012 50) · card oklch(24.5% .014 50) · amber oklch(79% .125 78)
display Fraunces (500, italic for the emphasis word) · body Inter (400/600, tabular nums)
shadow-card 0 1px 2px /.04, 0 8px 24px /.05   ·  radius 1rem / 1.4rem
```

### Motion tokens (品牌→动效参数, energy axis: low; tone axis: serious)
Blend of *专业信赖* and *精致高端* presets, then pulled toward the product's own motion spec
("restraint is the style", DESIGN_SPEC §2.4):

| token | value | why |
|---|---|---|
| main duration | 26–34f (page moves 40–100f) | slower than the 21f B2B preset — this brand settles and stops |
| entrance easing | `bezier(0.16,1,0.3,1)` | this *is* the product's `--ease-out` |
| camera easing | `bezier(0.33,0,0.15,1)` | PageCam default; long, damped |
| overshoot | ≤1.02 generally; **y1>1 only where something lands** (row-embed press, group-photo fly-in) | aesthetic-rules R2/Q8 outrank the preset's "no bounce" |
| squash | 0 | serif/editorial brand |
| hold budget | wordmark ≥30f · every information card ≥30f after settle · batch entrances 15f still | R1/R3 |
| camera shake | none (Q3) | light-场 UI promo |

**Styleframe:** `styleframe/frames.html` → `out/qa/styleframe-{1,2,3}.png`, checked before any Remotion code.

## 2. Feature → shot mapping

| # | Product feature (P4 checklist) | Card (`library.json` verified) | Style key / variant | Demo source |
|---|---|---|---|---|
| 1 | Daybreak morning brief (hero) | `crane-rise-reveal` | single | `demos/opening/crane-rise-reveal/CraneRiseReveal.tsx` |
| 2 | Attention queue — an insight card with evidence + impact | `spotlight-hero-card` | single (+ 3D annotation) | `template/src/aifl/live/SceneOpen.tsx` |
| 3 | breathing card | `paper-title-card` | single | `template/src/aifl/PaperTitleCard.tsx` |
| 4 | Studio — insight becomes a written campaign | `card-flip-reveal` | rotateY reveal | `demos/transition/card-flip-reveal/CardFlipReveal.tsx` |
| 5 | The Floor — live room board, sunset session ring | `wall-reveal-moves` | **B `grid-wave-flip`** (rotateX entrance) | `demos/ui-entrance/wall-reveal-moves/GridWaveFlip.tsx` |
| 6 | Inventory → UVALUX draft order | `list-stack-press` | single (+DigitRoll counter) | `template/src/aifl/live/ScenePapers.tsx` |
| 7 | breathing card | `paper-title-card` | single | as above |
| 8 | Consent — "What UVALUX sees" | seam: `bottom-push-stack-wipe` (single-seam adaptation, not the whole-film skeleton) | 30f heavy ease-out + 40px seam shadow | `demos/transition/bottom-push-stack-wipe/BottomPushStackWipe.tsx` |
| 9 | Compass Call List — evidence tiles, suggested conversation | `row-embed` | single | `template/src/aifl/live/SceneDetail.tsx` |
| 10 | Brand close, every surface returns | `outro-group-photo-launch` | single | `template/src/aifl/live/SceneOutroLive.tsx` |

Not filmed (documented, not forgotten): Customers, POS/scanner, public booking, Peers gap slider,
Network map. 42s cannot hold nine surfaces; the five that carry the pitch's argument are in.
**One technique = one starring role**: rotateY flip (4) and rotateX wall flip (5) are deliberately
different axes, per `card-flip-reveal` 已知坑.

## 3. Storyboard (制作放行 — frame-level)

| # | frames | dur | shot | page state / asset | key motion | caption (Q11 ≥56px) | SFX |
|---|---|---|---|---|---|---|---|
| S1 | 0–130 | 130 | Daybreak open | `today-full` 2x + `letter-4x` | crane-rise: hold tight on the gold eyebrow + headline 24f → 82f pull-back to full page, row pulses cross the attention queue → 24f still | — (the page's own headline is the copy) | riser-soft in, transition-soft at settle |
| S2 | 130–300 | 170 | The insight card | `insight-tuesday.png` cutout + empty backplate | spotlight roams 4 stations → locks → 16f push to rotY 30° → card rise 10f (overshoot) → hover 54f bob → outline beam ×2 laps → reseat 18f, then lock ≥20f | "It read yesterday while the salon slept." (3D page-space annotation, Fraunces 60px + gold marker bar) | whoosh-big on rise, sparkle on beam, snap on reseat |
| S3 | 300–352 | 52 | breathing | paper | letterpress per-word, italic terracotta on *campaign*, rule scaleX | "From the finding to the **campaign**." | swoosh-quick |
| S4 | 352–502 | 150 | Studio | `insight-tuesday.png` (front) / `studio-review` crop (back) | rotateY 18f→192°→8f→180°, edge sheen peaks at 90°; then 60f slow push over the generated Instagram + SMS, 40f still | "Bask drafts the offer, the post and the text. You still press send." | flip clack, transition-soft |
| S5 | 502–652 | 150 | The Floor | `floor-full` (with the in-session room injected via the product's own `.in-session-ring` markup) | grid-wave-flip: 8 room cards rotateX on a (row+col)·6f diagonal wave, last card overshoots; the in-session room lands wearing the sunset ring, countdown DigitRoll ticks; 20f still | "Eight beds, one board — live." | whoosh per wave (2 samples alternating, level ladder), soft impact on last card |
| S6 | 652–797 | 145 | Inventory → UVALUX order | `inventory-full` + 4 reorder-line cutouts | anticipation beat on the counter → 4 lines fly up and stack, each press-bounces the stack 6px, counter DigitRolls; 15f still | "It writes the UVALUX order. A forecast, not an ad." | camera-click on counter lock, soft pops laddered 0.40→0.25 |
| S7 | 797–849 | 52 | breathing | paper | letterpress, italic terracotta on *consent* | "The salon decides what crosses. That's **consent**." | swoosh-quick |
| S8 | 849–949 | 100 | Consent | `consent-full` | 60f slow push framing "What you see" / "What UVALUX sees"; at 919 the dark panel becomes the leading edge of the act break | "Business signals — never their customer list." | low riser |
| — | 919–949 | 30 | seam | — | bottom-push: Compass pushes up 1080→0, `cubic-bezier(.12,.9,.2,1)`, 40px seam shadow | — | long whoosh |
| S9 | 949–1099 | 150 | Compass Call List | `compass-full` + 3 evidence-tile cutouts | row-embed: tiles descend, rotateX flattens, amber seam flashes at the bottom edge on embed; camera pans down the card; 30f still | "Every rep calls knowing exactly what changed." | transition-soft, one amber tick per embed |
| S10 | 1099–1279 | 180 | Outro | 6 element cutouts (insight card, campaign post, room card w/ ring, order line, evidence tile, consent chip) | group photo: elements fly in from ±360–500px, `bezier(0.34,1.4,0.44,1)`, land with a glow; crane rotateX 4°→0; wordmark **Bask** letterpress + sunset rule; 30f sign-off hold | "The salon runs better. UVALUX sees the market it serves." then wordmark only | riser-cine → impact (peak 0.55) → sparkle |

Energy arc vs `sequences/promo-energy-arc.md`: ① open 130f (10%) · ② hero 170f (13%) · ③ climb
S3–S9 799f (62%) · ④ outro 180f (14%) · 2 breathing cards. Within the skeleton.

## 4. Assets (phase 4)

`public/textures/` — all captured from `https://bask-psi.vercel.app` at viewport 1920×1080,
`deviceScaleFactor: 2` (hero crops at 4, per Q2):

```
today-full.png / today-empty.png    letter-4x.png    insight-tuesday.png (+4x)
studio-offer.png  studio-review.png  studio-ig-4x.png  studio-sms-4x.png
floor-full.png (in-session injected)  room1..8.png  room-ring-4x.png
inventory-full.png  invline1..4.png  invcounter.png
consent-full.png  consent-dark-panel.png
compass-full.png  ctile1..3.png  ccard-4x.png
layout.json   (page-space bboxes + pageH for every cutout)
```

**In-session room, method:** the live demo's virtual clock sits at 5:38 p.m. with every bed Ready or
Cleaning, so the sunset ring — the product's signature — is not on screen and cannot be photographed
without starting a real session (a DB write that would leave a bed running for the actual pitch).
Instead the capture script wraps one room in the product's own `.in-session-ring` element and fills the
product's own `.state` markup (`.countdown.num` + `.mins` + `.who`), exactly as `RoomBoard.tsx` renders
it for a running room, using a fixture customer's first name. Same components, same CSS, same pixels,
zero writes. Documented here because it is a deviation from "screenshot only what the page served".

## 4b. Changes made after the first self-review (out/qa/v1 → v2)

Rendered stills, looked at them, fixed what they showed (P1 — the first look is never the user's):

| Frame | What the still showed | Change |
|---|---|---|
| v1 f20 | the app nav bar sat in the opening frame | S1 focal moved 78px down the page — the film opens on the sentence, not on chrome |
| v1 f250 | the 3D annotation landed on top of the card above it, and the spotlight pool bloomed over the card face | push-in eased from zoom 1.9 → 1.55 with the focal moved left so the page's left margin is in frame; note relocated there; pool centre alpha 0.40 → 0.20 and vignette 0.40 → 0.52 |
| v1 f520 | the room board sat empty for ~20 frames before the wave arrived | S5 hold 14 → 8, stagger 6 → 5 |
| v1 f700 | the shelf table showed a large white void where the un-landed rows were | S6 rows start arriving before the camera gets there (cues 26→58, flight 22f → 18f); glaze moved with them |
| v1 f1200 | outro tagline collided with the room card and the campaign card | group-photo layout re-laid around a protected centre band (y 360–780); background blur 16 → 22 |
| v1 f860 | consent caption was still fading in when the shot was half over | caption starts at +4 instead of +10 |

## 4c. Sound, and how it was verified without ears

The producing agent cannot listen. Everything about the mix was therefore established by
measurement, and that limit is stated here rather than hidden:

- **Levels** come from `ffmpeg volumedetect` on each source (all cues sit between −0.0 and −5.7 dBFS,
  so the documented 0.2–0.6 band behaves normally; none of the seven known quiet samples are used).
  Rendered mix: `max_volume −3.2 dB` with BGM, `−3.8 dB` without — no clipping.
- **Alignment** was checked by decoding the no-BGM render to PCM, computing per-frame RMS, and
  comparing detected onsets against the pin table. That pass found the two whooshes and both impacts
  landing late, because those samples peak well after their start (`impact-deep-whoosh` peaks at
  +16f, `whoosh-big` at +21f, `transition-soft` at +13f). Every affected cue was re-pinned by its own
  measured peak offset so the audible hit lands on the picture, not after it.
- **What is still unverified:** whether the tech-house bed is the right *character* for this brand.
  The skill's own rule is that a candidate must be auditioned inside the cut, and that needs ears.
  The no-BGM master exists partly for this reason — swapping the bed is a one-line change in
  `src/Soundtrack.tsx`.

## 4d. Post-review changes (independent review → fixes)

An independent reviewer with a clean context ran `final-review.md` + `aesthetic-rules.md` against the
first cut. Report: `REVIEW.md`. What it found and what changed:

| Finding | Fix |
|---|---|
| A2 — the three Compass tile clicks fired 30f early: the sound table recomputed the tile cues but omitted S9's own 30f act-break offset | `S9_PUSH` is now shared by both files |
| S5/D4 — the live countdown overlay's 100px box clipped the "left" label baked into the screenshot, so the running bed read "08:12 eft" for 4.9s | box narrowed to 88px |
| S5 — the right edge sliced the page's customer rail mid-glyph | board framing zoom 1.18 → 1.28 |
| Caption collisions — "You still press send." ran through the page's Schedule button; the counter sat on the page's own order button | caption gained a `rightGutter`; counter moved and held until the camera leaves the reorder card |
| R1/B3 — both title cards held their finished sentence for only 0.35s | 52f → 76f each (film 42.6s → 44.2s) |
| Q11 — closing tagline 38px, lockup 26px in low-contrast gold, counter labels 22px | 58px / 34px in a deeper gold / 34px |
| B2 — "That's consent." had been dropped from the second title card | restored |
| F2 — the two breathing cards were the same shot twice | the second one is now in the Compass palette, which also foreshadows the act break |
| S3/S4 — `list-stack-press`'s linked-highlight secondary action was missing | implemented, 3f after each landing |
| A2 — S8 was 2.2s of digital silence against a storyboard that promised a bed | added a peak-compensated scene-in plus a low bed under the push |
| A8 — the two masters were not frame-identical (132 frames differed by sub-pixel rasterisation) | video is now rendered ONCE and the music-free master is muxed from an audio-only render; `framemd5` over both video streams is identical |

Also added, off the back of the VO request: a `captions` input prop and a third master with the
captions off, so a voiceover does not double the on-screen text.

## 5. Deviations from the aesthetic rules

Declared, per the rules' requirement that a deliberate violation be written down:

1. **`bottom-push-stack-wipe` is used as a single seam**, not as the film-wide chapter skeleton the
   card describes. One act break exists in this film, and its two sides are two different products.
2. **The Compass act inverts the palette.** Not style drift — Compass ships that way.
3. **`spotlight-hero-card` camera parameters are adapted**: the card's push is zoom 2.6 / rotY 34° /
   rotX 8° / focal −30px; this film uses zoom 1.55 / rotY 26° / rotX 6° / rotZ 1.5° / focal −151px.
   Reason: Bask's insight card is 740×163 — wide and short, not the card's near-square subject — so
   the card's zoom put its own edges outside the frame, and the focal shift is what puts the page's
   left margin in shot for the 3D annotation. Every parameter the card marks 命门 (4 spotlight
   stations, pool 620→420→360, 10f rise with overshoot, 54f hover with a 4px/40f bob, 18f reseat with
   a 0.997 press, two laps at the card's widths and opacities) is unchanged.
4. **`crane-rise-reveal` runs 82f, not 100f**, and reverses direction (the card cranes up from the
   bottom row; this film pulls back from the letter at the top) because Bask's establishing fact is
   at the top of the page. Its tail is 24f rather than the card's ≥30f — but the next shot opens on
   the identical framing and holds it, so the stillness the audience sees is ~50f.
5. **`wall-reveal-moves` B runs hold 8 / stagger 5**, not the card's 20 / 6: at the card's values the
   room board sat empty in frame for two-thirds of a second and read as a loading state.
6. **`list-stack-press` runs 8f cues / 18f flight**, not 12 / 22, for the same reason — the shelf
   table's empty body is a white void, and the card's pacing left it on screen too long.
7. **Q4 vs two cards.** `wall-reveal-moves` B requires a per-cell 90° highlight and
   `outro-group-photo-launch` requires a per-element landing glow; Q4 forbids broadcasting light
   effects. Both are implemented as their cards specify — the conflict is noted rather than resolved
   unilaterally, and the film's discretionary light effects (the hero beam, the stack glaze, the
   outro sweep) are each used exactly once.

Two notes for anyone re-reading the original brief:
- `bottom-push-stack-wipe` is used as a **single seam**, not as the whole-film chapter skeleton the card
  describes. Justification: one act break exists in this film, and its two sides are genuinely two
  different products.
- The Compass act inverts the palette. That is not a style drift — Compass ships that way.
