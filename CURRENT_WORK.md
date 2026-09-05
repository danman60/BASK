# CURRENT_WORK — uvalux-platform

## 2026-09-04 — THE SEND. Report made 31x faster, agreement rewritten three times, Nick's email went out.

One sentence: `CUSTOMER-REPORT.html` was virtualised from a 4.1-second open to 0.13 seconds, the
Phase 1 letter agreement was rebuilt three times as Daniel changed his mind, and at 21:0x he sent
the lot to nik@uvalux.com with the correct attachments.

### OUTCOME — the email is SENT. Do not re-touch that draft.
Sent message `1a06e114375523e0`, to `nik@uvalux.com`, thread `1a06a423738c9c57`. Verified from the
Sent folder, attachments byte-checked:

| attachment | bytes | sha256 (16) |
|---|---|---|
| CUSTOMER-REPORT.html | 2,992,004 | `2435f6740b5ff450` |
| LETTER-AGREEMENT-Phase1.pdf | 154,075 | `4c3f1bedefa72a99` |
| EQUIPMENT-REPORT.html | 15,321 | `297d4991a88ca98c` |

The PDF that went out is byte-identical to `docs/pitch/LETTER-AGREEMENT-Phase1.pdf` in this repo.

### 1. CUSTOMER-REPORT.html — 6.86 MB and 4.1 s, now 2.99 MB and 0.13 s
Measured in headless Chromium over `file://`, 3 runs each, median:

| | before | after |
|---|---|---|
| file size | 6,855,509 B | 2,992,004 B |
| open, wall / DOMContentLoaded | 4,109 / 3,834 ms | 133 / 117 ms |
| `<td>` nodes per draw | 319,536 | 316 |
| total DOM nodes | 367,030 | 556 |
| sort a column | 4,516 ms | 178 ms |
| type "vaughan" in search | 15,928 ms | 744 ms |

What was done, in payoff order: virtualised the table on window scroll (~40 rows plus two spacer
`<tr>`, recycled); debounced search at 150 ms against a precomputed lowercase key per row;
`JSON.parse('...')` instead of a JS array literal; rows as arrays against one shared header;
totals computed once per filter instead of inside `draw()`.

**Correctness was proven, not sampled.** All 15,216 rows x 21 cells were dumped from both the old
and new files in a real browser, including each `<td>`'s class. Both dumps hash to
`9da5caa732dbbea11fb7881769ced91945edc585f67c102c9be8d0482702c945`. All five filters match on
count, total and row order. 84 scroll-position invariant checks across four states (all, filtered,
filtered+sorted, searched) found no gaps, overlaps or page errors; document height differs by 1 px
over 457,882.

**Two decisions worth remembering:**
- `city` is NOT rendered but the old search joined it, so it was KEPT in the payload. Dropping it
  would have silently changed search results. Only `retail`, `prov` and `mail` were dropped.
- Column widths are measured once from a hidden probe table (the 8 longest values per column, sized
  by the browser itself) so they do not jump while scrolling. Canvas `measureText` was tried first
  and over-measured by ~12%.

**Known trade-off, disclosed to Daniel:** browser Ctrl+F now only finds rows currently on screen.
The report's own search box still covers all 15,216. `beforeprint` re-renders every row so printing
is unaffected.

### 2. The letter agreement, rebuilt three times
`docs/pitch/LETTER-AGREEMENT-Phase1.{md,html,pdf}` are all modified and NOT yet committed at the
time of writing (this wrap-up commits them). Final state:
- **Section 3** — real dates. Phase 1 runs to December 1, 2026 assuming kickoff the week of
  September 8; a later kickoff moves the end date by the same number of days. Phase 2, if it
  happens, runs to February 1, 2027. Daniel cut the "eight working weeks / holidays" explanation:
  his words were "way too much junk context".
- **Section 5** — Daniel owns the whole of the software, not only the "generalised" parts. UVALUX's
  data ownership stated much more strongly. New continuity clause.
- **Entity** — every party reference is now **Stream Stage Productions Inc.**, on Daniel's
  instruction, EXCEPT one deliberate "Daniel Abrahamson" in the continuity-clause trigger:
  *"If Stream Stage Productions Inc. stops work, if Daniel Abrahamson is unable to continue, or if
  either party ends this agreement, UVALUX keeps the right to run the Phase 1 build for its own
  salons, permanently, at no further cost."* That personal trigger exists because a company can
  keep existing while its only operator cannot work. **Do not "tidy" that name away.**
- **Signature block** — Name and Title rows were added to the Stream Stage side so a company has a
  named signer. Daniel was told and did not ask to revert.

### How the PDF is built — THERE IS NO BUILD SCRIPT IN THIS REPO
The pipeline is markdown -> the existing `LETTER-AGREEMENT-Phase1.html` -> Chromium print. Rebuild
recipe, which is what the scratchpad scripts do:
1. Edit ONLY the affected `<section class="clause">` bodies inside the existing HTML. Never
   regenerate the whole HTML with a different converter, or you lose the `@page` rule, the
   `break-inside` fixes and the signature-block underscore markup.
2. The paragraph conversion is: split on blank lines, keep internal newlines, `**x**` ->
   `<strong>x</strong>`, straight apostrophes, no smart quotes. Prove it by converting an UNCHANGED
   prose section and diffing against the existing HTML — section 4 reproduces character for
   character.
3. Render with Playwright: `page.pdf({ printBackground: true, preferCSSPageSize: true })` after
   `waitUntil: 'networkidle'` and `document.fonts.ready`. **Fraunces and Inter come from the Google
   Fonts CDN and are NOT installed locally**, so the render needs network or the PDF silently falls
   back to Georgia/system-ui.
4. Validate settings by re-rendering the OLD html first and diffing `pdftotext` against the
   committed PDF. It matches text AND page breaks exactly.
5. Acceptance checks, all automated: 3 pages; zero dashes across `U+2010..U+2015` plus `U+2212`;
   every heading has content under it on its own page (no strand); no clause split across pages;
   exactly one "Daniel Abrahamson"; every prose word of the markdown appears in order in the
   rendered text (only the 11 list bullets legitimately do not).

Scratchpad scripts, worth copying into the repo if this is ever done again:
`/tmp/claude-1000/-home-danman60-projects-uvalux-platform/91de2a22-1683-4f26-b25c-b8d4d7d31ebb/scratchpad/`
— `build-letter.mjs`, `render-letter.mjs`, `swap-pdf.mjs`, `measure.mjs`, `compare.mjs`,
`verify.mjs`, `stress.mjs`, `build.mjs`.

### GOTCHAS THAT COST REAL TIME TODAY
- **A Gmail compose window that is already open will silently revert attachments written by the
  API.** Daniel had the draft open; his autosave rewrote the whole message from that window's
  in-memory state, restoring the previous PDF and discarding a verified API write. Detected by the
  message id changing after a verified read, with his body length changing in the same version.
  If someone is editing a draft in the UI, they must reload before you write, and again before they
  send. Racing their autosave is unwinnable; the last writer wins.
- **`gws gmail users drafts update --upload <file> --upload-content-type message/rfc822` WORKS**
  for multi-megabyte drafts. It builds a proper multipart upload. An earlier session's claim that
  `--upload` is rejected and that a hand-rolled resumable upload is required is WRONG. No resumable
  session, no shell argument limit.
- **`gws auth export` returns a refresh token that no longer works.** Minting an access token from
  it fails `invalid_grant` against the file secret and `invalid_client` against its own. gws itself
  works because it uses the encrypted `~/.config/gws/token_cache.json`. Do not try to hand-roll
  OAuth for gws; use the CLI.
- **`drafts.update` drops all labels.** Re-apply with `messages.modify` on the NEW message id every
  single time. The set here was `Label_19`, `Label_20`, `Label_26`.
- **Always re-fetch the draft raw immediately before writing.** Daniel's body changed four times
  during this session (2,211 -> 2,218 -> 2,308 -> 2,163 chars). Any cached `.eml` would have
  destroyed his edits.
- The report and the agreement hold real names, addresses, postal codes and mobile numbers for
  15,216 people. **Never host, commit or link `CUSTOMER-REPORT.html`.** Work on copies in `/tmp`.

### Open thread nobody closed
Daniel's email body said "twelve weeks from kickoff" while the PDF says December 1, 2026. It was
flagged twice to the PA and to Daniel and was still present in the live body at 19:11Z. He sent
anyway. **If Nick asks about the timeline, the PDF is authoritative.**

### Build status
Not run this session. No application code was touched — the only repo changes are the three
`docs/pitch/LETTER-AGREEMENT-Phase1.*` files and the previously untracked `uvaint-v7.mp3`.

### Next steps
1. Nothing is pending on the email. It is sent. Do not rewrite that draft.
2. If the agreement changes again, follow the rebuild recipe above and re-run the acceptance checks.
3. Consider moving the PDF build into `scripts/` so the next rebuild does not start from scratch.
4. Untested this session: nothing in the app changed, so no app regression risk.

---

## 2026-09-03 late — THE DATA SESSION. The extract was lying, and four features came back.

One sentence: the anonymised `canonical/*.csv` had been read for two weeks as if it described
SalonTouch; it described our own extract script's filters, and undoing that recovered customer
contact data, lamp telemetry, package balances and eight extra years of history.

### The core correction — read this before touching any data question
`~/salon-pull/canonical/*.csv` is a **PII-stripped, date-windowed, column-filtered projection**
produced by `packages/db/scripts/salon-ingest/salontouch-extract.mjs`. Four things were reported
as ABSENT from the dataset that were present in the source the whole time:

| Reported absent | Actually | Why it looked absent |
|---|---|---|
| customer emails/phones/names | `Client_Email` 1,654 clients, `Client_Phones` 15,241, full names/addresses/DOB | script read `Client_Email` only to set a yes/no flag |
| per-machine attribution | `BedUID`/`BedNumberUsed`/`BedTypeUsed` on all 444,327 sessions | dropped from `visits.csv` |
| minute/session balances | `Client_Tanservices.UnitsPurchased/UnitsUsed/UnitsLeft`, 4,302 clients hold one | filtered to `Type='UNLIMITED'`, the only type that never carries a balance |
| 8 extra years | source runs 2009-10-21 → 2022-04-01, 444,327 sessions | hardcoded window 2016-01-01 → 2020-03-15 cut 56% |

**The extractor is now fixed** (`4a1f623`): `emit()` refuses to run without provenance, writes
`_manifest.json` + `SOURCE-vs-EXTRACT.md` beside its output, emits `packages.csv`/`beds.csv`/
`bed_maintenance.csv`, restores the bed columns, and gates identified output behind two env vars
plus a hard refusal to write inside this repo. Verified 10/10, no regression on the 10 old files.

### The full dump exists now — use it, do not re-derive
`~/salon-pull/_extract/full/` — **all 88 non-empty tables, both databases, 2,219,679 rows**, row
counts matched against `sys.partitions` with zero mismatches. `ntext`/`text` included; binary
columns carry length+hex rather than being dropped. `_INDEX.csv` lists everything. 239 tables are
genuinely empty, confirmed two ways. `_REACHABILITY.csv` is one row per client.

### Contact reality (this is the product-shaping fact)
| Channel | Clients | of 20,033 |
|---|---|---|
| Street address | 13,879 | 69.3% |
| Any phone | 15,102 | 75.4% |
| — cell w/ `SENDSMS=1` | **8,092** | 40.4% |
| Email | 1,601 | 8.0% |
| **Reachable by any means** | **16,391** | **81.8%** |

**Email genuinely is not there, and the mechanism is proven, not inferred:** the client intake form
(`tanrelease.rpt` 2005, `tanrelease_esign.rpt` 2011–2022) has **no email field** — 0 hits by ASCII
and by UTF-16. Outlook was never installed, so SalonTouch's own "Send Emails" report could never
run. SMTP configured on 0 of 4 locations. `SENDSMS` is set on 99.7% of cell numbers and 0% of home
and work lines — deliberate, per-phone consent. **Reactivation is a texting and direct-mail
product, not an email product.** Direct mail carries no CASL exposure.

`Mailto` is the **postal** mailing flag (manual, verbatim), not an email opt-in. Do not reuse the
"99.7% opted in" argument; it is refuted.

### Deliverables (all OUTSIDE the repo — real PII, public remote)
- `/mnt/build/salon-pull/_extract/CUSTOMER-REPORT.html` — 15,216 reachable customers, $3,325,365
  lifetime spend, 348,348 visits. Real salon names + addresses, real staff names, street addresses,
  sortable, filters for SMS / Email / Post / Holds credit. **Attachment only, never hosted.**
- `EQUIPMENT-REPORT.html` — 31 lamped machines, 3 past rated lamp life.
- `CUSTOMER-EMAILS.csv` (1,601), `ALL-CUSTOMER-EMAILS.csv`, `REPAIRABLE-MALFORMED-EMAILS.csv`,
  `GRAB-AUDIT.md` (4,738 lines), `CENSUS-NON-SQL-STORES.md`, `full/` (526 MB).

### Shipped to production
- **`/video`** — the 2:10 product film, live at https://bask-psi.vercel.app/video (`0c3b538`).
  Film on Cloudflare R2 (`streamstagesite`, prefix `bask/`), 720p streams, 1080p linked. The 66 MB
  master stays out of the repo. **Playback itself was never machine-verified** — headless Chromium
  here has no H.264 codec. A human should click it once.
- `demo:verify` against production: **12 passed / 0 failed**, 19:25 ET. `/compass` needs no role
  param. `/compass/calls` does not exist — the Call List IS `/compass`.

### Lamp telemetry is real and nobody has ever read it
`Beds` carries a five-channel meter (`LampA/LampB/Top/Bottom/FacialMinutesUsed`) against four
rated-life columns. **Verified the meter RESETS at a relamp** — 40 of 40 maintenance series drop,
none ascend; the operator's own relamp points cluster at ~48,000 min ≈ 800 h, matching the rating.
3 machines are past rated life. `Bed_Maintenance` holds 1,264 dated part changes
(`BulbChange` is a PART NAME — `LAMP A`, `FACIAL/QUARTZ` — not a boolean).
**The data has been recorded 12 years and no report ever surfaced it.** That is Nick's feature #2.

### Build status
PASSING. `tsc --noEmit` clean, `demo:verify` 12/12 on production, HEAD pushed.

### Next steps (priority order)
1. **Pull `C:\Users\<user>\AppData` from the salon PC** while access remains. The grab took
   Desktop/Documents/Downloads but NOT AppData, so browser history and bookmarks — the only place
   left that could name an outside marketing tool holding a real email list — were never captured.
2. **Click the video once on a real browser.** Everything else about `/video` is verified.
3. **Re-derive the unused-credit dollar figure against the surcharge matrix** (manual pp.138–141:
   salon × bed type × minute band). Unit counts are exact; the $157,316 is an estimate and is
   labelled as such on the report. Do not let it be quoted as hard.
4. Repair the 68 malformed emails in `Client_Email` (15 already auto-repaired; ~53 need a human eye).
5. Decide on `system/user_files.tar` — 1.42 GB holding one named individual's T4, employment
   agreements, résumés and ~181 personal photos. PIPEDA-relevant, no product value. Owner's call.
6. Security, from `GRAB-AUDIT.md`: two plaintext SQL credentials compiled into
   `SalonTouch_unpacked.exe`; vendor publisher reachable on a public IP; `sa` password printed in
   the customer manual p.444. Incumbent's posture, relevant to Nick's risk.
7. `net user datapull /del` still owed on the salon PC.

### Gotchas
- **`~/salon-pull` is a SYMLINK to `/mnt/build/salon-pull`.** Searches under `~/projects` or `$HOME`
  will not find the reports. Use the real path.
- **Never attach anything in `~/salon-pull/live/`** — attaching runs recovery and WRITES to the MDF.
  Copy first. `_work/` holds copies; `live/` mtimes verified unchanged at 2026-08-24 16:58.
- `SalonTouchDB` may still be attached in a container named `salondb`.
- **`pkill -f "next dev"` matched its own command line and killed the shell mid-turn.** Kill by pid.
- Bundled Playwright Chromium has **no H.264** — video playback cannot be verified with it.
- `Client_General.ID` has a shift-row cipher on 17 rows (`+!@^^@F` → 12662). Membership card
  numbers, not contact data. Dead end, closed.
- The "3,433 unique emails" figure was a **greedy-regex artifact** on contiguous UTF-16, not
  evidence of hidden data. Real total is ~1,600. Do not resurrect it.
- `nick@uvalux.com` is CONFIRMED by Daniel (2026-09-03 20:40). The repo note calling it a guess is
  corrected.

### New skill
`~/.claude/skills/data-mine/SKILL.md` (274 lines) — census before answering; your own silent
pre-filters are the worst failure; enumerate stores before tables; never explain a surprising
number with an untested story; verify the instrument before trusting a discrepancy.

### Routed to PA
`PA-20260903-01` SalonTouch consent legal question · `PA-20260903-02` Suddenlink + stakeholders +
the owed Liberty Village dataset · `PA-20260903-03` Nick package (report attached, links live).
