# QA checklist — `/compass/network?role=uvalux_rep` and `/compass/accounts?role=uvalux_rep`

Spec: `docs/superpowers/specs/2026-08-22-compass-network-accounts-design.md`
Run with the QA agent against a real browser. No unit tests, no jsdom.

The Compass network map shows **1,007 real salons** loaded from the database.
Numbers below are checked against the database, not against what the page claims about itself.

## 1. The page exists and renders

- [ ] `/compass/network?role=uvalux_rep` loads inside the Compass shell (sidenav visible, wordmark, nav row).
- [ ] A **Network** entry appears in the Compass nav and is marked current on this route.
- [ ] `/compass/accounts?role=uvalux_rep` loads inside the Compass shell (sidenav visible, wordmark, nav row).
- [ ] An **Accounts** entry appears in the Compass nav and is marked current on this route.
- [ ] The page does NOT show a spinner forever and does NOT show a blank body.
- [ ] Screenshot the whole composited page. This is the visual coherence gate — it must look like
      the rest of Compass, not like a different product.

## 2. The network map renders

- [ ] The map shows salons as nodes in a 3D force graph on a dark canvas.
- [ ] The canvas is dark but the surrounding page chrome stays light Compass. It must NOT look
      like Bask — the palettes are how you know which product you are in.
- [ ] Nodes differ visibly in size (corroboration) and colour (review state).
- [ ] The legend explains colour, size, brightness and halo.
- [ ] Clicking a node selects it.
- [ ] If the view is capped, the page SAYS how many of how many it is plotting. A silent cap reads
      as "this is everything".
- [ ] Screenshot the map.

## 3. The account detail page

- [ ] `/compass/accounts/<slug>?role=uvalux_rep` loads inside the Compass shell.
- [ ] The account detail page shows a summary card with name, location, and health score.
- [ ] The health score is shown in a color-coded band (red/yellow/green), not as a raw number.
- [ ] The health bands expand to show the factors behind them.
- [ ] No raw health score is ever displayed — the consent filter deliberately keeps it out of
      the payload, so seeing one is a failure.
- [ ] If two salons share only a name, the name is shown and nothing else.

## 4. Filters

- [ ] Filter chips toggle and the row count changes.
- [ ] The **marketing** lens is OFF by default. Turning it on increases the count — those 266
      voice-of-customer quotes are a different queue and must not pollute curation by default.
- [ ] Clearing all filters restores the full default set.

## 5. Query parameter enforcement

- [ ] Every Compass route requires the query parameter `role=uvalux_rep` or it returns a forbidden error.
- [ ] Append `?role=uvalux_rep` to every URL tested.

## 6. Honesty and failure modes

- [ ] Stop the database (or point at a bad URL) and reload: an error state appears showing the
      REAL message in a monospace block. Not a blank page, not a fake-friendly "something went
      wrong" that hides the cause.
- [ ] Filter to something with no matches: an empty state explains what to do, no infinite spinner.
- [ ] With `prefers-reduced-motion: reduce` set, the graph does not idle-drift and does not
      fly-to-animate on selection.

## 7. Nothing else broke

- [ ] `/compass/knowledge?role=uvalux_rep`, `/compass/coaching?role=uvalux_rep` still render.
- [ ] `pnpm demo:verify` still walks the PITCH.md path.

## Known-not-built (must report as SKIP, never as PASS)

- **Command palette (`⌘K`)** — `palette.ts` and the palette UI are not wired in this pass.
- **Audio playback** in the inspector — source media lives on FIRMAMENT `J:`/`M:` and is not
  reachable from the web host. The UI must say the audio is not reachable rather than render a
  dead control.
- **`contradiction` alerts** — deliberately not implemented; detecting opposing sentiment needs a
  model, and the alerts module is pure.
- **Speaker attribution** — no diarization, and the corpus is not joined to `knowledge_doc`.