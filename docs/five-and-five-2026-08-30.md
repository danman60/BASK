# Five and Five — uvalux-platform (demo Thursday 2026-09-03)

Generated 2026-08-30. Every item cites code that exists today, at commit `1d49fef`.

The RAG is done and live. This is what would make the app land harder on Thursday.

---

## KILLER FEATURES

### 1. [creative] Make the opportunity cards move when the clock moves — `apps/web/src/app/(bask)/page.tsx:80-81`
The biggest block on Today — *"6 ways to grow your business today"*, the one carrying
**+$4,260/mo** — renders `DEMO_OPPORTUNITIES` / `DEMO_OUTCOMES`, module constants from
`packages/core/src/opportunities/fixtures.ts`. The attention queue beside it reads real insight rows
from the database. So when the presenter runs `pnpm demo:advance --days 7`, half of Today updates
and the headline half does not. Deriving even two or three of the six from real rows turns the clock
demo from "the queue changed" into "the whole morning changed".
**Effort:** ~half-day for 2–3 cards computed from live rows · multi-session for all six.

### 2. [industry-standard] Let Ask cite the coaching too — `packages/core/src/ai/ask.ts:107`
The Ask prompt is `FACTS: …` and nothing else. Ask is the surface a skeptical buyer types into
unprompted, and it is the one place the answer currently has no visible provenance. `coachingFor` now
exists and `CoachingCitations` already renders; wiring them under an Ask answer puts the same
clickable proof on the surface most likely to be poked at live.
**Effort:** ~1hr.

### 3. [creative] Close his loop — tie a fired action's measured result back to the claim that suggested it — `apps/web/src/app/(bask)/page.tsx:81`
His spine, verbatim: *"measuring and reporting the growth due to those actions."* Right now
`content.coaching` (the claim IDs) is persisted on every generated campaign, and campaigns really do
settle through the pipeline — but the outcomes shown on Today are `DEMO_OUTCOMES` fixtures. Joining
the two lets a result read *"this ran, it moved attachment 1.4 points, and here is the coaching it
came from."* That sentence is the entire product in one card.
**Effort:** multi-session (~half-day for one worked example on one campaign).

### 4. [boring-overlooked] Persist community posts — `apps/web/src/app/(bask)/community/page.tsx:231`
The page says it out loud: *"Nothing here is saved yet — posts and attachments stay in this tab until
the community room is connected."* Community is a quarter of his spine (*"wrapped in ongoing
community support and engagement"*), and on stage a post typed into it disappears on reload. Honest
in the product, fatal in a demo — the promo film had to frame below y=726 to avoid that line.
**Effort:** ~half-day (one table, one write path).

### 5. [boring-overlooked] Verify the ~20 claims the demo path actually retrieves — `packages/api/src/routers/knowledge.ts:188` (`bulkReview`)
Every citation on the new drill-down reads **"Not checked yet"** — because 1,004 of 1,007 claims are
unreviewed and `bask.match_claims` currently rejects nothing. Working the queue for just the claims
the demo retrieves (retail attachment, memberships, lapsed win-back) flips those badges to
**"Checked by UVALUX"** and makes the review queue visibly load-bearing rather than decorative. The
bulk endpoint already exists.
**Effort:** ~1hr, mostly reading claims.

---

## STREAMLINES

### 6. Confirm Studio's deep-link rehydrate actually works — `apps/web/src/app/(bask)/marketing/StudioBuilder.tsx:104-115`
A prior session recorded that deep-linking into Review lands on an empty screen. The rehydrate path
**does exist** at those lines (`existing.data.content` → `setContent` + tone + offer + channels), so
the inherited claim is unverified at best. A back-button on stage lands exactly here. Ten minutes
with a real campaign ID settles whether there is anything to fix.
**Effort:** ~10min to verify · ~1hr if it is genuinely broken.

### 7. Delete or land the four `.rejected` files — `packages/core/src/insights/detectors.ts.rejected` (+ `sweeps/seasonal-pause.ts.rejected`, `thresholds.ts.rejected`, `test/scaling.test.ts.rejected`)
Untracked leftovers from a rejected broker run, sitting inside `packages/core/src`. They compile to
nothing and mean nothing, but they are four files a future session has to work out the status of.
**Effort:** ~10min.

### 8. Say in one line that the chunk retriever is dormant — `packages/core/src/knowledge/retrieve.ts:1`
`knowledge_chunk` holds 0 rows. `retrieve`, `chunkText`, `embed.ts` and `bask.match_knowledge` are
all correct, all exported, and all unused at runtime now that retrieval goes through claims. Either
ingest the 22-doc expo corpus so both paths are live, or write the one sentence that stops the next
session re-deriving why the tables are empty.
**Effort:** ~10min for the note · ~1hr to ingest.

### 9. Reconcile the fixture volume with the pitch script — `docs/pitch/PITCH.md` vs the seed
Recorded in `CLAUDE.md` and still true: day-zero Daybreak reads *"31% below your usual Monday"* where
PITCH.md wants *"8% above"*, and impact figures run ~10× the mockups (~96 visits/day). The arithmetic
is right; the volume is a design decision nobody has made. It is the **opening line of the demo**.
**Effort:** ~half-day to reshape the seed · ~10min to change the script instead.

### 10. Clear the working tree before Thursday — `git status`
Thirty-plus uncommitted paths: the consent-delta strip, the promo tree, broker task files,
`docs/research/`, `.laneE-shots/`, deleted textures. A live fix on demo morning means working in
that. Decide keep / commit / delete now, while nothing is on fire.
**Effort:** ~10min–~1hr depending on how much you want to keep.

---

Pick numbers to build (e.g. "do 2,5,7"). Or "all".
