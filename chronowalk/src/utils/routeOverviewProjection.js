const PADDING = 12

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

function projectPoint(point, bounds, width, height) {
  const x =
    bounds.minLng === bounds.maxLng
      ? width / 2
      : ((point.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (width - PADDING * 2) +
        PADDING

  const y =
    bounds.minLat === bounds.maxLat
      ? height / 2
      : (1 - (point.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * (height - PADDING * 2) +
        PADDING

  return { x, y }
}

function buildBounds(points) {
  const lats = points.map((point) => point.lat)
  const lngs = points.map((point) => point.lng)

  const latSpan = Math.max(...lats) - Math.min(...lats)
  const lngSpan = Math.max(...lngs) - Math.min(...lngs)
  const latPad = Math.max(latSpan * 0.12, 0.0008)
  const lngPad = Math.max(lngSpan * 0.12, 0.0008)

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

export function buildRouteOverviewModel({
  tour,
  stops = [],
  routeCoordinates,
  activeLeg,
  transitLegActive,
  userPos,
  width = 360,
  height = 220,
}) {
  const fullRoute = routeCoordinates?.length
    ? routeCoordinates
    : buildLandmarkRouteCoordinates(stops, tour)

  const activeRoute =
    transitLegActive && activeLeg
      ? (() => {
          const from = stops.find((stop) => stop.id === activeLeg.fromId)?.landmark
          const to = stops.find((stop) => stop.id === activeLeg.toId)?.landmark
          if (!from || !to) return null
          return [
            [from.lng, from.lat],
            [to.lng, to.lat],
          ]
        })()
      : null

  const points = collectPoints({ routeCoordinates: fullRoute, stops, userPos })
  if (!points.length) {
    return {
      width,
      height,
      fullRoutePath: '',
      activeRoutePath: '',
      stops: [],
      userPoint: null,
    }
  }

  const bounds = buildBounds(points)

  const toPath = (coordinates) =>
    (coordinates ?? [])
      .map((coordinate, index) => {
        const projected = projectPoint(
          { lat: coordinate[1], lng: coordinate[0] },
          bounds,
          width,
          height
        )
        return `${index === 0 ? 'M' : 'L'} ${projected.x.toFixed(2)} ${projected.y.toFixed(2)}`
      })
      .join(' ')

  const projectedStops = (stops ?? [])
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
    fullRoutePath: toPath(fullRoute),
    activeRoutePath: activeRoute ? toPath(activeRoute) : '',
    stops: projectedStops,
    userPoint,
  }
}
