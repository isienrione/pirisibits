#!/usr/bin/env bash
# Process all expansion waypoints that use incoming/ raw MP4s.
# Expects per stop:
#   public/waypoints/<id>/incoming/modern-source.mp4
#   public/waypoints/<id>/incoming/ancient-source.mp4
#   public/waypoints/<id>/modern-exterior.jpg  (waypoint root — not in incoming/)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IDS=(
  capitoline-hill
  largo-argentina
  campo-de-fiori
  castel-sant-angelo
)

cd "$ROOT"
for id in "${IDS[@]}"; do
  echo ""
  echo "========== $id =========="
  if [[ ! -f "public/waypoints/$id/incoming/modern-source.mp4" && ! -f public/waypoints/$id/incoming/*modern*.mp4 ]]; then
    echo "Skip $id — no modern-source.mp4 in incoming/ (add files then re-run)"
    continue
  fi
  npm run process-waypoint -- "$id"
  npm run verify-waypoint -- "$id" || true
done

echo ""
echo "Done. Test: http://localhost:5173/?resetTour=true&debugGeo=true"
