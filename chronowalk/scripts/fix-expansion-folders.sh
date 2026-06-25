#!/usr/bin/env bash
# Organize expansion waypoint media (Mac-safe: case-insensitive APFS, wrong folder names).
# Run from chronowalk/:  npm run fix-expansion-folders
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/waypoint-incoming.sh
source "$ROOT/scripts/lib/waypoint-incoming.sh"
WP="$ROOT/public/waypoints"

safe_cp() {
  local src="$1"
  local dest="$2"
  [[ -f "$src" ]] || return 0
  mkdir -p "$(dirname "$dest")"
  if [[ -f "$dest" ]] && cmp -s "$src" "$dest" 2>/dev/null; then
    echo "   ✓ already $(basename "$dest")"
    return 0
  fi
  cp -f "$src" "$dest"
  echo "   → $(basename "$dest")"
}

classify_mp4() {
  local name
  name="$(basename "$1" | tr '[:upper:]' '[:lower:]')"
  if [[ "$name" == *ancient* ]]; then
    echo "ancient"
  elif [[ "$name" == *modern* ]] || [[ "$name" == now_from* ]]; then
    echo "modern"
  elif [[ "$name" == modern-source.mp4 ]]; then
    echo "modern"
  elif [[ "$name" == ancient-source.mp4 ]]; then
    echo "ancient"
  else
    echo "unknown"
  fi
}

# id | space-separated folder name aliases (wrong names users create)
WAYPOINTS=(
  "capitoline-hill|Capitoline-Hill capitoline-hill"
  "campo-de-fiori|Campo-de-fiori campo-de-fiori"
  "castel-sant-angelo|Castel-Sant-Angelo castel-sant-angelo"
  "largo-argentina|Largo_argentina Largo-Argentina largo-argentina Largo_Argentina"
)

organize_waypoint() {
  local id="$1"
  local aliases="$2"
  local dest="$WP/$id"

  echo ""
  echo "========== $id =========="
  mkdir -p "$dest/incoming"

  local seen_dirs=""
  for alias in $aliases; do
    local dir="$WP/$alias"
    [[ -d "$dir" ]] || continue
    # avoid processing same inode twice on case-insensitive Mac
    local real
    real="$(cd "$dir" && pwd -P)"
    if [[ "$seen_dirs" == *"|$real|"* ]]; then
      continue
    fi
    seen_dirs="${seen_dirs}|$real|"
    echo "Scanning: $alias/"

  while IFS= read -r -d '' f; do
    [[ -f "$f" ]] || continue
    local base lower ext
    base="$(basename "$f")"
    lower="$(echo "$base" | tr '[:upper:]' '[:lower:]')"
    ext="${lower##*.}"

    case "$ext" in
      mp4|mov)
        local kind
        kind="$(classify_mp4 "$f")"
        if [[ "$kind" == "modern" ]]; then
          safe_cp "$f" "$dest/incoming/modern-source.mp4"
        elif [[ "$kind" == "ancient" ]]; then
          safe_cp "$f" "$dest/incoming/ancient-source.mp4"
        else
          echo "   ? unknown MP4 (rename to *modern* or *ancient*): $base"
        fi
        ;;
      jpg|jpeg)
        if [[ "$lower" == modern-exterior* ]] || [[ "$lower" == *poster* && "$lower" != *ancient* ]]; then
          if [[ "$lower" == *poster* ]]; then
            safe_cp "$f" "$dest/modern-poster.jpg"
          else
            safe_cp "$f" "$dest/modern-exterior.jpg"
          fi
        elif [[ "$lower" == ancient-reconstruction* ]] || [[ "$lower" == *ancient*poster* ]]; then
          if [[ "$lower" == *poster* ]]; then
            safe_cp "$f" "$dest/ancient-poster.jpg"
          else
            safe_cp "$f" "$dest/ancient-reconstruction.jpg"
          fi
        else
          echo "   ? image (use modern-exterior.jpg name or Gemini PNG): $base"
        fi
        ;;
      png)
        if [[ "$lower" == gemini_generated_image* ]] || [[ "$lower" == modern-exterior* ]]; then
          safe_cp "$f" "$dest/modern-exterior.jpg"
        else
          echo "   ? PNG: $base (rename or export as modern-exterior.jpg)"
        fi
        ;;
    esac
  done < <(find "$dir" -type f \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) ! -path '*/node_modules/*' -print0 2>/dev/null)

  done

  # Fix typo modern-poster.pg.jpg
  if [[ -f "$dest/modern-poster.pg.jpg" ]] && [[ ! -f "$dest/modern-poster.jpg" ]]; then
    mv "$dest/modern-poster.pg.jpg" "$dest/modern-poster.jpg"
    echo "   → renamed modern-poster.pg.jpg"
  fi

  # Status — sync any MP4 pair (any filename) into canonical incoming/ names
  incoming_sync_canonical_names "$WP" "$id" || true

  [[ -f "$dest/modern-exterior.jpg" ]] && echo "  ✓ modern-exterior.jpg" || echo "  ✗ need modern-exterior.jpg at root"
  if [[ -f "$dest/incoming/modern-source.mp4" ]]; then
    echo "  ✓ incoming/modern-source.mp4"
  elif [[ -f "$dest/modern.mp4" ]]; then
    echo "  ✓ modern.mp4 (already processed)"
  else
    echo "  ✗ need MP4 → incoming/modern-source.mp4 (filename must contain 'modern' or 'now_from')"
  fi
  if [[ -f "$dest/incoming/ancient-source.mp4" ]]; then
    echo "  ✓ incoming/ancient-source.mp4"
  elif [[ -f "$dest/ancient-reconstruction.mp4" ]]; then
    echo "  ✓ ancient-reconstruction.mp4 (already processed)"
  else
    echo "  ✗ need MP4 → incoming/ancient-source.mp4 (filename must contain 'ancient')"
  fi
}

cd "$ROOT"

echo "ChronoWalk — organize expansion waypoint folders"
echo "(Mac note: Campo-de-fiori and campo-de-fiori are the same folder on case-insensitive disks)"

for entry in "${WAYPOINTS[@]}"; do
  id="${entry%%|*}"
  aliases="${entry#*|}"
  organize_waypoint "$id" "$aliases"
done

echo ""
echo "========== Loose MP4s in public/ (assign manually) =========="
shopt -s nullglob
loose=(public/*.mp4 public/*.mov)
if ((${#loose[@]})); then
  for f in "${loose[@]}"; do
    echo "  $f"
  done
  echo "  Copy each to the right stop's incoming/ as modern-source.mp4 or ancient-source.mp4"
  echo "  Or: npm run place-expansion-mp4 -- <stop-id> modern|ancient <file>"
else
  echo "  (none)"
fi

echo ""
echo "Next:"
echo "  npm run process-expansion-waypoints"
echo "  npm run diagnose-expansion-waypoints   # if still stuck"
echo ""
echo "Git (from chronowalk/):"
echo "  git add public/waypoints/capitoline-hill public/waypoints/largo-argentina public/waypoints/campo-de-fiori public/waypoints/castel-sant-angelo"
