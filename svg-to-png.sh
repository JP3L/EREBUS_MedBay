#!/usr/bin/env bash
# Render all 20 panel SVGs to 1024×768 PNGs using @resvg/resvg-js-cli.
# First run: npx downloads the binary (~30s). Subsequent runs: ~1s per file.
#
# Usage:   ./svg-to-png.sh
# Output:  prototype/export/panels/<stepId>.png

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SVG_DIR="$SCRIPT_DIR/prototype/export/svg"
OUT_DIR="$SCRIPT_DIR/prototype/export/panels"

mkdir -p "$OUT_DIR"
find "$OUT_DIR" -name '*.png' -delete

shopt -s nullglob
SVGS=("$SVG_DIR"/*.svg)
echo "Rendering ${#SVGS[@]} SVGs to $OUT_DIR"
echo

for svg in "${SVGS[@]}"; do
  base=$(basename "$svg" .svg)
  out="$OUT_DIR/$base.png"
  if npx -y @resvg/resvg-js-cli "$svg" "$out" >/dev/null 2>&1; then
    printf "  ✓ %-20s %s\n" "$base" "$(du -h "$out" | cut -f1)"
  else
    printf "  ✗ %-20s FAILED\n" "$base"
  fi
done

echo
count=$(ls -1 "$OUT_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ')
echo "Done. $count PNGs ready for ShapesXR upload in $OUT_DIR"
