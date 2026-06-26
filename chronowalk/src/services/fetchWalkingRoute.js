/**
 * Fetch a walking route GeoJSON line between two landmarks via Mapbox Directions.
 */
export const fetchWalkingRoute = async (from, to, accessToken) => {
  const result = await fetchWalkingDirections(from, to, accessToken)
  return result?.geometry ?? null
}

/** Walking directions with turn-by-turn steps for in-app guidance. */
export const fetchWalkingDirections = async (from, to, accessToken) => {
  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng || !accessToken) {
    return null
  }

  const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}` +
    `?geometries=geojson&overview=full&steps=true&language=en&access_token=${encodeURIComponent(accessToken)}`

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    const route = data?.routes?.[0]
    if (!route) return null

    const leg = route.legs?.[0]
    return {
      geometry: route.geometry ?? null,
      distanceM: leg?.distance ?? route.distance ?? 0,
      durationSec: leg?.duration ?? route.duration ?? 0,
      steps:
        leg?.steps?.map((step) => ({
          instruction: step.maneuver?.instruction ?? 'Continue',
          distanceM: step.distance ?? 0,
          durationSec: step.duration ?? 0,
          type: step.maneuver?.type ?? 'continue',
        })) ?? [],
    }
  } catch (error) {
    console.warn('fetchWalkingDirections: Mapbox Directions failed.', error)
    return null
  }
}

/** Multi-stop walking route through ordered landmarks. */
export const fetchTourWalkingRoute = async (landmarks, accessToken) => {
  if (!landmarks?.length || landmarks.length < 2 || !accessToken) return null

  const coordinates = landmarks.map((point) => `${point.lng},${point.lat}`).join(';')
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}` +
    `?geometries=geojson&overview=full&access_token=${encodeURIComponent(accessToken)}`

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    return data?.routes?.[0]?.geometry ?? null
  } catch (error) {
    console.warn('fetchTourWalkingRoute: Mapbox Directions failed.', error)
    return null
  }
}
