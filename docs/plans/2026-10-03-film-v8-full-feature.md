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
| E | VO: `voiceover.txt` (clean) + Chatterbox `frankie` read (v7 voice) | main | `promo/public/audio/vo/v8/` |
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
