#!/usr/bin/env bash
# Pantheon Runway exports use misleading filenames — enable swap mapping.
set -euo pipefail
exec env SWAP_RUNWAY=1 "$(dirname "$0")/process-waypoint-assets.sh" pantheon
