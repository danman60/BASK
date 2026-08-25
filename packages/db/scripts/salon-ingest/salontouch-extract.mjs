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
 * Env: SA_PASSWORD (required), CONTAINER (default salondb),
 *      FROM_DATE / TO_DATE (default the replay window 2016-01-01 → 2020-03-15).
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const OUT_DIR = process.env.OUT_DIR;
if (!OUT_DIR) { console.error('OUT_DIR required — no default (never write this into the repo).'); process.exit(1); }
const SA = process.env.SA_PASSWORD;
if (!SA) { console.error('SA_PASSWORD required.'); process.exit(1); }
const CONTAINER = process.env.CONTAINER || 'salondb';
const FROM = process.env.FROM_DATE || '2016-01-01';
const TO = process.env.TO_DATE || '2020-03-15';

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

/** Run a query whose columns map 1:1 onto `headers`, write it as CSV. */
function emit(name, headers, query, transform) {
  const rows = sql(query).map((line) => line.split('').map((c) => c.trim()));
  const body = rows.map((cells) => (transform ? transform(cells) : cells).map(q).join(','));
  const file = path.join(OUT_DIR, `${name}.csv`);
  fs.writeFileSync(file, `${headers.join(',')}\n${body.join('\n')}\n`);
  console.log(`  ${name}.csv  ${rows.length}`);
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
   FROM History_TanHistory WHERE Deleted=0 GROUP BY UPPER(SalonUID)`);

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
   FROM s`);

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
   FROM allc a`);

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
   FROM Product_General`);

/* --- visits. One row per real tanning session; Position is the natural key. --- */
emit('visits', ['visit_id', 'salon_id', 'customer_id', 'staff_id', 'check_in_at', 'session_minutes', 'walk_in'],
  `SELECT CAST(Position AS varchar(36)), UPPER(SalonUID), UPPER(ClientUID), ISNULL(UPPER(EmployeeUID) + '@' + UPPER(SalonUID),''),
          CONVERT(varchar,DateOfTan,120), ISNULL(LenOfTan,0), 'true'
   FROM History_TanHistory
   WHERE Deleted=0 AND CanceledTan=0 AND ClientUID IS NOT NULL AND ClientUID <> '0' AND ${tanWin}`);

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
   LEFT JOIN pay p ON p.SalonUID=h.SalonUID AND p.ReceiptNumber=h.ReceiptNumber AND p.d=h.d`);

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
     AND t.ClientUID IS NOT NULL AND t.ClientUID <> '0' AND t.${saleWin}`);

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
     AND cts.PurchaseDate >= '${FROM}' AND cts.PurchaseDate < '${TO}'`);

/* --- deliberately empty: no source data exists for either (see header). --- */
fs.writeFileSync(path.join(OUT_DIR, 'membership_payments.csv'),
  'payment_id,membership_id,due_date,status,recovered_date\n');
fs.writeFileSync(path.join(OUT_DIR, 'inventory_snapshots.csv'),
  'salon_id,product_id,snapshot_date,on_hand_units,reorder_threshold\n');
console.log('  membership_payments.csv  0 (no payment-failure data exists)');
console.log('  inventory_snapshots.csv  0 (on-hand unreconstructable)');

console.log('\ndone. Load with:  DATA_DIR=%s tsx etl/run.ts   (dry run; INGEST_CONFIRM=yes commits)\n', OUT_DIR);
