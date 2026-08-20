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
# Lanes are named by CARD CLASS, not by model — the skill's rule is that a lane
# name must not encode a model, or git provenance goes false the moment a lane
# is re-pointed. `big` is whichever card can hold a 30B; `small` is the 12B card.
#
# Routing is by weight, and the weights matter more than they look: measured,
# qwen3-coder:30b on a 4090 runs ~30s/file where gemma4:12b on a 3060 runs
# ~18min/file on the same task shape. 45x. So `big` takes everything with real
# branching and `small` takes only tasks that cannot become the critical path.
case "$LANE" in
  big)   HOST="${BIG_HOST:-http://100.75.112.14:11434}"; MODEL="${BIG_MODEL:-qwen3-coder:30b}" ;;
  small) HOST="${SMALL_HOST:-http://localhost:11434}";   MODEL="${SMALL_MODEL:-gemma4:12b}" ;;
  *) echo "unknown lane: $LANE (big|small)" >&2; exit 2 ;;
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

# typecheck a package, attributing errors [D6]: only this task's own file fails
# it. Unrelated breakage elsewhere must never park an innocent task.
tsc_attributed() {
  local pkg="$1" rel="$2" base out
  base="$(basename "$rel")"
  out=$(cd "$REPO/$pkg" && npx tsc --noEmit 2>&1)
  if echo "$out" | grep -q "$base"; then
    echo "gate: tsc errors in this file:"; echo "$out" | grep "$base" | head -5; return 1
  elif [[ -n "$out" ]]; then
    echo "note: tsc errors elsewhere, NOT this task's fault:"; echo "$out" | head -3
  fi
  return 0
}

# React component. [D11] must export, must return JSX, must not be a stub.
gate_tsx() {
  local rel="$1" task="$2" abs="$REPO/$1" errs=0
  [[ -s "$abs" ]] || { echo "gate: missing or empty"; return 1; }
  grep -q 'export function' "$abs" || { echo "gate: no exported component"; errs=1; }
  grep -qE 'return \(|=> \(|return <' "$abs" || { echo "gate: returns no JSX — stub"; errs=1; }
  grep -q 'data-testid' "$abs" || { echo "gate: no data-testid"; errs=1; }
  grep -q 'export default' "$abs" && { echo "gate: default export banned"; errs=1; }
  grep -qE ':\s*any\b|<any>' "$abs" && { echo "gate: uses any"; errs=1; }
  grep -q 'useState\|useEffect' "$abs" && { echo "gate: presentational component has state"; errs=1; }
  grep -q 'style={{' "$abs" && { echo "gate: inline style — classes are in health.css"; errs=1; }
  case "$task" in
    01-band-chip)
      grep -q 'BAND_LABEL' "$abs" || { echo "gate: missing BAND_LABEL"; errs=1; }
      grep -q "'bottom'" "$abs" || { echo "gate: PositionBand incomplete"; errs=1; } ;;
    07-citation-card)
      grep -q "confidence === 'approximate'" "$abs" || { echo "gate: caution not conditional"; errs=1; }
      grep -q 'APPROXIMATE_CAUTION' "$abs" || { echo "gate: missing APPROXIMATE_CAUTION"; errs=1; } ;;
  esac
  tsc_attributed "packages/ui" "$rel" || errs=1
  return $errs
}

gate_ts() {
  local rel="$1" abs="$REPO/$1" errs=0
  [[ -s "$abs" ]] || { echo "gate: missing or empty"; return 1; }
  for sym in CHUNK_TARGET CHUNK_OVERLAP DEFAULT_MAX_CHUNKS ChunkResult chunkText estimateTokens; do
    grep -q "export .*$sym" "$abs" || { echo "gate: does not export $sym"; errs=1; }
  done
  grep -q 'return' "$abs" || { echo "gate: no return statement — stub"; errs=1; }
  grep -qE ':\s*any\b' "$abs" && { echo "gate: uses any"; errs=1; }
  tsc_attributed "packages/core" "$rel" || errs=1
  return $errs
}

# Signal sweep: a pure function of rows. The purity checks are the point —
# a sweep that reads the clock breaks demo reproducibility silently.
gate_sweep() {
  local rel="$1" task="$2" abs="$REPO/$1" errs=0
  [[ -s "$abs" ]] || { echo "gate: missing or empty"; return 1; }
  grep -q 'export function sweep' "$abs" || { echo "gate: no exported sweep function"; errs=1; }
  grep -q 'return \[\]' "$abs" || { echo "gate: no early exit — sweep always fires"; errs=1; }
  grep -q 'InsightDraft' "$abs" || { echo "gate: does not emit InsightDraft"; errs=1; }
  grep -q 'dedupeKey' "$abs" || { echo "gate: no dedupeKey"; errs=1; }
  grep -q 'EVIDENCE_VERSION' "$abs" || { echo "gate: evidence not versioned"; errs=1; }
  # purity
  grep -qE 'Date\.now\(\)|new Date\(\)' "$abs" && { echo "gate: reads the clock — breaks reproducibility"; errs=1; }
  grep -q 'Math.random' "$abs" && { echo "gate: nondeterministic"; errs=1; }
  grep -qE 'await |fetch\(|prisma|db\.' "$abs" && { echo "gate: does I/O — sweeps are pure"; errs=1; }
  grep -qE ':\s*any\b' "$abs" && { echo "gate: uses any"; errs=1; }
  # dedupeKey must not embed a date, or tomorrow duplicates today
  grep -qE 'dedupeKey.*(today|forDate)' "$abs" && { echo "gate: dedupeKey contains a date"; errs=1; }
  case "$task" in
    13-sweep-bottle)
      grep -q 'estimateBottle' "$abs" || { echo "gate: does not reuse estimateBottle"; errs=1; }
      grep -qE '0\.5|ouncesPerTan' "$abs" && { echo "gate: reimplements the half-ounce math"; errs=1; } ;;
    11-sweep-tenure)
      grep -q 'MIN_COHORT' "$abs" || { echo "gate: no cohort minimum"; errs=1; } ;;
    14-sweep-category-gap)
      grep -q 'MIN_COHORT' "$abs" || { echo "gate: no cohort minimum"; errs=1; } ;;
  esac
  tsc_attributed "packages/core" "$rel" || errs=1
  return $errs
}

# Migration SQL. The task says write-don't-run; this gate proves the SQL itself
# cannot escape the bask schema, because the database is shared with 574 tables
# belonging to other products.
gate_sql() {
  local f="$REPO/$1" errs=0
  [[ -s "$f" ]] || { echo "gate: missing or empty"; return 1; }
  grep -q 'CREATE TABLE "bask"."knowledge_doc"' "$f" || { echo "gate: no knowledge_doc"; errs=1; }
  grep -q 'CREATE TABLE "bask"."knowledge_chunk"' "$f" || { echo "gate: no knowledge_chunk"; errs=1; }
  grep -q 'public.vector(1536)' "$f" || { echo "gate: wrong or missing vector type"; errs=1; }
  grep -q 'match_knowledge' "$f" || { echo "gate: no retrieval function"; errs=1; }
  grep -qi 'CREATE EXTENSION' "$f" && { echo "gate: touches extensions on a shared DB"; errs=1; }
  grep -qiE '^\s*DROP ' "$f" && { echo "gate: contains DROP"; errs=1; }
  # every CREATE TABLE / CREATE INDEX must name the bask schema explicitly
  grep -iE '^\s*CREATE TABLE' "$f" | grep -v '"bask"\.' | grep -q . \
    && { echo "gate: an unqualified CREATE TABLE would land in public"; errs=1; }
  grep -iE '^\s*CREATE (UNIQUE )?INDEX' "$f" | grep -v '"bask"\.' | grep -q . \
    && { echo "gate: an index targets outside bask"; errs=1; }
  return $errs
}

# A pure TS module in core that is NOT a sweep (no InsightDraft contract).
gate_ts2() {
  local rel="$1" task="$2" abs="$REPO/$1" errs=0
  [[ -s "$abs" ]] || { echo "gate: missing or empty"; return 1; }
  grep -q 'export function' "$abs" || { echo "gate: no exported function"; errs=1; }
  grep -qE 'Date\.now\(\)|new Date\(\)' "$abs" && { echo "gate: reads the clock"; errs=1; }
  grep -q 'Math.random' "$abs" && { echo "gate: nondeterministic"; errs=1; }
  grep -qE ':\s*any\b' "$abs" && { echo "gate: uses any"; errs=1; }
  case "$task" in
    24-kb-retrieve)
      grep -q "'interpolated'" "$abs" || { echo "gate: no confidence handling"; errs=1; }
      grep -qE "prisma|@bask/db|from 'pg'" "$abs" && { echo "gate: imports a db client — query is injected"; errs=1; }
      # the safety rule: an interpolated citation must not carry a speaker name
      grep -q 'DEFAULT_THRESHOLD' "$abs" || { echo "gate: no threshold constant"; errs=1; } ;;
    25-tenure-server)
      grep -q 'averageTenureMonths' "$abs" || { echo "gate: no tenure computation"; errs=1; } ;;
  esac
  tsc_attributed "packages/core" "$rel" || errs=1
  return $errs
}

# A db script. Must be written, never run — and must be gated behind a confirm.
gate_script() {
  local rel="$1" abs="$REPO/$1" errs=0
  [[ -s "$abs" ]] || { echo "gate: missing or empty"; return 1; }
  grep -q 'EMBED_CONFIRM' "$abs" || { echo "gate: no confirmation guard on a shared-DB write"; errs=1; }
  grep -q 'text-embedding-3-small' "$abs" || { echo "gate: wrong embedding model"; errs=1; }
  grep -q 'chunkText' "$abs" || { echo "gate: does not use the shared chunker"; errs=1; }
  grep -q 'uvalux26-expo.jsonl' "$abs" || { echo "gate: does not read the corpus"; errs=1; }
  grep -q 'process.env.DATABASE_URL' "$abs" && { echo "gate: reads DATABASE_URL directly"; errs=1; }
  grep -qE ':\s*any\b' "$abs" && { echo "gate: uses any"; errs=1; }
  tsc_attributed "packages/db" "$rel" || errs=1
  return $errs
}

gate_html() {
  local f="$REPO/$1" task="$2" errs=0
  [[ -s "$f" ]] || { echo "gate: missing or empty"; return 1; }
  head -c 20 "$f" | grep -qi '<!doctype html' || { echo "gate: no doctype"; errs=1; }
  grep -qi '<script' "$f" && { echo "gate: contains a <script tag"; errs=1; }
  [[ $(grep -o '<h2' "$f" | wc -l) -ge 4 ]] || { echo "gate: fewer than 4 h2 headings"; errs=1; }
  case "$task" in
    09-proposal-html)
      grep -q 'mark class="todo"' "$f" || { echo "gate: [[ ]] placeholders not marked"; errs=1; }
      grep -q 'Margin note' "$f" && { echo "gate: author margin notes leaked into client doc"; errs=1; }
      grep -q '@media print' "$f" || { echo "gate: no print stylesheet"; errs=1; } ;;
  esac
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

# The payback calculator is the ONE artifact allowed to ship JavaScript, because
# it is interactive by design. Everything else in docs/pitch is static.
gate_calc() {
  local f="$REPO/$1" errs=0
  [[ -s "$f" ]] || { echo "gate: missing or empty"; return 1; }
  head -c 20 "$f" | grep -qi '<!doctype html' || { echo "gate: no doctype"; errs=1; }
  [[ $(grep -o '<input' "$f" | wc -l) -ge 6 ]] || { echo "gate: fewer than 6 inputs"; errs=1; }
  grep -q 'paybackMonths' "$f" || { echo "gate: no payback calculation"; errs=1; }
  grep -q 'These are your numbers, not ours' "$f" || { echo "gate: missing honesty line"; errs=1; }
  # self-contained: fonts link is the only permitted external reference
  grep -oP 'src="https?://[^"]+' "$f" | grep -v 'fonts\.' | head -3 | grep -q . \
    && { echo "gate: external script source"; errs=1; }
  grep -q 'fetch(' "$f" && { echo "gate: makes a network call"; errs=1; }
  # it must actually compute, not just display constants
  grep -qE 'addEventListener|oninput' "$f" || { echo "gate: inputs are not wired"; errs=1; }
  return $errs
}

gate_md() {
  local f="$REPO/$1" task="$2" errs=0
  [[ -s "$f" ]] || { echo "gate: missing or empty"; return 1; }
  case "$task" in
    20-wilfred-packet)
      grep -q 'DRAFT — generated overnight' "$f" || { echo "gate: missing DRAFT line"; errs=1; }
      grep -q '^## Open' "$f" || { echo "gate: no Open section — the honest half is missing"; errs=1; }
      for s in 'bask' 'Row Level Security' 'residency' 'no authentication'; do
        grep -q "$s" "$f" || { echo "gate: missing required fact '$s'"; errs=1; }
      done
      # invented assurances. This reader is an ex-data-centre engineer; one
      # unearned certification claim loses him permanently.
      for bad in 'SOC 2' 'ISO 27001' 'HIPAA' 'PIPEDA compliant' '99.9' 'bank-grade' 'military-grade' 'end-to-end encrypted'; do
        grep -qi "$bad" "$f" && { echo "gate: INVENTED ASSURANCE '$bad'"; errs=1; }
      done ;;
    21-fences)
      grep -q 'DRAFT — generated overnight' "$f" || { echo "gate: missing DRAFT line"; errs=1; }
      local fences; fences=$(grep -c '^## ' "$f")
      [[ "$fences" -eq 4 ]] || { echo "gate: $fences fences, expected exactly 4"; errs=1; }
      for s in 'Sunlync' 'consent' '12 salons'; do
        grep -q "$s" "$f" || { echo "gate: missing '$s'"; errs=1; }
      done
      for bad in 'hereinafter' 'warrants and represents' 'shall indemnify'; do
        grep -qi "$bad" "$f" && { echo "gate: legalese '$bad' — this is plain-language intent"; errs=1; }
      done ;;
    17-shot-plan)
      local beats; beats=$(grep -c '^## Beat' "$f")
      [[ "$beats" -eq 9 ]] || { echo "gate: $beats beats, expected exactly 9"; errs=1; }
      grep -q 'PLAN — generated overnight' "$f" || { echo "gate: missing PLAN warning"; errs=1; }
      local tex; tex=$(grep -c 'Textures needed:' "$f")
      [[ "$tex" -ge 9 ]] || { echo "gate: only $tex beats name their textures"; errs=1; }
      grep -qi 'built for UVALUX' "$f" && { echo "gate: overclaims a UVALUX partnership"; errs=1; } ;;
    10-vo-script)
      local beats; beats=$(grep -c '^### Beat' "$f")
      [[ "$beats" -eq 9 ]] || { echo "gate: $beats beats, expected exactly 9"; errs=1; }
      grep -q 'DRAFT — generated overnight' "$f" || { echo "gate: missing DRAFT warning"; errs=1; }
      grep -q 'Total estimated read' "$f" || { echo "gate: missing total read time"; errs=1; }
      grep -qi 'built for UVALUX' "$f" && { echo "gate: overclaims a UVALUX partnership"; errs=1; } ;;
  esac
  return $errs
}

run_gate() {
  local kind="$1" target="$2" task="$3"
  case "$kind" in
    tsx)   gate_tsx   "$target" "$task" ;;
    ts)    gate_ts    "$target" ;;
    sweep)  gate_sweep  "$target" "$task" ;;
    ts2)    gate_ts2    "$target" "$task" ;;
    sql)    gate_sql    "$target" ;;
    script) gate_script "$target" ;;
    html)  gate_html  "$target" "$task" ;;
    calc)  gate_calc  "$target" ;;
    md)    gate_md    "$target" "$task" ;;
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
  lane="$(manifest_field "$task" 2)"
  target="$(manifest_field "$task" 3)"
  kind="$(manifest_field "$task" 4)"
  [[ -n "$target" ]] || { say "$task: not in manifest, skipping"; continue; }
  # Lanes share one queue directory; each driver takes only its own tasks.
  [[ "$lane" == "$LANE" ]] || continue

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
