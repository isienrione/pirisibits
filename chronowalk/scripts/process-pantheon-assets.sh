#!/usr/bin/env bash
set -euo pipefail
exec "$(dirname "$0")/process-waypoint-assets.sh" pantheon
