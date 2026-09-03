#!/usr/bin/env node
/**
 * SalonTouch (SQL Server) → the canonical CSVs the existing pure mappers consume.
 *
 * The mappers in ./etl are unchanged: they already expect an ANONYMIZED source
 * (`map-customers.ts` synthesizes names from the customer id). So no real client
 * name, phone, address or DOB is written to disk here — only ids, dates, money
 * and counts. That is deliberate and load-bearing: the repo is public and the
 * salon's owner gave permission for analysis, not publication.
 *
 * Every mapping decision below is documented in
 * docs/research/salontouch-detector-grading.md. The two that are INFERRED
 * rather than translated, and must be labelled as such wherever they surface:
 *
 *   1. visit ↔ sale. SalonTouch has no link between tanning history and the
 *      register. A sale is attributed to the client's FIRST session that same
 *      day at the same salon. This is what makes "attachment" computable at all.
 *   2. memberships. `Client_EFT` holds 2 rows for 20k clients, so real EFT
 *      memberships do not exist in this file. The analogue is the UNLIMITED
 *      package (`TanService_General.Type='UNLIMITED'`).
 *
 * NOT emitted: inventory_snapshots (on-hand is unreconstructable — the
 * adjustment ledger goes negative for 1,039 of 1,147 product/salon pairs
 * because receiving was never entered) and membership_payments (no payment
 * failure data exists; `FAILEDLYNK` is 0 on all 121,058 rows).
 *
 *   OUT_DIR=~/salon-pull/canonical node salontouch-extract.mjs
 *
 * ---------------------------------------------------------------------------
 * 2026-09-03 CORRECTION. This script's output was read for two weeks as if it
 * described SalonTouch. It does not — it describes this filter. Four separate
 * things were absent from the CSVs and present in the source the whole time,
 * and each one killed a feature on the roadmap:
 *
 *   1. CONTACT INFO. `Client_Email` (2,554 rows, 1,586 distinct clients),
 *      `Client_Phones` (16,054 / 15,241 clients) and `Client_General`'s own
 *      name/address/DOB columns were read only to compute a yes/no
 *      `preferred_channel` flag. Reactivation needs the address, not the flag.
 *   2. BED ATTRIBUTION. `History_TanHistory` carries `BedUID`,
 *      `BedNumberUsed` and `BedTypeUsed` on all 444,327 rows. visits.csv kept
 *      `session_minutes` and dropped all three, so per-machine utilisation and
 *      lamp hours read as "not derivable".
 *   3. PACKAGE BALANCES. `Client_Tanservices` holds
 *      `UnitsPurchased/UnitsUsed/UnitsLeft` + `ExpirationDate` across types
 *      SESSIONS / MINUTES / UNLIMITED / POINTS. The membership query below
 *      filters to `Type='UNLIMITED'` — i.e. to exactly the rows that never
 *      carry a balance. 4,302 clients hold an unused balance; the CSVs showed
 *      a flat-rate world with no minute banking.
 *   4. ELEVEN YEARS OF HISTORY. The FROM/TO default below is a 2016→2020
 *      replay window. The source runs 2009-10-21 → 2022-04-01. 249,655 of
 *      444,327 sessions (56%) are outside the window.
 *
 * The anonymised canonical output is still the DEFAULT and still safe to hand
 * around: this repo is public and the owner gave permission for analysis, not
 * publication. But non-identifying columns (bed ids, unit balances, lamp
 * meters) were never a privacy question and are now emitted unconditionally.
 * Identifying columns are a separate, explicitly gated output that refuses to
 * write anywhere near this repo. See EMIT_IDENTIFIED below.
 * ---------------------------------------------------------------------------
 *
 * Env: SA_PASSWORD (required), CONTAINER (default salondb),
 *      FROM_DATE / TO_DATE (default the replay window 2016-01-01 → 2020-03-15),
 *      FULL_HISTORY=yes  widen to the source's true span (2009-01-01 → 2023-01-01).
 *        Left OFF by default: the existing demo dataset and every coefficient
 *        derived from it assume the replay window. Widening changes the dataset,
 *        so it is a decision, not a flag to flip in passing.
 *      EMIT_IDENTIFIED=yes + IDENTIFIED_DIR=<abs path outside this repo>
 *        also writes customers_identified.csv (real name, email, phone,
 *        address, DOB). Both are required; there is no default for either.
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const OUT_DIR = process.env.OUT_DIR;
if (!OUT_DIR) { console.error('OUT_DIR required — no default (never write this into the repo).'); process.exit(1); }
const SA = process.env.SA_PASSWORD;
if (!SA) { console.error('SA_PASSWORD required.'); process.exit(1); }
const CONTAINER = process.env.CONTAINER || 'salondb';
const FULL = process.env.FULL_HISTORY === 'yes';
const FROM = process.env.FROM_DATE || (FULL ? '2009-01-01' : '2016-01-01');
const TO = process.env.TO_DATE || (FULL ? '2023-01-01' : '2020-03-15');

/* Identifying output. Two independent gates, no default for either, and a hard
 * refusal to write inside this repo — a public remote plus 20k real Ontario
 * consumers is not a mistake that can be walked back after a push. */
const EMIT_ID = process.env.EMIT_IDENTIFIED === 'yes';
const ID_DIR = process.env.IDENTIFIED_DIR;
if (EMIT_ID) {
  if (!ID_DIR) { console.error('EMIT_IDENTIFIED=yes requires IDENTIFIED_DIR (absolute path, outside this repo).'); process.exit(1); }
  const repo = path.resolve(new URL('../../../..', import.meta.url).pathname);
  if (path.resolve(ID_DIR).startsWith(repo)) {
    console.error(`IDENTIFIED_DIR must be OUTSIDE the repo. Got ${ID_DIR}, repo is ${repo}.`); process.exit(1);
  }
  fs.mkdirSync(ID_DIR, { recursive: true });
}

/** Run a query in the container and return raw stdout lines. */
function sql(query) {
  const out = execFileSync('sudo', [
    '-S', 'docker', 'exec', CONTAINER, '/opt/mssql-tools18/bin/sqlcmd',
    '-S', 'localhost', '-U', 'sa', '-P', SA, '-C', '-d', 'SalonTouchDB',
    '-h', '-1', '-W', '-s', '', '-w', '65535', '-Q', `SET NOCOUNT ON; ${query}`,
  ], { input: `${process.env.SUDO_PASSWORD ?? ''}\n`, maxBuffer: 1024 * 1024 * 512, encoding: 'utf8' });
  return out.split('\n').map((l) => l.replace(/\r$/, '')).filter((l) => l.length && !/^-+$/.test(l));
}

const q = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/* ---- provenance manifest -------------------------------------------------
 * Four features were wrongly marked "not buildable" because this script's
 * output carried no record of what it removed. A CSV with clean headers and a
 * plausible row count reads as the source. Every emit() now declares the table
 * it came from, the filters in force and the columns dropped, and REFUSES TO
 * RUN without them. `_manifest.json` lands beside the CSVs and
 * `SOURCE-vs-EXTRACT.md` states the loss in one line per file.
 */
const MANIFEST = [];

/** Row count of a source table, for the emitted-vs-source ratio. */
function sourceCount(table) {
  const [n] = sql(`SELECT COUNT(*) FROM ${table}`);
  return Number.parseInt((n || '0').trim(), 10) || 0;
}

/**
 * Run a query whose columns map 1:1 onto `headers`, write it as CSV.
 * `prov` is REQUIRED: { from, filters, dropped, windowed } — the source table,
 * the WHERE clauses applied, and the source columns deliberately not emitted.
 */
function emit(name, headers, query, transform, prov) {
  if (!prov || !prov.from) {
    throw new Error(`emit(${name}): provenance required — name the table, the filters and the dropped columns.`);
  }
  const rows = sql(query).map((line) => line.split('').map((c) => c.trim()));
  const body = rows.map((cells) => (transform ? transform(cells) : cells).map(q).join(','));
  const file = path.join(OUT_DIR, `${name}.csv`);
  fs.writeFileSync(file, `${headers.join(',')}\n${body.join('\n')}\n`);
  // `sameGrain: false` means one emitted row is NOT one source row (staff is
  // employee x salon; salons is one row per GROUP of history rows). Computing a
  // percentage across a grain change produced "122 of 101 = 120.8%" and, worse,
  // made SOURCE-vs-EXTRACT.md report "all rows" for a file that dropped six
  // columns. A ratio nobody can trust is worse than no ratio.
  const sameGrain = prov.sameGrain !== false;
  const src = sameGrain ? sourceCount(prov.from) : null;
  const pct = src ? ((rows.length / src) * 100).toFixed(1) : null;
  MANIFEST.push({
    file: `${name}.csv`, source_table: prov.from, grain: prov.grain || 'one row per source row',
    source_rows: src, emitted_rows: rows.length, emitted_pct: pct,
    filters: prov.filters || [], dropped_columns: prov.dropped || [],
    window: prov.windowed === false ? null : { from: FROM, to: TO },
  });
  console.log(`  ${name}.csv  ${rows.length}${src && rows.length < src ? `   <- ${pct}% of ${src} source rows` : ''}`);
  return rows.length;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
console.log(`\n=== SalonTouch → canonical CSV ===`);
console.log(`window ${FROM} → ${TO} · out ${OUT_DIR}\n`);

const WIN = `>= '${FROM}' AND {col} < '${TO}'`;
const tanWin = WIN.replace('{col}', 'DateOfTan').replace('>=', "DateOfTan >=");
const saleWin = WIN.replace('{col}', 'DateofSale').replace('>=', "DateofSale >=");

/* --- salons. Anonymized labels: the client name never enters the pipeline. --- */
emit('salons', ['salon_id', 'salon_name'],
  `SELECT UPPER(SalonUID), 'Salon ' + CHAR(64 + CAST(ROW_NUMBER() OVER (ORDER BY MIN(DateOfTan)) AS int))
   FROM History_TanHistory WHERE Deleted=0 GROUP BY UPPER(SalonUID)`,
  undefined, { from: 'History_TanHistory', sameGrain: false, grain: 'one row per distinct SalonUID', filters: ['Deleted=0'], dropped: ['real salon name (replaced by ordinal label)'] });

/* --- staff. Real employee names replaced by a per-salon ordinal label. --- */
emit('staff', ['staff_id', 'salon_id', 'full_name', 'role', 'hire_date', 'active', 'primary_shift'],
  `WITH worked AS (
     -- Every employee who touched EITHER surface. Sourcing staff from tanning
     -- history alone misses register-only employees and breaks sale.staffId.
     SELECT UPPER(EmployeeUID) EmployeeUID, UPPER(SalonUID) SalonUID
     FROM History_TanHistory WHERE Deleted=0 AND EmployeeUID IS NOT NULL AND EmployeeUID <> ''
     UNION
     SELECT UPPER(EmployeeUID), UPPER(SalonUID)
     FROM Reg_Transactions WHERE Deleted=0 AND EmployeeUID IS NOT NULL AND EmployeeUID <> ''),
   s AS (
     SELECT w.EmployeeUID, w.SalonUID, MIN(e.Hired) Hired, MAX(CAST(e.Status AS int)) Status,
            ROW_NUMBER() OVER (PARTITION BY w.SalonUID ORDER BY w.EmployeeUID) rn
     FROM worked w LEFT JOIN Emp_General e ON UPPER(e.EmployeeUID) = w.EmployeeUID
     GROUP BY w.EmployeeUID, w.SalonUID)
   SELECT EmployeeUID + '@' + SalonUID, SalonUID, 'Staff ' + RIGHT('0'+CAST(rn AS varchar),2),
          'staff', ISNULL(CONVERT(varchar,Hired,23),''), CASE WHEN Status=1 THEN 'true' ELSE 'false' END, ''
   FROM s`,
  undefined, { from: 'Emp_General', sameGrain: false, grain: 'one row per employee x salon, sourced from history not Emp_General', filters: ['Deleted=0','EmployeeUID non-empty'], dropped: ['FirstName','LastName','Emp_Email','Emp_Phone','Emp_Address','real name replaced by per-salon ordinal'] });

/* --- customers. Ids + dates only. Names are synthesized by map-customers. --- */
emit('customers', ['customer_id', 'salon_id', 'signup_date', 'marketing_opt_in', 'preferred_channel'],
  `WITH known AS (
     SELECT UPPER(c.ClientUID) ClientUID, UPPER(c.SalonUID) SalonUID, c.FirstVisit, c.Mailto
     FROM Client_General c WHERE c.Deleted=0 AND c.SalonUID IS NOT NULL),
   -- Clients referenced by history but absent from Client_General (hard-deleted
   -- or null-salon). Without these the visit/sale FKs break on load.
   seen AS (
     SELECT UPPER(ClientUID) ClientUID, UPPER(SalonUID) SalonUID, DateOfTan AS seenAt FROM History_TanHistory WHERE Deleted=0
     UNION ALL
     SELECT UPPER(ClientUID) ClientUID, UPPER(SalonUID) SalonUID, DateofSale FROM Reg_Transactions WHERE Deleted=0),
   ghosts AS (
     SELECT s.ClientUID, MIN(s.SalonUID) SalonUID, MIN(s.seenAt) FirstVisit, CAST(0 AS bit) Mailto
     FROM seen s
     WHERE s.ClientUID IS NOT NULL AND s.ClientUID <> '0'
       AND NOT EXISTS (SELECT 1 FROM known k WHERE k.ClientUID = s.ClientUID)
     GROUP BY s.ClientUID),
   allc AS (SELECT * FROM known UNION ALL SELECT * FROM ghosts)
   SELECT a.ClientUID, a.SalonUID, ISNULL(CONVERT(varchar,a.FirstVisit,23),''),
          CASE WHEN a.Mailto=1 THEN 'true' ELSE 'false' END,
          CASE WHEN EXISTS (SELECT 1 FROM Client_Email e WHERE e.ClientUID=a.ClientUID) THEN 'email' ELSE 'none' END
   FROM allc a`,
  undefined, { from: 'Client_General', filters: ['Deleted=0'], dropped: ['FirstName','LastName','Birthday','Address','City','State','Zip','HomeAreaCode','HomePhoneNo','WorkPhoneNo','SocialSecurity','DriverLicense','Client_Email.Email','Client_Phones.PhoneNo','Client_Addresses.*'] });

/* --- products. Brand lives in Product_General.Type (real UVALUX brands). --- */
emit('products', ['product_id', 'sku', 'product_name', 'brand', 'category', 'retail_price', 'unit_cost', 'active'],
  `SELECT UPPER(ProductID),
          -- Product.sku is @unique in Bask, but 26 barcodes repeat here (two
          -- salons stocking the same item). A repeated barcode falls back to
          -- the product id, otherwise createMany(skipDuplicates) silently drops
          -- the second row and every sale line referencing it breaks its FK.
          CASE WHEN Barcode IS NULL OR Barcode = ''
                 OR COUNT(*) OVER (PARTITION BY NULLIF(Barcode,'')) > 1
               THEN UPPER(ProductID) ELSE Barcode END,
          ISNULL(Product,''), ISNULL(Type,''), ISNULL(Item,''),
          CAST(ISNULL(RegularPrice,0) AS decimal(10,2)), '',
          CASE WHEN Deleted=1 THEN 'false' ELSE 'true' END
   -- No Deleted filter: discontinued products still appear on historic sale
   -- lines, and excluding them breaks sale_line.productId. They load inactive.
   FROM Product_General`,
  undefined, { from: 'Product_General', filters: [], dropped: ['unit_cost (not populated)'], windowed: false });

/* --- visits. One row per real tanning session; Position is the natural key. --- */
emit('visits', ['visit_id', 'salon_id', 'customer_id', 'staff_id', 'check_in_at', 'session_minutes', 'walk_in',
   'bed_uid', 'bed_number', 'bed_type', 'units_used'],
  `SELECT CAST(Position AS varchar(36)), UPPER(SalonUID), UPPER(ClientUID), ISNULL(UPPER(EmployeeUID) + '@' + UPPER(SalonUID),''),
          CONVERT(varchar,DateOfTan,120), ISNULL(LenOfTan,0), 'true',
          -- Bed attribution. Present on every row and dropped until 2026-09-03;
          -- without these, per-machine utilisation and lamp hours are impossible.
          ISNULL(CAST(BedUID AS varchar(36)),''), ISNULL(CAST(BedNumberUsed AS varchar(36)),''),
          ISNULL(BedTypeUsed,''), ISNULL(UnitsUsed,0)
   FROM History_TanHistory
   WHERE Deleted=0 AND CanceledTan=0 AND ClientUID IS NOT NULL AND ClientUID <> '0' AND ${tanWin}`,
  undefined, { from: 'History_TanHistory', filters: ['Deleted=0','CanceledTan=0','ClientUID not null/0',`DateOfTan in [${FROM},${TO})`], dropped: ['PackageDeduction','ServiceUsedID','PackageUsedID','EmployeeName','Result','StepNumber'] });

/*
 * --- transactions. No sale-header table exists: a sale is the set of register
 * lines sharing (SalonUID, ReceiptNumber, sale date). visit_id is the INFERRED
 * link — that client's first session the same day at the same salon.
 */
emit('transactions',
  ['transaction_id', 'salon_id', 'customer_id', 'staff_id', 'visit_id', 'transaction_at',
   'total_revenue', 'retail_revenue', 'service_revenue', 'discount_amount', 'payment_method'],
  `WITH hdr AS (
     SELECT UPPER(t.SalonUID) SalonUID, t.ReceiptNumber, CAST(t.DateofSale AS date) d,
            MIN(UPPER(t.ClientUID)) ClientUID, MIN(UPPER(t.EmployeeUID)) EmployeeUID, MIN(t.DateofSale) at,
            SUM(CASE WHEN t.ItemSoldType='PRODUCT' THEN t.Price ELSE 0 END) retail,
            SUM(CASE WHEN t.ItemSoldType='TanService' THEN t.Price ELSE 0 END) svc,
            SUM(ISNULL(t.Discount,0)) disc
     FROM Reg_Transactions t
     WHERE t.Deleted=0 AND t.TransType='SALE' AND t.ClientUID IS NOT NULL AND t.ClientUID <> '0' AND t.${saleWin}
     GROUP BY UPPER(t.SalonUID), t.ReceiptNumber, CAST(t.DateofSale AS date)
     HAVING SUM(CASE WHEN t.ItemSoldType IN ('PRODUCT','TanService') THEN 1 ELSE 0 END) > 0),
   firstVisit AS (
     SELECT UPPER(SalonUID) SalonUID, UPPER(ClientUID) ClientUID, CAST(DateOfTan AS date) d, MIN(CAST(Position AS varchar(36))) vid
     FROM History_TanHistory WHERE Deleted=0 AND CanceledTan=0 AND ClientUID <> '0' AND ${tanWin}
     GROUP BY UPPER(SalonUID), UPPER(ClientUID), CAST(DateOfTan AS date)),
   pay AS (
     SELECT UPPER(SalonUID) SalonUID, ReceiptNumber, CAST(DateofSale AS date) d, MIN(PaymentType) pt
     FROM Reg_Payment WHERE Deleted=0 GROUP BY UPPER(SalonUID), ReceiptNumber, CAST(DateofSale AS date))
   SELECT h.SalonUID + ':' + CAST(h.ReceiptNumber AS varchar) + ':' + CONVERT(varchar,h.d,112),
          h.SalonUID, h.ClientUID, ISNULL(h.EmployeeUID + '@' + h.SalonUID,''), ISNULL(fv.vid,''),
          CONVERT(varchar,h.at,120),
          CAST(h.retail + h.svc AS decimal(12,2)), CAST(h.retail AS decimal(12,2)),
          CAST(h.svc AS decimal(12,2)), CAST(h.disc AS decimal(12,2)),
          ISNULL(p.pt,'')
   FROM hdr h
   LEFT JOIN firstVisit fv ON fv.SalonUID=h.SalonUID AND fv.ClientUID=h.ClientUID AND fv.d=h.d
   LEFT JOIN pay p ON p.SalonUID=h.SalonUID AND p.ReceiptNumber=h.ReceiptNumber AND p.d=h.d`,
  undefined, { from: 'Reg_Transactions', filters: ['Deleted=0',"TransType='SALE'",'ClientUID not null/0',`DateofSale in [${FROM},${TO})`], dropped: ['line-level detail (see transaction_items)'] });

/*
 * --- transaction_items. item_type MUST be exactly 'product' for retail lines:
 * map-transactions.ts keys productId off that literal, and using 'retail' here
 * once cost a whole grading run (attachment read 0% everywhere).
 */
emit('transaction_items',
  ['transaction_item_id', 'transaction_id', 'salon_id', 'customer_id', 'staff_id',
   'product_id', 'item_type', 'quantity', 'unit_price', 'visit_id'],
  `SELECT CAST(t.Position AS varchar(36)),
          UPPER(t.SalonUID) + ':' + CAST(t.ReceiptNumber AS varchar) + ':' + CONVERT(varchar,CAST(t.DateofSale AS date),112),
          UPPER(t.SalonUID), ISNULL(UPPER(t.ClientUID),''), ISNULL(UPPER(t.EmployeeUID) + '@' + UPPER(t.SalonUID),''),
          CASE WHEN t.ItemSoldType='PRODUCT' THEN ISNULL(UPPER(t.ItemSoldUID),'') ELSE '' END,
          CASE WHEN t.ItemSoldType='PRODUCT' THEN 'product' ELSE 'service' END,
          ISNULL(t.Quantity,1), CAST(ISNULL(t.Price,0) AS decimal(10,2)), ''
   FROM Reg_Transactions t
   WHERE t.Deleted=0 AND t.TransType='SALE' AND t.ItemSoldType IN ('PRODUCT','TanService')
     AND t.ClientUID IS NOT NULL AND t.ClientUID <> '0' AND t.${saleWin}`,
  undefined, { from: 'Reg_Transactions', filters: ['Deleted=0',"TransType='SALE'","ItemSoldType in ('PRODUCT','TanService')",`DateofSale in [${FROM},${TO})`], dropped: ['visit_id (never populated on line rows)'] });

/*
 * --- memberships. INFERRED, not translated: the UNLIMITED package standing in
 * for a membership. status/cancel come from the package's expiry, monthly_price
 * from what was actually paid.
 */
emit('memberships',
  ['membership_id', 'salon_id', 'customer_id', 'plan_name', 'status', 'monthly_price', 'start_date', 'cancel_date', 'cancel_reason'],
  `SELECT CAST(cts.Position AS varchar(36)),
          -- Client_Tanservices.SalonUID uses an 'ALL' prefix meaning "usable at
          -- any location" (29,269 rows are the bare string 'ALL'), so it is not
          -- a salon key. Resolve the salon from the client instead.
          UPPER(COALESCE(cg.SalonUID, NULLIF(REPLACE(UPPER(cts.SalonUID),'ALL',''), ''))), UPPER(cts.ClientID),
          LOWER(ISNULL(tsg.Item,'unlimited')),
          CASE WHEN cts.Active=1 AND (cts.ExpirationDate IS NULL OR cts.ExpirationDate >= '${TO}') THEN 'active' ELSE 'cancelled' END,
          CAST(ISNULL(cts.PricePaid, cts.PurchasePrice) AS decimal(10,2)),
          ISNULL(CONVERT(varchar,cts.PurchaseDate,23),''),
          CASE WHEN cts.ExpirationDate < '${TO}' THEN ISNULL(CONVERT(varchar,cts.ExpirationDate,23),'') ELSE '' END,
          ''
   FROM Client_Tanservices cts
   JOIN TanService_General tsg ON tsg.ServiceID = cts.ServiceID
   LEFT JOIN Client_General cg ON cg.ClientUID = cts.ClientID AND cg.Deleted=0
   WHERE cts.Deleted=0 AND tsg.Type='UNLIMITED'
     AND COALESCE(cg.SalonUID, NULLIF(REPLACE(UPPER(cts.SalonUID),'ALL',''), '')) IS NOT NULL
     AND cts.PurchaseDate >= '${FROM}' AND cts.PurchaseDate < '${TO}'`,
  undefined, { from: 'Client_Tanservices', filters: ['Deleted=0',"TanService_General.Type='UNLIMITED'  <-- EXCLUDES every SESSIONS/MINUTES/POINTS row, i.e. every row carrying a balance",`PurchaseDate in [${FROM},${TO})`], dropped: ['UnitsPurchased','UnitsUsed','UnitsLeft','ExpirationDate (see packages.csv)'] });

/* --- deliberately empty: no source data exists for either (see header). --- */
fs.writeFileSync(path.join(OUT_DIR, 'membership_payments.csv'),
  'payment_id,membership_id,due_date,status,recovered_date\n');
fs.writeFileSync(path.join(OUT_DIR, 'inventory_snapshots.csv'),
  'salon_id,product_id,snapshot_date,on_hand_units,reorder_threshold\n');
// These two bypass emit(), so they would otherwise be the only files with no
// stated reason for being empty — exactly the ones a reader most needs one for.
MANIFEST.push({
  file: 'membership_payments.csv', source_table: 'Reg_Payment', grain: 'n/a — intentionally empty',
  source_rows: null, emitted_rows: 0, emitted_pct: null,
  filters: ['NONE EMITTED: no payment-failure data exists in the source; FAILEDLYNK is 0 on all 121,058 rows'],
  dropped_columns: [], window: null,
});
MANIFEST.push({
  file: 'inventory_snapshots.csv', source_table: 'Product_Inventory', grain: 'n/a — intentionally empty',
  source_rows: null, emitted_rows: 0, emitted_pct: null,
  filters: ['NONE EMITTED: on-hand is unreconstructable — the adjustment ledger goes negative for 1,039 of 1,147 product/salon pairs because receiving was never entered'],
  dropped_columns: [], window: null,
});

/* =========================================================================
 * RECOVERED 2026-09-03. Non-identifying and wrongly dropped. These carry no
 * name, email, phone or address, so there was never a privacy reason to omit
 * them — they were casualties of a query shape, and each one blocked a feature.
 * ========================================================================= */

/* --- packages. THE BALANCE LEDGER. memberships.csv above is the UNLIMITED
 * slice of this same table; this is all of it, including every finite package
 * that actually carries UnitsLeft. "How many minutes you had, we'll honor it"
 * is UnitsLeft > 0 joined to a reachable client. */
emit('packages',
  ['package_id', 'salon_id', 'customer_id', 'service_id', 'plan_type', 'plan_item',
   'units_purchased', 'units_used', 'units_left', 'purchase_date', 'first_used_date',
   'expiration_date', 'price_paid', 'active'],
  `SELECT CAST(cts.Position AS varchar(36)),
          UPPER(COALESCE(cg.SalonUID, NULLIF(REPLACE(UPPER(cts.SalonUID),'ALL',''), ''))),
          UPPER(cts.ClientID), UPPER(ISNULL(cts.ServiceID,'')),
          UPPER(ISNULL(tsg.Type, cts.Type)), LOWER(ISNULL(tsg.Item, cts.Item)),
          CAST(ISNULL(cts.UnitsPurchased,0) AS decimal(12,2)),
          CAST(ISNULL(cts.UnitsUsed,0) AS decimal(12,2)),
          CAST(ISNULL(cts.UnitsLeft,0) AS decimal(12,2)),
          ISNULL(CONVERT(varchar,cts.PurchaseDate,23),''),
          ISNULL(CONVERT(varchar,cts.FirstUsedDate,23),''),
          ISNULL(CONVERT(varchar,cts.ExpirationDate,23),''),
          CAST(ISNULL(cts.PricePaid, cts.PurchasePrice) AS decimal(10,2)),
          CASE WHEN cts.Active=1 THEN 'true' ELSE 'false' END
   FROM Client_Tanservices cts
   LEFT JOIN TanService_General tsg ON tsg.ServiceID = cts.ServiceID
   LEFT JOIN Client_General cg ON cg.ClientUID = cts.ClientID AND cg.Deleted=0
   WHERE cts.Deleted=0`,
  undefined,
  { from: 'Client_Tanservices', filters: ['Deleted=0'], dropped: ['Barcode','restriction pointers','reset schedule','EFT flags'], windowed: false });

/* --- beds. 34 machines with a five-channel lamp meter against four rated-life
 * columns. VERIFIED 2026-09-03: the *MinutesUsed counters RESET at a relamp
 * (40 of 40 maintenance series show a drop; none ascend forever), so
 * MinutesUsed/60 over *Life is genuinely "share of rated lamp life consumed".
 * AccumulatedMinutes is the lifetime counter and does NOT reset. */
emit('beds',
  ['bed_id', 'salon_id', 'room_id', 'bed_type', 'label', 'lamp_watts', 'lamp_count', 'timer',
   'lamp_life_hours', 'top_life_hours', 'bottom_life_hours', 'facial_life_hours',
   'lamp_a_minutes_used', 'lamp_b_minutes_used', 'top_minutes_used', 'bottom_minutes_used',
   'facial_minutes_used', 'accumulated_minutes', 'avg_session_minutes', 'maint_mode', 'premaint'],
  `SELECT CAST(ID AS varchar(36)), UPPER(SalonUID), ISNULL(CAST(RoomID AS varchar(36)),''),
          ISNULL(Type,''), ISNULL(LabelAs,''), ISNULL(Lamp,''), ISNULL([Number of Lamps],0), ISNULL(Timer,''),
          ISNULL([Lamp Life],0), ISNULL([Top Life],0), ISNULL([Bottom Life],0), ISNULL([Facial Life],0),
          ISNULL(LampAMinutesUsed,0), ISNULL(LampBMinutesUsed,0), ISNULL(TopMinutesUsed,0),
          ISNULL(BottomMinutesUsed,0), ISNULL(FacialMinutesUsed,0),
          ISNULL(AccumulatedMinutes,0), ISNULL(AvgTime,0), ISNULL(MaintMode,0), ISNULL(Premaint,0)
   FROM Beds WHERE Deleted=0`,
  undefined,
  { from: 'Beds', filters: ['Deleted=0'], dropped: ['appointment block schedule','spreadcord columns'], windowed: false });

/* --- bed_maintenance. BulbChange is a PART NAME ('LAMP A','FACIAL/QUARTZ',
 * 'TOP ACRYLIC'...), not a boolean. `Used` is the meter reading at the moment
 * of the change, which is what makes the reset behaviour above provable. */
emit('bed_maintenance',
  ['maintenance_id', 'salon_id', 'bed_id', 'part_changed', 'changed_at', 'meter_minutes_at_change'],
  `SELECT CAST(Position AS varchar(36)), UPPER(SalonUID), CAST(BedUID AS varchar(36)),
          ISNULL(BulbChange,''), ISNULL(CONVERT(varchar,DateOfChange,23),''), ISNULL(Used,0)
   FROM Bed_Maintenance WHERE Deleted=0`,
  undefined,
  { from: 'Bed_Maintenance', filters: ['Deleted=0'], dropped: [], windowed: false });

/* --- IDENTIFIED. Gated twice and written outside the repo. This is the only
 * output that can reach a real person; everything above is safe to publish. */
if (EMIT_ID) {
  const rows = sql(
    `SELECT cg.ClientUID, UPPER(ISNULL(cg.SalonUID,'')), ISNULL(cg.FirstName,''), ISNULL(cg.LastName,''),
            ISNULL((SELECT TOP 1 e.Email FROM Client_Email e
                     WHERE e.ClientUID=cg.ClientUID AND e.Deleted=0 AND e.Email LIKE '%_@_%'
                     ORDER BY e.Position),''),
            ISNULL((SELECT TOP 1 LTRIM(RTRIM(ISNULL(p.AreaCode,''))) + LTRIM(RTRIM(p.PhoneNo))
                     FROM Client_Phones p WHERE p.ClientUID=cg.ClientUID AND p.Deleted=0
                       AND LTRIM(RTRIM(ISNULL(p.PhoneNo,''))) <> '' ORDER BY p.Position),''),
            ISNULL(cg.Address,''), ISNULL(cg.City,''), ISNULL(cg.State,''), ISNULL(cg.Zip,''),
            ISNULL(CONVERT(varchar,cg.Birthday,23),''),
            CASE WHEN cg.Mailto=1 THEN 'true' ELSE 'false' END,
            ISNULL(CONVERT(varchar,cg.LastVisit,23),'')
     FROM Client_General cg WHERE cg.Deleted=0`
  ).map((l) => l.split('\x01').map((c) => c.trim()));
  const hdr = ['customer_id','salon_id','first_name','last_name','email','phone','address','city','province','postal','birth_date','mailto_optin','last_visit'];
  const f = path.join(ID_DIR, 'customers_identified.csv');
  fs.writeFileSync(f, `${hdr.join(',')}\n${rows.map((r) => r.map(q).join(',')).join('\n')}\n`);
  console.log(`\n  IDENTIFIED -> ${f}  ${rows.length} rows  (joins to canonical on customer_id)`);
}

console.log('  membership_payments.csv  0 (no payment-failure data exists)');
console.log('  inventory_snapshots.csv  0 (on-hand unreconstructable)');

/* ---- write the manifest. The point of the whole correction: the loss is now
 * stated beside the data instead of living only in this file's head comment. */
const mf = path.join(OUT_DIR, '_manifest.json');
fs.writeFileSync(mf, `${JSON.stringify({
  generated_at: new Date().toISOString(),
  source: { database: 'SalonTouchDB', container: CONTAINER, true_span: '2009-10-21 .. 2022-04-01' },
  window_applied: { from: FROM, to: TO, full_history: FULL },
  identified_emitted: EMIT_ID,
  files: MANIFEST,
}, null, 2)}\n`);
const md = MANIFEST.map((m) => {
  const loss = m.emitted_rows === 0 ? '**none — see filters**'
    : m.source_rows === null ? `_${m.grain}_`
    : m.emitted_rows < m.source_rows ? `**${m.emitted_pct}% of ${m.source_rows.toLocaleString()}**`
    : 'all rows';
  return `| \`${m.file}\` | ${m.source_table} | ${m.emitted_rows.toLocaleString()} | ${loss} | ${m.dropped_columns.length ? `**${m.dropped_columns.length} dropped**` : '—'} |`;
}).join('\n');
fs.writeFileSync(path.join(OUT_DIR, 'SOURCE-vs-EXTRACT.md'),
`# What this extract is NOT

Generated ${new Date().toISOString()} from SalonTouchDB.
**Source span 2009-10-21 .. 2022-04-01. This extract's window: ${FROM} .. ${TO}${FULL ? '' : '  <- NOT the full history'}.**

These CSVs are a FILTERED PROJECTION. Do not describe the dataset from them —
an absence here is a fact about this filter, not about SalonTouch. Read
\`_manifest.json\` for the exact filters and dropped columns per file.

| file | source table | rows out | share of source | cols dropped |
|---|---|---|---|---|
${md}

Identifying columns (name, email, phone, address, DOB) are emitted only with
EMIT_IDENTIFIED=yes + IDENTIFIED_DIR set to a path outside this repo.
`);
console.log(`\n  _manifest.json + SOURCE-vs-EXTRACT.md written to ${OUT_DIR}`);

console.log('\ndone. Load with:  DATA_DIR=%s tsx etl/run.ts   (dry run; INGEST_CONFIRM=yes commits)\n', OUT_DIR);
