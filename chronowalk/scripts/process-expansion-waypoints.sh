#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/waypoint-incoming.sh
source "$ROOT/scripts/lib/waypoint-incoming.sh"

WP="$ROOT/public/waypoints"
IDS=(capitoline-hill largo-argentina campo-de-fiori castel-sant-angelo)

has_processed_video() {
  local id="$1"
  [[ -f "$WP/$id/modern.mp4" && -f "$WP/$id/ancient-reconstruction.mp4" ]]
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

  if incoming_sync_canonical_names "$WP" "$id"; then
    npm run process-waypoint -- "$id"
    npm run verify-waypoint -- "$id" || true
    continue
  fi

  echo "SKIP — no MP4 pair found in incoming/ (checked lowercase id + alias folders)"
  echo "  Run: npm run diagnose-expansion-waypoints"
  while IFS= read -r -d '' dir; do
    echo "  scanned: ${dir#$WP/}"
    while IFS= read -r -d '' f; do
      echo "    $(basename "$f")"
    done < <(incoming_list_mp4s "$dir")
  done < <(incoming_collect_dirs "$WP" "$id")
done

echo ""
echo "Done. Test: http://localhost:5173/?singleWaypoint=castel-sant-angelo&debugGeo=true"
