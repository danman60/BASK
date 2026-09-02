# walk: Customers + Insights

## What to build

Write a markdown QA checklist section, following the exemplar's structure, for three Bask screens: slash customers which is Customer Health, slash insights which is Analytics, and its two children slash insights slash activity and slash insights slash peers. Check each route renders in the shell, that customer rows or health bands appear, that every band or score is accompanied by the factors behind it rather than shown as a naked number, that the peers view suppresses any comparison drawn from fewer salons than the cohort minimum and says so in words instead of showing a thin number, and that empty states explain what to do rather than spinning. Note that peer and cohort numbers must be cross-checked against the database. End with a section listing what to report as SKIP if unimplemented.

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/tests/agent/walkthrough/02-customers-insights.md`
## Follow this exemplar exactly

This file is the approved reference for how this kind of component is written
and styled in this project. Match its structure, its class vocabulary and its
conventions. Deviating from its visual vocabulary is a failure even if the code
compiles.

```tsx
# QA checklist — `/compass/knowledge`

Spec: `docs/superpowers/specs/2026-08-22-compass-knowledge-curation-design.md`
Run with the QA agent against a real browser. No unit tests, no jsdom.

The corpus holds **1,007 real claims** loaded from four extraction lenses. Numbers below are
checked against the database, not against what the page claims about itself.

## 1. The page exists and renders

- [ ] `/compass/knowledge` loads inside the Compass shell (sidenav visible, wordmark, nav row).
- [ ] A **Knowledge** entry appears in the Compass nav and is marked current on this route.
- [ ] The page does NOT show a spinner forever and does NOT show a blank body.
- [ ] Screenshot the whole composited page. This is the visual coherence gate — it must look like
      the rest of Compass, not like a different product.

## 2. Claims actually load

- [ ] The table renders rows with real text, not placeholders.
- [ ] The row count in the pager matches `SELECT count(*) FROM bask.knowledge_claim` filtered to
      the default lenses (`advice`, `recall`). **Compare to the database, not to the header.**
- [ ] Each row shows: review state, claim text, category, moment, source count, timecode.
- [ ] Claim text that overflows is clipped with an ellipsis, and the full text is still selectable.

## 3. The inspector is the trust anchor

- [ ] Selecting a row fills the right-hand inspector.
- [ ] The **verbatim quote** is visually dominant and is shown IN FULL — never shortened.
- [ ] Beneath it: source file basename, audio stream index, timecode range.
- [ ] The `knowledgeRef` reads in the documented shape, e.g. `Room B 2026 · P1060686 · 12:34`.
- [ ] Where a speaker is unknown it says so. **It must never print a speaker name that is not in
      the data.** Every claim currently has `sessionTitle: null` and `speaker: null` because the
      corpus is not yet joined to `knowledge_doc` — the UI must show that honestly, not blank.

## 4. Verification works and persists

- [ ] `J` and `K` move the focused row; the inspector follows.
- [ ] `V` verifies the focused claim. The row's state changes.
- [ ] `X` rejects. The row's state changes.
- [ ] Reload the page — **the verdict survived**. (If it did not, the mutation is not reaching the
      database and everything else on this page is theatre.)
- [ ] `SELECT review_state FROM bask.knowledge_claim WHERE id = <that id>` matches the UI.
- [ ] `SELECT count(*) FROM bask.knowledge_claim_event WHERE claim_id = <that id>` is ≥ 1. A
      verdict without its audit row is the failure that makes undo impossible.
- [ ] `⌘Z` / `Ctrl+Z` undoes the last decision and the row returns to its prior state.

## 5. Filters

- [ ] Filter chips toggle and the row count changes.
- [ ] The **marketing** lens is OFF by default. Turning it on increases the count — those 266
      voice-of-customer quotes are a different queue and must not pollute curation by default.
- [ ] Clearing all filters restores the full default set.

## 6. The map

- [ ] Switching to **Map** renders a 3D force graph on a dark canvas.
- [ ] The canvas is dark but the surrounding page chrome stays light Compass. It must NOT look
      like Bask — the palettes are how you know which product you are in.
- [ ] Nodes differ visibly in size (corroboration) and colour (review state).
- [ ] The legend explains colour, size, brightness and halo.
- [ ] Clicking a node selects it.
- [ ] If the view is capped, the page SAYS how many of how many it is plotting. A silent cap reads
      as "this is everything".
- [ ] Screenshot the map.

## 7. Honesty and failure modes

- [ ] Stop the database (or point at a bad URL) and reload: an error state appears showing the
      REAL message in a monospace block. Not a blank page, not a fake-friendly "something went
      wrong" that hides the cause.
- [ ] Filter to something with no matches: an empty state explains what to do, no infinite spinner.
- [ ] With `prefers-reduced-motion: reduce` set, the graph does not idle-drift and does not
      fly-to-animate on selection.

## 8. Nothing else broke

- [ ] `/compass/network`, `/compass/accounts`, `/compass/coaching` still render.
- [ ] `pnpm demo:verify` still walks the PITCH.md path.

## Known-not-built (must report as SKIP, never as PASS)

- **Command palette (`⌘K`)** — `palette.ts` and the palette UI are not wired in this pass.
- **Audio playback** in the inspector — source media lives on FIRMAMENT `J:`/`M:` and is not
  reachable from the web host. The UI must say the audio is not reachable rather than render a
  dead control.
- **`contradiction` alerts** — deliberately not implemented; detecting opposing sentiment needs a
  model, and the alerts module is pure.
- **Speaker attribution** — no diarization, and the corpus is not joined to `knowledge_doc`.

```

## Rules

- Write the target file. Do not create other files.
- Do not modify anything outside the target path.
- Do not leave TODOs, stubs, or placeholder values.
- Do not fix unrelated bugs you notice. Build only what is described above.

## Acceptance gate — you are DONE only when all of these are true

1. `/home/danman60/projects/uvalux-platform/tests/agent/walkthrough/02-customers-insights.md` exists and is complete.
2. `bash -c 'test -s /home/danman60/projects/uvalux-platform/tests/agent/walkthrough/02-customers-insights.md && grep -q "^## " /home/danman60/projects/uvalux-platform/tests/agent/walkthrough/02-customers-insights.md' && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/tests/agent/compass-knowledge.md /home/danman60/projects/uvalux-platform/tests/agent/walkthrough/02-customers-insights.md` passes with exit code 0.
3. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
