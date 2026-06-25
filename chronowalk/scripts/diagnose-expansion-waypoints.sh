#!/usr/bin/env bash
# Show exactly what media exists for expansion stops.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/waypoint-incoming.sh
source "$ROOT/scripts/lib/waypoint-incoming.sh"

WP="$ROOT/public/waypoints"
IDS=(capitoline-hill largo-argentina campo-de-fiori castel-sant-angelo)

cd "$ROOT"
echo "=== Expansion waypoint diagnose ==="
echo "cwd: $ROOT"
echo ""

for id in "${IDS[@]}"; do
  echo "--- $id ---"
  found_any=0
  while IFS= read -r -d '' dir; do
    echo "  incoming: ${dir#$WP/}/"
    dir_has_mp4=0
    while IFS= read -r -d '' f; do
      found_any=1
      dir_has_mp4=1
      kind="$(incoming_classify_mp4 "$f")"
      echo "    $(basename "$f")  [$kind]"
    done < <(incoming_list_mp4s "$dir")
    if [[ "$dir_has_mp4" -eq 0 ]]; then
      echo "    (no mp4/mov files)"
    fi
  done < <(incoming_collect_dirs "$WP" "$id")

  if pair="$(incoming_find_pair_for_waypoint "$WP" "$id" 2>/dev/null)"; then
    echo "  ✓ pair detected:"
    echo "      modern  ← $(basename "${pair%%|*}")"
    echo "      ancient ← $(basename "${pair#*|}")"
  else
    echo "  ✗ no MP4 pair detected (need 2 videos in incoming/)"
  fi

  if [[ -d "$WP/$id" ]]; then
    find "$WP/$id" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) 2>/dev/null | sort | while read -r f; do
      echo "  root: $(basename "$f")"
    done
  else
    echo "  (no folder public/waypoints/$id)"
  fi
  echo ""
done

echo "--- Loose public/*.mp4 ---"
ls -1 public/*.mp4 public/*.mov 2>/dev/null || echo "  (none)"
echo ""
echo "Then: npm run process-expansion-waypoints"
