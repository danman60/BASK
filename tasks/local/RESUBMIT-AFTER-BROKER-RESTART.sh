#!/usr/bin/env bash
# Re-dispatch the bask materiality batch once the broker daemon accepts the `force` payload key.
#
# Blocked as of 2026-08-28 12:52 — every code submit from the updated CLI returns
#   400 {"error": "new_task() got an unexpected keyword argument 'force'"}
# because submit.py always sends "force" and the running daemon predates it.
# sysadmin-13 owns the restart. Nothing here needs editing after it lands; just run this.
#
# Defaults only. NO --gpu and NO --model on any row: a stray pin makes a whole card
# blind to the row (measured twice — classact wave6, uvalux 2026-08-24).

set -euo pipefail

SCRATCH="/tmp/claude-1000/-home-danman60-projects-uvalux-platform/a71822c3-e3f8-40aa-8fbb-e75ab201832f/scratchpad"
REPO="/home/danman60/projects/uvalux-platform"
CORE="$REPO/packages/core"
WINDOW="uvalux-platform-8"
BATCH="bask-materiality-v2"

cd ~/projects/sysadmin

# --- Row 1: threshold config module (new file, no --force needed) -------------
# v1 failed its gate: it imported MaterialityRule from the contract AND redeclared
# it in the same file (duplicate identifier). Cause was passing the contract as its
# own exemplar. Fixed here: different exemplar, explicit no-redeclare instruction,
# and the two export names pinned because row 3 imports them by name.
python3 -m broker.submit \
  --kind code \
  --name "bask-insight-thresholds-v2" \
  --intent "$(cat "$SCRATCH/thresholds-intent.txt")" \
  --artifact "$CORE/src/insights/thresholds.ts" \
  --repo "$REPO" \
  --contract "$CORE/src/insights/scaling.ts" \
  --contract-module "./scaling" \
  --exemplar "$CORE/src/insights/sweeps/evidence.ts" \
  --gate "pnpm --filter @bask/core typecheck" \
  --batch "$BATCH" \
  --notify tmux --window "$WINDOW"

# --- Row 2: unit tests for the materiality helpers (new file) -----------------
# v1 failed its gate 7/136: it asserted the same call both true and false, and used
# a wrong tolerance (0.454 where the real value is 0.4508). Fixed here: every case
# states its expected result and contradictory pairs are explicitly forbidden.
python3 -m broker.submit \
  --kind code \
  --name "bask-scaling-unit-tests-v2" \
  --intent "$(cat "$SCRATCH/scaling-test-intent.txt")" \
  --artifact "$CORE/test/scaling.test.ts" \
  --repo "$REPO" \
  --contract "$CORE/src/insights/scaling.ts" \
  --contract-module "../src/insights/scaling" \
  --exemplar "$CORE/test/consent.test.ts" \
  --gate "pnpm --filter @bask/core test" \
  --batch "$BATCH" \
  --notify tmux --window "$WINDOW"

# --- Row 3: one-line month-offset bug (EDIT, needs --force) -------------------
python3 -m broker.submit \
  --kind code --force \
  --name "bask-fix-seasonal-pause-month" \
  --intent "$(sed -n '/^## The defect/,/^## Acceptance/p' "$REPO/tasks/local/fix-seasonal-pause-month.md" | sed 's/^#* *//')" \
  --artifact "$CORE/src/insights/sweeps/seasonal-pause.ts" \
  --repo "$REPO" \
  --gate "pnpm --filter @bask/core typecheck" \
  --batch "$BATCH" \
  --notify tmux --window "$WINDOW"

# --- Row 4: wire the detectors onto the helpers (EDIT, needs --force) ---------
# Highest-risk row: 711-line file, five other detectors with NO test coverage.
# Post-run check is mandatory and is NOT satisfied by the gate:
#   git diff --stat packages/core/src/insights/detectors.ts
#   sed -n '/ALL_DETECTORS/,/];/p' packages/core/src/insights/detectors.ts
# must still list exactly: attachmentSlip, failedPayments, softCapacity,
# lowStock, overstock, anomalyBand — six, same order.
python3 -m broker.submit \
  --kind code --force \
  --name "bask-wire-materiality-into-detectors" \
  --intent "$(sed -n '/^## Background/,/^## Acceptance/p' "$REPO/tasks/local/wire-materiality-into-detectors.md" | sed 's/^#* *//')" \
  --artifact "$CORE/src/insights/detectors.ts" \
  --repo "$REPO" \
  --contract "$CORE/src/insights/scaling.ts" \
  --contract-module "./scaling" \
  --gate "pnpm --filter @bask/core test" \
  --batch "$BATCH" \
  --notify tmux --window "$WINDOW"

echo
echo "All four rows submitted to batch $BATCH."
echo "Rows 1-2 create new files. Rows 3-4 edit existing files and required --force."
echo "Verify row 4 by diff, not by the gate alone."
