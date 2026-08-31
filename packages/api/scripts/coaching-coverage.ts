/**
 * Where the coaching corpus can and cannot answer what the product detects.
 *
 * The product finds a pattern in a salon's numbers; the corpus is supposed to say
 * what to DO about it. This measures the seam between them: for every pattern we
 * actually detect, it retrieves against the live claims and reports how strong the
 * best match is, whether any matching claim is CONCRETE (a specific tactic rather
 * than a general principle), and whether any is a SCRIPT (words a staff member can
 * say out loud).
 *
 * A weak row here is not a bug. It is an interview question — the exact thing to
 * put in front of a trainer on camera, because it is a pattern we can see in real
 * salon data and cannot yet coach.
 *
 *   OPENAI_API_KEY=… npx tsx scripts/coaching-coverage.ts
 */
import { db } from '@bask/db';

import { coachingFor } from '../src/ai/coaching';

interface Pattern {
  key: string;
  /** Where in the product this pattern is detected. */
  source: string;
  /** Phrased the way the product states it to an owner. */
  query: string;
  prefer: string[];
}

const PATTERNS: Pattern[] = [
  { key: 'retail attachment slipping', source: 'insight retail_attachment_slip',
    query: 'Lotion sales per visit fell from 9% to 6% over two weeks. Traffic is unchanged. Most of the drop is on evening shifts.',
    prefer: ['retail'] },
  { key: 'nearly out of product', source: 'sweep bottle.ts',
    query: 'A customer bought a bottle of lotion nine weeks ago and at their usual pace is nearly out of it now.',
    prefer: ['retail'] },
  { key: 'category gap vs cohort', source: 'sweep category-gap.ts',
    query: 'This salon sells far fewer units per 100 customers in one product category than comparable salons do.',
    prefer: ['retail'] },
  { key: 'first visit never returned', source: 'sweep first-visit.ts',
    query: 'Customers who came once and never came back. A first visit is the most expensive customer a salon buys and a second visit is what makes it pay back.',
    prefer: ['customer', 'marketing'] },
  { key: 'seasonal pause vs real lapse', source: 'sweep seasonal-pause.ts',
    query: 'A member has gone quiet during the summer trough. Is this a seasonal pause or are they actually leaving?',
    prefer: ['membership', 'customer'] },
  { key: 'member tenure vs cohort', source: 'sweep tenure.ts',
    query: 'Average membership tenure is shorter than comparable salons. Members are cancelling sooner than they should.',
    prefer: ['membership'] },
  { key: 'upgrade headroom', source: 'sweep upgrade-headroom.ts',
    query: 'These members already use more sessions than their tier includes, so the next tier up is a fair conversation.',
    prefer: ['membership'] },
  { key: 'quiet weekday capacity', source: 'insight soft_capacity',
    query: 'Tuesday and Wednesday afternoons run under half full while evenings are packed.',
    prefer: ['marketing'] },
  { key: 'failed payments', source: 'insight failed_payments',
    query: 'Several membership payments failed this month and the cards have not been updated.',
    prefer: ['membership', 'operations'] },
  { key: 'overstock', source: 'insight overstock',
    query: 'Product sitting on the shelf for months with cash tied up in it and no sales.',
    prefer: ['retail'] },
  { key: 'lapsed 30 days', source: 'segment lapsed_30d',
    query: 'Customers who have not been in for thirty days and are drifting away.',
    prefer: ['marketing', 'customer'] },
  { key: 'new customer to regular', source: 'segment new_this_month',
    query: 'Someone joined this month. Turning a first visit into a habit.',
    prefer: ['customer', 'membership'] },
];

async function main(): Promise<void> {
  const rows: Array<{ p: Pattern; top: number; concrete: number; script: number; best: string }> = [];

  for (const pattern of PATTERNS) {
    // Ask for more than the product shows: coverage is a question about the
    // corpus, not about what fits on a card.
    const citations = await coachingFor(db, pattern.query, { limit: 8, prefer: pattern.prefer });

    const ids = citations.map((c) => c.claimId);
    const detail = ids.length
      ? await db.$queryRaw<Array<{ specificity: string; is_script: boolean }>>`
          SELECT specificity, is_script FROM bask.knowledge_claim WHERE id = ANY(${ids}::uuid[])`
      : [];

    rows.push({
      p: pattern,
      top: citations[0]?.similarity ?? 0,
      concrete: detail.filter((d) => d.specificity === 'concrete').length,
      script: detail.filter((d) => d.is_script).length,
      best: citations[0]?.claim ?? '(nothing cleared the threshold)',
    });
  }

  rows.sort((a, b) => a.top - b.top);

  console.log('\nCOACHING COVERAGE — what we detect vs what the corpus can say about it');
  console.log('weakest first. top = best similarity, concrete = specific tactics, script = sayable words\n');
  for (const r of rows) {
    console.log(
      `${r.top.toFixed(3)}  concrete ${String(r.concrete).padStart(2)}/8  script ${r.script}  ${r.p.key}`,
    );
    console.log(`        ${r.p.source}`);
    console.log(`        best: ${r.best.slice(0, 110)}`);
  }
}

main()
  .catch(console.error)
  .finally(() => void db.$disconnect());
