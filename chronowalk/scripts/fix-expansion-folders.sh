#!/usr/bin/env bash
# Rename / merge wrongly cased waypoint folders into app ids, then process incoming MP4s.
# Run from chronowalk/:  npm run fix-expansion-folders
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WP="$ROOT/public/waypoints"

merge_folder() {
  local src_name="$1"
  local dest_id="$2"
  local src="$WP/$src_name"
  local dest="$WP/$dest_id"

  [[ -d "$src" ]] || return 0

  echo ""
  echo "→ Merging $src_name → $dest_id/"
  mkdir -p "$dest/incoming"

  shopt -s nullglob
  for f in "$src"/*; do
    [[ -e "$f" ]] || continue
    local base
    base="$(basename "$f")"

    if [[ "$base" == "incoming" && -d "$f" ]]; then
      for inf in "$f"/*; do
        [[ -e "$inf" ]] || continue
        local inbase
        inbase="$(basename "$inf")"
        case "$inbase" in
          modern-source.mp4|*modern*.mp4|*Modern*.mp4)
            cp -f "$inf" "$dest/incoming/modern-source.mp4"
            echo "   incoming: modern-source.mp4"
            ;;
          ancient-source.mp4|*ancient*.mp4|*Ancient*.mp4)
            cp -f "$inf" "$dest/incoming/ancient-source.mp4"
            echo "   incoming: ancient-source.mp4"
            ;;
          modern-exterior.jpg|modern-exterior.png|modern-exterior.jpeg)
            cp -f "$inf" "$dest/modern-exterior.jpg"
            echo "   modern-exterior.jpg"
            ;;
          ancient-reconstruction.jpg)
            cp -f "$inf" "$dest/ancient-reconstruction.jpg"
            echo "   ancient-reconstruction.jpg"
            ;;
          *)
            echo "   (skip incoming/$inbase)"
            ;;
        esac
      done
      continue
    fi

    case "$base" in
      modern-source.mp4|*modern*.mp4|*Modern*.mp4)
        [[ "$base" == *ancient* || "$base" == *Ancient* ]] && continue
        cp -f "$f" "$dest/incoming/modern-source.mp4"
        echo "   → incoming/modern-source.mp4"
        ;;
      ancient-source.mp4|*ancient*.mp4|*Ancient*.mp4)
        cp -f "$f" "$dest/incoming/ancient-source.mp4"
        echo "   → incoming/ancient-source.mp4"
        ;;
      modern-exterior.jpg|modern-exterior.png|modern-exterior.jpeg|Gemini_Generated_Image*)
        cp -f "$f" "$dest/modern-exterior.jpg"
        echo "   modern-exterior.jpg"
        ;;
      ancient-reconstruction.jpg)
        cp -f "$f" "$dest/ancient-reconstruction.jpg"
        echo "   ancient-reconstruction.jpg"
        ;;
      modern-poster.jpg|modern-poster.pg.jpg)
        cp -f "$f" "$dest/modern-poster.jpg"
        echo "   modern-poster.jpg (copied; process-waypoint will regenerate)"
        ;;
      ancient-poster.jpg)
        cp -f "$f" "$dest/ancient-poster.jpg"
        echo "   ancient-poster.jpg"
        ;;
      Audio_sample.mp3|geocache-arrival-alert.wav|README.md|.DS_Store)
        ;;
      *)
        echo "   (left in $src_name/: $base — move manually if needed)"
        ;;
    esac
  done

  echo "   Done merging $src_name (you can delete $src_name/ after verifying)"
}

cd "$ROOT"

# Wrong folder names → correct waypoint ids (lowercase kebab-case)
merge_folder "Campo-de-fiori" "campo-de-fiori"
merge_folder "campo-de-fiori" "campo-de-fiori"
merge_folder "Capitoline-Hill" "capitoline-hill"
merge_folder "capitoline-hill" "capitoline-hill"
merge_folder "Castel-Sant-Angelo" "castel-sant-angelo"
merge_folder "castel-sant-angelo" "castel-sant-angelo"
merge_folder "Largo_argentina" "largo-argentina"
merge_folder "Largo-Argentina" "largo-argentina"
merge_folder "largo-argentina" "largo-argentina"

echo ""
echo "========== Status =========="
for id in capitoline-hill largo-argentina campo-de-fiori castel-sant-angelo; do
  echo ""
  echo "$id:"
  [[ -f "$WP/$id/modern-exterior.jpg" ]] && echo "  ✓ modern-exterior.jpg" || echo "  ✗ missing modern-exterior.jpg (root)"
  [[ -f "$WP/$id/incoming/modern-source.mp4" ]] && echo "  ✓ incoming/modern-source.mp4" || echo "  ✗ missing incoming/modern-source.mp4"
  [[ -f "$WP/$id/incoming/ancient-source.mp4" ]] && echo "  ✓ incoming/ancient-source.mp4" || echo "  ✗ missing incoming/ancient-source.mp4"
done

echo ""
echo "Next:"
echo "  npm run process-expansion-waypoints"
echo "  git add public/waypoints/capitoline-hill public/waypoints/largo-argentina public/waypoints/campo-de-fiori public/waypoints/castel-sant-angelo"
echo ""
echo "Run git commands from chronowalk/ (NOT scripts/)."
