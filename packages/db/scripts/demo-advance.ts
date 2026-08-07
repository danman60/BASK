/**
 * `pnpm demo:advance --days N` — move the demo clock and rerun the pipeline.
 *
 * One day at a time, so a five-day jump settles each day's campaigns rather
 * than skipping four of them. Per day:
 *
 *   materialise day → campaign outcomes → metric rollups → insight sweep → Daybreak
 *
 * Flags:
 *   --days N     days to advance (default 1; 0 reruns the pipeline for today)
 *   --offline    skip the API entirely and use the deterministic brief
 *   --quiet      summary only
 */

import { runPipeline } from '@bask/core';

import { createPrismaClient } from '../src/client';
import { createPrismaPipelinePorts } from '../src/ports';
import { DEFAULT_SEED } from '../fixtures/constants';

const args = process.argv.slice(2);
const daysIndex = args.indexOf('--days');
const days = daysIndex >= 0 ? Number(args[daysIndex + 1]) : 1;
const offline = args.includes('--offline');
const quiet = args.includes('--quiet');

if (!Number.isInteger(days) || days < 0) {
  console.error('--days must be a non-negative integer');
  process.exit(1);
}

async function main(): Promise<void> {
  const prisma = createPrismaClient({ direct: true });

  try {
    const state = await prisma.demoState.findUnique({ where: { id: 'default' } });
    if (!state) {
      console.error('No demo_state row. Run `pnpm demo:reset` first.');
      process.exit(1);
    }

    const ports = createPrismaPipelinePorts(prisma, { seed: state.seed ?? DEFAULT_SEED });
    const report = await runPipeline(ports, {
      days,
      offline,
      onStage: quiet ? undefined : (stage, detail) => console.log(`  [${stage}] ${detail}`),
    });

    console.log('');
    console.log(`  clock  ${report.startedFrom} → ${report.virtualToday}`);
    for (const day of report.days) {
      for (const salon of day.salons) {
        const brief = salon.brief;
        console.log(
          `  ${day.date}  insights ${salon.insights.total}` +
            (brief
              ? `  brief ${brief.source}${brief.cacheHit ? ' (cache hit, no API call)' : ''}`
              : ''),
        );
        if (brief) console.log(`             "${brief.headline}"`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

await main();
