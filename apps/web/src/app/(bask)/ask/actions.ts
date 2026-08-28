'use server';

import { askAboutSalon, type AskResult } from '@bask/core';
import { db } from '@bask/db';

import { getDemoSalon } from '@/server/salon';

/**
 * The facts bundle the question box answers from.
 *
 * Assembled here, deliberately, and deliberately small. The model gets these
 * numbers and nothing else — no schema, no table names, no ability to ask for
 * more. That bound is the feature: a question outside this bundle gets "I don't
 * have that", which is a far better thing to say in front of a stakeholder than
 * a confident sentence nobody in the room can check.
 *
 * Everything in it is already on a screen somewhere else in the product, and is
 * computed by the same queries those screens use. So the assistant can restate
 * the product but never contradict it — the failure mode where a chat box and a
 * dashboard disagree in front of a customer cannot happen here.
 *
 * Every figure is pre-formatted into plain words. The model is a writer, not a
 * calculator: give it `0.0587` and it will eventually call that "nearly 6
 * percent" or "0.06%" depending on the day.
 */
async function buildAskFacts(salonId: string, salonName: string) {
  const [visitCount, customerCount, memberships, insights, recentSales] = await Promise.all([
    db.visit.count({ where: { salonId } }),
    db.customer.count({ where: { salonId, status: 'active' } }),
    db.membership.groupBy({
      by: ['paymentState'],
      where: { salonId },
      _count: { _all: true },
      _sum: { monthlyPrice: true },
    }),
    db.insight.findMany({
      /* Anything not dismissed. There is no 'open' state — the enum is
         new/seen/actioned/dismissed — and a dismissed insight is exactly the one
         the owner already told us to stop raising. */
      where: { salonId, state: { not: 'dismissed' } },
      select: { title: true, summary: true, impactEstimate: true },
      orderBy: { impactEstimate: 'desc' },
      take: 6,
    }),
    db.saleLine.findMany({
      where: { salonId, productId: { not: null } },
      select: { lineTotal: true, product: { select: { name: true, brand: true } } },
      orderBy: { soldAt: 'desc' },
      take: 500,
    }),
  ]);

  const current = memberships.find((m) => m.paymentState === 'current');
  const failed = memberships.find((m) => m.paymentState === 'failed');

  const byProduct = new Map<string, number>();
  for (const line of recentSales) {
    const key = line.product ? [line.product.brand, line.product.name].filter(Boolean).join(' ') : 'Unknown';
    byProduct.set(key, (byProduct.get(key) ?? 0) + 1);
  }
  const topProducts = [...byProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => `${name} (${count} sold recently)`);

  return {
    salonName,
    totalVisitsOnRecord: visitCount.toLocaleString('en-CA'),
    activeCustomers: customerCount.toLocaleString('en-CA'),
    activeMemberships: current?._count._all ?? 0,
    monthlyMembershipMoney: `$${Math.round(Number(current?._sum.monthlyPrice ?? 0)).toLocaleString('en-CA')}`,
    membershipsWithFailedPayment: failed?._count._all ?? 0,
    moneyStuckInFailedPayments: `$${Math.round(Number(failed?._sum.monthlyPrice ?? 0)).toLocaleString('en-CA')} a month`,
    thingsNeedingAttention: insights.map((i) => ({
      what: i.title,
      detail: i.summary,
      worthPerMonth: i.impactEstimate ? `$${Math.round(Number(i.impactEstimate)).toLocaleString('en-CA')}` : null,
    })),
    bestSellingProductsRecently: topProducts,
  };
}

export async function askQuestion(question: string): Promise<AskResult> {
  const salon = await getDemoSalon();
  const facts = await buildAskFacts(salon.salonId, salon.salonName);
  return askAboutSalon({ question, facts });
}
