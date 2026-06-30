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

const ADHOC_CACHE_KEY = 'chronowalk:adhoc-directions'

function coordKey(point) {
  if (!point?.lat || !point?.lng) return null
  return `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`
}

function adhocKey(origin, destination) {
  const from = coordKey(origin)
  const to = coordKey(destination)
  if (!from || !to) return null
  return `${from}->${to}`
}

function readAdhocCache() {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.sessionStorage.getItem(ADHOC_CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAdhocCache(cache) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(ADHOC_CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.warn('routeGeometryCache: failed to persist adhoc directions.', error)
  }
}

export function cacheAdhocWalkingDirections(origin, destination, directions) {
  const key = adhocKey(origin, destination)
  if (!key || !directions?.steps?.length) return

  const cache = readAdhocCache()
  cache[key] = directions
  writeAdhocCache(cache)
}

export function getAdhocWalkingDirections(origin, destination) {
  const key = adhocKey(origin, destination)
  if (!key) return null
  return readAdhocCache()[key] ?? null
}
