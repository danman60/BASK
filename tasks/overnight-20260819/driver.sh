#!/usr/bin/env bash
# Overnight build driver — uvalux-platform, 2026-08-19.
#
# Dispatches one task file at a time per lane to a local model, gates the
# artifact, and commits only what passed. Detached: survives the supervisor
# session dying. Written against the 12 defects listed in the
# local-parallel-build skill; each correction is marked [Dn] below.
#
#   ./driver.sh <lane>          run a lane's queue
#   ./driver.sh <lane> --smoke  run exactly ONE task, then stop
#
# It never dispatches without SMOKE_OK, so a fresh checkout cannot stampede.

set -uo pipefail

LANE="${1:?usage: driver.sh <lane> [--smoke]}"
SMOKE=0
[[ "${2:-}" == "--smoke" ]] && SMOKE=1

REPO="/home/danman60/projects/uvalux-platform"
BASE="$REPO/tasks/overnight-20260819"
QUEUE="$BASE/queue"
DONE="$BASE/done"
FAILED="$BASE/failed"
LOGDIR="$BASE/runlogs"          # [D3] NOT logs/ — that path is permission-denied for the supervisor
MANIFEST="$BASE/manifest.tsv"
RUNNER="/home/danman60/projects/qa-agent/ollama-runner.py"

# ---- [D8] host and model are config, not code -------------------------------
# Point a lane at a different card by editing here or exporting these.
case "$LANE" in
  pages) HOST="${PAGES_HOST:-http://localhost:11434}"; MODEL="${PAGES_MODEL:-gemma4:12b}" ;;
  core)  HOST="${CORE_HOST:-http://localhost:11434}";  MODEL="${CORE_MODEL:-gemma4:12b}" ;;
  *) echo "unknown lane: $LANE" >&2; exit 2 ;;
esac

MAX_ATTEMPTS=2                  # [§9] after two local failures the supervisor builds it
WALL_CLOCK=2700                 # 45 min backstop only
IDLE_KILL=180                   # [§3] the breaker that matters: artifact mtime stops moving
POLL=3                          # [D1] never sleep 30

mkdir -p "$QUEUE" "$DONE" "$FAILED" "$LOGDIR"

# [D3] preflight: prove the supervisor can actually READ the log dir before we
# rely on it. A driver running perfectly into an unreadable directory is worse
# than a crash, because silence reads as progress.
if ! test -r "$LOGDIR"; then echo "FATAL: $LOGDIR not readable" >&2; exit 3; fi
echo "preflight $(date -Is)" > "$LOGDIR/.preflight" || { echo "FATAL: cannot write $LOGDIR" >&2; exit 3; }
cat "$LOGDIR/.preflight" >/dev/null || { echo "FATAL: cannot read back from $LOGDIR" >&2; exit 3; }

say() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$LOGDIR/driver-$LANE.log"; }

# [D12] paths that are always dirty and were never touched by a builder.
STRAY_IGNORE='node_modules|\.next|generated/|runlogs/|tasks/overnight-20260819/'

manifest_field() { awk -F'\t' -v t="$1" -v c="$2" '$1==t{print $c}' "$MANIFEST"; }

# ---- verify the model id actually exists [§1] --------------------------------
# A dead model id does not fail loudly; it fails as a plausible-looking report.
if ! curl -s --max-time 10 "$HOST/api/tags" | grep -q "\"$MODEL\""; then
  say "FATAL: model '$MODEL' not present at $HOST — refusing to dispatch."
  say "       (a non-existent model produces plausible-looking fake results)"
  exit 4
fi
say "lane=$LANE host=$HOST model=$MODEL smoke=$SMOKE"

# ---- gates -------------------------------------------------------------------
# [D11] every gate proves the file DOES something, never just that it compiles.

gate_html() {
  local f="$REPO/$1" task="$2" errs=0
  [[ -s "$f" ]] || { echo "gate: missing or empty"; return 1; }
  head -c 20 "$f" | grep -qi '<!doctype html' || { echo "gate: no doctype"; errs=1; }
  grep -q 'tokens.css' "$f" || { echo "gate: does not link tokens.css"; errs=1; }
  grep -qi '<script' "$f" && { echo "gate: contains a <script tag"; errs=1; }
  # shape assertion: it must actually render structure, not be a stub
  grep -q '<main' "$f" || { echo "gate: no <main>"; errs=1; }
  grep -q 'class="card' "$f" || { echo "gate: no card element — nothing was built"; errs=1; }
  # required headings, per task
  case "$task" in
    01-scoreboard)
      grep -q 'category by category' "$f" || { echo "gate: missing category section"; errs=1; }
      grep -q 'What to do about it' "$f" || { echo "gate: missing actions section"; errs=1; } ;;
    02-customer-health)
      grep -q 'Worth a call today' "$f" || { echo "gate: missing worklist section"; errs=1; }
      [[ $(grep -o '<span' "$f" | wc -l) -ge 120 ]] || { echo "gate: fewer than 120 grid squares"; errs=1; } ;;
    03-coach)
      grep -q 'Where this came from' "$f" || { echo "gate: missing sources section"; errs=1; }
      grep -q 'placed by the clock' "$f" || { echo "gate: MISSING the attribution caution line"; errs=1; } ;;
  esac
  # well-formedness, cheap
  python3 - "$f" <<'PY' || errs=1
import sys, html.parser
class P(html.parser.HTMLParser):
    def error(self, m): raise AssertionError(m)
try:
    P().feed(open(sys.argv[1], encoding='utf-8').read())
except Exception as e:
    print(f"gate: html did not parse: {e}"); sys.exit(1)
PY
  return $errs
}

gate_ts() {
  local rel="$1" abs="$REPO/$1" errs=0
  [[ -s "$abs" ]] || { echo "gate: missing or empty"; return 1; }
  for sym in CHUNK_TARGET CHUNK_OVERLAP DEFAULT_MAX_CHUNKS ChunkResult chunkText estimateTokens; do
    grep -q "export .*$sym" "$abs" || { echo "gate: does not export $sym"; errs=1; }
  done
  grep -q 'return' "$abs" || { echo "gate: no return statement — stub"; errs=1; }
  grep -qE '\bany\b' "$abs" && { echo "gate: uses any"; errs=1; }
  # [D6] typecheck whole project (path aliases) but ATTRIBUTE: only fail on
  # errors naming this task's own file. Anything else is not this task's fault.
  local out; out=$(cd "$REPO/packages/core" && npx tsc --noEmit 2>&1)
  if echo "$out" | grep -q "$(basename "$rel")"; then
    echo "gate: tsc errors in this file:"; echo "$out" | grep "$(basename "$rel")" | head -5; errs=1
  elif [[ -n "$out" ]]; then
    echo "note: tsc errors elsewhere, NOT this task's fault:"; echo "$out" | head -3
  fi
  return $errs
}

run_gate() {
  local kind="$1" target="$2" task="$3"
  case "$kind" in
    html) gate_html "$target" "$task" ;;
    ts)   gate_ts   "$target" ;;
    *) echo "gate: unknown kind $kind"; return 1 ;;
  esac
}

# ---- dispatch ----------------------------------------------------------------
dispatch() {
  local taskfile="$1" task target kind stamp log pid elapsed idle
  task="$(basename "$taskfile" .md)"
  target="$(manifest_field "$task" 3)"
  kind="$(manifest_field "$task" 4)"
  [[ -n "$target" && -n "$kind" ]] || { say "$task: NOT IN MANIFEST — skipping"; return 1; }

  # [D2] key logs by timestamp, never by attempt number — a re-run must not
  # overwrite the evidence that would explain the original failure.
  stamp="$(date +%Y%m%d-%H%M%S)"
  log="$LOGDIR/$task-$stamp.log"

  say "$task -> $target [$kind] log=$(basename "$log")"

  python3 "$RUNNER" "$taskfile" --provider ollama --host "$HOST" --model "$MODEL" \
      > "$log" 2>&1 &
  pid=$!                                   # [D10] terminate by recorded PID, never a -f pattern
  local start; start=$(date +%s)
  local last_mtime=0

  while kill -0 "$pid" 2>/dev/null; do
    sleep "$POLL"
    elapsed=$(( $(date +%s) - start ))

    # [§3] idle-since-last-write. The dominant failure is finishing and not
    # stopping: the model keeps making tool calls while the artifact stops
    # changing. Watch the artifact, not the process.
    if [[ -f "$REPO/$target" ]]; then
      local m; m=$(stat -c %Y "$REPO/$target" 2>/dev/null || echo 0)
      [[ "$m" != "$last_mtime" ]] && last_mtime="$m"
      idle=$(( $(date +%s) - m ))
      if (( idle > IDLE_KILL )); then
        if run_gate "$kind" "$target" "$task" >/dev/null 2>&1; then
          say "$task: idle ${idle}s and gates PASS — killing, accepting"
          kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null
          return 0
        else
          say "$task: idle ${idle}s and gates FAIL — killing, will retry"
          kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null
          return 1
        fi
      fi
    fi

    # [§3] thrashing breaker — needs the ABSOLUTE floor, not the ratio alone.
    # bash>write*2 fired at 3:1 once and killed a task 7s before it passed.
    local nb nw
    nb=$(grep -c 'run_command\|bash' "$log" 2>/dev/null || echo 0)
    nw=$(grep -c 'write_file\|edit_file' "$log" 2>/dev/null || echo 0)
    if (( nb >= 8 && nb > nw*2 )); then
      say "$task: thrashing (bash=$nb write=$nw) — killing"
      kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null
      return 1
    fi

    if (( elapsed > WALL_CLOCK )); then
      say "$task: wall clock ${elapsed}s — killing"
      kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null
      return 1
    fi
  done
  wait "$pid" 2>/dev/null
  return 0
}

# ---- main loop ---------------------------------------------------------------
shopt -s nullglob
for taskfile in "$QUEUE"/*.md; do
  task="$(basename "$taskfile" .md)"
  target="$(manifest_field "$task" 3)"
  kind="$(manifest_field "$task" 4)"
  [[ -n "$target" ]] || { say "$task: not in manifest, skipping"; continue; }

  attempts=0
  passed=0
  while (( attempts < MAX_ATTEMPTS )); do
    attempts=$((attempts+1))
    say "=== $task attempt $attempts/$MAX_ATTEMPTS ==="
    dispatch "$taskfile"

    gate_out="$(run_gate "$kind" "$target" "$task" 2>&1)"
    gate_rc=$?

    # [§5] record the model's own DONE claim next to the gate verdict. The gap
    # between "✅ all requirements" and a red gate is the tuning artifact.
    latest_log="$(ls -t "$LOGDIR/$task-"*.log 2>/dev/null | head -1)"
    claim="$(grep -iE '^\s*(✅|done|complete|implemented)' "$latest_log" 2>/dev/null | head -3)"
    { echo "--- $task attempt $attempts $(date -Is)"; echo "gate_rc=$gate_rc"; echo "$gate_out";
      echo "model_claimed:"; echo "$claim"; } >> "$LOGDIR/verdicts-$LANE.log"

    if (( gate_rc == 0 )); then
      # [D9] guard the PASS path: refuse to commit anything but the target.
      stray="$(cd "$REPO" && git status --porcelain | grep -vE "$STRAY_IGNORE" | grep -v "$target" || true)"
      if [[ -n "$stray" ]]; then
        say "$task: STRAY changes outside target, reverting those only:"; echo "$stray" | tee -a "$LOGDIR/driver-$LANE.log"
        # [D7] never git clean -fdq — it deletes legitimate new helper files.
        echo "$stray" | awk '{print $2}' | while read -r p; do
          (cd "$REPO" && git checkout -- "$p" 2>/dev/null || true)
        done
      fi
      (cd "$REPO" && git add "$target" && \
        git commit -q -m "feat(demo): $task

builder: $MODEL @ $HOST (lane $LANE, attempt $attempts)
gate: pass

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>") && say "$task: PASS, committed"
      mv "$taskfile" "$DONE/" 2>/dev/null
      passed=1
      break
    fi
    say "$task: gate FAIL (attempt $attempts): $gate_out"
  done

  if (( passed == 0 )); then
    # [D4] clear the counter on FAIL_FINAL too, or a requeue goes straight to
    # FAIL_FINAL without ever dispatching.
    attempts=0
    mv "$taskfile" "$FAILED/" 2>/dev/null
    say "$task: FAIL_FINAL after $MAX_ATTEMPTS — supervisor builds this one"
  fi

  (( SMOKE == 1 )) && { say "smoke run complete, stopping"; break; }
done

say "lane $LANE drained"
