const PADDING = 28

function collectPoints({ routeCoordinates, stops, userPos }) {
  const points = []

  for (const coordinate of routeCoordinates ?? []) {
    if (!coordinate) continue
    const [lng, lat] = coordinate
    if (lat != null && lng != null) points.push({ lat, lng })
  }

  for (const stop of stops ?? []) {
    if (stop?.landmark?.lat != null && stop?.landmark?.lng != null) {
      points.push(stop.landmark)
    }
  }

  if (userPos?.lat != null && userPos?.lng != null) {
    points.push(userPos)
  }

  return points
}

function projectPoint(point, bounds, width, height, padding = PADDING) {
  const x =
    bounds.minLng === bounds.maxLng
      ? width / 2
      : ((point.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (width - padding * 2) +
        padding

  const y =
    bounds.minLat === bounds.maxLat
      ? height / 2
      : (1 - (point.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * (height - padding * 2) +
        padding

  return { x, y }
}

function buildBounds(points) {
  const lats = points.map((point) => point.lat)
  const lngs = points.map((point) => point.lng)

  const latSpan = Math.max(...lats) - Math.min(...lats)
  const lngSpan = Math.max(...lngs) - Math.min(...lngs)
  // Keep a usable minimum span so a short Forum leg doesn't collapse to a speck.
  const latPad = Math.max(latSpan * 0.18, 0.0012)
  const lngPad = Math.max(lngSpan * 0.18, 0.0012)

  return {
    minLat: Math.min(...lats) - latPad,
    maxLat: Math.max(...lats) + latPad,
    minLng: Math.min(...lngs) - lngPad,
    maxLng: Math.max(...lngs) + lngPad,
  }
}

export function buildLandmarkRouteCoordinates(stops, tour) {
  const orderedIds = tour?.stopIds?.length
    ? tour.stopIds
    : (stops ?? []).map((stop) => stop.id)

  return orderedIds
    .map((stopId) => {
      const stop = stops.find((entry) => entry.id === stopId)
      if (!stop?.landmark) return null
      return [stop.landmark.lng, stop.landmark.lat]
    })
    .filter(Boolean)
}

/** Landmark segment for the current walking leg (previous → destination). */
export function buildActiveLegCoordinates(stops, activeLeg, userPos = null) {
  if (!activeLeg) return null
  const from = stops.find((stop) => stop.id === activeLeg.fromId)?.landmark
  const to = stops.find((stop) => stop.id === activeLeg.toId)?.landmark
  if (from && to) {
    return [
      [from.lng, from.lat],
      [to.lng, to.lat],
    ]
  }
  if (to && userPos?.lat != null && userPos?.lng != null) {
    return [
      [userPos.lng, userPos.lat],
      [to.lng, to.lat],
    ]
  }
  return null
}

function resolveFocusStops(stops, activeLeg, focus) {
  if (focus !== 'active-leg') return stops ?? []
  if (!activeLeg) {
    // Compact frames: only the current destination · not every upcoming stop.
    return (stops ?? []).filter((stop) => stop.status === 'current')
  }
  const ids = new Set([activeLeg.fromId, activeLeg.toId].filter(Boolean))
  const focused = (stops ?? []).filter((stop) => ids.has(stop.id))
  if (focused.length) return focused
  return (stops ?? []).filter((stop) => stop.status === 'current')
}

/**
 * @param {{
 *   tour?: object,
 *   stops?: object[],
 *   routeCoordinates?: number[][],
 *   activeLeg?: { fromId?: string, toId?: string } | null,
 *   transitLegActive?: boolean,
 *   userPos?: { lat: number, lng: number } | null,
 *   width?: number,
 *   height?: number,
 *   focus?: 'tour' | 'active-leg',
 * }} options
 */
export function buildRouteOverviewModel({
  tour,
  stops = [],
  routeCoordinates,
  activeLeg,
  transitLegActive,
  userPos,
  width = 360,
  height = 220,
  focus = 'tour',
}) {
  const landmarkTour = buildLandmarkRouteCoordinates(stops, tour)
  const fullRoute = routeCoordinates?.length ? routeCoordinates : landmarkTour

  const landmarkLeg = buildActiveLegCoordinates(stops, activeLeg, userPos)
  // Prefer provided route coords when they already describe the active walk;
  // otherwise always synthesize previous → destination for walking frames.
  const activeRoute =
    focus === 'active-leg'
      ? routeCoordinates?.length >= 2
        ? routeCoordinates
        : landmarkLeg
      : transitLegActive && landmarkLeg
        ? landmarkLeg
        : null

  const focusStops = resolveFocusStops(stops, activeLeg, focus)
  // Never fall back to the full tour for active-leg frames · that crushes the
  // walking pair into overlapping corner dots and stacked labels.
  const frameRoute =
    focus === 'active-leg' ? activeRoute ?? landmarkLeg ?? null : fullRoute

  const points = collectPoints({
    routeCoordinates: frameRoute,
    stops: focusStops,
    userPos,
  })

  if (!points.length) {
    return {
      width,
      height,
      fullRoutePath: '',
      activeRoutePath: '',
      stops: [],
      userPoint: null,
      focus,
    }
  }

  const bounds = buildBounds(points)

  const toPath = (coordinates) => {
    const coords = (coordinates ?? []).filter(
      (coordinate) =>
        Array.isArray(coordinate) &&
        coordinate.length >= 2 &&
        Number.isFinite(coordinate[0]) &&
        Number.isFinite(coordinate[1]),
    )
    if (coords.length < 2) return ''
    return coords
      .map((coordinate, index) => {
        const projected = projectPoint(
          { lat: coordinate[1], lng: coordinate[0] },
          bounds,
          width,
          height,
        )
        return `${index === 0 ? 'M' : 'L'} ${projected.x.toFixed(2)} ${projected.y.toFixed(2)}`
      })
      .join(' ')
  }

  const projectedStops = focusStops
    .filter((stop) => stop?.landmark)
    .map((stop) => ({
      id: stop.id,
      title: stop.title,
      status: stop.status,
      ...projectPoint(stop.landmark, bounds, width, height),
    }))

  const userPoint =
    userPos?.lat != null && userPos?.lng != null
      ? projectPoint(userPos, bounds, width, height)
      : null

  return {
    width,
    height,
    fullRoutePath: focus === 'active-leg' ? '' : toPath(fullRoute),
    activeRoutePath: toPath(activeRoute ?? (focus === 'active-leg' ? frameRoute : null)),
    stops: projectedStops,
    userPoint,
    focus,
  }
}
