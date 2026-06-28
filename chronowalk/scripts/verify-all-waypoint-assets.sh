#!/usr/bin/env bash
# Verify deliverables for every tour stop in rome-core-tour.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERIFY="$ROOT/scripts/verify-waypoint-assets.sh"

# Heart of Ancient Rome stops with shipped media in repo (scaffolds excluded).
STOP_IDS=(
  colosseum
  capitoline-hill
  pantheon
  fontana-di-trevi
  largo-argentina
  campo-de-fiori
  piazza-navona
  castel-sant-angelo
)

failed=0
for stop_id in "${STOP_IDS[@]}"; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Checking $stop_id"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  if ! bash "$VERIFY" "$stop_id"; then
    failed=$((failed + 1))
  fi
done

echo ""
if (( failed > 0 )); then
  echo "$failed stop(s) failed asset verification."
  exit 1
fi

echo "All tour waypoint assets are ready."
