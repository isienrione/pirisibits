#!/usr/bin/env bash
# Normalize waypoint narration to −16 LUFS for mobile outdoor listening.
# Usage:
#   npm run normalize-audio -- colosseum arrival
#   npm run normalize-audio -- pantheon transit
# Input:  public/waypoints/<id>/<type>-raw.wav (or .mp3)
# Output: public/waypoints/<id>/<type>.mp3  (arrival.mp3 or transit.mp3)

set -euo pipefail

ID="${1:?waypoint id required}"
TYPE="${2:-arrival}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/public/waypoints/$ID"
OUT="$DIR/${TYPE}.mp3"

for ext in wav mp3 m4a; do
  RAW="$DIR/${TYPE}-raw.${ext}"
  if [[ -f "$RAW" ]]; then
    break
  fi
done

if [[ ! -f "${RAW:-}" ]]; then
  echo "Missing input: $DIR/${TYPE}-raw.{wav,mp3,m4a}"
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg required (brew install ffmpeg)"
  exit 1
fi

ffmpeg -y -i "$RAW" -af "loudnorm=I=-16:TP=-1.5:LRA=11" -ar 48000 "$OUT"
echo "Wrote $OUT"
