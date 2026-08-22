#!/usr/bin/env bash
# ETL-mapper build driver — uvalux-platform, 2026-08-21.
# Single lane, sequential, ONE working tree (no worktrees — owner directive).
# Pure CSV→Bask-shape mappers + the grader; the DB insert stays with the
# supervisor. Runner gets --contract so the real API surface is injected.
#
#   ./driver.sh big           run the queue
#   ./driver.sh big --smoke    run ONE task, then stop
set -uo pipefail

LANE="${1:?usage: driver.sh <lane> [--smoke]}"
SMOKE=0
[[ "${2:-}" == "--smoke" ]] && SMOKE=1

REPO="/home/danman60/projects/uvalux-platform"
BASE="$REPO/tasks/ingest-20260821"
QUEUE="$BASE/queue"; DONE="$BASE/done"; FAILED="$BASE/failed"
LOGDIR="$BASE/runlogs"; MANIFEST="$BASE/manifest.tsv"
RUNNER="/home/danman60/projects/qa-agent/ollama-runner.py"
CONTRACT="$REPO/packages/db/scripts/salon-ingest/etl/contract.ts"

case "$LANE" in
  big)   HOST="${BIG_HOST:-http://100.75.112.14:11434}"; MODEL="${BIG_MODEL:-qwen3-coder:30b}" ;;
  small) HOST="${SMALL_HOST:-http://localhost:11434}";   MODEL="${SMALL_MODEL:-gemma4:12b}" ;;
  *) echo "unknown lane: $LANE" >&2; exit 2 ;;
esac

MAX_ATTEMPTS=2; WALL_CLOCK=2700; IDLE_KILL=180; POLL=3
mkdir -p "$QUEUE" "$DONE" "$FAILED" "$LOGDIR"
if ! test -r "$LOGDIR"; then echo "FATAL: $LOGDIR not readable" >&2; exit 3; fi

say() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$LOGDIR/driver-$LANE.txt"; }
STRAY_IGNORE='node_modules|\.next|generated/|dist|tasks/ingest-20260821/'
manifest_field() { awk -F'\t' -v t="$1" -v c="$2" '$1==t{print $c}' "$MANIFEST"; }

if ! curl -s --max-time 10 "$HOST/api/tags" | grep -q "\"$MODEL\""; then
  say "FATAL: model '$MODEL' not present at $HOST — refusing to dispatch."; exit 4
fi
say "lane=$LANE host=$HOST model=$MODEL smoke=$SMOKE contract=$(basename "$CONTRACT")"

# tsc attributed to the file (db package is where these live)
tsc_attributed() {
  local rel="$1" base out; base="$(basename "$rel")"
  out=$(cd "$REPO/packages/db" && npx tsc --noEmit 2>&1)
  if echo "$out" | grep -q "$base"; then
    echo "gate: tsc errors in this file:"; echo "$out" | grep "$base" | head -6; return 1
  elif [[ -n "$out" ]]; then
    echo "note: tsc errors elsewhere, NOT this task's fault:"; echo "$out" | head -3
  fi
  return 0
}

# a pure ETL mapper (or grader): exports a function, imports the contract, no I/O,
# no DB, no clock, no randomness, no any.
gate_ts() {
  local rel="$1" task="$2" abs="$REPO/$1" errs=0
  [[ -s "$abs" ]] || { echo "gate: missing or empty"; return 1; }
  grep -q 'export function' "$abs" || { echo "gate: no exported function"; errs=1; }
  grep -q 'return' "$abs" || { echo "gate: no return — stub"; errs=1; }
  grep -qE "from '\.\./etl/contract'|from './contract'|from '\.\./contract'" "$abs" \
    || grep -q "contract" "$abs" || { echo "gate: does not import the contract"; errs=1; }
  grep -qE ':\s*any\b|<any>' "$abs" && { echo "gate: uses any"; errs=1; }
  grep -qE 'Date\.now\(\)|Math\.random' "$abs" && { echo "gate: nondeterministic"; errs=1; }
  grep -qE 'prisma|@bask/db|fetch\(|readFileSync|writeFileSync|process\.env|createClient' "$abs" \
    && { echo "gate: does I/O or DB — mappers are pure"; errs=1; }
  grep -q 'export default' "$abs" && { echo "gate: default export banned"; errs=1; }
  # per-task required export
  local want; want="$(manifest_field "$task" 5)"
  if [[ -n "$want" ]]; then
    IFS=',' read -ra fns <<< "$want"
    for fn in "${fns[@]}"; do grep -q "export function $fn" "$abs" || { echo "gate: missing export $fn"; errs=1; }; done
  fi
  tsc_attributed "$rel" || errs=1
  return $errs
}

run_gate() { gate_ts "$2" "$3"; }

dispatch() {
  local taskfile="$1" task target stamp log pid start last_mtime m idle elapsed nb nw
  task="$(basename "$taskfile" .md)"
  target="$(manifest_field "$task" 3)"
  [[ -n "$target" ]] || { say "$task: NOT IN MANIFEST"; return 1; }
  stamp="$(date +%Y%m%d-%H%M%S)"; log="$LOGDIR/$task-$stamp.txt"
  say "$task -> $target"
  python3 "$RUNNER" "$taskfile" --provider ollama --host "$HOST" --model "$MODEL" \
      --contract "$CONTRACT" > "$log" 2>&1 &
  pid=$!; start=$(date +%s); last_mtime=0
  while kill -0 "$pid" 2>/dev/null; do
    sleep "$POLL"; elapsed=$(( $(date +%s) - start ))
    if [[ -f "$REPO/$target" ]]; then
      m=$(stat -c %Y "$REPO/$target" 2>/dev/null || echo 0)
      [[ "$m" != "$last_mtime" ]] && last_mtime="$m"
      idle=$(( $(date +%s) - m ))
      if (( idle > IDLE_KILL )); then
        if run_gate "" "$target" "$task" >/dev/null 2>&1; then
          say "$task: idle ${idle}s + gates PASS — accepting"; kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; return 0
        else
          say "$task: idle ${idle}s + gates FAIL — retry"; kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; return 1
        fi
      fi
    fi
    nb=$(grep -c 'run_command\|bash' "$log" 2>/dev/null|head -1); nb=${nb:-0}
    nw=$(grep -c 'write_file\|edit_file' "$log" 2>/dev/null|head -1); nw=${nw:-0}
    if (( nb >= 8 && nb > nw*2 )); then say "$task: thrashing — kill"; kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; return 1; fi
    if (( elapsed > WALL_CLOCK )); then say "$task: wall clock — kill"; kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; return 1; fi
  done
  wait "$pid" 2>/dev/null; return 0
}

shopt -s nullglob
for taskfile in "$QUEUE"/*.md; do
  task="$(basename "$taskfile" .md)"; lane="$(manifest_field "$task" 2)"
  target="$(manifest_field "$task" 3)"
  [[ -n "$target" ]] || { say "$task: not in manifest, skip"; continue; }
  [[ "$lane" == "$LANE" ]] || continue
  # §0: if the artifact already exists and compiles, DROP the task.
  if [[ -f "$REPO/$target" ]] && run_gate "" "$target" "$task" >/dev/null 2>&1; then
    say "$task: target already built + gates PASS — dropping (not dispatching)"; mv "$taskfile" "$DONE/" 2>/dev/null; continue
  fi
  attempts=0; passed=0
  while (( attempts < MAX_ATTEMPTS )); do
    attempts=$((attempts+1)); say "=== $task attempt $attempts/$MAX_ATTEMPTS ==="
    dispatch "$taskfile"
    gate_out="$(run_gate "" "$target" "$task" 2>&1)"; gate_rc=$?
    { echo "--- $task attempt $attempts $(date -Is)"; echo "gate_rc=$gate_rc"; echo "$gate_out"; } >> "$LOGDIR/verdicts-$LANE.txt"
    if (( gate_rc == 0 )); then
      stray="$(cd "$REPO" && git status --porcelain 2>/dev/null | grep -vE "$STRAY_IGNORE" | grep -v "$target" || true)"
      if [[ -n "$stray" ]]; then say "$task: STRAY, reverting those only:"; echo "$stray"|awk '{print $2}'|while read -r p; do (cd "$REPO" && git checkout -- "$p" 2>/dev/null||true); done; fi
      (cd "$REPO" && git add "$target" && git commit -q -m "feat(etl): $task

builder: $MODEL @ $HOST (lane $LANE, attempt $attempts)
gate: pass") && say "$task: PASS, committed"
      mv "$taskfile" "$DONE/" 2>/dev/null; passed=1; break
    fi
    say "$task: gate FAIL: $gate_out"
  done
  (( passed == 0 )) && { attempts=0; mv "$taskfile" "$FAILED/" 2>/dev/null; say "$task: FAIL_FINAL — supervisor builds this one"; }
  (( SMOKE == 1 )) && { say "smoke complete, stopping"; break; }
done
say "lane $LANE drained"
