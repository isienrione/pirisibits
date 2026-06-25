#!/usr/bin/env bash
# Remove duplicate alias waypoint folders from disk (after media is in canonical lowercase id/).
# Safe on Mac: does NOT delete case-only aliases (Campo-de-fiori == campo-de-fiori same folder).
# Run from chronowalk/:  npm run cleanup-expansion-folders
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/waypoint-incoming.sh
source "$ROOT/scripts/lib/waypoint-incoming.sh"

cd "$ROOT"
WP="public/waypoints"
IDS=(capitoline-hill largo-argentina campo-de-fiori castel-sant-angelo)
ASSETS=(modern.mp4 ancient-reconstruction.mp4 modern-exterior.jpg)

canon_has_core_assets() {
  local dir="$1"
  local asset
  for asset in "${ASSETS[@]}"; do
    [[ -f "$dir/$asset" ]] || return 1
  done
  return 0
}

is_case_only_alias() {
  local id="$1"
  local alias="$2"
  [[ "$(echo "$id" | tr '[:upper:]' '[:lower:]')" == "$(echo "$alias" | tr '[:upper:]' '[:lower:]')" ]]
}

echo "Cleaning duplicate alias folders (disk only)…"
echo ""

removed=0
for id in "${IDS[@]}"; do
  canon="$WP/$id"
  if ! canon_has_core_assets "$canon"; then
    echo "Skip $id — canonical folder missing core assets"
    continue
  fi

  aliases="$(incoming_aliases_for "$id")"
  for alias in $aliases; do
    dir="$WP/$alias"
    [[ -d "$dir" ]] || continue
    if is_case_only_alias "$id" "$alias"; then
      continue
    fi
    real_canon="$(cd "$canon" && pwd -P)"
    real_alias="$(cd "$dir" && pwd -P)"
    if [[ "$real_canon" == "$real_alias" ]]; then
      continue
    fi
    rm -rf "$dir"
    echo "  ✓ removed $dir (canonical: $canon)"
    removed=$((removed + 1))
  done
done

echo ""
if ((removed == 0)); then
  echo "Nothing to remove. Run git status — remaining ?? lines may be loose exports (ignored by .gitignore)."
else
  echo "Removed $removed duplicate folder(s). Run: git status"
fi
