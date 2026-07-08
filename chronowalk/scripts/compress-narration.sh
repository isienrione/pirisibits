#!/usr/bin/env bash
#
# Re-encode narration MP3s for lean delivery.
# Spoken-word voice: 96 kbps mono is transparent and roughly halves 192 kbps files.
#
# Usage:
#   scripts/compress-narration.sh            # all narration mp3s
#   scripts/compress-narration.sh a.mp3 b.mp3  # specific files (names under narration dir)
#
# Re-encoded output replaces the original only if it is smaller. Originals are
# tracked in git, so `git checkout -- <file>` restores them if needed.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NARR="$ROOT/public/rome/audio/narration"
BITRATE="96k"

human() {
  awk -v b="$1" 'BEGIN{ split("B KB MB GB",u); s=1; while(b>=1024 && s<4){b/=1024; s++} printf "%.1f %s", b, u[s] }'
}

FILES=()
if [[ $# -gt 0 ]]; then
  for f in "$@"; do FILES+=("$NARR/$f"); done
else
  while IFS= read -r line; do [[ -n "$line" ]] && FILES+=("$line"); done < <(find "$NARR" -name '*.mp3' | sort)
fi

total_before=0
total_after=0
printf "%-24s %12s %12s %8s\n" "FILE" "BEFORE" "AFTER" "SAVED"
printf '%.0s-' {1..60}; echo

for src in "${FILES[@]}"; do
  [[ -f "$src" ]] || { echo "skip (missing): $src" >&2; continue; }
  before=$(stat -f%z "$src" 2>/dev/null || stat -c%s "$src")
  total_before=$((total_before + before))

  tmp="${src%.mp3}.__opt__.mp3"
  ffmpeg -y -loglevel error -i "$src" \
    -c:a libmp3lame -b:a "$BITRATE" -ac 1 -ar 44100 \
    "$tmp"

  after=$(stat -f%z "$tmp" 2>/dev/null || stat -c%s "$tmp")
  if [[ "$after" -lt "$before" ]]; then
    mv "$tmp" "$src"
  else
    rm -f "$tmp"; after=$before
  fi
  total_after=$((total_after + after))
  pct=$(awk -v a="$after" -v b="$before" 'BEGIN{ if(b>0) printf "%d%%", (1-a/b)*100; else print "0%" }')
  printf "%-24s %12s %12s %8s\n" "$(basename "$src")" "$(human "$before")" "$(human "$after")" "$pct"
done

printf '%.0s-' {1..60}; echo
printf "%-24s %12s %12s %8s\n" "TOTAL" "$(human "$total_before")" "$(human "$total_after")" \
  "$(awk -v a="$total_after" -v b="$total_before" 'BEGIN{ if(b>0) printf "%d%%", (1-a/b)*100; else print "0%" }')"
