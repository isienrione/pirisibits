import { formatWalkingTime } from '../../content/journeyProgress.js'

export function formatPlaybackClock(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/**
 * Clean walk meta: "335 m · 4 min"
 * Strips trailing "walk" from ETA copy and joins with a middle dot.
 */
export function formatDistanceLine(distanceCopy) {
  if (distanceCopy?.gpsBlocked) return 'Distance unavailable'
  if (distanceCopy?.pending) return '—'
  const dist = distanceCopy?.primary
  const etaRaw = distanceCopy?.secondary
  const eta =
    typeof etaRaw === 'string'
      ? etaRaw.replace(/\s*walk$/i, '').replace(/^~/, '').trim()
      : null
  if (dist && eta) return `${dist} · ${eta}`
  if (dist) return dist
  return '—'
}

/**
 * Prefer Directions distance/duration when available for accurate chrome copy.
 */
export function resolveWalkChromeDistanceCopy({
  liveDistanceM = null,
  estimatedDistanceM = null,
  directionsDistanceM = null,
  directionsDurationSec = null,
  locationStatus = null,
  resolveWalkingDistanceCopy,
}) {
  const preferredMeters =
    typeof directionsDistanceM === 'number' && directionsDistanceM > 0
      ? directionsDistanceM
      : liveDistanceM

  const base = resolveWalkingDistanceCopy(
    preferredMeters,
    estimatedDistanceM,
    locationStatus,
  )

  if (!base.gpsBlocked && !base.pending) {
    if (typeof directionsDistanceM === 'number' && directionsDistanceM > 0) {
      // Prefer a distance-based estimate using the same brisk/range format as
      // the rest of the app — more consistent than raw Mapbox pedestrian durations
      // which tend to overestimate for an active tourist pace.
      const timeCopy = formatWalkingTime(directionsDistanceM)
      if (timeCopy) return { ...base, secondary: timeCopy }
    } else if (typeof directionsDurationSec === 'number' && directionsDurationSec > 0) {
      // Mapbox durations assume a slow pace; scale down ~28 % to match 100 m/min.
      const effectiveSec = Math.round(directionsDurationSec * 0.72)
      const minutes = Math.max(1, Math.round(effectiveSec / 60))
      return { ...base, secondary: `${minutes} min` }
    }
  }

  return base
}

export function formatRemainingShort(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '−0:00'
  return `−${formatPlaybackClock(Math.ceil(seconds))}`
}
