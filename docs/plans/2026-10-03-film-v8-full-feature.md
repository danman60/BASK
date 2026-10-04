# Film v8: the full-feature cut (2026-10-03)

**Purpose line (Daniel, verbatim):** "spin up a new session in the repo to do some more videos and
demos. I'm not sure we ever included the front desk, listening functionality, sales intelligence part
into the shotgraph video" → then: "We should ideally reassemble it into its full flush tone with all
the features and ideas" → then: "devise new shots of h3 real life and product shots for all, html demo
where needed with shotcraft, and make sure all features are up to date, and make sure the incoming
proposal doc has all these ideas/features in there".

Deadline: Nik Van Haeren (UVALUX) meeting, Tue 2026-10-06 1 PM ET, in person.

## Mode
video-shotcraft **autonomous free creation**, building on v7 (`promo/src/MainV6.tsx`,
`timelineV6.ts`, v6 FigurePlate shot language). Not Ink Press.

## Protagonists (shotcraft rule: film the person doing the job)
- **Dana**, owner of Sunset Ridge Tanning & Wellness (name already in the Daybreak letter). Job: "make
  the quiet hours less quiet."
- **Maya**, front-desk attendant (name already in DEMO_MONITOR). Job: sell the membership well.
- **The UVALUX rep** (unnamed on screen; signed-in name stays masked as in v7).
The single shot where the job visibly happens: Maya at the front desk computer doing the per-visit
membership math out loud, the customer saying yes, and that conversation landing on Dana's Monitor.

## Ruled out (Aug 19 debrief, Nik): the Floor (room board, check-in, waivers), till/POS, public booking.

## Tracks
| # | Track | Owner | Output |
|---|---|---|---|
| A | App fixes: `fixtures.ts:275` "no knowledgeRef." leak; render `ConsentPledgeCard` on /monitor | main | commit |
| B | H3 b-roll: Nano Banana stills (one identity per character) → H3 I2VA 864x480, via gpu-borrow | subagent | `promo/public/h3/v8/*.mp4` |
| C | HTML demo plates for features NOT built in the app (concept screens, Bask tokens) | subagent | `promo/demos/v8/*.html` + PNG captures |
| D | Product captures of BUILT features not in v7 (monitor, peers, customers, recovery, data-sharing, inventory order, staff) | subagent | `promo/public/textures/v8/*.png` |
| E | VO: `voiceover.txt` (clean) + Chatterbox `uvaint` read (v7 voice — file uvaint-v7.mp3; the v7 beatmap note "Frankie" was wrong, corrected by Daniel 14:00) | main | `promo/public/audio/vo/v8/` |
| F | Remotion v8 assembly, comprehension gate, final review, render, DM | main | `promo/out/promo-v8*.mp4` |
| G | Proposal board gaps → routed to coverwise-2 (owns the scope board) | done 13:5x | message sent |

Built vs concept is labelled per beat below. Concept beats are spoken in the future tense or as
"next", never as if shipped.

## Beat sheet (VO ≈ 2.5 words/s estimate; Chatterbox timing replaces it)
| # | beat | picture | built? | VO |
|---|---|---|---|---|
| 1 | open | H3: Dana unlocking a quiet salon at dawn, laptop on the desk | b-roll | Bask is an app a salon owner opens when the place is quiet. To make it less quiet. |
| 2 | sync | HTML: "Syncing with SalonTouch" background uploader | CONCEPT | It doesn't replace your software. It sits beside it, and quietly syncs what you already have. |
| 3 | read | v7 Daybreak | built | (v7 para 2) |
| 4 | chart | v7 chart | built | (v7 para 3) |
| 5 | method | v7 citation travel | built | (v7 para 4) |
| 6 | action | v7 campaign | built | (v7 para 5) |
| 7 | health | /customers bands + HTML prepaid-minutes chip | built + CONCEPT | It knows every customer by their own rhythm. Who's healthy, who's slipping, who's gone quiet, and who still has minutes they paid for. |
| 8 | recovery | /customers?view=recovery | built | Seven memberships failed to pay this week. The messages are already drafted. |
| 9 | frontdesk | H3: customer walks in, Maya glances at screen; HTML front-desk card | b-roll + CONCEPT | When someone walks in, the front desk already knows. Eighty-five days since her last tan, and the lotion she always buys. |
| 10 | listen | H3: front-desk computer, small consent sign; /monitor listener rail + one conversation scoring | b-roll + built | And with everyone's consent, the front desk listens. Every sales conversation is scored on the moments that matter: the greeting, the question, the product, the membership, the close. |
| 11 | bottle | /monitor "Maya's method" insight + HTML "bottled pitch" playbook | built + CONCEPT | Then it finds your best seller, and bottles how she does it. Maya does the membership math out loud, and people say yes. Now the whole team learns it. |
| 12 | flag | HTML transcript line flagged "not a product claim we can make" | CONCEPT | And if someone says something about a product that isn't true, you hear it first. |
| 13 | staff | /insights team at the counter + monitor team table | built | You see your team, without a leaderboard. Who's improving, and who needs a hand this week. |
| 14 | peers | /insights/peers | built | And you see where you stand. Against salons like yours, as a rank, not a guess. |
| 15 | community | v7 | built | (v7 para 6) |
| 16 | measured | v7 + HTML headline number | built + CONCEPT | (v7 para 7) |
| 17 | opens | v7 | built | (v7 para 8) |
| 18 | consent | /settings/data-sharing | built | Your data stays yours. You choose what UVALUX sees, and you can take it back in one click. |
| 19 | flip | v7 | built | (v7 para 9a) |
| 20 | network | v7 | built | (v7 para 9b) |
| 21 | supply | /inventory/order + HTML lamp hours + utilization | built + CONCEPT | Low stock becomes a draft order. Lamp hours become a relamping budget. Busy beds become the case for one more. |
| 22 | calls | v7 + H3 rep in car on the phone | built + b-roll | (v7 para 10) |
| 23 | knowledge | v7 | built | (v7 para 11) |
| 24 | ask | HTML expert + customer chatbot off the corpus | CONCEPT | And that same knowledge answers questions. For owners, and one day for their customers. |
| 25 | signoff | v7 end card, quiet landing (no whoosh) | built | That's Bask. It opens when the salon is quiet. To make it less quiet. |

## Acceptance
- Every built beat captured from the running app at demo state (`pnpm demo:reset` owner only).
- Every concept plate uses Bask tokens (`apps/web/src/app/(bask)/bask.css`) and only names/figures
  already in fixtures (Sunset Ridge, Maya, Jordan, Priya, Tess, DEMO_MONITOR numbers); new figures
  are flagged in the plate's source comment.
- Comprehension gate on first watchable cut (blind subagent, 3 questions) before technical review.
- `voiceover.txt` clean (no digits, brackets, timecodes) + `music-brief.md`; no generated music; no
  end whoosh.
- Nothing deployed to bask-psi without Daniel's OK.

## Deviations log
(append here)
- 2026-10-03 14:00 — Voice is `uvaint` (Daniel). Frankie render kept only as a scratch reference.
- 2026-10-03 14:02 — RESTRUCTURE (Daniel: "a guiding principle ... the basic chain of data analysis to reveal
  insight coaching to build LLM instant actions and then tracking and sharing with the community on the salon
  owner side and then visibility coaching opportunities and analytics on the Uvolux side"; "look for ... a few
  extra high end aftereffects motion graphics shots ... OK if this video is explainer length").
  Beat sheet above is SUPERSEDED by chapter order: DATA → INSIGHT → COACHING → INSTANT ACTION → TRACKING →
  COMMUNITY | consent hinge | flip | VISIBILITY → COACHING OPPORTUNITIES → ANALYTICS. Narration rewritten:
  promo/v8/voiceover.txt (25 paragraphs, 598 words, ~4:00), read in uvaint → promo/public/audio/vo/v8-chain/.
  New MG shots: chain draw-on (b02), data-flow sync (b03), waveform→transcript→scores (b08), transcript→playbook
  deal-out (b11), DigitRoll measured (b15), 3D flip to the UVALUX chain (b19), persistent chain strip.

### 2026-10-03 — Remotion v8 assembly (track F)
- Structure follows the chain brief (25 beats, `v8-chain` uvaint read, 204.07s), not the 24-beat table above.
- Every cut comes from the read: `scripts/v8-anchors.py` (Whisper word pass) → `vo-anchors.json`; `timelineV8.ts` has ONE import line naming the read.
- Bed: `bgm-open-road.mp3` is 182s, the film 205.5s → two passes spliced once at the first UVALUX chapter (network), jump back 13 bars; pass B ends on the track's own outro under the sign-off. Ducked in-composition from the beat timing; master gain in `scripts/master-v8.sh`.
- b15 opens on `owner-review.mp4` (Dana reading the result) instead of v7's measured plate; `team.mp4` / `yes.mp4` unused (the deal-out MG carries "the whole team learns it").
- b18 shows the data-sharing heading + three tiers for the whole line (the tall what-UVALUX-sees panel read as a broken sliver in draft 1).
- 2026-10-03 18:50 — Daniel: "at 1:36 I was really craving to start seeing a bunch of clips of the uvalux speakers that make up the training. Corpus some of the highly real and some of the longer excited clips of experts talking". Real session video is on FIRMAMENT J:/M: (148 GB; manifest data/salon-transcripts/manifest.json). Clips being cut to promo/public/corpus/v8/ (A = short verbatim lines, B = longer high-energy) for a speaker montage in the method beat.
- 2026-10-03 18:51 — Number mismatch traced: opportunity card 8.3%→5.9% / $4,260 is hand-typed in packages/core/src/opportunities/fixtures.ts:53-56 against an older seed; live data says 8.8%→5.7%, insight $5,354/mo. VO "four thousand" inherited the stale figure. Awaiting Daniel on canonical $ figure and precision.
- 2026-10-03 18:56 — Daniel: UVALUX = "YOU vah lux", stress on YOU; test C "Yoo-vah-lucks" was right but "too deliberate/slow" (hyphens). Testing run-together spellings for the Chatterbox input only; voiceover.txt keeps "UVALUX".
- 2026-10-03 18:56 — Daniel: "over emphasis on data sharing ... salons are going to have no problem clicking a single consent box to share the data ... I don't want to mention it like it's mentioned now". Consent/data-sharing beat (old b18) REMOVED from narration and picture. "With everyone's consent, the front desk listens" (recording consent) is kept.
- 2026-10-03 18:59 — Daniel: front-desk recording consent line ALSO removed ("We're just going to put up a sign saying consent. It's industry standard"). b08 now opens 'And the front desk listens.' The H3 listen shot keeps the printed consent sign — that IS the consent.
- Pass 2: grow tagline + end-card line via new optional props on v7's A1Open (`tagline`) / A13Outro (`line`); corner chain strip compact/stacked in the right margin; larger dealt playbook copies.
- Pass 3 (read `v8-f2`, 24 beats, 4:02): consent beat and shot deleted; two narration holes — the UVALUX speaker montage (A08, A01, A02, A04, B04; A03 excluded) inside the method paragraph after "...said on a stage", and the messages run (email, Instagram, Studio phone) after "Nothing leaves without you." The read is split, never sped up (`VO_SEGMENTS`). Action shot replaced with Today's text sheet, a cursor press on "Approve & send", and the real toast. Cuts now snap to the quietest 20 ms between words (`v8-anchors.py`). Bed splice re-chosen automatically (now at the action chapter).
- Pass 4 (read `v8-g`, 25 beats, 4:15): UVALUX logo + "Built with UVALUX" lands on that sentence; chain ends on a payoff (two rising lines, "Visits" / "Spend per visit", labels only); new `bridge` shot after the speakers. No recapture (dev server/env access not granted): stale-figure shots handled by framing — chart keeps the chart + app figure "≈ $5,354/mo" instead of the insight plate (stored "9% to 6%"); method citation travel starts below the stored sentence; Today sheets keep only the sheet sharp (page behind blurred); toast stage page blurred; open-title page blurred.
- 2026-10-04 14:51 — Daniel notes on pass 4: UVALUX line → 'who already supply great services and support to Canada's salons' (the 'make the lotions and beds' wording was mine and WRONG); 'sits beside it' → 'learns from it'; ending → 'It grows salons. And it grows UVALUX.'; picture: opening dashboard flashes twice in first 10s, slow zoom on the long 0:22 shot, 1:03 health grid hover + profile popup, 1:09 hover line clipping, 1:12 front desk shot to 4-5s, 1:30 scoreboard must show other salons. Read v8-h.
- Pass 5 (read `v8-h`, 4:20): one continuous blurred/veiled backdrop for the whole open (A1Open `bare`), easing to paper before the chain — removes the two dashboard pops; chain hero pushes in continuously (1.00→1.07) across its full 18s, payoff included; recovery rings narrowed so they never touch the next number; listen H3 holds 140f via a narration pause after "And the front desk listens."; recovery shot leads "Seven..." by 15f; the speaker hole moved to the END of the method paragraph (narrator finishes "...about this exact problem."), bridge follows; end card "It grows salons. It grows UVALUX." v8-h2 re-roll ignored (garbled b05).
- 2026-10-04 15:12 — Daniel: 'proposal boards live on dancoded.ca' + 'it should have latest film; board that includes system design, value section, everything latest ADAPT and COVERWISE proposals had'. BASK proposal being built at ~/projects/ddd/public/p/bask-uvalux-<slug> (ADAPT pattern: film cover, SYSTEM map, VALUE, PLAN + PRICE, DEAL; board v2 numbers carried over). The bask-psi board stays as the working copy.
