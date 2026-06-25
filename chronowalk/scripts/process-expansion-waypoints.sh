#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IDS=(capitoline-hill largo-argentina campo-de-fiori castel-sant-angelo)

has_processed_video() {
  local id="$1"
  [[ -f "public/waypoints/$id/modern.mp4" && -f "public/waypoints/$id/ancient-reconstruction.mp4" ]]
}

has_incoming_sources() {
  local id="$1"
  local dir="public/waypoints/$id/incoming"
  local modern ancient
  modern=""
  ancient=""
  shopt -s nullglob
  for f in "$dir"/modern-source.mp4 "$dir"/*modern*.mp4 "$dir"/now_from*.mp4; do
    [[ -f "$f" && "$f" != *ancient* && "$f" != *Ancient* ]] && modern="$f" && break
  done
  for f in "$dir"/ancient-source.mp4 "$dir"/*ancient*.mp4 "$dir"/*Ancient*.mp4; do
    [[ -f "$f" ]] && ancient="$f" && break
  done
  [[ -n "$modern" && -n "$ancient" ]]
}

cd "$ROOT"
for id in "${IDS[@]}"; do
  echo ""
  echo "========== $id =========="
  if has_processed_video "$id"; then
    echo "Already has modern.mp4 + ancient-reconstruction.mp4 — running verify only"
    npm run verify-waypoint -- "$id" || true
    continue
  fi
  if has_incoming_sources "$id"; then
    npm run process-waypoint -- "$id"
    npm run verify-waypoint -- "$id" || true
    continue
  fi
  echo "SKIP — missing videos. Run: npm run fix-expansion-folders"
  echo "  Need incoming/modern-source.mp4 AND incoming/ancient-source.mp4"
  echo "  (or *.mp4 with 'modern' and 'ancient' in the filename)"
done

echo ""
echo "Done. Test: http://localhost:5173/?singleWaypoint=castel-sant-angelo&debugGeo=true"
