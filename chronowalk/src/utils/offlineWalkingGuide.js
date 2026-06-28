import { getDistance } from './distance'

const CARDINALS = [
  'north',
  'northeast',
  'east',
  'southeast',
  'south',
  'southwest',
  'west',
  'northwest',
]

export function formatDistanceLabel(distanceMeters) {
  if (distanceMeters == null || Number.isNaN(distanceMeters)) return null
  const meters = Math.round(distanceMeters)
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function bearingLabel(from, to) {
  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) return null

  const lat1 = (from.lat * Math.PI) / 180
  const lat2 = (to.lat * Math.PI) / 180
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180

  const y = Math.sin(deltaLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)

  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  const index = Math.round(bearing / 45) % 8
  return CARDINALS[index]
}

export function buildOfflineWalkingInstruction({
  state,
  distance,
  currentStopTitle,
  nextStopTitle,
  targetStopTitle,
  transitLegActive,
  awaitingFirstStop,
  cachedSteps,
  atStop,
  userPos,
  targetLandmark,
}) {
  if (atStop) {
    return 'You have arrived. Explore the landmark, then continue when you are ready.'
  }

  if (cachedSteps?.length) {
    const step = cachedSteps.find((entry) => entry.type !== 'arrive') ?? cachedSteps[0]
    if (step?.instruction) return step.instruction
  }

  const distanceLabel = formatDistanceLabel(distance)
  const destination = transitLegActive
    ? nextStopTitle ?? targetStopTitle
    : targetStopTitle ?? nextStopTitle

  if (distanceLabel && destination) {
    const bearing = userPos && targetLandmark ? bearingLabel(userPos, targetLandmark) : null

    if (awaitingFirstStop) {
      return `Walk ${distanceLabel} to ${destination} to begin your tour.`
    }

    if (transitLegActive) {
      return bearing
        ? `Continue ${distanceLabel} toward ${destination}, heading ${bearing}.`
        : `Continue ${distanceLabel} toward ${destination}.`
    }

    return bearing
      ? `Head ${bearing} toward ${destination} — about ${distanceLabel} away.`
      : `Head toward ${destination} — about ${distanceLabel} away.`
  }

  if (destination) {
    return transitLegActive
      ? `Walk toward ${destination} along the route overview.`
      : `Head toward ${destination} to reach your next story.`
  }

  return currentStopTitle
    ? `Make your way toward ${currentStopTitle}.`
    : 'Follow the route overview to your next stop.'
}

export function resolveActiveLegEndpoints({ tour, stops, activeLeg, transitLegActive, activeTargetId }) {
  const currentStop = stops.find((stop) => stop.status === 'current') ?? null
  const nextStop =
    transitLegActive && activeLeg
      ? stops.find((stop) => stop.id === activeLeg.toId) ?? null
      : stops.find((stop) => stop.status === 'upcoming') ?? null

  const completedStops = stops.filter((stop) => stop.status === 'completed')
  const previousStop =
    transitLegActive && activeLeg
      ? stops.find((stop) => stop.id === activeLeg.fromId) ?? null
      : completedStops.at(-1) ?? null

  const targetStop = stops.find((stop) => stop.id === activeTargetId) ?? currentStop

  return {
    currentStop,
    nextStop,
    previousStop,
    targetStop,
    tourStopCount: tour?.stopIds?.length ?? stops.length,
  }
}

export function estimateLegDistanceMeters(from, to) {
  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) return null
  return getDistance(from.lat, from.lng, to.lat, to.lng)
}
