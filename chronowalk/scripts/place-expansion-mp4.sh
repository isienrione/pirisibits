#!/usr/bin/env bash
# Copy one Gemini / Runway MP4 into a stop's incoming/ folder with the correct name.
# Usage: npm run place-expansion-mp4 -- <waypoint-id> <modern|ancient> <path-to-file>
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ID="${1:-}"
KIND="${2:-}"
SRC="${3:-}"

if [[ -z "$ID" || -z "$KIND" || -z "$SRC" ]]; then
  echo "Usage: npm run place-expansion-mp4 -- <waypoint-id> <modern|ancient> <path-to-file>" >&2
  echo "" >&2
  echo "Examples:" >&2
  echo "  npm run place-expansion-mp4 -- campo-de-fiori modern \"public/now_from_that_image_make_a_mi (1).mp4\"" >&2
  echo "  npm run place-expansion-mp4 -- largo-argentina ancient ~/Downloads/largo-ancient.mp4" >&2
  exit 1
fi

case "$KIND" in
  modern|ancient) ;;
  *)
    echo "Second argument must be 'modern' or 'ancient', got: $KIND" >&2
    exit 1
    ;;
esac

if [[ "$SRC" != /* ]]; then
  SRC="$ROOT/$SRC"
fi

if [[ ! -f "$SRC" ]]; then
  echo "File not found: $SRC" >&2
  exit 1
fi

DEST_DIR="$ROOT/public/waypoints/$ID/incoming"
mkdir -p "$DEST_DIR"

if [[ "$KIND" == "modern" ]]; then
  DEST="$DEST_DIR/modern-source.mp4"
else
  DEST="$DEST_DIR/ancient-source.mp4"
fi

cp -f "$SRC" "$DEST"
echo "✓ $ID: $(basename "$SRC") → incoming/$(basename "$DEST")"
echo "  Run: npm run process-waypoint -- $ID"
