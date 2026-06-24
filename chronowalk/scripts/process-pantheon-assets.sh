#!/usr/bin/env bash
# Process Pantheon AI deliverables into public/waypoints/pantheon/
# Drop source files in incoming/ then run from chronowalk/: npm run process-pantheon
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WAYPOINT_DIR="$ROOT/public/waypoints/pantheon"
INCOMING="$WAYPOINT_DIR/incoming"
POSTER_SEC="${POSTER_SEC:-3}"

mkdir -p "$INCOMING"

find_source() {
  local kind="$1"
  local found=""

  if [[ "$kind" == "ancient" ]]; then
    for pattern in ancient-source.mp4 '*Ancient*Pantheon*.mp4' '*ancient*.mp4'; do
      for candidate in "$INCOMING"/$pattern; do
        [[ -f "$candidate" ]] || continue
        found="$candidate"
        break 2
      done
    done
  else
    for pattern in modern-source.mp4 'now_from_that*.mp4' '*modern*.mp4'; do
      for candidate in "$INCOMING"/$pattern; do
        [[ -f "$candidate" ]] || continue
        [[ "$candidate" == *ancient* || "$candidate" == *Ancient* ]] && continue
        found="$candidate"
        break 2
      done
    done
  fi

  printf '%s' "$found"
}

require_ffmpeg() {
  if command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; then
    return 0
  fi

  cat >&2 <<'EOF'
ffmpeg is required (includes ffprobe).

Install on macOS (Homebrew):
  brew install ffmpeg

Then verify:
  ffmpeg -version
  ffprobe -version

Re-run:
  npm run process-pantheon
EOF
  exit 1
}

video_dims() {
  ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$1"
}

poster_dims_from_video() {
  local video="$1"
  local width height

  IFS=, read -r width height < <(video_dims "$video")
  if (( width * 9 > height * 16 )); then
    printf '%s %s' "$width" $(( width * 9 / 16 ))
  else
    printf '%s %s' $(( height * 16 / 9 )) "$height"
  fi
}

extract_poster() {
  local video="$1"
  local output="$2"
  local poster_w="$3"
  local poster_h="$4"
  local src_w src_h

  IFS=, read -r src_w src_h < <(video_dims "$video")

  if (( src_w == src_h )); then
    ffmpeg -y -hide_banner -loglevel error -ss "$POSTER_SEC" -i "$video" -frames:v 1 -update 1 \
      -vf "scale=-2:${poster_h}:flags=lanczos,pad=${poster_w}:${poster_h}:(ow-iw)/2:(oh-ih)/2:black" \
      -q:v 2 "$output"
  else
    ffmpeg -y -hide_banner -loglevel error -ss "$POSTER_SEC" -i "$video" -frames:v 1 -update 1 \
      -vf "scale=${poster_w}:${poster_h}:force_original_aspect_ratio=increase,crop=${poster_w}:${poster_h}" \
      -q:v 2 "$output"
  fi
}

require_ffmpeg

ANCIENT_SRC="$(find_source ancient)"
MODERN_SRC="$(find_source modern)"

if [[ -z "$ANCIENT_SRC" || -z "$MODERN_SRC" ]]; then
  cat >&2 <<EOF
Missing source videos in $INCOMING

Expected (any one name per row):
  Ancient: ancient-source.mp4  OR  *Ancient*Pantheon*.mp4
  Modern:  modern-source.mp4   OR  now_from_that*.mp4

Copy from Downloads, e.g.:
  cp "/Users/isidora/Downloads/isienrione_Ancient_Rome_reconstruction_of_The_Pantheon_exact__752036de-6a85-46e7-ba35-d8a4415133f1_0.mp4" \\
     "$INCOMING/ancient-source.mp4"
  cp "/Users/isidora/Downloads/now_from_that_image_make_a_mi (1).mp4" \\
     "$INCOMING/modern-source.mp4"

The script maps by content (not Runway filename):
  ancient-source / *Ancient*Pantheon*  →  modern.mp4  (today's piazza)
  modern-source / now_from_that*       →  ancient-reconstruction.mp4

Then run: npm run process-pantheon
EOF
  exit 1
fi

echo "Ancient-tagged source: $ANCIENT_SRC"
echo "Modern-tagged source:  $MODERN_SRC"

# Runway/Midjourney filenames are misleading for Pantheon:
#   *Ancient*Pantheon*  → animated modern piazza (today)
#   now_from_that*      → ancient reconstruction animation
# Map by content, not by download filename.
cp "$ANCIENT_SRC" "$WAYPOINT_DIR/modern.mp4"
cp "$MODERN_SRC" "$WAYPOINT_DIR/ancient-reconstruction.mp4"

# Still fallback — first frame of ancient clip (pre-motion)
ffmpeg -y -hide_banner -loglevel error -ss 0 -i "$WAYPOINT_DIR/ancient-reconstruction.mp4" -frames:v 1 -update 1 \
  -vf "scale=1280:-2:flags=lanczos" -q:v 2 "$WAYPOINT_DIR/ancient-reconstruction.jpg"

IFS=' ' read -r POSTER_W POSTER_H <<< "$(poster_dims_from_video "$WAYPOINT_DIR/modern.mp4")"
echo "Poster size: ${POSTER_W}x${POSTER_H} at ${POSTER_SEC}s"

extract_poster "$WAYPOINT_DIR/modern.mp4" "$WAYPOINT_DIR/modern-poster.jpg" "$POSTER_W" "$POSTER_H"
extract_poster "$WAYPOINT_DIR/ancient-reconstruction.mp4" "$WAYPOINT_DIR/ancient-poster.jpg" "$POSTER_W" "$POSTER_H"

echo ""
echo "Done. Deliverables in $WAYPOINT_DIR:"
shopt -s nullglob
for asset in "$WAYPOINT_DIR"/*.mp4 "$WAYPOINT_DIR"/*.jpg; do
  [[ -f "$asset" ]] || continue
  ls -lh "$asset" | awk '{print "  " $9, "(" $5 ")"}'
done
