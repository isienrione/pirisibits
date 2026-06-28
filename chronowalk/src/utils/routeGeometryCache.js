const storageKey = (tourId) => `chronowalk:route-cache:${tourId}`

const emptyCache = () => ({
  tourRoute: null,
  legs: {},
  directions: {},
})

function readCache(tourId) {
  if (typeof window === 'undefined' || !tourId) return emptyCache()

  try {
    const raw = window.sessionStorage.getItem(storageKey(tourId))
    if (!raw) return emptyCache()
    const parsed = JSON.parse(raw)
    return {
      tourRoute: parsed.tourRoute ?? null,
      legs: parsed.legs ?? {},
      directions: parsed.directions ?? {},
    }
  } catch {
    return emptyCache()
  }
}

function writeCache(tourId, cache) {
  if (typeof window === 'undefined' || !tourId) return

  try {
    window.sessionStorage.setItem(storageKey(tourId), JSON.stringify(cache))
  } catch (error) {
    console.warn('routeGeometryCache: failed to persist route geometry.', error)
  }
}

function legKey(fromId, toId) {
  return `${fromId}->${toId}`
}

export function cacheTourRoute(tourId, geometry) {
  if (!tourId || !geometry?.coordinates?.length) return

  const cache = readCache(tourId)
  cache.tourRoute = geometry.coordinates
  writeCache(tourId, cache)
}

export function cacheLegRoute(tourId, fromId, toId, geometry) {
  if (!tourId || !fromId || !toId || !geometry?.coordinates?.length) return

  const cache = readCache(tourId)
  cache.legs[legKey(fromId, toId)] = geometry.coordinates
  writeCache(tourId, cache)
}

export function cacheLegDirections(tourId, fromId, toId, steps) {
  if (!tourId || !fromId || !toId || !steps?.length) return

  const cache = readCache(tourId)
  cache.directions[legKey(fromId, toId)] = steps
  writeCache(tourId, cache)
}

export function getTourRouteCoordinates(tourId) {
  return readCache(tourId).tourRoute
}

export function getLegRouteCoordinates(tourId, fromId, toId) {
  if (!tourId || !fromId || !toId) return null
  return readCache(tourId).legs[legKey(fromId, toId)] ?? null
}

export function getLegWalkingSteps(tourId, fromId, toId) {
  if (!tourId || !fromId || !toId) return null
  return readCache(tourId).directions[legKey(fromId, toId)] ?? null
}

export function resetRouteGeometryCache(tourId) {
  if (typeof window === 'undefined' || !tourId) return
  window.sessionStorage.removeItem(storageKey(tourId))
}
