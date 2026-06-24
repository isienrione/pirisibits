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

echo ""
echo "$WAYPOINT_ID assets ready."
echo "Test tour: ?debugGeo=true&debugStop=$WAYPOINT_ID"
echo "Asset Studio: ?assetStudio=true&waypoint=$WAYPOINT_ID"
