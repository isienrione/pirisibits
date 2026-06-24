import { ROME_CORE_TOUR } from '../data/rome-core-tour'
import { getWaypointGeo } from '../data/waypointGeo'

const TOURS = {
  [ROME_CORE_TOUR.id]: ROME_CORE_TOUR,
}

export const getTourById = (tourId) => TOURS[tourId] ?? null

export const listTourIds = () => Object.keys(TOURS)

/** Implicit legs between consecutive stopIds. */
export const getTourLegs = (tour) => {
  if (!tour?.stopIds?.length) return []

  const legs = []
  for (let index = 0; index < tour.stopIds.length - 1; index += 1) {
    legs.push({
      index,
      fromId: tour.stopIds[index],
      toId: tour.stopIds[index + 1],
    })
  }
  return legs
}

export const getTourLeg = (tour, legIndex) => getTourLegs(tour)[legIndex] ?? null

export const getTourStopGeo = (tour, stopIndex) => {
  const stopId = tour?.stopIds?.[stopIndex]
  if (!stopId) return null
  return getWaypointGeo(stopId)
}

export const getTourBounds = (tour) => {
  const coords = (tour?.stopIds ?? [])
    .map((id) => getWaypointGeo(id)?.landmark)
    .filter(Boolean)

  if (!coords.length) return null

  const lats = coords.map((c) => c.lat)
  const lngs = coords.map((c) => c.lng)

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
    center: {
      lat: lats.reduce((a, b) => a + b, 0) / lats.length,
      lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
    },
  }
}
