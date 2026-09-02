#!/usr/bin/env bash
# Full walk-through of Bask + Compass. REPEATABLE: run it again any time.
#
#   scripts/qa/walkthrough.sh                 # against production
#   scripts/qa/walkthrough.sh http://localhost:3418   # against a local build
#
# Two steps, deliberately separate:
#   1. assemble  — concatenate tests/agent/walkthrough/*.md into one checklist.
#      The sections are written per-surface so they can be regenerated or edited
#      independently; this file is derived and should never be hand-edited.
#   2. run       — hand that checklist to the QA agent, which drives a real
#      browser. No ad-hoc Playwright: the agent owns reporting and gotchas.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SECTIONS="$REPO/tests/agent/walkthrough"
OUT="$REPO/tests/agent/walkthrough-full.md"
BASE_URL="${1:-https://bask-psi.vercel.app}"

# The run itself is driven by a LOCAL model on the fleet, not a cloud one.
# Override with QA_MODEL / QA_HOST if the 4090 is busy.
#
# NOT qwen3.5:27b — that model is no longer pulled on FIRMAMENT even though the
# registry still lists it. Confirmed present 2026-08-23: gemma4:12b, gemma4:26b,
# qwen3-coder:30b, Qwen3.8-27B-OBLITERATED. Check /api/tags before changing.
QA_HOST="${QA_HOST:-http://100.75.112.14:11434}"
QA_MODEL="${QA_MODEL:-qwen3-coder:30b}"

if ! compgen -G "$SECTIONS/*.md" > /dev/null; then
  echo "No checklist sections in $SECTIONS — nothing to assemble." >&2
  exit 1
fi

{
  echo "# Bask + Compass — full walk-through"
  echo
  echo "**Target:** \`$BASE_URL\`"
  echo
  echo "GENERATED FILE — assembled by \`scripts/qa/walkthrough.sh\` from"
  echo "\`tests/agent/walkthrough/*.md\`. Edit those sections, not this."
  echo
  echo "## How to read a result"
  echo
  echo "- A surface that is not built reports **SKIP**, never PASS. A green run"
  echo "  that quietly skipped half the app is worse than a red one."
  echo "- Any number shown on screen is checked against the database, not"
  echo "  believed from the page. The page describing itself is not evidence."
  echo "- **Every \`/compass\` route needs \`?role=uvalux_rep\`.** Without it the"
  echo "  router returns FORBIDDEN, which looks like a broken page but is not."
  echo "- There is no login. Auth lands in M3; roles come from the URL."
  echo
  for f in "$SECTIONS"/*.md; do
    echo
    cat "$f"
    echo
  done
  # The Knowledge surface has its own detailed checklist that predates these
  # sections. Append it rather than duplicating it into a section.
  if [ -f "$REPO/tests/agent/compass-knowledge.md" ]; then
    echo
    cat "$REPO/tests/agent/compass-knowledge.md"
    echo
  fi
} > "$OUT"

echo "assembled $(grep -c '^- \[ \]' "$OUT" || true) checks from $(ls -1 "$SECTIONS"/*.md | wc -l) sections -> $OUT"

# ---- route guard -----------------------------------------------------------
# A checklist that names a route which does not exist does not test the app, it
# tests a 404 — and reports FAIL for the wrong reason. The first generated pass
# invented /bask/today and, from the phrase "slash inventory" in the task
# description, the literal path /slash/inventory. Both looked plausible in
# review. This catches that class of error before a run burns an hour.
REAL=$(mktemp)
find "$REPO/apps/web/src/app" -name page.tsx \
  | sed "s|$REPO/apps/web/src/app||; s|/page.tsx||" \
  | sed 's|([a-z]*)||g; s|//|/|g; s|^$|/|' | sort -u > "$REAL"

BAD=0
while read -r route; do
  [ -z "$route" ] && continue
  probe=$(echo "$route" | sed 's|<[a-z]*>|[slug]|g')
  grep -qx "$probe" "$REAL" || { echo "  UNKNOWN ROUTE in checklist: $route" >&2; BAD=1; }
done < <(grep -ohE '`/[a-z0-9/_<>[]-]*' "$OUT" | tr -d '`' | sed 's/?.*//' | sort -u)
rm -f "$REAL"

if [ "$BAD" = "1" ]; then
  echo "Checklist names routes that do not exist. Fix the sections, then re-run." >&2
  exit 2
fi
echo "route guard: every route in the checklist exists"

echo "driving with $QA_MODEL on $QA_HOST"
exec python3 ~/projects/qa-agent/qa_agent.py "$BASE_URL" \
  --checklist "$OUT" \
  --provider ollama --ollama-url "$QA_HOST" --model "$QA_MODEL"
