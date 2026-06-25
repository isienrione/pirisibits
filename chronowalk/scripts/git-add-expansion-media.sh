#!/usr/bin/env bash
# Stage processed expansion stop media on macOS (wrong folder casing in git status).
# Run from chronowalk/:  npm run git-add-expansion-media
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/waypoint-incoming.sh
source "$ROOT/scripts/lib/waypoint-incoming.sh"

cd "$ROOT"

WP="public/waypoints"
ASSETS=(
  modern.mp4
  ancient-reconstruction.mp4
  modern-exterior.jpg
  ancient-reconstruction.jpg
  modern-poster.jpg
  ancient-poster.jpg
)
IDS=(capitoline-hill largo-argentina campo-de-fiori castel-sant-angelo)

# Wrong git paths that must not remain in the repo (underscore / mixed case duplicates)
WRONG_GIT_PATHS=(
  public/waypoints/Largo_argentina
  public/waypoints/Largo_Argentina
  public/waypoints/Largo-Argentina
  public/waypoints/Capitoline-Hill
  public/waypoints/Campo-de-fiori
  public/waypoints/Castel-Sant-Angelo
)

echo "Syncing alias folders → canonical lowercase ids…"
for id in "${IDS[@]}"; do
  incoming_sync_deliverables "$WP" "$id"
done
echo ""

echo "Removing wrong-case duplicate paths from git index (if any)…"
for wrong in "${WRONG_GIT_PATHS[@]}"; do
  if git ls-files --error-unmatch "$wrong" >/dev/null 2>&1; then
    git rm -r --cached "$wrong" 2>/dev/null || true
    echo "  - dropped index entry: $wrong"
  fi
done
echo ""

echo "Staging canonical paths only…"
staged=0
missing=()
for id in "${IDS[@]}"; do
  dir="$WP/$id"
  stop_ok=1
  for asset in "${ASSETS[@]}"; do
    path="$dir/$asset"
    if [[ ! -f "$path" ]]; then
      stop_ok=0
      continue
    fi
    git add -f "$path"
    echo "  + $path"
    staged=$((staged + 1))
  done
  if [[ "$stop_ok" -eq 0 ]]; then
    missing+=("$id")
  fi
done

echo ""
if ((${#missing[@]})); then
  echo "Warning: incomplete stops (re-run process-expansion-waypoints): ${missing[*]}"
fi

if ((staged == 0)); then
  echo "Nothing staged. Run: npm run diagnose-expansion-waypoints"
  exit 1
fi

echo "Staged $staged file(s). Review:"
git status --short public/waypoints/
echo ""
echo "Commit:"
echo '  git commit -m "Add processed slider media for expansion stops"'
echo "  git push"
echo ""
echo "If push stops early (large videos), run git push again — it resumes."
