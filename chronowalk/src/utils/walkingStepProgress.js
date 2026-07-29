import { getDistance } from './distance'

function projectAlongRoute(coordinates, userPos) {
  if (!coordinates?.length || userPos?.lat == null || userPos?.lng == null) {
    return { distanceAlongM: 0, closestIndex: 0, minDistanceM: Infinity }
  }

  let closestIndex = 0
  let minDistance = Infinity
  let distanceAlongM = 0
  let bestAlongM = 0
  let walkedM = 0

  for (let index = 0; index < coordinates.length; index += 1) {
    const [lng, lat] = coordinates[index]
    const dist = getDistance(userPos.lat, userPos.lng, lat, lng)

    if (dist < minDistance) {
      minDistance = dist
      closestIndex = index
      bestAlongM = walkedM
    }

    if (index > 0) {
      const [prevLng, prevLat] = coordinates[index - 1]
      walkedM += getDistance(prevLat, prevLng, lat, lng)
    }
  }

  if (closestIndex > 0) {
    const [lng, lat] = coordinates[closestIndex]
    const [prevLng, prevLat] = coordinates[closestIndex - 1]
    const segmentM = getDistance(prevLat, prevLng, lat, lng)

    if (segmentM > 0) {
      const toPrev = getDistance(userPos.lat, userPos.lng, prevLat, prevLng)
      const toNext = getDistance(userPos.lat, userPos.lng, lat, lng)
      const alongSegment = Math.max(0, segmentM - toNext)
      distanceAlongM = bestAlongM + Math.min(alongSegment, segmentM)
    } else {
      distanceAlongM = bestAlongM
    }
  }

  return { distanceAlongM, closestIndex, minDistanceM: minDistance }
}

/** Threshold beyond which GPS is considered "far from route" and we pin step 0. */
const FAR_FROM_ROUTE_M = 500

export function resolveWalkingStepProgress({
  userPos,
  steps = [],
  geometry,
  totalDistanceM = 0,
}) {
  const stepCount = steps.length
  const safeTotalDistanceM =
    totalDistanceM > 0
      ? totalDistanceM
      : steps.reduce((sum, step) => sum + (step.distanceM ?? 0), 0)

  if (!stepCount) {
    return {
      currentStepIndex: 0,
      routeProgress: 0,
      remainingDistanceM: safeTotalDistanceM,
    }
  }

  const coordinates = geometry?.coordinates ?? []
  const { distanceAlongM, minDistanceM } = projectAlongRoute(coordinates, userPos)

  // If the user has no GPS position yet, or is too far from the route geometry
  // (e.g. outside Rome / stale/unreliable fix), pin to step 0 so the step
  // indicator doesn't flicker based on meaningless projection noise.
  if (userPos?.lat == null || userPos?.lng == null || minDistanceM > FAR_FROM_ROUTE_M) {
    return {
      currentStepIndex: 0,
      routeProgress: 0,
      remainingDistanceM: safeTotalDistanceM,
    }
  }

  let cumulativeM = 0
  let currentStepIndex = 0

  for (let index = 0; index < steps.length; index += 1) {
    const stepDistance = steps[index]?.distanceM ?? 0
    const nextCumulative = cumulativeM + stepDistance

    if (distanceAlongM >= nextCumulative || index === steps.length - 1) {
      currentStepIndex = index
      cumulativeM = nextCumulative
      if (index < steps.length - 1 && distanceAlongM < nextCumulative) break
      continue
    }

    currentStepIndex = index
    break
  }

  const routeProgress =
    safeTotalDistanceM > 0
      ? Math.min(1, Math.max(0, distanceAlongM / safeTotalDistanceM))
      : stepCount > 0
        ? Math.min(1, (currentStepIndex + 1) / stepCount)
        : 0

  const remainingDistanceM = Math.max(0, safeTotalDistanceM - distanceAlongM)

  return {
    currentStepIndex,
    routeProgress,
    remainingDistanceM,
  }
}
