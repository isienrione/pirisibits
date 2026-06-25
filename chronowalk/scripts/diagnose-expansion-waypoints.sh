#!/usr/bin/env bash
# Show exactly what media exists for expansion stops.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WP="$ROOT/public/waypoints"
IDS=(capitoline-hill largo-argentina campo-de-fiori castel-sant-angelo)

cd "$ROOT"
echo "=== Expansion waypoint diagnose ==="
echo "cwd: $ROOT"
echo ""

for id in "${IDS[@]}"; do
  echo "--- $id ---"
  if [[ -d "$WP/$id" ]]; then
    find "$WP/$id" -type f \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) 2>/dev/null | sort | while read -r f; do
      echo "  ${f#$WP/$id/}"
    done
  else
    echo "  (no folder public/waypoints/$id)"
  fi
  # wrong-name siblings
  find "$WP" -maxdepth 1 -type d -iname "*${id//-/_}*" 2>/dev/null | while read -r d; do
    base="$(basename "$d")"
    [[ "$base" == "$id" ]] && continue
    echo "  alt folder: $base/"
    find "$d" -type f \( -iname '*.mp4' -o -iname '*.mov' \) 2>/dev/null | head -5 | while read -r f; do
      echo "    $(basename "$f")"
    done
  done
  echo ""
done

echo "--- Loose public/*.mp4 ---"
ls -1 public/*.mp4 public/*.mov 2>/dev/null || echo "  (none)"
echo ""
echo "Required per stop:"
echo "  modern-exterior.jpg (root)"
echo "  incoming/modern-source.mp4"
echo "  incoming/ancient-source.mp4"
echo "Then: npm run process-expansion-waypoints"
