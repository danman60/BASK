# Final review — Bask / Compass product film

Independent review, clean context, not involved in production.
Film: `out/promo.mp4` 1279f / 42.63s / 1920×1080 / 30fps · no-BGM master `out/promo-nobgm.mp4`.
Baseline: `promo/DESIGN_SPEC.md` (autonomous-free-creation mode → the Agent's own recorded spec is
the baseline), the named card docs under `~/.claude/skills/video-shotcraft/references/shots/**`, the
named demo/template TSX, and `aesthetic-rules.md`.

**Numbering.** `P/F/V/S/B/D/A/Q` = `final-review.md`. Items from `aesthetic-rules.md` are prefixed
`AR-` where the letter would collide (`AR-S` sound, `AR-C` copy, `AR-P` process); `R` and `Q` are
unambiguous and used bare.

**What I could not do:** I cannot hear. Every audio finding below is from `volumedetect`, per-frame
RMS onset detection on the no-BGM master decoded to PCM, sample-duration probes, and the pin table
in `src/Soundtrack.tsx`. Gallery reference clips are absent locally (`gallery/media/*.mp4` was never
fetched) — every "matches the gallery clip" question is marked cannot-verify and judged against the
card doc + demo TSX instead.

---

## P — product goal

- **P1 ✓** Positioning and core proposition are legible without narration. Two named products, two
  acts, one hinge. Frames looked at: 110 (Daybreak + "the morning brief was written while the salon
  slept"), 440 (Studio), 580 (The Floor), 770 (UVALUX order), 870 (consent), 1000 (Compass), 1210
  (wordmark + "The salon runs better. UVALUX sees the market it serves.").
- **P2 ✓** Screen time follows the recorded priority. Hero (Daybreak + the insight) gets 300f (23%);
  the five pitch-carrying surfaces get 745f; the two breathing cards 104f; outro 180f. Matches
  DESIGN_SPEC §3's declared arc (10/13/62/14%).
- **P3 ✗ frame 490:** the Studio page carries the real line **"Written by gpt-4.1"** (bottom-right of
  the Schedule card; legible at f470–f500, cropped and enlarged at `/tmp/gpt.png`). It is real page
  text, so it is not fabricated — but it is a third-party model attribution on a screen shown to the
  UVALUX president, and `uvalux-platform/CLAUDE.md` records that the AI path is currently running a
  deterministic fallback. Owner decision required: either it is true and intended to be public, or
  it should be framed out. Nothing else in the film claims a feature that is not on screen.
- **P4 ✓** Every row of the §0 decision table lands somewhere checkable: two acts joined by the
  consent screen (f870→f935 seam); Daybreak opens the film (f0–130); editorial register throughout
  (no hype copy — every caption names a surface); 42.63s inside 35–45s; two masters exist; `grep` for
  `Date.now|Math.random|new Date(` over `src/` returns only a comment. The one execution choice that
  did **not** land is the S8 "low riser" (see A2).

## F — feature completeness

- **F1 ✓** All ten mapped features have an identifiable shot: Daybreak f10–130 · attention queue /
  insight card f130–300 · Studio f352–502 · The Floor f502–652 · Inventory→UVALUX order f652–797 ·
  consent f849–949 · Compass Call List f949–1099 · two title cards · outro. The five features
  DESIGN_SPEC §2 records as *not filmed* are genuinely absent, as declared.
- **F2 ✗ frames 320 and 820:** S3 and S7 are visually the same shot — same paper ground, same
  Fraunces 108px centred line, same 220px terracotta rule, same per-word letterpress, same duration
  (52f). Only the words differ. `AR-P4` ("一种手法全片只当一次主角") is stretched: the second card
  reads as a repeat of the first rather than a new beat. No repeated tagline and no repeated
  information otherwise — each shot carries new content.
- **F3 ✓** Page state teaches in every shot, not just decorates: f110 shows five ranked insight rows
  with impact chips; f580 shows four bed states (Ready / in-session countdown / Cleaning 4 min /
  Maintenance with a reason); f770 shows the five-column shelf table with the "reorder at N" reason
  under each count; f870 shows the two consent columns side by side; f1000 shows three evidence tiles
  plus the suggested conversation. Nothing is motion-for-motion's-sake.

## V — visual direction

- **V1 ✓** Tokens are lifted, not re-derived (`src/tokens.ts` vs `mockups/tokens.css` — identical
  oklch strings). Fraunces display / Inter body, radius 16/22, `shadowCard` verbatim. Checked at
  f110, f343, f580, f1000, f1210.
- **V2 ✓** Motion character matches the recorded tokens: entrance easing is the product's own
  `bezier(0.16,1,0.3,1)`; `y1 > 1` appears only where something lands (`E.land` on the S2 card rise,
  `FLY_EASE` in S6/S10); squash 0; camera shake absent everywhere.
- **V3 ✓** No drift to Ink Press or neon. The Compass act is dark but it is the product's own
  charcoal+amber sub-theme (`T.cPaper`/`T.cAmber` = `mockups/tokens.css` COMPASS block), declared in
  §5 — f960, f1000, f1090.
- **V4 ✓** The sunset gradient — the one token DESIGN_SPEC §1 declares "sacred and scarce" — is used
  by the film exactly twice: the in-session ring (f540–f651) and the outro rule (f1210). The
  gradients visible on the Instagram mock (f400) and the "Your week, as a story" chip (f150) are the
  product's own page pixels, not film-added uses.

## S — shot cards and gallery variants

- **S1 ✓** Every mapped card is actually in its shot. crane pull-back f10→f110 · roving spotlight →
  hero lift → reseat f130→f278 · rotateY flip f368→f394 · rotateX diagonal wall wave f510→f552 ·
  five rows stacking f678→f728 · bottom-push seam f919→f949 · three tiles embedding f963→f993 ·
  group photo f1107→f1163.
- **S2 ✓ (with a caveat)** The one variant named — `wall-reveal-moves` **B `grid-wave-flip`** — is
  the one implemented: `delay=(row+col)*STAGGER`, rotateX 0→180°, `bezier(0.35,0,0.25,1)`, only the
  last card overshooting to 190° with an 8f settle (`S5Floor.tsx:32-48`). Style-key ↔ demo TSX ↔ card
  doc agree. **The Gallery reference clip is not available locally, so "same variant as the sample
  video" is 无法验证.**
- **S3 ✗ multiple parameter departures, three of them undeclared:**
  - `crane-rise-reveal` (S1): card says start scale 3.2 → 1.0 over **100f** with a **≥30f真静止**
    tail. Film uses 2.55 → 0.8 over **82f** (`S1Daybreak.tsx:20-30`) and the tail is **24f**
    (f106→f130), 6f short of the card's floor and of R1's 1-second rule. The shot does not cut at
    130 — S2 opens on the identical framing and holds to ~f180 — so the *viewed* stillness is
    longer, but the card's own parameter is not met.
  - `spotlight-hero-card` (S2): card says push to **zoom 2.6, rotY 34°, rotX 8°, focal card-centre
    −30px**. Film uses **zoom 1.55, rotY 26°, rotX 6°, rotZ 1.5°, focal −151px**
    (`S2Insight.tsx:29-36`). DESIGN_SPEC §4b declares the zoom change (1.9→1.55) as a self-review
    fix for an annotation collision; the rotY/rotX/focal changes are **not** declared anywhere. All
    the card's 命门 parameters *are* kept exactly: 4 spotlight stations, pool 620→420→360, rise 10f
    on `bezier(0.2,1.25,0.3,1)`, hover 54f with a 4px/40f bob at z=110, reseat 18f with press 0.997,
    lap1 14f at 5+2.5px and lap2 20f at 3.5+1.75px @0.62 opacity, annotation at 38px / translateZ 92
    / 3px bob on a 44f period / 12f marker grow.
  - `wall-reveal-moves` B (S5): card says **hold 20f, stagger 6f**. Film uses **hold 8, stagger 5**
    (`S5Floor.tsx:26-27`). Declared in DESIGN_SPEC §4b as a v1 fix, **not** carried into §5.
  - `list-stack-press` (S6): card says **CUES 12f apart, flight 22f**, plus a **联动高亮** (a 40%-width
    accent bar growing at 72% height, 2–4f after each landing). Film uses **8f cues, 18f flight**
    (declared in §4b) and the **联动高亮 secondary action is absent entirely** (`S6Order.tsx` has no
    highlight bar). That is one of the card's listed 关键参数, not a timing tweak.
  - Kept faithfully everywhere else: `card-flip-reveal` 18f drive to 192° + 8f `out(poly(5))` back to
    180° with the angle-linked sheen peaking at 90° (`S4Studio.tsx:30-59`) is the card verbatim;
    `bottom-push-stack-wipe` runs 30f on `cubic-bezier(0.12,0.9,0.2,1)` with the 40px top-edge seam
    shadow (`S9Compass.tsx:29,46,134-141`) — card verbatim; `row-embed` keeps cue 12+i·9, 12f flight,
    `perspective(900)` translateY −120·air, rotateX 16°·air, scale 1.06→0.995→1, and the 2px amber
    seam spreading from the bottom-edge centre (5f grow, 8f fade).
- **S4 ✗ frames 490 and 680 — two card 已知坑 hit:**
  - `card-flip-reveal` 已知坑: *"背面塞完整 UI 读不完——翻面后只有一拍注意力"*. The back face is a
    complete Instagram-post card with header, image, caption chip and three lines of body copy
    (f400), not the prescribed "大号数字 + 一行小标签". In practice it reads (the offer headline is
    large), but it is the pit the card names.
  - `list-stack-press` 已知坑 requires the counter's anticipation beat to be above the eye threshold —
    it is (scale 0.96→1 over 8f, `S6Order.tsx:61-66`) ✓. The failure is a different one: the
    screen-space counter is pinned to `top:82 right:104` with no scrim and no collision test, so at
    **f680** the page's own terracotta "Add all 1 to the order" button lands squarely on top of the
    word **"COUNTED TONIGHT"** and both are unreadable (crop: `/tmp/c_s6_counter.png`).
- **S5 ✗ frames 540 / 580 / 640 — the adapted screenshot is broken by the adaptation.** The live
  `Countdown` overlay (`S5Floor.tsx:71-83`) paints an opaque white box `left:22 width:100` over
  `room2.png`. That box clips the first letter of the word **"left"** baked into the screenshot, so
  the running bed reads **"08:12 eft"** for the whole of S5. Proof: the same `room2.png` in the outro
  group photo — where no overlay is drawn — reads **"08:12 left"** correctly at f1210 and f1270.
  Enlarged crops: `/tmp/crop_A600.png`, `/tmp/sharp_floor.png`.
  Second S5 framing fault, **frames 510–651:** the page is framed so the right-hand "Find a customer"
  rail is sliced by the frame edge mid-glyph — "Find a cust", "Name, p", and a white panel reading
  "Searc / they / they" all cut hard at x=1920 (`/tmp/c_floor_right.png`). It reads as a mis-framed
  capture, not a deliberate crop.
  Otherwise the adaptation is clean: cutout coordinates come from `layout.json`, paper patches stop
  the baked-in cards ghosting under a mid-flip card, and the brand tokens are the product's own.
- **S6 ✓ / n-a** No card in the mapping is flagged "仅供参考，需要自定义实现" or "缺少预览", so nothing
  needed to be user-named and nothing claims parity with a dynamic sample. The report does **not**
  claim gallery-clip parity anywhere (see S2).

## B — storyboard consistency

- **B1 ✓** Order and durations are the storyboard exactly. `src/timeline.ts` = §3 table, item for
  item: 130 / 170 / 52 / 150 / 150 / 145 / 52 / 100 / 150 / 180 = 1279f.
- **B2 ✗ four departures from the recorded storyboard, none declared in §5:**
  - **S1 caption.** §3 records the caption column as "—" ("the page's own headline is the copy").
    The film adds "The morning brief was written while the salon slept. / Daybreak · Sunset Ridge
    Tanning & Wellness" from f60 (visible f110). Defensible under `AR-C1`, but it is a change.
  - **S2 caption.** §3 records *"It read yesterday while the salon slept."* The film says
    *"Found overnight, nobody ran a report."* (f250).
  - **S7 caption.** §3 records *"The salon decides what crosses. That's **consent**."* The film drops
    the second sentence entirely — f820 reads only "The salon decides what *crosses.*" The word
    "consent", which the shot exists to plant before S8, is never said.
  - **S8 SFX.** §3 records a "low riser" for the consent shot. `src/Soundtrack.tsx` contains **no S8
    cue**. Confirmed in the render: the no-BGM master sits at digital silence (−120 dB) from f845 to
    f911 — a 2.2s hole (see A2).
- **B3 ✗ frames 343 and 831 — the two breathing cards do not breathe.** `PaperTitleCard` settles its
  last word at local f33 (S3) / f29 (S7) and the rule finishes at f34; `fadeOut` starts at
  `duration − 8` = f44. The complete sentence is therefore fully opaque for **10–11 frames ≈ 0.35s**.
  `R1` and DESIGN_SPEC's own motion-token table ("every information card ≥30f after settle") both
  require ≥30f. Evidence: f320 shows "From the finding to"; f343 (`/tmp/f343.png`) is the first fully
  settled frame; f352 is the cut.
  The brand wordmark hold **passes**: the outro wordmark is pixel-static from f1217 to f1269 (I
  diffed f1249 vs f1268 over the wordmark box — max Δ 13/255, mean 0.21, i.e. compression noise
  only), ≈1.7s ≥ 1s. Batch entrances also pass: S5 last card settles f552 with 20f of camera hold
  from f1030-equivalent (f632→f652), S6 last row lands f728 with 15f still, S9 last tile lands f993
  with 54f of locked camera.
- **B4 ✓** No key shot was deleted, replaced or added after the storyboard. All ten storyboard rows
  are in the film in the storyboard's order.

## D — data and asset safety

- **D1 ✗ (partial) frame 680.** The brief's own rule is "no price close-ups; the inventory shot is
  framed to keep the derived-retail stat tiles out of shot." The stat tiles *are* out of shot
  (`S6Order.tsx:36-42` never rises above y≈360 — verified, they never appear). But at zoom 1.55 the
  reorder card renders **"72 suggested · $35 each"** and **"Norvell · 34 on the shelf · $2,312 of
  shelf value"** at readable size. Those are per-item prices. Not the *subject* of the close-up, so
  the letter of the rule is arguable; the spirit is not clean. Owner call.
- **D2 ✓** No customer, personal, key or internal-address material. Names on screen (Dana, Rosalind,
  Marc S., Freya R., Nolan L., Nadia Carrow, Maple Glow Tanning, Aurora Collective — Beltline) are
  the seeded Sunset Ridge fixture set. No tokens, no URLs beyond the brand, no internal hostnames.
  The one judgement call is the model attribution at f490 (see P3).
- **D3 ✓** Every product surface is a real screenshot, not a hand-built replica. Spot-checked the
  textures: `studio-review.png` 3840×2222, `floor-full.png` 3840×2286, `inventory-full.png`
  3840×11320, `consent-full.png` 3840×3544, `compass-empty.png` 3840×3176 — all 2× device-scale
  captures. The double "Bask" wordmark at f490 that looks like a capture artefact is **not** one: the
  texture itself contains the app nav and the campaign-wizard bar, each with its own wordmark
  (`/tmp/sr_top.png`). That is the live page.
- **D4 ✗ frames 540–651** — see S5: the injected `Countdown` overlay leaves the underlying label
  reading "eft". That is an incompletely-rendered screenshot state visible on screen for 4.9 seconds.
  Everything else loads fully: fonts, product photography, dynamic numbers and chips are all present
  and complete at f110, f440, f580, f770, f870, f1000.
- **D5 ✓** The public property is checkable and I checked it: `https://bask-psi.vercel.app/` returns
  HTTP 200 unauthenticated and serves "Sunset Ridge" content. Nothing live, customer-owned or
  internal is on screen; the in-session ring was synthesised from the product's own
  `.in-session-ring` markup rather than by writing to the demo DB (DESIGN_SPEC §4), which is the
  right call and is documented.

## A — audio and rhythm

Method: decoded `promo-nobgm.mp4` to mono 48k PCM, computed per-frame RMS, and detected onsets
(>7 dB rise over the previous 3-frame floor, above −44 dBFS). Detected: 10, 65, 176, 201, 279, 307,
312, 373, 398, 403, 518, 529, 539, 554, 662, 698, 705, 714, 721, 730, 735, 804, 809, 923, 928, 935,
946, 964, 1139, 1147.

- **A1 ✓ (headroom) / 无法验证 (character).** BGM at 0.26 with a 30f in / 60f out envelope. Rendered
  mix `max_volume −1.4 dB` with BGM, `−1.6 dB` without; `mean_volume −22.6 / −28.4 dB`. No clipping,
  ~5.8 dB of room left for the SFX layer above the bed. **Whether tech-house is the right character
  for a serious editorial brand pitched to a dealer president needs ears — I cannot judge it, and
  `AR-S1` requires the candidate to be auditioned inside the cut.**
- **A2 ✗ three misalignments:**
  - **Frames 945 / 954 / 963 — the worst one, a full second.** `Soundtrack.tsx:23` computes the
    Compass tile pins as `14 + i*9 + 12`, but `S9Compass.tsx:54` computes the tile cues as
    `PUSH + 14 + i*9` with `PUSH = 30`. The **30-frame act-break offset is missing from the sound
    table.** The three `switch-click-quick` cues therefore fire at abs 945/954/963 while the tiles
    actually touch down at abs **975/984/993**. Verified both ways: onsets detected at 946 and 964
    (954 masked), and pixel measurement of the tile band shows f960 and f963 identical (nothing
    landed), first change at f975, all three seated by f993. Every click lands ~1.0s early, over an
    empty card.
  - **Frame 652 → audible 662.** `transition-soft` is pinned exactly on the cut into S6, but that
    sample peaks +13f. The producing agent compensated this same sample in S4 (pinned at studio+39
    for a +13 peak) and did not compensate it here. Detected onset 662 — the "cut" sound arrives
    0.33s after the cut.
  - **Frame 730 → audible 735.** `click-camera` for "counter locks on 5". The counter reaches 5 at
    f728. Detected onset 735, i.e. +7f.
  - Also under this item: **S8 has no sound at all.** The no-BGM master is at −120 dB from f845 to
    f911 — 2.2s of digital silence in the middle of the film, against a storyboard that promised a
    riser (see B2).
  - Correctly aligned (worth stating, since the compensation work was real): whoosh-big at hero+49
    → detected 201 against a card lift at f196; transition-snap at hero+146 → detected 279 against a
    reseat at f278; the five S6 row-landing pops → detected 698/705/714/721/730 against landings at
    696/704/712/720/728 (all +1 to +2); impact-deep-whoosh at compass−16 → detected 946 against the
    push completing at 949.
- **A3 ✗** The ≤3-frame tolerance is met for the five S6 pops (+1/+2), the S2 lift (+5 measured but
  the sample's peak is what matters and it lands on the beat), the S2 reseat (+1) and the act-break
  impact (−3). It is **not** met at f662 (+10), f735 (+7), f373 (+5), f398 (+4), f554 (+4), f804
  (+5), and catastrophically not met for the three Compass tile clicks (+30).
- **A4 ✓** The riser → impact → sparkle sentence is intact and the ending is the film's energy peak.
  Per-shot SFX maxima: **outro −9.7 dB @f1173**, S9 −17.0, S8/seam −16.8, S2 −18.0, S1 −20.5,
  S6 −20.6, S5 −22.8, S3/S7 −24.1. The curve rises −120 (f1134) → −50 (f1138) → −22 (f1150) →
  −15 (f1158) → **−11 (f1174, the wordmark stamp at f1163–1172)** → −19 (f1178, sparkle) → −42
  (f1198). The sparkle beat is `sfx/light/sparkle.mp3`, as required.
- **A5 ✓** Only one sample >5s is used as an SFX cue — `swoosh-slow.mp3` (5.54s) — and it carries
  `durationInFrames: 84`. Every other cue is under 5s, and the `?? 90` default in
  `Soundtrack.tsx:103` hard-caps any un-declared cue at 3s, so nothing can outlive its action. The
  two `impact-deep-whoosh` cues (4.10s) are deliberately left to ring; they are clipped at the 90f
  window, which will hard-cut the reverb tail at f1023 and f1246 — **whether that cut is audible
  needs ears.**
- **A6 ✗ (documentation) / 无法验证 (audibility).** Measured peaks of every sample actually used:
  −0.0 to **−6.7 dB** (`sparkle.mp3`). DESIGN_SPEC §4c states the range is "−0.0 to −5.7 dBFS" — the
  spec understates it; sparkle is the outlier. None of the library's seven known quiet (<−12 dB)
  samples are used, so the "换素材／预归一化" remedy was not needed. Rendered mix does not clip. But
  `sparkle` at −6.7 dB × volume 0.28–0.30 sits ~−17 dB under a 0.26 bed — **whether it survives the
  mix is exactly the thing I cannot check.**
- **A7 ✓** Vocabulary is film, not game: whoosh / impact / riser / sparkle / transition / sweep /
  pop / paper-page-turn / click-camera. The only `sfx/ui/` file used is **`switch-click-quick.mp3`**,
  which is a real light-switch recording and sits in the ✅ tier of the sound-design 3.3 audition
  table. No `ui-confirm-*`, `ui-*-tone` or `ui-notify-*` synth tone appears anywhere in the table.
- **A8 ✗ frames 520–651.** Both masters are delivered and both are 1279f from one timeline. They are
  **not** frame-identical. I hashed the decoded raw video of each (`ffmpeg -f framemd5 -c rawvideo`):
  **132 of 1279 frames differ, contiguously, frames 520–651 — exactly the S5 Floor shot.** Frames
  519 and 652 are bit-identical, so this is not encoder drift scattered across the file. Measured
  per-pixel: f520 max Δ 33 (41 px), f560 max Δ 85 (1,503 px), f600 max Δ 74 (23,778 px), f651 max
  Δ 108 (5,925 px). The amplified diff (`/tmp/diff600.png`) is a faint edge outline of *every*
  element in the frame, strongest around the countdown and the ring card — i.e. the whole zoomed page
  layer rasterised at a marginally different scale/offset between the two passes, **not** different
  content. Nothing is visibly wrong in either master. But S5's code is pure (`S5Floor.tsx` derives
  everything from `frame`), so this is a Chromium rasterisation race in the `PageCam` CSS-`zoom`
  layer, and it means the two deliverables are not provably the same picture — which is what A8 asks
  for, and what the brief's "deterministic renders" line asks for.

## Q — visual technical quality (`aesthetic-rules.md` in full)

### R — rhythm
- **R1 ✗** Brand wordmark hold passes (1.7s static, measured above). The two title cards fail: 0.35s
  settled (see B3, frames 343 / 831). The S1 crane tail is 24f, 6f under the 1s floor (see S3).
- **R2 ✗ (one element) frames 208–222.** The S2 perimeter beam's first lap uses `Easing.linear`
  (`S2Insight.tsx:98`) — a constant-velocity element, which is the thing R2 names. Lap 2 correctly
  uses `bezier(0.4,0,0.4,1)`. Everything else is non-linear: S5's wave rides `bezier(0.35,0,0.25,1)`,
  S6's rows `bezier(0.45,0.05,0.25,1.12)`, S9's tiles `bezier(0.3,0,0.25,1)`, S10's fly-in
  `bezier(0.34,1.4,0.44,1)`. Batch entrances all end with a settle: S5 20f, S6 15f, S9 54f.
  Note that the S6 batch is *equidistant* (8f), not accelerating — the `list-stack-press` card
  explicitly permits equidistant for ≤5 cards, so this is card-compliant, not an R2 breach.
- **R3 ✓** The opening arc runs 3.5s (f10 close-up → f110 full page), above the 3s floor. The hero
  arc runs lock f180 → touchdown f278 ≈ 3.3s, exactly the card's own target. No interaction
  simulation (no typing / filtering) exists in this film, so the "real human speed" clause is n/a.

### Q — texture, camera, composition
- **Q1 ✓** Every product surface is a real capture (see D3). The only hand-built UI is the S6
  screen-space counter and the S2 3D annotation — neither replicates an existing page, and both are
  publication-grade in the render (f680, f250). Data handling follows the declared rule except the
  price note in D1.
- **Q2 ✓** `PageCam.tsx:99-121` implements exactly the fix the rule prescribes: magnification via the
  CSS `zoom` property rather than `transform: scale`, with the `Tx = 960/zoom − cx` re-derivation
  worked out in the comment, so Chromium rasterises at the enlarged device size. Verified by
  enlarging glyph edges: f10 opening headline, f200 insight body (`/tmp/sharp_insight.png`), f640
  room card at zoom 1.42 (`/tmp/sharp_floor.png`). Clean anti-aliased edges, no pixel blocks. Hero
  elements ship at 4× (`letter-4x`, `insight4-4x`, `ctile*-4x`), pages at 2×.
- **Q3 ✓** No handheld shake anywhere. `src/lib/helpers/shake.ts` exists but is never imported — the
  only match for "shake" in shot code is the comment `// no shake, Q3` at `S5Floor.tsx:50`. Confirmed
  by eye across f10, f200, f440, f580, f720, f960, f1170.
- **Q4 ⚠ card-vs-rule conflict, reported as a conflict, not adjudicated.** Q4 forbids broadcasting
  glints ("批量元素入场靠运动本身"). Two shots broadcast, and in both cases the **card doc
  prescribes it**:
  - S5, frames 510–552: all eight room cards get a 90° highlight line (`S5Floor.tsx:147-158`).
    `wall-reveal-moves` B lists this as a required parameter ("90° 高光线骑格位").
  - S10, frames 1119–1163: all seven group-photo elements get a landing glow
    (`S10Outro.tsx:183-192`). `outro-group-photo-launch` lists "landing glow" as required.
  Where there is no conflict the rule is respected: S2's beam is given to the hero **once** (two laps
  of one element) and is clipped by `rx={RADIUS}` on the SVG rect so it cannot spill the corner;
  S6's glaze sweeps the whole stack once, never per card (`S6Order.tsx:120-129`); S10's opening light
  sweep fires once. Whether the two broadcast cases *look* cheap at speed is the one judgement in
  this section I would want the owner's eye on — statically they read as material specular, not glint.
- **Q5 ✓** The opening has exactly one protagonist (the morning-brief letter block) and one
  uninterrupted arc: hold f0–24 → pull-back f24–106 → still f106–130, with per-row pulses solved
  frame-by-frame against the widening view (`S1Daybreak.tsx:48-53`), not on a fixed interval.
- **Q6 ✓** Camera choice is per shot, not global. The two information-dense list shots are frontal:
  S6 (`CAM_KEYS` are pure cx/cy/zoom, no rotation) and S9 (same). The one oblique shot is the hero
  card close-up, tilted rotY 26° from the **left** — the orientation the rule names — and its body
  text is still fully legible at f200 and f250 (`/tmp/sharp_insight.png`). S5 is frontal.
- **Q7 n/a** The film contains no object/asset close-up shot, so the four-part treatment (side tilt,
  stacked height, orbit, contrasting dark material ground) has nothing to apply to. Not a miss —
  nothing in the storyboard called for one.
- **Q8 ✓** The outro is a genuine group photo and the film's energy peak. All seven surfaces have a
  representative element (`S10Outro.tsx:37-47`): the letter, the finding, the campaign post, the
  running bed, the shelf line, the consent tiers, the rep's evidence tile — all seven visible at
  f1210 and f1270. Spec is escalated as the rule demands: crane rotateX 4°→0 with a continuing push,
  stage light behind the wordmark, opening light sweep, 20 index-derived gold dust motes, rule with
  extension lines. Audio confirms the peak (A4: −9.7 dB, the loudest point in the film).
- **Q9 ✓** Every flying element ends in a real layout slot. S2's card reseats into the slot it
  vacated (the slot is patched and edged while it's airborne, `S2Insight.tsx:124-141`); S6's five
  rows land in the shelf table's real row coordinates from `layout.json`, with paper patches removed
  as each lands; S9's tiles land in `ctile1..3` page-space boxes over a base texture captured with
  the tiles hidden, so nothing ghosts. Nothing floats permanently over a page. (The outro is a
  deliberate composite, not a page.)
- **Q10 ✓** The document-class shots are publication-grade because they are the product: the shelf
  table at f770/f790 carries five full rows with product name, brand, SKU, size, description, four
  numeric columns and a state chip each; the consent screen at f870 carries both full columns
  including the "THEY NEVER SEE" block. Pause anywhere in either and it reads as real.
- **Q11 ✗ four measured failures.** Measured on rendered frames, not source `fontSize`:
  - Narration captions **pass**: `CAP.lead = 62px` at scale 1 — measured cap-height 44px / full band
    61px at f580. Sub-captions pass: `CAP.sub = 34px`, measured band 33px. The S2 3D annotation
    passes on effective height: 38px × zoom 1.55 × cos(26°) ≈ 53–59px, measured "F" 52px at f250.
  - **✗ frame 1210 — the closing tagline is 38px.** "The salon runs better. UVALUX sees the market
    it serves." measures **28px cap / 30px band** (`S10Outro.tsx:295`). That is below the 56px
    narration floor and is *exactly* the 38–40px value the rule's own 判例 failed. It is also the
    film's single most important line and its second-smallest text, against a rule that says the
    closing call is the line that should least be small.
  - **✗ frame 1210 — "BASK · COMPASS" is 26px** (`S10Outro.tsx:303`) in `T.gold` on ivory paper.
    Below the 32px support floor, and the contrast is low enough that a 200-level luminance threshold
    finds no glyph pixels at all. This is the "wants to be read but can't be" middle state the rule
    says to either fix or delete.
  - **✗ frames 680–790 — the S6 counter labels are 22px.** "COUNTED TONIGHT" and "OF 40 PRODUCTS"
    measure 16px cap height (`S6Order.tsx:141,152`), below the 32px support floor — and they are the
    shot's entire point (the number they frame is 96px and fine).

### AR-S — sound
- **AR-S1 ✓ (vocabulary) / 无法验证 (BGM character).** See A7 and A1.
- **AR-S2 ✓** The table is declarative — frame + source + volume + a per-line note naming the picture
  action (`Soundtrack.tsx:25-83`), and every pin is expressed relative to `SHOTS`, never as a bare
  number. Machine-gun defences are all present in the two run-on sequences: S5 alternates
  `sweep-short` / `wind-swoosh-short` with a 0.30 → 0.16 six-step ladder; S6 alternates `pop` /
  `pop-electric` with a 0.40 → 0.25 five-step ladder, riding an 8f cue spacing. No `playbackRate`
  pitch-shifting, correctly.
- **AR-S3 ✗** The rule's whole point is that a timeline change forces a full re-pin. `S9Compass.tsx`
  introduced a 30-frame `PUSH` offset that the sound table never absorbed — see A2. The relative-to-
  `SHOTS` discipline was followed and still did not catch it, because the bug is inside one shot's
  local frame space, not between shots.
- **AR-S4 ✓ (foley choice) / ✗ (one placement).** Actions get their own sound rather than a generic
  swoosh: a paper page-turn for the flip, a camera shutter for the count lock, individual pops for
  each row landing, a real switch click for each tile embedding. Long samples are cut to their
  action. The failure is placement, not vocabulary (A2).

### AR-C — copy
- **AR-C1 ✗** Copy *was* rewritten against the final picture — the S2 caption changed from the
  storyboard line to "Found overnight, nobody ran a report.", which is better and matches its shot.
  But the rewrite dropped "That's **consent**." from S7 (f820) without replacing it, so the film
  never names the concept its next 100 frames are about. No silent stretch exceeds 3s: S2's longest
  copy-free run is f130→f208 (2.6s) and S8's is under 2s.
- **AR-C2 ✓** Every line carries a product name and a concrete benefit, and none rests on a metaphor:
  "Daybreak · Sunset Ridge Tanning & Wellness" (f110), "Studio writes the offer, the post and the
  text. *You still press send.*" (f440), "The Floor: eight beds, one board, *live.*" (f580), "It
  counts the shelf, then writes the *UVALUX order.*" (f770), "Business signals only — *never their
  customer list.*" (f870), "Compass: every rep calls knowing *exactly what changed.*" (f1000). The
  lead-in card before the Studio section exists as the rule asks (f343).
- **AR-C3 ✓** The one in-scene annotation lives in the same 3D space as its subject: page coordinates,
  the same camera, `translateZ(92px)` with a soft ellipse shadow cast onto the page, large Fraunces,
  marker-bar highlight on the key phrase (`S2Insight.tsx:239-283`, visible f250). It is not screen-
  glass text.

### AR-P — process
- **AR-P1 ✓ (partial)** Self-rendered stills exist and were demonstrably acted on: `out/qa/v1/`
  holds 27 frames, `out/qa/final/` holds 32 + a contact sheet, and DESIGN_SPEC §4b lists six specific
  v1 frames with the change each one caused. Caveat: **`out/qa/v2/` is empty** although §4b is
  written as a v1→v2 comparison, so the "after" half of that evidence is not on disk.
- **AR-P2 n/a** No reference film was used, so there is no motion breakdown to check and no risk of a
  reference image being applied as a global style order.
- **AR-P3 n/a** No ambiguous feedback existed — autonomous mode, no user round trips.
- **AR-P4 ✓ (checklist) / ✗ (one technique twice).** The feature checklist is written out and mapped
  one-to-one (DESIGN_SPEC §2), and the five unfilmed surfaces are named rather than forgotten. The
  two flip axes are deliberately different (rotateY in S4, rotateX in S5), which is the card's own
  requirement. The repeat is the paper title card — the same device, same layout, twice (F2).

---

## Must fix

1. **The three Compass tile SFX fire 30 frames (1.0s) before the picture.** `Soundtrack.tsx:23`
   omits `S9Compass.tsx`'s `PUSH = 30`. Clicks at f945/954/963; tiles land at f975/984/993. This is
   the only failure in the film that will be obvious to a listener on first play. Fix:
   `TILE_EMBEDS = [0,1,2].map(i => 30 + 14 + i*9 + 12)`.
2. **"08:12 eft" on the running bed, frames 540–651 (4.9s).** The `Countdown` overlay's 100px-wide
   opaque box clips the "l" of "left" baked into `room2.png`. It is the film's signature product
   moment. Fix: narrow/offset the box, or render the word "left" in the overlay too.
3. **Caption/UI collisions in two shots.** f440 and f490: "You still press *send.*" runs straight
   through the "Schedule campaign" button, both illegible in the overlap. f680: the page's "Add all
   1 to the order" button lands on "COUNTED TONIGHT", both illegible. Both are the exact composited-
   surface failure the process rules exist to catch.
4. **The two breathing cards hold their finished sentence for 0.35s** (f343, f831) against a ≥1s
   rule the project's own motion-token table restates. Extend the settled window before `fadeOut`.
5. **Q11 text floors, frames 680–790 and 1210.** Closing tagline 38px (needs ≥56), "BASK · COMPASS"
   26px in low-contrast gold (needs ≥32 and more contrast, or delete), S6 counter labels 22px
   (needs ≥32).
6. **The two masters are not the same picture.** 132 frames (520–651) differ. The difference is
   sub-pixel rasterisation of the `PageCam` zoom layer, not content — but "two versions from one
   timeline, frame-identical" is the deliverable, and "deterministic renders" is in the brief. Fix by
   rendering both from one video pass (mux two audio tracks / render video once and swap audio)
   rather than two full renders.

## Should improve

7. **S5's right edge slices the customer rail mid-glyph**, frames 510–651 — "Find a cust", "Name, p",
   "Searc / they / they". Re-frame or mask.
8. **S8 has no sound at all** — 2.2s of digital silence (f845–911) in the no-BGM master, against a
   storyboard that specifies a low riser. Also fix the two smaller pins: `transition-soft` at f652
   needs the same −13f peak compensation the S4 instance got (currently audible +10f after its cut),
   and `click-camera` at f730 lands +7f after the counter locks.
9. **"That's consent." was dropped from S7** (f820). The word the next shot is entirely about is
   never spoken. Restore it or move it into S8's caption.
10. **The `list-stack-press` 联动高亮 is missing** — the card's secondary-action highlight bar
    (40% width at 72% height, 2–4f after each landing) is not implemented. It is the beat that makes
    the stack feel dimensional rather than pasted.
11. **Undeclared card departures.** S2's rotY 34→26, rotX 8→6, focal −30→−151 and the added rotZ 1.5
    are real changes to a named card and appear in no section of DESIGN_SPEC. §5 currently says
    "None planned"; the S5 hold/stagger and S6 cue/flight changes are in §4b but never promoted to
    §5. The declaration discipline, not the changes, is what needs fixing.
12. **The two title cards are visually identical** (f320, f820). Differentiate one — a different
    ground, a sub-line, a different rule treatment — so the second reads as a new beat.
13. **"Written by gpt-4.1" is legible at f470–500** and **per-item prices ("$35 each", "$2,312 of
    shelf value") are legible at f680**. Both are real page text and neither is a leak, but both are
    owner decisions for a pitch to the UVALUX president, and the price one sits against the brief's
    own no-price-close-up rule.
14. **Minor:** S2's lap-1 beam runs on `Easing.linear` (f208–222), the one constant-velocity element
    in the film. `out/qa/v2/` is empty despite §4b being written as a v1→v2 diff. `src/lib/FlashCut.tsx`
    and `src/lib/Caption.tsx` are dead files. `S9Compass.tsx:142-143` ships an "unused import guard"
    div that renders a URL string into a hidden node. DESIGN_SPEC §4c states the sample peak range is
    "−0.0 to −5.7 dB"; `sparkle.mp3` measures −6.7 dB.

## Cannot verify

- **Whether any SFX is actually audible in the mix.** I have peaks, levels, RMS onsets and headroom
  numbers, but no ears. `sparkle.mp3` (−6.7 dB source × 0.28 volume, ≈ −17 dB under a 0.26 bed) is
  the specific cue I would want listened to. So is the hard 90-frame clip on the two
  `impact-deep-whoosh` tails at f1023 and f1246 — a truncated reverb can click.
- **Whether the tech-house bed is the right character for this brand.** `AR-S1` requires the
  candidate to be auditioned inside the cut. DESIGN_SPEC §4c flags this as unresolved too; the
  no-BGM master exists partly so it can be swapped in one line.
- **Whether the film matches the Gallery reference clips.** `gallery/media/*.mp4` was never fetched
  for this project. I judged every shot against the card doc and the named demo/template TSX instead,
  and I have not claimed sample parity anywhere.
- **Whether the two broadcast light effects (S5's eight highlight lines, S10's seven landing glows)
  read as cheap at playback speed.** The card docs require them; Q4 forbids broadcasting. I am
  reporting the conflict rather than picking a winner, and statically both read as material specular
  rather than glint. This needs a human watching at speed.
- **The exact cause of the S5 render divergence.** I proved it is real (132 frames, up to Δ108/255),
  proved it is confined to S5, and proved it is a whole-page edge-outline difference rather than
  different content — but I did not reproduce it, so "Chromium rasterisation race in the zoom layer"
  is the best-supported reading, not a confirmed root cause.
