#!/usr/bin/env bash
# Verify waypoint deliverables exist before deploy
# Usage: npm run verify-waypoint -- <waypoint-id>
set -euo pipefail

WAYPOINT_ID="${1:-}"
if [[ -z "$WAYPOINT_ID" ]]; then
  echo "Usage: npm run verify-waypoint -- <waypoint-id>" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/public/waypoints/$WAYPOINT_ID"

required=(
  modern-exterior.jpg
  modern.mp4
  modern-poster.jpg
  ancient-reconstruction.mp4
  ancient-reconstruction.jpg
  ancient-poster.jpg
  geocache-arrival-alert.wav
)

missing=0
for file in "${required[@]}"; do
  if [[ -f "$DIR/$file" ]]; then
    echo "✓ $file"
  else
    echo "✗ missing: $file"
    missing=$((missing + 1))
  fi
done

if (( missing > 0 )); then
  echo ""
  echo "$missing file(s) missing for $WAYPOINT_ID."
  echo "Process videos: npm run process-waypoint -- $WAYPOINT_ID"
  echo "Export still: modern-exterior.jpg from Street View at viewpoint in src/data/$WAYPOINT_ID.js"
  exit 1
fi

warnings=0
for other_dir in "$ROOT/public/waypoints"/*; do
  [[ -d "$other_dir" ]] || continue
  other_id="$(basename "$other_dir")"
  [[ "$other_id" == "$WAYPOINT_ID" ]] && continue
  [[ "$other_id" == "incoming" ]] && continue

  for file in modern-exterior.jpg modern.mp4 ancient-reconstruction.mp4; do
    [[ -f "$DIR/$file" && -f "$other_dir/$file" ]] || continue
    if cmp -s "$DIR/$file" "$other_dir/$file"; then
      echo "⚠ $file is identical to $other_id — replace with $WAYPOINT_ID-specific media"
      warnings=$((warnings + 1))
    fi
  done
done

if (( warnings > 0 )); then
  echo ""
  echo "$warnings duplicate file(s) detected. The slider will show the wrong landmark until you:"
  echo "  1. Export modern-exterior.jpg from Street View (Asset Studio link below)"
  echo "  2. Re-run: npm run process-waypoint -- $WAYPOINT_ID  (with your Runway MP4s in incoming/)"
  echo "Do NOT copy image/video files from pantheon/ or colosseum/."
fi

echo ""
echo "$WAYPOINT_ID assets ready."
echo "Asset Studio (prompts): http://localhost:5173/?assetStudio=true&waypoint=$WAYPOINT_ID"
echo "Test tour: ?debugGeo=true&debugStop=$WAYPOINT_ID"
