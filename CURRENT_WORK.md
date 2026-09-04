# CURRENT_WORK — uvalux-platform

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
