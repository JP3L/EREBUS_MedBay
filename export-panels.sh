#!/usr/bin/env bash
# Export all 20 step panels as 1024×768 PNGs via Chrome headless.
# Requires: a running dev server on port 5173 (see .claude/launch.json) and Google Chrome on macOS.
# Outputs: prototype/export/panels/<stepId>.png

set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE_URL="${BASE_URL:-http://localhost:5173/panel.html}"
OUT_DIR="$(dirname "$0")/prototype/export/panels"

mkdir -p "$OUT_DIR"

STEP_IDS=(
  # Station 1 — Triage
  s1_0_alert s1_1_raw s1_2_diag s1_3_win s1_3_fail s1_4_teach
  # Station 2 — Trauma
  s2_0_alert s2_1_compare s2_2_trace s2_3_win s2_3_partial s2_3_slow s2_4_teach
  # Station 3 — ICU
  s3_0_alert s3_1_firmware s3_2_network s3_3_win s3_3_partial s3_3_fail s3_4_teach
)

CONCURRENCY="${CONCURRENCY:-4}"
echo "Exporting ${#STEP_IDS[@]} panels to $OUT_DIR (concurrency: $CONCURRENCY)"
echo

export_one() {
  local id="$1"
  local profile
  profile="$(mktemp -d /tmp/chrome-export.XXXXXX)"
  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --no-sandbox \
    --disable-background-networking \
    --disable-extensions \
    --disable-default-apps \
    --disable-sync \
    --user-data-dir="$profile" \
    --virtual-time-budget=1500 \
    --window-size=1024,768 \
    --default-background-color=00000000 \
    --screenshot="$OUT_DIR/$id.png" \
    "$BASE_URL?id=$id" \
    >/dev/null 2>&1
  local ec=$?
  rm -rf "$profile"
  if [[ $ec -eq 0 && -f "$OUT_DIR/$id.png" ]]; then
    printf "  ✓ %-20s %s\n" "$id" "$(du -h "$OUT_DIR/$id.png" | cut -f1)"
  else
    printf "  ✗ %-20s FAILED\n" "$id"
  fi
}
export -f export_one
export CHROME BASE_URL OUT_DIR

# Parallel dispatch with a simple semaphore.
pids=()
for id in "${STEP_IDS[@]}"; do
  # Throttle to $CONCURRENCY active jobs.
  while [[ $(jobs -rp | wc -l) -ge $CONCURRENCY ]]; do
    sleep 0.2
  done
  export_one "$id" &
  pids+=($!)
done
wait "${pids[@]}" 2>/dev/null || true

echo
count=$(ls -1 "$OUT_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ')
echo "Done. $count panels written to $OUT_DIR"
echo "Drag them into ShapesXR (or Figma) as textured planes."
