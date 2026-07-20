#!/usr/bin/env bash
#
# Re-encode waypoint .mp4 files for lean web delivery.
#
# - H.264 (universal iOS/Android/browser support), CRF-based quality
# - Bitrate cap to kill the over-encoded 7-12 Mbps small clips
# - Audio stripped (videos play muted; ambience is separate audio)
# - +faststart so playback can begin before full download
# - Resolution is preserved (no upscaling/downscaling)
#
# Usage:
#   scripts/compress-waypoint-videos.sh <file.mp4> [<file2.mp4> ...]   # specific files
#   scripts/compress-waypoint-videos.sh --all                          # every waypoint mp4
#   scripts/compress-waypoint-videos.sh --dry-run --all               # report only, no writes
#
# Re-encoded output replaces the original in place. Originals are tracked
# in git, so `git checkout -- <file>` restores them if needed.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WAYPOINTS="$ROOT/public/waypoints"

CRF=24
MAXRATE="2M"
BUFSIZE="4M"
PRESET="slow"
DRY_RUN=0

human() {
  awk -v b="$1" 'BEGIN{ split("B KB MB GB",u); s=1; while(b>=1024 && s<4){b/=1024; s++} printf "%.1f %s", b, u[s] }'
}

collect_files() {
  if [[ "${1:-}" == "--all" ]]; then
    find "$WAYPOINTS" -name '*.mp4' | sort
  else
    for f in "$@"; do
      [[ "$f" = /* ]] && echo "$f" || echo "$WAYPOINTS/$f"
    done
  fi
}

ARGS=()
for a in "$@"; do
  if [[ "$a" == "--dry-run" ]]; then DRY_RUN=1; else ARGS+=("$a"); fi
done

if [[ ${#ARGS[@]} -eq 0 ]]; then
  echo "Usage: $0 [--dry-run] (--all | <file.mp4> ...)" >&2
  exit 1
fi

FILES=()
while IFS= read -r line; do
  [[ -n "$line" ]] && FILES+=("$line")
done < <(collect_files "${ARGS[@]}")

total_before=0
total_after=0

printf "%-60s %12s %12s %8s\n" "FILE" "BEFORE" "AFTER" "SAVED"
printf '%.0s-' {1..94}; echo

for src in "${FILES[@]}"; do
  [[ -f "$src" ]] || { echo "skip (missing): $src" >&2; continue; }

  before=$(stat -f%z "$src" 2>/dev/null || stat -c%s "$src")
  total_before=$((total_before + before))

  rel="${src#"$WAYPOINTS"/}"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    printf "%-60s %12s %12s %8s\n" "$rel" "$(human "$before")" "-" "(dry)"
    continue
  fi

  tmp="${src%.mp4}.__opt__.mp4"
  ffmpeg -y -loglevel error -i "$src" \
    -c:v libx264 -profile:v high -pix_fmt yuv420p \
    -crf "$CRF" -preset "$PRESET" -maxrate "$MAXRATE" -bufsize "$BUFSIZE" \
    -an -movflags +faststart \
    "$tmp"

  after=$(stat -f%z "$tmp" 2>/dev/null || stat -c%s "$tmp")

  # Only keep the re-encode if it is actually smaller.
  if [[ "$after" -lt "$before" ]]; then
    mv "$tmp" "$src"
  else
    rm -f "$tmp"
    after=$before
  fi

  total_after=$((total_after + after))
  pct=$(awk -v a="$after" -v b="$before" 'BEGIN{ if(b>0) printf "%d%%", (1-a/b)*100; else print "0%" }')
  printf "%-60s %12s %12s %8s\n" "$rel" "$(human "$before")" "$(human "$after")" "$pct"
done

if [[ "$DRY_RUN" -eq 0 ]]; then
  printf '%.0s-' {1..94}; echo
  printf "%-60s %12s %12s %8s\n" "TOTAL" "$(human "$total_before")" "$(human "$total_after")" \
    "$(awk -v a="$total_after" -v b="$total_before" 'BEGIN{ if(b>0) printf "%d%%", (1-a/b)*100; else print "0%" }')"
fi
