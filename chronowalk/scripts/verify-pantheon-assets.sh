#!/usr/bin/env bash
# Verify Pantheon deliverables exist before deploy
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/public/waypoints/pantheon"

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
  echo "$missing file(s) missing. Run: npm run process-pantheon"
  exit 1
fi

echo ""
echo "Pantheon assets ready. Test tour: ?debugGeo=true&debugStop=pantheon"
