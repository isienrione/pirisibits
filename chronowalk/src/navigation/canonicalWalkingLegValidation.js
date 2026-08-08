/**
 * Validation helpers for packaged Rome canonical walking legs.
 * Shared by the generator (build-time) and runtime readiness / tests.
 *
 * Straight-line temporary geometry is an INTERNAL emergency fallback only —
 * it is never "valid real walking" for package completeness.
 */

export const GEOMETRY_KIND_TEMPORARY = 'temporary-straight-line-fallback'
export const GEOMETRY_KIND_MAPBOX_WALKING = 'mapbox-walking'
export const LEG_SOURCE_MAPBOX = 'mapbox-directions'
export const LEG_SOURCE_AUTHORED_STOPS = 'authored-stop-coordinates'

/** Max distance (m) from stop geofence to route endpoint before rejecting. */
export const ENDPOINT_TOLERANCE_M = 120

/** Reject routes shorter than this (m) unless haversine between stops is also tiny. */
export const MIN_ROUTE_DISTANCE_M = 15

/** Reject routes longer than this (m) for central Rome stop→stop legs. */
export const MAX_ROUTE_DISTANCE_M = 3500

/**
 * Haversine distance in meters.
 * @param {{ lat: number, lng: number }} a
 * @param {{ lat: number, lng: number }} b
 */
export function haversineMeters(a, b) {
  if (
    !a ||
    !b ||
    !Number.isFinite(a.lat) ||
    !Number.isFinite(a.lng) ||
    !Number.isFinite(b.lat) ||
    !Number.isFinite(b.lng)
  ) {
    return null
  }
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * @param {unknown} geometry
 * @returns {{ type: string, coordinates: number[][] } | null}
 */
export function normalizeLineStringGeometry(geometry) {
  if (!geometry || typeof geometry !== 'object') return null
  if (geometry.type === 'Feature' && geometry.geometry) {
    return normalizeLineStringGeometry(geometry.geometry)
  }
  if (geometry.type !== 'LineString' || !Array.isArray(geometry.coordinates)) {
    return null
  }
  const coordinates = geometry.coordinates.filter(
    (pair) =>
      Array.isArray(pair) &&
      pair.length >= 2 &&
      Number.isFinite(Number(pair[0])) &&
      Number.isFinite(Number(pair[1])),
  )
  if (coordinates.length < 2) return null
  return {
    type: 'LineString',
    coordinates: coordinates.map((pair) => [Number(pair[0]), Number(pair[1])]),
  }
}

/**
 * @param {unknown} leg
 * @returns {boolean}
 */
export function isTemporaryFallbackLeg(leg) {
  if (!leg || typeof leg !== 'object') return true
  if (leg.productDebt === true) return true
  if (leg.geometryKind === GEOMETRY_KIND_TEMPORARY) return true
  if (leg.source === LEG_SOURCE_AUTHORED_STOPS) return true
  return false
}

/**
 * @param {unknown} leg
 * @returns {boolean}
 */
export function isRealWalkingLeg(leg) {
  if (!leg || typeof leg !== 'object') return false
  if (isTemporaryFallbackLeg(leg)) return false
  if (leg.geometryKind !== GEOMETRY_KIND_MAPBOX_WALKING) return false
  if (leg.source !== LEG_SOURCE_MAPBOX) return false
  return leg.validationStatus === 'ok'
}

/**
 * Validate a candidate walking leg (Mapbox result or packaged JSON).
 *
 * @param {object} leg
 * @param {{
 *   origin?: { lat: number, lng: number } | null,
 *   destination?: { lat: number, lng: number } | null,
 *   allowTemporary?: boolean,
 * }} [opts]
 * @returns {{
 *   ok: boolean,
 *   status: 'ok' | 'invalid' | 'temporary_fallback',
 *   flags: string[],
 *   report: {
 *     originStopId: string | null,
 *     destinationStopId: string | null,
 *     distanceMeters: number | null,
 *     durationSeconds: number | null,
 *     geometryPointCount: number,
 *     stepCount: number,
 *     source: string | null,
 *     geometryKind: string | null,
 *     validationStatus: string,
 *   }
 * }}
 */
export function validateCanonicalWalkingLeg(leg, opts = {}) {
  const originStopId = leg?.originStopId ?? leg?.fromId ?? null
  const destinationStopId = leg?.destinationStopId ?? leg?.toId ?? null
  const geometry = normalizeLineStringGeometry(leg?.geometry)
  const steps = Array.isArray(leg?.steps) ? leg.steps : []
  const distanceMeters = Number(leg?.distanceMeters ?? leg?.distanceM)
  const durationSeconds = Number(leg?.durationSeconds ?? leg?.durationSec)
  const source = typeof leg?.source === 'string' ? leg.source : null
  const geometryKind = typeof leg?.geometryKind === 'string' ? leg.geometryKind : null

  const flags = []

  if (isTemporaryFallbackLeg(leg) && !opts.allowTemporary) {
    flags.push('temporary_straight_line_fallback')
  }

  if (!geometry) {
    flags.push('empty_geometry')
  } else if (geometry.coordinates.length < 2) {
    flags.push('empty_geometry')
  } else if (
    geometry.coordinates.length === 2 &&
    geometryKind === GEOMETRY_KIND_TEMPORARY
  ) {
    flags.push('temporary_two_point_geometry')
  }

  if (!steps.length) flags.push('zero_steps')

  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    flags.push('missing_distance')
  } else {
    if (distanceMeters < MIN_ROUTE_DISTANCE_M) flags.push('implausibly_short')
    if (distanceMeters > MAX_ROUTE_DISTANCE_M) flags.push('implausibly_long')
  }

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    flags.push('missing_duration')
  }

  const origin = opts.origin ?? leg?.from ?? null
  const destination = opts.destination ?? leg?.to ?? null

  if (geometry?.coordinates?.length) {
    const start = geometry.coordinates[0]
    const end = geometry.coordinates[geometry.coordinates.length - 1]
    const startPt = { lng: start[0], lat: start[1] }
    const endPt = { lng: end[0], lat: end[1] }

    if (origin) {
      const d = haversineMeters(origin, startPt)
      if (d != null && d > ENDPOINT_TOLERANCE_M) flags.push('origin_endpoint_far')
    }
    if (destination) {
      const d = haversineMeters(destination, endPt)
      if (d != null && d > ENDPOINT_TOLERANCE_M) flags.push('destination_endpoint_far')
    }
  }

  const isTemporary =
    flags.includes('temporary_straight_line_fallback') ||
    flags.includes('temporary_two_point_geometry')

  let status = 'ok'
  if (isTemporary && opts.allowTemporary) {
    status = 'temporary_fallback'
  } else if (flags.length > 0) {
    status = 'invalid'
  }

  // Real walking legs must not carry temporary flags.
  const ok =
    status === 'ok' &&
    !isTemporary &&
    geometryKind === GEOMETRY_KIND_MAPBOX_WALKING &&
    (source === LEG_SOURCE_MAPBOX || source === null)

  return {
    ok,
    status: ok ? 'ok' : status === 'temporary_fallback' ? 'temporary_fallback' : 'invalid',
    flags,
    report: {
      originStopId,
      destinationStopId,
      distanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : null,
      durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
      geometryPointCount: geometry?.coordinates?.length ?? 0,
      stepCount: steps.length,
      source,
      geometryKind,
      validationStatus: ok
        ? 'ok'
        : status === 'temporary_fallback'
          ? 'temporary_fallback'
          : 'invalid',
    },
  }
}

/**
 * @param {object} packageData
 * @returns {{
 *   expectedLegKeys: string[],
 *   legCount: number,
 *   realWalkingLegCount: number,
 *   temporaryFallbackLegCount: number,
 *   invalidLegCount: number,
 *   missingLegKeys: string[],
 *   complete: boolean,
 *   reports: object[],
 * }}
 */
export function assessCanonicalWalkingPackage(packageData, expectedLegKeys = null) {
  const legs = packageData?.legs && typeof packageData.legs === 'object' ? packageData.legs : {}
  const keysFromRoutes = []
  if (Array.isArray(packageData?.routes)) {
    for (const route of packageData.routes) {
      if (Array.isArray(route?.legKeys)) keysFromRoutes.push(...route.legKeys)
    }
  }
  const expected = Array.isArray(expectedLegKeys)
    ? [...new Set(expectedLegKeys)]
    : keysFromRoutes.length
      ? [...new Set(keysFromRoutes)]
      : Object.keys(legs)

  const reports = []
  let realWalkingLegCount = 0
  let temporaryFallbackLegCount = 0
  let invalidLegCount = 0
  const missingLegKeys = []

  for (const key of expected) {
    const leg = legs[key]
    if (!leg) {
      missingLegKeys.push(key)
      reports.push({
        legKey: key,
        validationStatus: 'missing',
        flags: ['missing_leg'],
      })
      invalidLegCount += 1
      continue
    }
    const result = validateCanonicalWalkingLeg(leg, { allowTemporary: true })
    reports.push({
      legKey: key,
      ...result.report,
      flags: result.flags,
      validationStatus: result.report.validationStatus,
    })
    if (isRealWalkingLeg(leg) && result.ok) {
      realWalkingLegCount += 1
    } else if (isTemporaryFallbackLeg(leg)) {
      temporaryFallbackLegCount += 1
    } else {
      invalidLegCount += 1
    }
  }

  const complete =
    missingLegKeys.length === 0 &&
    realWalkingLegCount === expected.length &&
    temporaryFallbackLegCount === 0 &&
    invalidLegCount === 0 &&
    expected.length > 0

  return {
    expectedLegKeys: expected,
    legCount: expected.length,
    realWalkingLegCount,
    temporaryFallbackLegCount,
    invalidLegCount,
    missingLegKeys,
    complete,
    reports,
  }
}
