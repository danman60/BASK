/**
 * Grade the built intelligence against the practice dataset's answer key.
 *
 * SUPERVISOR-OWNED. For each loaded salon it queries the real rows, feeds the
 * PRODUCTION facts builder (`buildFacts`) and the PRODUCTION detector engine
 * (`runInsightSweep`) — not a reimplementation — then matches what fired against
 * `evaluation/expected_signals.csv` via the pure `grade()` mapper.
 *
 *   EVAL_DIR=<evaluation dir> tsx grade-run.ts
 *
 * Read-only. Runs against whatever is in bask right now (load first).
 */
import * as path from 'node:path';

import { db, buildFacts, type FactsInput } from '@bask/db';
import { runInsightSweep } from '@bask/core';

import { readCsv, remapId, type ExpectedSignal, type DetectedSignal } from './contract';
import { grade } from './grade';

const EVAL_DIR = process.env.EVAL_DIR ?? '';
if (!EVAL_DIR) {
  console.error('EVAL_DIR required (the evaluation/ directory).');
  process.exit(1);
}
const TODAY = '2026-06-30';
const SRC_SALONS = ['SAL001', 'SAL002', 'SAL003', 'SAL004', 'SAL005', 'SAL006'];

function readExpected(): ExpectedSignal[] {
  return readCsv(path.join(EVAL_DIR, 'expected_signals.csv')).map((r) => ({
    signalId: r.signal_id ?? '',
    salonSrcId: r.salon_id ?? '',
    signal: r.signal ?? '',
    expectedDetection: r.expected_detection ?? '',
    likelyAction: r.likely_action ?? '',
    difficulty: r.difficulty ?? '',
  }));
}

async function factsForSalon(srcId: string): Promise<FactsInput> {
  const salonId = remapId('salon', srcId);
  const [visits, sales, saleLines, staff, customers, memberships, products, inventory] =
    await Promise.all([
      db.visit.findMany({ where: { salonId }, select: { id: true, customerId: true, staffId: true, checkedInAt: true } }),
      db.sale.findMany({ where: { salonId }, select: { id: true, visitId: true, total: true, soldAt: true } }),
      db.saleLine.findMany({ where: { salonId }, select: { id: true, saleId: true, customerId: true, productId: true, serviceId: true, staffId: true, quantity: true, lineTotal: true, soldAt: true } }),
      db.staff.findMany({ where: { salonId }, select: { id: true, firstName: true, lastName: true } }),
      db.customer.findMany({ where: { salonId }, select: { id: true, firstName: true, lastName: true, lastVisitAt: true } }),
      db.membership.findMany({ where: { salonId }, select: { id: true, customerId: true, tier: true, status: true, paymentState: true, monthlyPrice: true, failedPaymentCount: true, lastPaymentAt: true } }),
      db.product.findMany({ select: { id: true, sku: true, name: true, category: true, retailPrice: true, wholesaleCost: true } }),
      db.inventoryLevel.findMany({ where: { salonId }, select: { productId: true, onHand: true, reorderPoint: true } }),
    ]);
  return {
    salonId,
    salonName: srcId,
    today: TODAY,
    currency: 'CAD',
    timezone: 'America/Toronto',
    openHours: [[9,21],[9,21],[9,21],[9,21],[9,21],[9,21],[9,21]],
    slotsPerRoomHour: 2,
    visits,
    sessions: [],
    sales,
    saleLines,
    staff,
    customers,
    memberships,
    products,
    inventory: inventory.map((i) => ({ ...i, parLevel: null })),
    services: [],
    rooms: [],
  } as unknown as FactsInput;
}

async function main() {
  const expected = readExpected();
  const detected: DetectedSignal[] = [];

  console.log('\n=== running the built detectors on loaded practice data ===');
  for (const srcId of SRC_SALONS) {
    const input = await factsForSalon(srcId);
    const facts = buildFacts(input);
    const sweep = runInsightSweep(facts, { maxInsights: 50 });
    const types = sweep.allDrafts.map((d) => d.type);
    console.log(`  ${srcId}: ${sweep.allDrafts.length} insights [${[...new Set(types)].join(', ') || '—'}]`);
    for (const d of sweep.allDrafts) {
      detected.push({ salonSrcId: srcId, kind: d.type, detail: `${d.title} ($${Math.round(d.impactEstimate)})` });
    }
  }

  const rows = grade(expected, detected);
  const hits = rows.filter((r) => r.found).length;

  console.log('\n=== SCORECARD vs evaluation/expected_signals.csv ===');
  for (const r of rows) {
    console.log(`  [${r.found ? 'HIT ' : 'miss'}] ${r.signalId} ${r.salonSrcId}  ${r.signal}`);
    console.log(`         ${r.note}`);
  }
  console.log(`\n  ${hits}/${rows.length} planted signals detected by the built engine.`);

  await db.$disconnect();
}

main();
