import { JOURNEY_PACE } from '../data/romePacing.js'
import { getTierActIds, getTierWaypointIds } from '../data/tourTiers.js'
import { getManifestWaypointIds } from './mapStops.js'
import { getWaypoint } from './manifest.js'

function getTourActIds(pace) {
  return getTierActIds(pace)
}

/** Pause / scripted rest · on the route but not a landmark stop. */
export function isVisitStop(waypoint) {
  if (!waypoint) return false
  if (waypoint.scripted_rest) return false
  return true
}

/** Playable narration stop (excludes scripted rest). */
export function isStoryStop(waypoint) {
  return isVisitStop(waypoint) && Array.isArray(waypoint.chapters) && waypoint.chapters.length > 0
}

/** Marketing weight for combined stops (e.g. w11_12 counts as two public places). */
export function getPublicPlaceWeight(manifest, waypointId) {
  const waypoint = getWaypoint(manifest, waypointId)
  const declared = waypoint?.display?.publicPlaceCount
  if (Number.isFinite(declared) && declared > 0) return declared
  return isVisitStop(waypoint) ? 1 : 0
}

function uniqueIds(ids) {
  return [...new Set(ids)]
}

/** All landmark ids in the product catalog (excludes pause; includes optional off-path). */
export function getCatalogLandmarkIds(manifest, path = manifest?.journey?.default_path ?? 'a') {
  if (!manifest?.waypointsById) return []

  const optionalIds = Object.values(manifest.journey?.optional_waypoints ?? {}).flat()
  const catalogIds = Object.keys(manifest.waypointsById).filter((id) => {
    const waypoint = getWaypoint(manifest, id)
    return isVisitStop(waypoint)
  })

  return uniqueIds([...catalogIds, ...optionalIds])
}

/** Visit stops on an active path + pace (excludes pause; w11_12 = one stop). */
export function getVisitStopIds(
  manifest,
  {
    path = manifest?.journey?.default_path ?? 'a',
    pace = JOURNEY_PACE.HEROIC,
    promotedOptionalIds = [],
    customWaypointIds = null,
  } = {}
) {
  if (!manifest) return []

  const pathIds = getManifestWaypointIds(manifest, path, promotedOptionalIds)

  if (pace === JOURNEY_PACE.OWN) {
    const selected = new Set(customWaypointIds ?? [])
    return pathIds.filter((id) => {
      const waypoint = getWaypoint(manifest, id)
      return selected.has(id) && isVisitStop(waypoint)
    })
  }

  const tierIds = getTierWaypointIds(pace)
  if (tierIds) {
    const allowed = new Set(tierIds)
    return pathIds.filter((id) => {
      const waypoint = getWaypoint(manifest, id)
      return allowed.has(id) && isVisitStop(waypoint)
    })
  }

  const allowedActs = new Set(getTourActIds(pace))
  return pathIds.filter((id) => {
    const waypoint = getWaypoint(manifest, id)
    if (!isVisitStop(waypoint)) return false
    return waypoint?.act && allowedActs.has(waypoint.act)
  })
}

export function computePublicPlaceCount(manifest) {
  return getCatalogLandmarkIds(manifest).reduce(
    (total, id) => total + getPublicPlaceWeight(manifest, id),
    0
  )
}

export function computeStoryStopCount(manifest, options = {}) {
  return getVisitStopIds(manifest, options).filter((id) => isStoryStop(getWaypoint(manifest, id))).length
}

export function formatPublicPlacesLabel(count) {
  if (!Number.isFinite(count) || count <= 0) return '-'
  return `${count} place${count === 1 ? '' : 's'}`
}

export function formatVisitStopsLabel(count) {
  if (!Number.isFinite(count) || count <= 0) return '-'
  return `${count} stop${count === 1 ? '' : 's'}`
}

export function formatPlacesAcrossActs(publicPlaceCount, actCount) {
  const places = formatPublicPlacesLabel(publicPlaceCount)
  if (!Number.isFinite(actCount) || actCount <= 0) return places
  return `${places} across ${actCount} act${actCount === 1 ? '' : 's'}`
}

export function formatPlacesYoursToKeep(publicPlaceCount) {
  return `${formatPublicPlacesLabel(publicPlaceCount)} · yours to keep`
}

export function formatPlacesAvailableNow(publicPlaceCount) {
  return `${formatPublicPlacesLabel(publicPlaceCount)} · available now`
}

/**
 * Canonical Rome product counts and marketing labels · single source for UI copy.
 */
export function getTourProductTruth(manifest, options = {}) {
  const product = manifest?.product ?? {}
  const path = options.path ?? manifest?.journey?.default_path ?? 'a'
  const pace = options.pace ?? JOURNEY_PACE.HEROIC

  const visitStopIds = getVisitStopIds(manifest, { ...options, path, pace })
  const classicVisitStopIds = getVisitStopIds(manifest, {
    ...options,
    path,
    pace: JOURNEY_PACE.CLASSIC,
  })

  const computedPublicPlaceCount = computePublicPlaceCount(manifest)
  const publicPlaceCount = product.publicPlaceCount ?? computedPublicPlaceCount
  const useComputedVisitCount =
    options.pace != null || (options.customWaypointIds != null && options.customWaypointIds.length > 0)
  const visitStopCount = useComputedVisitCount
    ? visitStopIds.length
    : (product.visitStopCount ?? visitStopIds.length)
  const classicVisitStopCount = product.classicVisitStopCount ?? classicVisitStopIds.length
  const storyStopCount = product.storyStopCount ?? computeStoryStopCount(manifest, { ...options, path, pace })
  const actCount = product.actCount ?? 6

  const durationLabel = product.durationLabel ?? 'your pace'
  const ownershipLabel = product.ownershipLabel ?? 'yours forever'
  const distanceLabel = product.distanceLabel ?? '-'
  const priceFallbackCents = product.priceFallbackCents ?? manifest?.price_fallback_cents ?? 1499
  const currency = product.currency ?? 'EUR'

  return {
    publicPlaceCount,
    visitStopCount,
    classicVisitStopCount,
    storyStopCount,
    actCount,
    durationLabel,
    ownershipLabel,
    distanceLabel,
    priceFallbackCents,
    currency,
    computedPublicPlaceCount,
    visitStopIds,
    classicVisitStopIds,
    publicPlacesLabel: formatPublicPlacesLabel(publicPlaceCount),
    visitStopsLabel: formatVisitStopsLabel(visitStopCount),
    classicVisitStopsLabel: formatVisitStopsLabel(classicVisitStopCount),
    placesAcrossActsLabel: formatPlacesAcrossActs(publicPlaceCount, actCount),
    placesYoursToKeepLabel: formatPlacesYoursToKeep(publicPlaceCount),
    placesAvailableNowLabel: formatPlacesAvailableNow(publicPlaceCount),
  }
}

/** Landing / hero trust chips derived from product truth. */
export function getLandingTrustStats(manifest) {
  const truth = getTourProductTruth(manifest)
  return [
    { id: 'places', label: truth.publicPlacesLabel },
    { id: 'pace', label: 'Self-paced' },
    { id: 'offline', label: 'Works offline' },
  ]
}

export function getRedesignHeroTrustStats(manifest) {
  const truth = getTourProductTruth(manifest)
  return [
    truth.visitStopsLabel,
    'Works offline',
    truth.ownershipLabel.replace(/^./, (c) => c.toUpperCase()),
  ]
}
