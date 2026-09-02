# "The Quietest Register" — shot plan
**Companion to** `2026-08-28-film-vo-script.md`. Every figure on screen or in dialogue traces to
`2026-08-27-insights-final.html` or to the recompute noted in the VO script.
**Deliverable:** `promo/out/quietest-register.mp4` (+ a no-BGM version from the same timeline).

## Form

| | |
|---|---|
| Runtime | ~4:40 |
| H3 footage | 13 clips, 3:11 total, generated on FIRMAMENT (RTX 4090) |
| Screen footage | 4 captured beats from the live report and `/evidence`, moved with PageCam (2.5D) |
| Voice-over | 611 words, 4:04 — **script only**; the read is recorded by Daniel, as with the V3 promo. No synthetic voice. |
| Aspect | 16:9, 1920×1080 delivery; H3 renders 864×480 and is upscaled into the frame with a soft-matte |
| Assembly | Remotion, in `promo/` alongside the existing V3 project, new composition `QuietestRegister` |

## H3 hard constraints (measured, not assumed)

Duration snaps to `frames % 17 == 5` at 24fps: **15.083s (362f)** and **10.125s (243f)** are the two
long-form sizes used here. 864×480 @ 362f is **~681s of wall clock per take** — 13 shots at one take
each is ~2h20m of GPU. Peak VRAM is 22.7–23.9 GB of 24.5, so **one clip at a time, nothing else on
the box.** Method: iterate at 608×352 with a fixed seed, promote the settled prompt to 864×480.

## Cast — two referenced identities only

The reference registry caps at 9 pictures / 12 files, so exactly two characters recur and carry
Ref2VA identity packs. Everyone else appears in a single shot and is described in prose.

- **MARIA (S1)** — the owner, late forties, runs the counter herself. 4 canonical images.
- **JESS (S2)** — front desk, early twenties, the person the whole film's fix runs through.
  4 canonical images.
- 1 location reference: the counter/retail wall, so the geography holds across seven shots.

Reference images are generated with the `image-gen` skill (SD 3.5 Large) **on the same 4090** —
so they are produced *before* any H3 render is queued, never alongside one.

## Shot cards

Camera phrasing uses the official H3 vocabulary. Speaker IDs are stable across the film.

### SHOT-001 · 15.083s · open · VO beat 0
Dark salon before opening. MARIA unlocks the front door, flips the sign, and the fluorescent tubes
strike on in a stagger. Empty beds visible through the doorway behind her.
*Camera:* Static Shot, then Push In with small amplitude at slow speed toward the counter.
*New information:* the place, and that it is empty and ordinary.
*Sound:* key in lock, door seal, tube ballast hum striking. *Music:* single sustained low synth note.
*Exit frame:* counter centred, Maria's back to camera.

### SHOT-002 · 15.083s · the customers never left · VO beat 1
The same counter through one busy day. Customers arrive, check in, and pass out of frame — a steady
unbroken stream, no basket in anyone's hand.
*Camera:* Static Shot, locked, so the traffic does the work.
*New information:* volume. Nobody is leaving. Nobody is buying.
*Sound:* door chime repeating at uneven intervals, keyboard taps, overlapping short greetings.
*Continuity from SHOT-001:* same counter, same screen direction, lights now on.

### SHOT-003 · 10.125s · the shelf · VO beat 2
The retail wall in daylight. Full bottles, faced and even, a thin film of dust on the top row.
*Camera:* Truck Right with small amplitude at slow speed along the shelf.
*New information:* the product is all there. Nothing has moved.
*Sound:* room tone only, distant tanning-bed fan. *Music:* none.

### SHOT-004 · 15.083s · the quietest register · VO beat 3 · **dialogue**
A member reaches the counter for her monthly renewal. JESS takes the card, the terminal beeps, the
receipt prints. Neither of them looks at the shelf two feet away.
- MEMBER, a woman in her thirties with a flat, friendly voice (S3): `<d>[English] Same as last month.</d>`
- JESS (S2), warm, quick: `<d>[English] Same as last month.</d>`
*Camera:* Static Shot, medium two-shot at counter height.
*New information:* the transaction completes in total silence about anything else.
*Sound:* card terminal beep, thermal printer, paper tear. *Music:* none — the joke is the quiet.

### SHOT-005 · 15.083s · the nine-dollar dead end · VO beat 5 · **dialogue**
A customer sets a small foil sachet on the counter. Behind her, at eye level, a full bottle. JESS
starts to say something, glances at the queue behind her, and rings the sachet through instead.
- CUSTOMER, mid-twenties, bright (S4): `<d>[English] Just this one.</d>`
- JESS (S2): `<d>[English] Just that one.</d>`
*Camera:* Static Shot on the sachet, then Push In with small amplitude at slow speed as the hand
closes over it.
*New information:* the moment exists, arrives at the counter by itself, and gets missed.
*Sound:* foil crinkle, register drawer, queue shuffle behind. *Music:* none.
*Sets up:* SHOT-012, which is the same beat played correctly.

### SHOT-006 · 15.083s · week one · VO beat 6
A first-time customer leaves. MARIA calls after her, the door closes, and the doorway holds empty
for a long beat. A wall calendar sits in frame to the right of the door.
- MARIA (S1): `<d>[English] See you soon.</d>`
*Camera:* Static Shot on the door; hold the empty frame after the exit.
*New information:* the decision leaves with her, on day one, not at month end.
*Sound:* door chime, street noise briefly, then room tone. *Music:* one low piano note, decaying.

### SHOT-007 · 15.083s · the buddy economy · VO beat 7
Two women arrive together mid-conversation, check in one after the other without breaking sentence,
and walk to adjacent rooms.
*Camera:* Tracking Shot following them from door to counter at slow speed.
*New information:* they are one unit and the register records them as two strangers.
*Sound:* two overlapping voices, laughter, two chimes close together.

### SHOT-008 · 15.083s · the comeback · VO beat 8 · **dialogue**
A woman comes through the door who hasn't been in for months. JESS recognises her before she
reaches the counter.
- JESS (S2), surprised and pleased: `<d>[English] Look who it is.</d>`
- RETURNING CUSTOMER, forties, a little sheepish (S5): `<d>[English] I know, I know.</d>`
*Camera:* Push In with small amplitude at slow speed on the counter as she arrives.
*New information:* she came back on her own. Nobody fetched her.
*Sound:* door chime, footsteps, warm short laugh.

### SHOT-009 · 15.083s · January and July · VO beat 9 · **deliberate internal cut**
[Shot 1] January. Coats, wet floor mat, three people waiting to sign up, breath fogging as the door
opens. [Shot 2] At 00:08.000 the camera cuts to July: the same counter, one sunburned customer
buying a single month, door propped open, a fan turning.
*Camera:* Static Shot in both halves — the cut is the information.
*New information:* the same counter produces two completely different members.
*Sound:* winter — coats, radiator tick, boots. Summer — fan, cicadas outside, flip-flops.

### SHOT-010 · 10.125s · the bottom step · VO beat 10
MARIA in the back office. A stack of member files on the desk; she lifts the top one, and the stack
under it barely moves.
*Camera:* Static Shot, high three-quarter over the desk.
*New information:* the mortality is all at the bottom of the stack.
*Sound:* paper, chair creak, distant fan.

### SHOT-011 · 15.083s · four calendars · VO beat 11
Night. The salon is closed and lit only by the counter screen. MARIA prints one short list, tears it
off, and pins it to the corkboard beside three others. Four sheets. None of them says a price.
*Camera:* Push In with small amplitude at slow speed toward the corkboard.
*New information:* the fix is four pieces of paper, not a discount.
*Sound:* printer, paper tear, pin push into cork. *Music:* low sustained strings entering.

### SHOT-012 · 15.083s · the sentence · VO beat 12 · **dialogue, payoff of SHOT-005**
Morning. A different customer sets down a sachet. This time JESS says it, and reaches for the bottle
on the shelf behind her.
- CUSTOMER, thirties (S6): `<d>[English] Just this one.</d>`
- JESS (S2): `<d>[English] Two of those cost more than half the bottle.</d>`
*Camera:* Static Shot, then Pan Right with small amplitude at slow speed following her reach.
*New information:* the identical moment, worked.
*Sound:* foil, then glass bottle set down on the counter — the sound the whole film was missing.
*Continuity:* same counter, same lighting family as SHOT-005; wardrobe changed to mark a new day.

### SHOT-013 · 10.125s · close · VO beat 13
The retail wall again, in the same light as SHOT-003 — with a gap on the shelf where bottles have
sold. MARIA passes through frame and doesn't stop.
*Camera:* Pull Out with small amplitude at slow speed.
*New information:* one hole in a row of bottles is the entire result.
*Sound:* room tone, single door chime off-screen. *Music:* the strings resolve and stop.

## Screen beats — real captures, not mock-ups

Captured with Playwright CLI against a local dev server, 2× texture, then moved with PageCam.
Public demo data only; the client is not identifiable in any frame.

| id | source | what moves | over VO |
|---|---|---|---|
| SCREEN-A | `docs/pitch/2026-08-27-insights-final.html` | slow scroll through the findings, then one "Show me the numbers" block opening to expose the cohort and caveat | beat 4 |
| SCREEN-B | same page, finding № 9 | the renewal escalator, cycle 1 → cycle 15, numbers counting up on DigitRoll | beat 10 |
| SCREEN-C | `http://localhost:3417/evidence` | the four lists, live, with row counts | beat 11 |
| SCREEN-D | same page, footer + provenance | the method statement holding still under the sign-off | beat 13 |

## Cut structure

```
0:00  SHOT-001 ─ beat 0
0:15  SHOT-002 ─ beat 1
0:31  SHOT-003 ─ beat 2
0:41  SHOT-004 ─ beat 3
0:56  SCREEN-A ─ beat 4
1:11  SHOT-005 ─ beat 5   (34.8s of VO — SHOT-005 + a held product still)
1:46  SHOT-006 ─ beat 6
2:01  SHOT-007 ─ beat 7
2:16  SHOT-008 ─ beat 8
2:31  SHOT-009 ─ beat 9
2:46  SCREEN-B + SHOT-010 ─ beat 10
3:18  SHOT-011 + SCREEN-C ─ beat 11
3:45  SHOT-012 ─ beat 12
4:00  SHOT-013 + SCREEN-D ─ beat 13
4:20  brand card, hold ≥1s
```

## Sound

House SFX come from `promo/public/audio/` (already licensed and in the project). H3 clips arrive with
their own diegetic track; screen beats get UI foley only where something actually moves. One BGM bed
enters at beat 10 and resolves at beat 13 — everything before that runs on room tone, because the
film's argument is that the room is too quiet.

## Production order

1. Reference images for MARIA and JESS (image-gen, 4090, before any H3 work).
2. `h3-film.py init → draft → select` — screenplay, then the three Bibles, film IR, storyboard.
   Each of those is an approval gate; nothing renders until they are selected.
3. Draft passes at 608×352, fixed seed, one clip at a time.
4. Promote settled prompts to 864×480, one take each, ~11 min per clip.
5. Screen captures; Remotion assembly. The VO track is Daniel's recording of the script — no TTS
   is generated for this film.
6. Independent final review in a clean context per the shotcraft `final-review.md`, then
   `promo/out/quietest-register.mp4`.
