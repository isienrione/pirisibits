#!/usr/bin/env bash
# Process AI deliverables into public/waypoints/<id>/
# Usage: npm run process-waypoint -- <waypoint-id>
# Optional: SWAP_RUNWAY=1 when Runway filenames disagree with content (Pantheon quirk)
set -euo pipefail

WAYPOINT_ID="${1:-}"
if [[ -z "$WAYPOINT_ID" ]]; then
  echo "Usage: npm run process-waypoint -- <waypoint-id>" >&2
  echo "Example: npm run process-waypoint -- piazza-navona" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/waypoint-incoming.sh
source "$ROOT/scripts/lib/waypoint-incoming.sh"
WAYPOINT_DIR="$(waypoint_deliverable_dir "$ROOT/public/waypoints" "$WAYPOINT_ID")"
INCOMING="$WAYPOINT_DIR/incoming"
POSTER_SEC="${POSTER_SEC:-3}"
SWAP_RUNWAY="${SWAP_RUNWAY:-0}"

incoming_sync_canonical_names "$ROOT/public/waypoints" "$WAYPOINT_ID" 2>/dev/null || true
if [[ "$WAYPOINT_ID" == "colosseum" ]]; then
  incoming_migrate_legacy_colosseum "$ROOT/public/waypoints"
fi

mkdir -p "$INCOMING"

find_source() {
  local kind="$1"
  local pair modern ancient

  if waypoint_is_modern_video_only "$WAYPOINT_ID" && [[ "$kind" == "modern" ]]; then
    if modern="$(incoming_find_modern_for_waypoint "$ROOT/public/waypoints" "$WAYPOINT_ID")"; then
      printf '%s' "$modern"
      return 0
    fi
  fi

  if pair="$(incoming_find_pair_for_waypoint "$ROOT/public/waypoints" "$WAYPOINT_ID")"; then
    modern="${pair%%|*}"
    ancient="${pair#*|}"
    if [[ "$kind" == "ancient" ]]; then
      printf '%s' "$ancient"
    else
      printf '%s' "$modern"
    fi
    return 0
  fi

  local found=""
  local search_dir=""
  for search_dir in "$INCOMING" "$ROOT/public/waypoints/$WAYPOINT_ID/incoming"; do
    [[ -d "$search_dir" ]] || continue
    if [[ "$kind" == "ancient" ]]; then
      for pattern in ancient-source.mp4 '*Ancient*.mp4' '*ancient*.mp4'; do
        for candidate in "$search_dir"/$pattern; do
          [[ -f "$candidate" ]] || continue
          found="$candidate"
          break 3
        done
      done
    else
      for pattern in modern-source.mp4 'now_from_that*.mp4' '*modern*.mp4'; do
        for candidate in "$search_dir"/$pattern; do
          [[ -f "$candidate" ]] || continue
          [[ "$candidate" == *ancient* || "$candidate" == *Ancient* ]] && continue
          found="$candidate"
          break 3
        done
      done
    fi
  done

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
  npm run process-waypoint -- <waypoint-id>
EOF
  exit 1
}

# Slider frame background — pad tall/square Gemini exports to 16:9 without cropping sky/facade
PAD_COLOR="0x0c0a09"

video_dims() {
  ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$1"
}

is_16x9_video() {
  local w="$1"
  local h="$2"
  # ~2% tolerance around 16:9
  (( h > 0 && w * 9 * 100 >= h * 16 * 98 && w * 9 * 100 <= h * 16 * 102 ))
}

# Tall/square sources: fit full height, pad sides. Wide sources: crop sides only.
build_16x9_vf() {
  local src_w="$1"
  local src_h="$2"
  local out_w="$3"
  local out_h="$4"

  if is_16x9_video "$src_w" "$src_h"; then
    printf 'scale=%s:%s' "$out_w" "$out_h"
    return 0
  fi

  if (( src_w * 9 < src_h * 16 )); then
    printf 'scale=-2:%s:flags=lanczos,pad=%s:%s:(ow-iw)/2:(oh-ih)/2:color=%s' \
      "$out_h" "$out_w" "$out_h" "$PAD_COLOR"
    return 0
  fi

  printf 'scale=%s:%s:force_original_aspect_ratio=increase,crop=%s:%s' \
    "$out_w" "$out_h" "$out_w" "$out_h"
}

encode_video_16x9() {
  local input="$1"
  local output="$2"
  local src_w src_h vf
  local out_w=1280
  local out_h=720

  IFS=, read -r src_w src_h < <(video_dims "$input")

  if is_16x9_video "$src_w" "$src_h"; then
    cp -f "$input" "$output"
    echo "  $(basename "$output"): already 16:9 (${src_w}x${src_h})"
    return 0
  fi

  vf="$(build_16x9_vf "$src_w" "$src_h" "$out_w" "$out_h")"
  if [[ "$vf" == *pad=* ]]; then
    echo "  $(basename "$output"): fit-height ${src_w}x${src_h} → ${out_w}x${out_h} (preserve vertical, pad sides)"
  else
    echo "  $(basename "$output"): crop ${src_w}x${src_h} → ${out_w}x${out_h}"
  fi

  ffmpeg -y -hide_banner -loglevel error -i "$input" \
    -vf "$vf" \
    -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -an -movflags +faststart \
    "$output"
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
  local src_w src_h vf

  IFS=, read -r src_w src_h < <(video_dims "$video")
  vf="$(build_16x9_vf "$src_w" "$src_h" "$poster_w" "$poster_h")"

  ffmpeg -y -hide_banner -loglevel error -ss "$POSTER_SEC" -i "$video" -frames:v 1 -update 1 \
    -vf "$vf" \
    -q:v 2 "$output"
}

require_ffmpeg

ANCIENT_SRC="$(find_source ancient)"
MODERN_SRC="$(find_source modern)"
MODERN_ONLY=0
if waypoint_is_modern_video_only "$WAYPOINT_ID"; then
  MODERN_ONLY=1
fi

if [[ -z "$MODERN_SRC" && -f "$WAYPOINT_DIR/modern.mp4" ]]; then
  MODERN_SRC="$WAYPOINT_DIR/modern.mp4"
  echo "Using existing deliverable: $WAYPOINT_DIR/modern.mp4"
fi
if [[ -z "$ANCIENT_SRC" && -f "$WAYPOINT_DIR/ancient-reconstruction.mp4" ]]; then
  ANCIENT_SRC="$WAYPOINT_DIR/ancient-reconstruction.mp4"
  echo "Using existing deliverable: $WAYPOINT_DIR/ancient-reconstruction.mp4"
fi

if [[ "$MODERN_ONLY" == "1" ]]; then
  if [[ -z "$MODERN_SRC" ]]; then
    cat >&2 <<EOF
Missing modern source video for $WAYPOINT_ID (modern-video-only stop — no ancient clip needed).

Looked in:
  - $INCOMING

Drop one file here:
  public/waypoints/$WAYPOINT_ID/incoming/modern-source.mp4

Also accepted names: now_from_that*.mp4, *modern*.mp4 (not ancient/reconstruction)

Or copy finished deliverables directly (skip ffmpeg):
  cp public/waypoints/$WAYPOINT_ID/local-backup/modern.mp4 public/waypoints/$WAYPOINT_ID/
  cp public/waypoints/$WAYPOINT_ID/local-backup/modern-exterior.jpg public/waypoints/$WAYPOINT_ID/

Then run: npm run process-waypoint -- $WAYPOINT_ID
EOF
    exit 1
  fi
elif [[ -z "$ANCIENT_SRC" || -z "$MODERN_SRC" ]]; then
  LEGACY_INCOMING="$ROOT/public/waypoints/$WAYPOINT_ID/incoming"
  cat >&2 <<EOF
Missing source videos for $WAYPOINT_ID.

Looked in:
  - $INCOMING
  - $LEGACY_INCOMING

Drop files here (Colosseum uses exterior/incoming):
  $( [[ "$WAYPOINT_ID" == "colosseum" ]] && echo "  public/waypoints/colosseum/exterior/incoming/" )

Expected (one file per row):
  Ancient era: ancient-source.mp4  OR  *Ancient*.mp4
  Modern era:  modern-source.mp4   OR  now_from_that*.mp4

To update only the ancient clip, keep modern-source.mp4 out of incoming —
the script will reuse the existing modern.mp4 in $WAYPOINT_DIR.

Default mapping (name = content):
  ancient-source  →  ancient-reconstruction.mp4
  modern-source   →  modern.mp4

Pantheon-only Runway mislabels? Use: SWAP_RUNWAY=1 npm run process-pantheon

Then run: npm run process-waypoint -- $WAYPOINT_ID
EOF
  exit 1
fi

echo "Waypoint: $WAYPOINT_ID"
if [[ "$MODERN_ONLY" == "1" ]]; then
  echo "Mode: modern video only (no ancient reconstruction)"
fi
if [[ -n "$ANCIENT_SRC" ]]; then
  echo "Ancient-era source: $ANCIENT_SRC"
fi
echo "Modern-era source:  $MODERN_SRC"

if [[ "$MODERN_ONLY" == "1" ]]; then
  echo "Mapping: modern → modern.mp4"
  if [[ "$MODERN_SRC" != "$WAYPOINT_DIR/modern.mp4" ]]; then
    encode_video_16x9 "$MODERN_SRC" "$WAYPOINT_DIR/modern.mp4"
  else
    echo "  modern.mp4: unchanged (already the deliverable)"
  fi

  IFS=' ' read -r POSTER_W POSTER_H <<< "$(poster_dims_from_video "$WAYPOINT_DIR/modern.mp4")"
  echo "Poster size: ${POSTER_W}x${POSTER_H} at ${POSTER_SEC}s"
  extract_poster "$WAYPOINT_DIR/modern.mp4" "$WAYPOINT_DIR/modern-poster.jpg" "$POSTER_W" "$POSTER_H"
elif [[ "$SWAP_RUNWAY" == "1" ]]; then
  echo "Mapping: SWAP_RUNWAY=1 (ancient-tagged file → modern.mp4, modern-tagged → ancient)"
  if [[ "$ANCIENT_SRC" != "$WAYPOINT_DIR/modern.mp4" ]]; then
    encode_video_16x9 "$ANCIENT_SRC" "$WAYPOINT_DIR/modern.mp4"
  else
    echo "  modern.mp4: unchanged (already the deliverable)"
  fi
  if [[ "$MODERN_SRC" != "$WAYPOINT_DIR/ancient-reconstruction.mp4" ]]; then
    encode_video_16x9 "$MODERN_SRC" "$WAYPOINT_DIR/ancient-reconstruction.mp4"
  else
    echo "  ancient-reconstruction.mp4: unchanged (already the deliverable)"
  fi
else
  echo "Mapping: literal (ancient → ancient-reconstruction.mp4, modern → modern.mp4)"
  if [[ "$MODERN_SRC" != "$WAYPOINT_DIR/modern.mp4" ]]; then
    encode_video_16x9 "$MODERN_SRC" "$WAYPOINT_DIR/modern.mp4"
  else
    echo "  modern.mp4: unchanged (already the deliverable)"
  fi
  if [[ "$ANCIENT_SRC" != "$WAYPOINT_DIR/ancient-reconstruction.mp4" ]]; then
    encode_video_16x9 "$ANCIENT_SRC" "$WAYPOINT_DIR/ancient-reconstruction.mp4"
  else
    echo "  ancient-reconstruction.mp4: unchanged (already the deliverable)"
  fi
fi

if [[ "$MODERN_ONLY" != "1" ]]; then
  ffmpeg -y -hide_banner -loglevel error -ss 0 -i "$WAYPOINT_DIR/ancient-reconstruction.mp4" -frames:v 1 -update 1 \
    -vf "scale=1280:720" -q:v 2 "$WAYPOINT_DIR/ancient-reconstruction.jpg"

  IFS=' ' read -r POSTER_W POSTER_H <<< "$(poster_dims_from_video "$WAYPOINT_DIR/modern.mp4")"
  echo "Poster size: ${POSTER_W}x${POSTER_H} at ${POSTER_SEC}s"

  extract_poster "$WAYPOINT_DIR/modern.mp4" "$WAYPOINT_DIR/modern-poster.jpg" "$POSTER_W" "$POSTER_H"
  extract_poster "$WAYPOINT_DIR/ancient-reconstruction.mp4" "$WAYPOINT_DIR/ancient-poster.jpg" "$POSTER_W" "$POSTER_H"
fi

echo ""
echo "Done. Deliverables in $WAYPOINT_DIR:"
shopt -s nullglob
for asset in "$WAYPOINT_DIR"/*.mp4 "$WAYPOINT_DIR"/*.jpg; do
  [[ -f "$asset" ]] || continue
  ls -lh "$asset" | awk '{print "  " $9, "(" $5 ")"}'
done

if [[ ! -f "$WAYPOINT_DIR/modern-exterior.jpg" ]]; then
  echo ""
  echo "Still required: modern-exterior.jpg (Street View export at viewpoint)"
fi

echo ""
echo "Verify: npm run verify-waypoint -- $WAYPOINT_ID"
if [[ "$MODERN_ONLY" != "1" && "$SWAP_RUNWAY" != "1" ]]; then
  echo "If modern/ancient look swapped in the app, re-run with SWAP_RUNWAY=1"
fi
