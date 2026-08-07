/**
 * Standalone contrast report — `pnpm --filter @bask/tokens contrast`.
 * Same audit the vitest gate runs, printed as a table for humans tuning a theme.
 * Exits non-zero on any failure so it is also usable as a bare CI step.
 */
import { auditThemes, formatResults } from '../src/contrast';

const results = auditThemes();
console.log(formatResults(results));

const failures = results.filter((r) => !r.pass);
console.log(
  `\n${results.length - failures.length}/${results.length} pairs pass WCAG AA across all themes.`
);
if (failures.length > 0) {
  console.error(`\n${failures.length} FAILING pair(s):\n${formatResults(failures)}`);
  process.exit(1);
}
