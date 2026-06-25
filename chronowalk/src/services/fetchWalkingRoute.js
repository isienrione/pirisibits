/**
 * Fetch a walking route GeoJSON line between two landmarks via Mapbox Directions.
 */
export const fetchWalkingRoute = async (from, to, accessToken) => {
  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng || !accessToken) {
    return null
  }

  const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}` +
    `?geometries=geojson&overview=full&access_token=${encodeURIComponent(accessToken)}`

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    return data?.routes?.[0]?.geometry ?? null
  } catch (error) {
    console.warn('fetchWalkingRoute: Mapbox Directions failed.', error)
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
