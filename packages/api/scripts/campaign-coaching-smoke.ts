/**
 * Proves the campaign path end to end WITHOUT WRITING ANYTHING.
 *
 * `marketing.generate` persists a draft campaign row, and whether to do that
 * against the production demo database is the owner's call, not this script's.
 * So this calls `generateCampaignContent` directly with a hand-built input: same
 * retrieval, same prompt, same guardrails, same provenance — no persistence.
 */
import { db } from '@bask/db';

import { generateCampaignContent } from '../src/ai/campaign';
import { coachingFor } from '../src/ai/coaching';

async function main(): Promise<void> {
  const goal = 'Bring lapsed customers back in on quiet weekday afternoons';
  const coaching = await coachingFor(db, `${goal}. 20% off any single session. Lapsed 30 days.`, {
    limit: 3,
    prefer: ['marketing'],
  });

  const { content, calledApi } = await generateCampaignContent({
    salonName: 'Sunset Ridge Tanning & Wellness',
    handle: '@sunsetridge',
    goal,
    tone: 'warm',
    offer: {
      headline: '20% off any single session',
      discountPercent: 20,
      discountAmount: null,
      validity: 'this Tuesday and Wednesday',
    },
    audience: { label: 'Lapsed 30 days', description: 'Not in for a month', count: 84 },
    channels: ['sms', 'email'],
    fixing: null,
    sendLabel: 'Sunday 6:00 pm',
    // NO_COACHING=1 runs the identical generation with retrieval switched off.
    // That is how it was established that the AI path's occasional fallback was
    // pre-existing and not caused by the coaching block in the prompt.
    coaching: process.env.NO_COACHING ? [] : coaching,
  });

  console.log('\ncalledApi:', calledApi, '· path:', content.provenance.source, '· model:', content.provenance.model);
  console.log('coaching attached to content:', content.coaching.length);
  for (const c of content.coaching) console.log('  ·', c.claim, `[${c.label}]`);
  console.log('\nSMS:', content.sms.body);
  console.log('\nEMAIL:', content.email.subject, '\n' + content.email.body);
}

main()
  .catch(console.error)
  .finally(() => void db.$disconnect());
