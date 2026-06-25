#!/usr/bin/env bash
# Stage processed expansion stop media on macOS (wrong folder casing in git status).
# Run from chronowalk/:  npm run git-add-expansion-media
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/waypoint-incoming.sh
source "$ROOT/scripts/lib/waypoint-incoming.sh"

cd "$ROOT"

ASSETS=(
  modern.mp4
  ancient-reconstruction.mp4
  modern-exterior.jpg
  ancient-reconstruction.jpg
  modern-poster.jpg
  ancient-poster.jpg
)

IDS=(capitoline-hill largo-argentina campo-de-fiori castel-sant-angelo)

echo "Staging expansion slider media (Mac-safe paths)…"
echo ""

staged=0
for id in "${IDS[@]}"; do
  aliases="$(incoming_aliases_for "$id")"
  for alias in $id $aliases; do
    dir="public/waypoints/$alias"
    [[ -d "$dir" ]] || continue
    for asset in "${ASSETS[@]}"; do
      path="$dir/$asset"
      [[ -f "$path" ]] || continue
      git add -f "$path"
      echo "  + $path"
      staged=$((staged + 1))
    done
  done
done

echo ""
if ((staged == 0)); then
  echo "Nothing staged. Expected files like public/waypoints/<id>/modern.mp4"
  echo "Run: npm run diagnose-expansion-waypoints"
  exit 1
fi

echo "Staged $staged file(s). Review:"
git status --short public/waypoints/
echo ""
echo "Commit:"
echo '  git commit -m "Add processed slider media for expansion stops"'
echo "  git push"
