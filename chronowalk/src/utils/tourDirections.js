import { getWaypointGeo } from '../data/waypointGeo'

function withWaypointTitle(waypointId) {
  const geo = getWaypointGeo(waypointId)
  if (!geo?.landmark) return null
  return { ...geo.landmark, title: geo.title }
}

/** Walking directions origin when routing between tour stops (not live GPS). */
export function getTourDirectionsOrigin(tour, progress) {
  if (!tour?.stopIds?.length || !progress) return null

  const lastArrivedId = progress.arrivedStopIds?.at(-1)
  if (lastArrivedId) {
    return withWaypointTitle(lastArrivedId)
  }

  if (progress.targetStopIndex > 0) {
    const previousStopId = tour.stopIds[progress.targetStopIndex - 1]
    return withWaypointTitle(previousStopId)
  }

  return null
}
