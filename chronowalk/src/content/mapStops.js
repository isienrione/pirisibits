import {
  getTraversalSequence,
  getWaypoint,
  isTransitId,
  isWaypointId,
  resolveJourneyStep,
} from './manifest.js'
import { buildEffectiveSequence } from './optionalPromotion.js'

export function getManifestWaypointIds(manifest, path, promotedOptionalIds = []) {
  return buildEffectiveSequence(manifest, path, promotedOptionalIds).filter((stepId) =>
    isWaypointId(manifest, stepId)
  )
}

export function buildManifestTour(manifest, path = manifest.journey?.default_path ?? 'a') {
  const stopIds = getManifestWaypointIds(manifest, path)

  return {
    id: manifest.id ?? manifest.city ?? 'rome',
    stopIds,
    mapZoom: 14,
    bounds: getManifestTourBounds(manifest, stopIds),
  }
}

export function getManifestTourBounds(manifest, stopIds = []) {
  const coords = stopIds
    .map((id) => getWaypoint(manifest, id)?.geofence)
    .filter(Boolean)
    .map((geofence) => ({ lat: geofence.lat, lng: geofence.lng }))

  if (!coords.length) return null

  const lats = coords.map((coord) => coord.lat)
  const lngs = coords.map((coord) => coord.lng)

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
    center: {
      lat: lats.reduce((sum, lat) => sum + lat, 0) / lats.length,
      lng: lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length,
    },
  }
}

function waypointToMapStop(waypoint, { status, index }) {
  if (!waypoint?.geofence) return null

  return {
    id: waypoint.id,
    title: waypoint.title ?? waypoint.name,
    landmark: {
      lat: waypoint.geofence.lat,
      lng: waypoint.geofence.lng,
    },
    arrivalRadiusM: waypoint.geofence.radius_m ?? 40,
    status,
    index,
  }
}

export function buildMapStopsFromManifest(
  manifest,
  {
    path = manifest.journey?.default_path ?? 'a',
    sequenceIndex = 0,
    completedWaypointIds = [],
    promotedOptionalIds = [],
  } = {}
) {
  const completed = new Set(completedWaypointIds)
  const step = resolveJourneyStep(manifest, path, sequenceIndex, promotedOptionalIds)
  const currentTargetId =
    step.type === 'waypoint' ? step.id : step.targetWaypoint?.id ?? null

  const stopIds = getManifestWaypointIds(manifest, path, promotedOptionalIds)

  return stopIds
    .map((stopId, index) => {
      const waypoint = getWaypoint(manifest, stopId)
      let status = 'upcoming'

      if (completed.has(stopId)) {
        status = 'completed'
      } else if (stopId === currentTargetId) {
        status = 'current'
      } else if (
        currentTargetId &&
        stopIds.indexOf(stopId) > stopIds.indexOf(currentTargetId)
      ) {
        status = 'locked'
      }

      return waypointToMapStop(waypoint, { status, index })
    })
    .filter(Boolean)
}

export function resolveActiveMapLeg(manifest, path, sequenceIndex, promotedOptionalIds = []) {
  const step = resolveJourneyStep(manifest, path, sequenceIndex, promotedOptionalIds)
  const targetId = step.type === 'waypoint' ? step.id : step.targetWaypoint?.id
  if (!targetId) return { activeTargetId: null, activeLeg: null, transitLegActive: false }

  const sequence = buildEffectiveSequence(manifest, path, promotedOptionalIds)
  let previousWaypointId = null

  for (let index = 0; index < sequenceIndex; index += 1) {
    const stepId = sequence[index]
    if (isWaypointId(manifest, stepId)) {
      previousWaypointId = stepId
    }
  }

  if (!previousWaypointId) {
    return {
      activeTargetId: targetId,
      activeLeg: null,
      transitLegActive: step.type === 'transit',
    }
  }

  return {
    activeTargetId: targetId,
    activeLeg: {
      fromId: previousWaypointId,
      toId: targetId,
    },
    transitLegActive: step.type === 'transit' || Boolean(step.targetWaypoint),
  }
}

export function getMapConfidenceLayers({
  locationStatus,
  activeStop,
  distance,
  transitLegActive,
  companionMode,
}) {
  const layers = [
    {
      id: 'position',
      label:
        locationStatus === 'granted'
          ? 'Position live'
          : locationStatus === 'waiting'
            ? 'Finding GPS'
            : 'GPS unavailable',
      active: locationStatus === 'granted',
    },
    {
      id: 'zone',
      label: activeStop ? `${activeStop.title} zone` : 'Stop zone',
      active: distance != null && activeStop?.arrivalRadiusM != null && distance <= activeStop.arrivalRadiusM,
    },
    {
      id: 'route',
      label: transitLegActive ? 'Active walking leg' : 'Full route',
      active: transitLegActive,
    },
  ]

  if (companionMode === 'off_route') {
    layers.push({ id: 'route_drift', label: 'Off route', active: true })
  } else if (companionMode === 'observing') {
    layers.push({ id: 'observing', label: 'Observing', active: true })
  }

  return layers
}
