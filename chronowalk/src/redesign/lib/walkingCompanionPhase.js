import { LOCATION_STATUS } from '../../hooks/useGeoLocation.js'
import {
  formatDistanceToNext,
  formatWalkingTime,
  sanitizeWalkDistanceM,
} from '../../content/journeyProgress.js'

/** @typedef {'walking' | 'near' | 'arrived'} WalkingCompanionPhase */

export const APPROACH_DISTANCE_M = 80

export function isWithinApproachDistance(distanceM, thresholdM = APPROACH_DISTANCE_M) {
  const liveDistanceM = sanitizeWalkDistanceM(distanceM)
  return liveDistanceM != null && liveDistanceM <= thresholdM
}

/**
 * @param {{
 *   showArrivedUI?: boolean
 *   distanceM?: number | null
 *   near?: boolean
 * }} input
 * @returns {WalkingCompanionPhase}
 */
export function resolveWalkingCompanionPhase({
  showArrivedUI = false,
  distanceM = null,
  near = false,
}) {
  if (showArrivedUI) return 'arrived'
  if (near || isWithinApproachDistance(distanceM)) return 'near'
  return 'walking'
}

export function shouldShowTransitMiniPlayer({
  mode,
  transcript,
  duration = 0,
  currentTime = 0,
  narrationPlaying = false,
  narrationPaused = false,
  showArrivedUI = false,
}) {
  if (showArrivedUI) return false
  if (mode !== 'transit') return false
  if (!transcript?.trim()) return false
  const sessionLive =
    narrationPlaying || narrationPaused || duration > 0 || currentTime > 0
  if (!sessionLive) return false
  const ended =
    duration > 0 &&
    currentTime >= Math.max(duration - 1, 0) &&
    !narrationPlaying &&
    !narrationPaused
  return !ended
}

export function phaseLabel(phase) {
  switch (phase) {
    case 'arrived':
      return 'You have arrived'
    case 'near':
      return 'Almost there'
    default:
      return null
  }
}

export function resolveWalkingDistanceCopy(distanceM, estimatedDistanceM, locationStatus) {
  const liveDistanceM = sanitizeWalkDistanceM(distanceM)

  if (liveDistanceM != null) {
    return {
      primary: formatDistanceToNext(liveDistanceM),
      secondary: formatWalkingTime(liveDistanceM),
      estimated: false,
      pending: false,
    }
  }

  if (estimatedDistanceM != null) {
    return {
      primary: formatDistanceToNext(estimatedDistanceM),
      secondary: formatWalkingTime(estimatedDistanceM),
      estimated: true,
      pending: false,
    }
  }

  const gpsBlocked =
    locationStatus === LOCATION_STATUS.DENIED ||
    locationStatus === LOCATION_STATUS.UNAVAILABLE

  if (gpsBlocked) {
    return {
      primary: 'Distance unavailable',
      secondary: null,
      estimated: false,
      pending: false,
      gpsBlocked: true,
    }
  }

  return {
    primary: '—',
    secondary: null,
    estimated: false,
    pending: locationStatus === LOCATION_STATUS.WAITING,
  }
}
