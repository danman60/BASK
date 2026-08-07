/**
 * `tsx scripts/demo-arcs.ts` — print what the rollups and the sweep actually
 * see, straight off the generated bundle.
 *
 * This is the tuning instrument for the story arcs. When a number in the demo
 * doesn't match PRODUCT_SPEC §20, this tells you whether the generator drifted
 * or the detector thresholds did — without touching the database.
 */

import { runInsightSweep } from '@bask/core';

import { heroFacts } from '../tests/helpers';

const facts = heroFacts();
const sweep = runInsightSweep(facts, { maxInsights: 20 });

const pct = (n: number) => `${n.toFixed(1)}%`;

console.log('\n=== ATTACHMENT ===');
console.log(`  baseline (28d)  ${pct(facts.attachment.baselineRate)}  over ${facts.attachment.baselineVisits} visits`);
console.log(`  current  (14d)  ${pct(facts.attachment.currentRate)}  over ${facts.attachment.currentVisits} visits`);
console.log(`  avg attached spend  $${facts.attachment.averageAttachedSpend.toFixed(2)}`);
console.log('  by staff (current vs baseline, current visits):');
for (const s of [...facts.attachment.byStaff].sort((a, b) => a.currentRate - b.currentRate)) {
  console.log(`    ${s.name.padEnd(12)} ${pct(s.currentRate).padStart(6)} vs ${pct(s.baselineRate).padStart(6)}  n=${s.currentVisits}`);
}
console.log('  softest slots:');
for (const s of [...facts.attachment.bySlot].sort((a, b) => a.currentRate - b.currentRate).slice(0, 4)) {
  console.log(`    wd${s.weekday} ${s.daypart.padEnd(10)} ${pct(s.currentRate).padStart(6)} vs ${pct(s.baselineRate).padStart(6)}  n=${s.visits}`);
}

console.log('\n=== CAPACITY (lowest 10 slots) ===');
for (const s of [...facts.capacity.slots].sort((a, b) => a.utilisation - b.utilisation).slice(0, 10)) {
  console.log(`  wd${s.weekday} ${String(s.hour).padStart(2)}:00  ${pct(s.utilisation).padStart(6)}  run=${s.sessionsRun}/${s.sessionsPossible}`);
}
const tuesdayAfternoon = facts.capacity.slots.filter((s) => s.weekday === 2 && s.hour >= 13 && s.hour < 17);
console.log(
  `  Tuesday 1-5pm mean utilisation: ${pct(tuesdayAfternoon.reduce((a, s) => a + s.utilisation, 0) / Math.max(tuesdayAfternoon.length, 1))}`,
);

console.log('\n=== FAILED PAYMENTS ===');
for (const m of facts.failedPayments.memberships) {
  console.log(
    `  ${m.customerName.padEnd(28)} ${m.tier.padEnd(7)} $${m.monthlyPrice}  attempts=${m.failedAttempts}  lastVisit=${m.daysSinceLastVisit}d`,
  );
}

console.log('\n=== STOCK (tightest 6 + overstock) ===');
for (const p of [...facts.stock]
  .filter((p) => p.daysRemaining !== null)
  .sort((a, b) => a.daysRemaining! - b.daysRemaining!)
  .slice(0, 6)) {
  console.log(`  ${p.sku} ${p.name.padEnd(28)} onHand=${String(p.onHand).padStart(3)}  v=${p.dailyVelocity.toFixed(2)}/d  ${p.daysRemaining!.toFixed(1)}d`);
}
for (const p of facts.stock.filter((p) => p.unitsSoldInWindow === 0 && p.onHand >= 6)) {
  console.log(`  ${p.sku} ${p.name.padEnd(28)} onHand=${String(p.onHand).padStart(3)}  NO SALES IN WINDOW`);
}

console.log('\n=== CATEGORY TRENDS ===');
for (const t of facts.categoryTrends) {
  const change = t.baselineCount === 0 ? 0 : ((t.currentCount - t.baselineCount) / t.baselineCount) * 100;
  console.log(`  ${t.label.padEnd(20)} ${t.currentCount} vs ${t.baselineCount}  ${change > 0 ? '+' : ''}${change.toFixed(1)}%`);
}

console.log('\n=== PULSE ===');
console.log(`  revenue today ${facts.pulse.revenueToday.toFixed(2)}  typical ${facts.pulse.revenueTypicalForWeekday.toFixed(2)}`);
console.log(`  bookings today ${facts.pulse.bookingsToday}  active members ${facts.pulse.activeMembers}  MRR $${facts.pulse.membershipRevenueMonthly}`);

console.log(`\n=== SWEEP (${sweep.allDrafts.length} insights) ===`);
for (const d of sweep.allDrafts) {
  console.log(`  [${d.severity.padEnd(8)}] ${d.type.padEnd(24)} $${d.impactEstimate} ${d.evidence.impact.cadence}`);
  console.log(`             ${d.title}`);
  console.log(`             ${d.evidence.sentence}`);
}
