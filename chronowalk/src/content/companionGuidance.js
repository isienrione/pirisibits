import { LOCATION_STATUS } from '../hooks/useGeoLocation.js'
import { JOURNEY_STATES } from '../state/journey.js'
import { t } from '../i18n/t.js'

export const COMPANION_MODES = {
  NORMAL: 'normal',
  OFF_ROUTE: 'off_route',
  OBSERVING: 'observing',
}

export const OFF_ROUTE_DISTANCE_M = 400
export const OFF_ROUTE_RADIUS_MULTIPLIER = 6
export const OBSERVATION_STATIONARY_MS = 90_000
export const STATIONARY_MOVE_THRESHOLD_M = 25

export function movedEnough(from, to, thresholdM = STATIONARY_MOVE_THRESHOLD_M) {
  if (!from?.lat || !from?.lng || to?.lat == null || to?.lng == null) return true

  const latDiff = (from.lat - to.lat) * 111_320
  const lngDiff =
    (from.lng - to.lng) * 111_320 * Math.cos(((from.lat + to.lat) / 2) * (Math.PI / 180))

  return Math.hypot(latDiff, lngDiff) > thresholdM
}

export function resolveOffRouteThresholdM(geofenceRadiusM = 40) {
  return Math.max(OFF_ROUTE_DISTANCE_M, geofenceRadiusM * OFF_ROUTE_RADIUS_MULTIPLIER)
}

export function resolveCompanionMode({
  distance,
  geofenceRadiusM = 40,
  locationStatus,
  stationaryMs = 0,
  /** Dev Rome GPS simulation - never treat fixed QA coords as off-route. */
  suppressOffRoute = false,
}) {
  if (locationStatus !== LOCATION_STATUS.GRANTED || distance == null) {
    return COMPANION_MODES.NORMAL
  }

  if (!suppressOffRoute && distance > resolveOffRouteThresholdM(geofenceRadiusM)) {
    return COMPANION_MODES.OFF_ROUTE
  }

  if (stationaryMs >= OBSERVATION_STATIONARY_MS) {
    return COMPANION_MODES.OBSERVING
  }

  return COMPANION_MODES.NORMAL
}

export function companionCopy(mode, { targetTitle } = {}) {
  if (mode === COMPANION_MODES.OFF_ROUTE) {
    return {
      eyebrow: t('companion.offRoute.eyebrow'),
      title: t('companion.offRoute.title'),
      subtitle: targetTitle
        ? t('companion.offRoute.subtitle', { target: targetTitle })
        : t('companion.offRoute.subtitle.generic'),
    }
  }

  if (mode === COMPANION_MODES.OBSERVING) {
    return {
      eyebrow: t('companion.observing.eyebrow'),
      title: t('companion.observing.title'),
      subtitle: t('companion.observing.subtitle'),
    }
  }

  return null
}

export function isCompanionTrackingState(state) {
  return state === JOURNEY_STATES.WALKING || state === JOURNEY_STATES.APPROACHING
}
