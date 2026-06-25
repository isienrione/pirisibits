export const createCirclePolygon = (center, radiusMeters, points = 64) => {
  const coords = []
  const earthRadius = 6371000
  const lat = (center.lat * Math.PI) / 180
  const lng = (center.lng * Math.PI) / 180

  for (let i = 0; i <= points; i++) {
    const bearing = (i / points) * 2 * Math.PI
    const lat2 = Math.asin(
      Math.sin(lat) * Math.cos(radiusMeters / earthRadius) +
        Math.cos(lat) * Math.sin(radiusMeters / earthRadius) * Math.cos(bearing)
    )
    const lng2 =
      lng +
      Math.atan2(
        Math.sin(bearing) * Math.sin(radiusMeters / earthRadius) * Math.cos(lat),
        Math.cos(radiusMeters / earthRadius) - Math.sin(lat) * Math.sin(lat2)
      )
    coords.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI])
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  }
}
