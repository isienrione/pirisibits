import { formatWalkingTime, sanitizeWalkDistanceM } from '../../content/journeyProgress.js'

export function formatPlaybackClock(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/**
 * Clean walk meta: "335 m · 4 min"
 * Strips trailing "walk" from ETA copy and joins with a middle dot.
 */
export function formatDistanceLine(
  distanceCopy,
  { unavailable = 'Distance unavailable' } = {},
) {
  if (distanceCopy?.gpsBlocked) return unavailable
  if (distanceCopy?.pending) return '-'
  const dist = distanceCopy?.primary
  const etaRaw = distanceCopy?.secondary
  const eta =
    typeof etaRaw === 'string'
      ? etaRaw.replace(/\s*walk$/i, '').replace(/^~/, '').trim()
      : null
  if (dist && eta) return `${dist} · ${eta}`
  if (dist) return dist
  return '-'
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
  /** Override chrome copy for ride/taxi legs (e.g. Via Appia encore). */
  etaOverride = null,
}) {
  if (etaOverride) {
    const base = resolveWalkingDistanceCopy(
      null,
      estimatedDistanceM,
      locationStatus,
    )
    return {
      ...base,
      primary: etaOverride,
      secondary: null,
      pending: false,
      gpsBlocked: false,
    }
  }

  const safeLive = sanitizeWalkDistanceM(liveDistanceM)
  const safeEstimated = sanitizeWalkDistanceM(estimatedDistanceM)
  const safeDirections = sanitizeWalkDistanceM(directionsDistanceM)

  // Prefer stop→stop estimate when live/directions look like a stale GPS jump
  // (common when advancing with "I'm here" while still geolocated at an earlier stop).
  const directionsInflated =
    typeof safeEstimated === 'number' &&
    safeEstimated > 0 &&
    typeof safeDirections === 'number' &&
    safeDirections > safeEstimated * 1.75

  const liveInflated =
    typeof safeEstimated === 'number' &&
    safeEstimated > 0 &&
    typeof safeLive === 'number' &&
    safeLive > safeEstimated * 1.75

  const preferredMeters = directionsInflated || liveInflated
    ? safeEstimated
    : typeof safeDirections === 'number' && safeDirections > 0
      ? safeDirections
      : safeLive

  const base = resolveWalkingDistanceCopy(
    preferredMeters,
    safeEstimated,
    locationStatus,
  )

  if (!base.gpsBlocked && !base.pending) {
    const metersForTime =
      typeof preferredMeters === 'number' && preferredMeters > 0
        ? preferredMeters
        : null
    if (metersForTime != null) {
      const timeCopy = formatWalkingTime(metersForTime)
      if (timeCopy) return { ...base, secondary: timeCopy }
    } else if (
      !directionsInflated &&
      typeof directionsDurationSec === 'number' &&
      directionsDurationSec > 0
    ) {
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

/** Avoid “Open the The Colosseum story” when the title already starts with The. */
export function formatOpenStoryCta(
  title,
  {
    unnamed = 'Open the story →',
    named = (name) => `Open the ${name} story →`,
    leadingArticle = (name) => `Open ${name} story →`,
  } = {},
) {
  const cleanTitle = String(title ?? '').trim()
  if (!cleanTitle) return unnamed
  return /^the\s+/i.test(cleanTitle) ? leadingArticle(cleanTitle) : named(cleanTitle)
}
