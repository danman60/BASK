#!/usr/bin/env bash
# Fails when a component is exported from @bask/ui but rendered nowhere.
#
# WHY THIS EXISTS: the local build lane produces LEAVES, so a fully green batch
# delivers exactly the invisible half of a feature. The broker gate is `tsc`,
# and `tsc` is perfectly happy with a component nobody imports — so "batch
# passed" and "nothing is visible" are the same outcome by construction.
# This was written down as a gotcha twice and still recurred, because a note
# asks a human to remember a grep that no pipeline runs. This runs it.
#
# Usage:  bash scripts/qa/orphan-check.sh          # report + exit 1 if orphans
#         ALLOW_ORPHANS=1 bash scripts/qa/...      # report only, exit 0
#
# An orphan is NOT always a bug — a component can be deliberately parked ahead
# of the surface that will use it. Add those to ALLOWLIST below, WITH A REASON,
# so the parked set stays a decision rather than an accident.

set -uo pipefail
cd "$(dirname "$0")/../.." || exit 2

# name:reason — parked on purpose, not lost.
ALLOWLIST="
PulseCard:removed from Today on purpose (operational, not opportunity)
CoachAnswer:no coaching surface yet — needs a real answer AND real citations from the expo corpus; the only action that could open it (coaching_request) carries a topic and nothing else, and writing the prose to fill it would be fabricating advice
"

BARREL="packages/ui/src/index.ts"
[ -f "$BARREL" ] || { echo "no barrel at $BARREL"; exit 2; }

orphans=0
total=0
report=""

for f in packages/ui/src/components/*.tsx; do
  base="$(basename "$f" .tsx)"
  # only components the barrel actually exports
  grep -q "from './components/$base'" "$BARREL" || continue
  total=$((total + 1))

  # Count JSX render sites in BOTH the app and sibling ui components.
  # Searching only apps/ produces false positives for anything composed
  # inside packages/ui (that mistake reported 24 orphans when there were 12).
  app_uses=$(grep -rl "<$base\b" --include=*.tsx apps/*/src 2>/dev/null | wc -l)
  ui_uses=$(grep -rl "<$base\b" --include=*.tsx packages/ui/src/components 2>/dev/null \
            | grep -v "/$base\.tsx$" | wc -l)

  if [ "$app_uses" -eq 0 ] && [ "$ui_uses" -eq 0 ]; then
    reason=$(printf '%s\n' "$ALLOWLIST" | grep "^$base:" | cut -d: -f2-)
    if [ -n "$reason" ]; then
      report="$report  parked   $base — $reason\n"
    else
      report="$report  ORPHAN   $base — exported, rendered nowhere\n"
      orphans=$((orphans + 1))
    fi
  fi
done

printf 'exported components: %s\n' "$total"
printf "%b" "$report"
printf 'unexplained orphans: %s\n' "$orphans"

if [ "$orphans" -gt 0 ] && [ "${ALLOW_ORPHANS:-0}" != "1" ]; then
  echo
  echo "Each one is a component that exists, compiles, and renders for nobody."
  echo "Either compose it into a surface, or add it to ALLOWLIST with a reason."
  exit 1
fi
exit 0
