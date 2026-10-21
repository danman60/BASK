# Proposal collaboration: save, history, comments, activity log (2026-10-07)

Purpose (Daniel, verbatim): "I want to just give them a link, they'll work on it individually and together,
they can comment in multiple areas, all comments saved, full slider/click history saved for us to have full
visibility of their experience of proposal"

Page: dancoded.ca/p/bask-uvalux-cmxb8vlay3 (ddd repo, public/p/<slug>/index.html). Server: ddd Next app,
Supabase CC&SS, public schema, `ddd_` prefix (ddd convention), routes under /api/public/ (existing public pattern).

## Design
- One link, no login. Device id (localStorage) + typed name, asked once, on first save or comment.
- Individually: each device keeps its own working state (existing localStorage) and it autosaves to the server.
- Together: SAVE (top center of header) writes a named version everyone sees in History; any version can be opened.
- Comments: any element with `data-cmt="<anchor>"` gets a comment button with a count; drawer shows that
  area's thread; all comments visible to everyone; replies by thread.
- Activity: every click, slider change (final value), toggle, tab view with dwell, state snapshot, save, comment,
  batched to the server every 5s and on pagehide. `?obs=off` devices (Daniel) send no activity.
- Owner view: /p/<slug>/activity.html, data from GET /api/public/proposal/<slug>/log gated on PROPOSAL_OWNER_KEY.

## Steps (acceptance)
1. Migration `ddd_proposal_versions`, `ddd_proposal_comments`, `ddd_proposal_events` (+ slug allowlist in code).
   Accept: tables exist in public, RLS on, no anon policies (service-role routes only).
2. Routes: GET state (versions + comments), GET version, POST save, POST comment, POST events, GET log (owner key).
   Accept: scoped tsc clean; curl round trip on preview/local.
3. Page UI: Save + History in header, name prompt, comment buttons + drawer, activity recorder.
   Accept: 390 + 1440 screenshots read; save→history→open works; comment persists across reload.
4. Activity page. Accept: shows the test session's events in order, by person.
5. Deploy (push main), set env, live round trip with a test name, then delete test rows.

## Deviations
- Owner 13:45 ET: no login, no users, no names. Devices are anonymous (Visitor A, B...) in the owner view.
