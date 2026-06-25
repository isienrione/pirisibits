#!/usr/bin/env bash
# Shared helpers: find expansion waypoint incoming/ dirs and classify MP4 pairs.
# Source from other scripts:  source "$(dirname "$0")/lib/waypoint-incoming.sh"

WAYPOINT_INCOMING_ALIASES=(
  "capitoline-hill|Capitoline-Hill capitoline-hill"
  "campo-de-fiori|Campo-de-fiori campo-de-fiori"
  "castel-sant-angelo|Castel-Sant-Angelo castel-sant-angelo"
  "largo-argentina|Largo_argentina Largo-Argentina largo-argentina Largo_Argentina"
)

incoming_classify_mp4() {
  local name
  name="$(basename "$1" | tr '[:upper:]' '[:lower:]')"

  if [[ "$name" == ancient-source.mp4 || "$name" == *ancient* || "$name" == *reconstruction* ]]; then
    echo "ancient"
  elif [[ "$name" == modern-source.mp4 || "$name" == *modern* || "$name" == now_from* || "$name" == *make_a_mi* ]]; then
    echo "modern"
  elif [[ "$name" == *rome* && "$name" != *modern* ]]; then
    echo "ancient"
  else
    echo "unknown"
  fi
}

incoming_aliases_for() {
  local id="$1"
  local entry aliases
  for entry in "${WAYPOINT_INCOMING_ALIASES[@]}"; do
    if [[ "${entry%%|*}" == "$id" ]]; then
      aliases="${entry#*|}"
      printf '%s' "$aliases"
      return 0
    fi
  done
  printf '%s' "$id"
}

incoming_collect_dirs() {
  local wp="$1"
  local id="$2"
  local aliases seen=""
  aliases="$(incoming_aliases_for "$id")"

  for alias in $id $aliases; do
    local dir="$wp/$alias/incoming"
    [[ -d "$dir" ]] || continue
    local real
    real="$(cd "$dir" && pwd -P)"
    if [[ "$seen" == *"|$real|"* ]]; then
      continue
    fi
    seen="${seen}|$real|"
    printf '%s\0' "$dir"
  done
}

incoming_list_mp4s() {
  local dir
  shopt -s nullglob
  for f in "$1"/*.mp4 "$1"/*.mov "$1"/*.MP4 "$1"/*.MOV; do
    [[ -f "$f" ]] || continue
    printf '%s\0' "$f"
  done
}

incoming_find_pair() {
  local dir="$1"
  local modern="" ancient="" f kind
  local -a unknown=()

  shopt -s nullglob
  [[ -f "$dir/modern-source.mp4" ]] && modern="$dir/modern-source.mp4"
  [[ -f "$dir/ancient-source.mp4" ]] && ancient="$dir/ancient-source.mp4"
  if [[ -n "$modern" && -n "$ancient" ]]; then
    printf '%s|%s' "$modern" "$ancient"
    return 0
  fi

  while IFS= read -r -d '' f; do
    kind="$(incoming_classify_mp4 "$f")"
    case "$kind" in
      modern)
        [[ -z "$modern" ]] && modern="$f"
        ;;
      ancient)
        [[ -z "$ancient" ]] && ancient="$f"
        ;;
      unknown)
        unknown+=("$f")
        ;;
    esac
  done < <(incoming_list_mp4s "$dir")

  if [[ -n "$modern" && -n "$ancient" ]]; then
    printf '%s|%s' "$modern" "$ancient"
    return 0
  fi

  # One classified + one unknown → assign the unknown to the missing role
  if ((${#unknown[@]} == 1)); then
    if [[ -n "$modern" && -z "$ancient" ]]; then
      ancient="${unknown[0]}"
    elif [[ -n "$ancient" && -z "$modern" ]]; then
      modern="${unknown[0]}"
    fi
  fi

  if [[ -n "$modern" && -n "$ancient" ]]; then
    printf '%s|%s' "$modern" "$ancient"
    return 0
  fi

  # Exactly two MP4s with no keywords — common Gemini export names
  if ((${#unknown[@]} == 2)); then
    local sorted=()
    mapfile -d '' -t sorted < <(printf '%s\0' "${unknown[@]}" | sort -z)
    modern="${sorted[0]}"
    ancient="${sorted[1]}"
    echo "NOTE: unlabeled MP4s in $(basename "$(dirname "$dir")")/incoming — using alphabetical order:" >&2
    echo "      modern  ← $(basename "$modern")" >&2
    echo "      ancient ← $(basename "$ancient")" >&2
    printf '%s|%s' "$modern" "$ancient"
    return 0
  fi

  return 1
}

incoming_find_pair_for_waypoint() {
  local wp="$1"
  local id="$2"
  local dir pair modern ancient

  mkdir -p "$wp/$id/incoming"

  while IFS= read -r -d '' dir; do
    if pair="$(incoming_find_pair "$dir")"; then
      modern="${pair%%|*}"
      ancient="${pair#*|}"
      printf '%s|%s' "$modern" "$ancient"
      return 0
    fi
  done < <(incoming_collect_dirs "$wp" "$id")

  return 1
}

incoming_sync_canonical_names() {
  local wp="$1"
  local id="$2"
  local pair modern ancient canon="$wp/$id/incoming"

  if ! pair="$(incoming_find_pair_for_waypoint "$wp" "$id")"; then
    return 1
  fi

  modern="${pair%%|*}"
  ancient="${pair#*|}"
  mkdir -p "$canon"

  if [[ "$modern" != "$canon/modern-source.mp4" ]]; then
    cp -f "$modern" "$canon/modern-source.mp4"
    echo "   → incoming/modern-source.mp4  (from $(basename "$modern"))"
  fi
  if [[ "$ancient" != "$canon/ancient-source.mp4" ]]; then
    cp -f "$ancient" "$canon/ancient-source.mp4"
    echo "   → incoming/ancient-source.mp4 (from $(basename "$ancient"))"
  fi

  return 0
}
