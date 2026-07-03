import { getDistance } from '../utils/distance.js'
import { getManifestWaypointIds } from './mapStops.js'
import { getWaypoint } from './manifest.js'
import { pickJournalReflection } from './journalTimeline.js'

export function buildLetterStops(manifest, completedWaypointIds = [], path = 'a') {
  const pathOrder = getManifestWaypointIds(manifest, path)
  const completedSet = new Set(completedWaypointIds)

  return pathOrder
    .filter((id) => completedSet.has(id))
    .map((id) => {
      const waypoint = getWaypoint(manifest, id)
      if (!waypoint?.geofence) return null

      return {
        id,
        title: waypoint.title ?? id,
        lat: waypoint.geofence.lat,
        lng: waypoint.geofence.lng,
      }
    })
    .filter(Boolean)
}

export function estimateLetterWalkedMeters(stops) {
  if (stops.length < 2) return 0

  let total = 0
  for (let index = 1; index < stops.length; index += 1) {
    const from = stops[index - 1]
    const to = stops[index]
    total += getDistance(from.lat, from.lng, to.lat, to.lng)
  }

  return total
}

function formatDistancePhrase(meters) {
  if (!meters || meters < 1) return null
  if (meters < 1000) return `${Math.round(meters)} metres`
  return `${(meters / 1000).toFixed(1)} kilometres`
}

export function composeLetterBody(manifest, stops) {
  if (!stops.length) {
    return 'Your letter is still blank — Rome is waiting for your footsteps. Each stop you hear will add a line to the path you walked.'
  }

  const names = stops.map((stop) => stop.title)
  const walked = formatDistancePhrase(estimateLetterWalkedMeters(stops))
  const city = manifest?.name ?? 'Rome'

  if (names.length === 1) {
    return `You began in ${city} at ${names[0]}. One doorway opened — and the city already knows your name.`
  }

  const route = names.length === 2
    ? `${names[0]} and ${names[1]}`
    : `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`

  const distanceLine = walked
    ? ` Along the way you covered roughly ${walked} of stone, piazza, and hill.`
    : ''

  return `You walked ${city} from ${route}.${distanceLine} The stories you heard are yours to keep.`
}

export function buildJourneyLetter(manifest, context = {}) {
  const path = context.path ?? 'a'
  const stops = buildLetterStops(manifest, context.completedWaypointIds ?? [], path)
  const reflection = pickJournalReflection(manifest, stops.length)
  const body = composeLetterBody(manifest, stops)
  const walkedMeters = estimateLetterWalkedMeters(stops)

  return {
    city: manifest?.name ?? 'Rome',
    title: stops.length ? 'The path you walked' : 'Your letter awaits',
    body,
    reflection,
    stops,
    stopCount: stops.length,
    walkedMeters,
    shareText: [body, reflection].filter(Boolean).join('\n\n'),
  }
}

export function projectMeanderPoints(stops, { width = 360, height = 180, padding = 24 } = {}) {
  if (!stops.length) {
    return { points: [], path: '', viewBox: `0 0 ${width} ${height}` }
  }

  const lats = stops.map((stop) => stop.lat)
  const lngs = stops.map((stop) => stop.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latSpan = Math.max(maxLat - minLat, 0.001)
  const lngSpan = Math.max(maxLng - minLng, 0.001)

  const points = stops.map((stop) => ({
    ...stop,
    x: padding + ((stop.lng - minLng) / lngSpan) * (width - padding * 2),
    y: padding + (1 - (stop.lat - minLat) / latSpan) * (height - padding * 2),
  }))

  const path = points.reduce((line, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const prev = points[index - 1]
    const midX = (prev.x + point.x) / 2
    const midY = (prev.y + point.y) / 2
    return `${line} Q ${prev.x} ${midY}, ${midX} ${midY} T ${point.x} ${point.y}`
  }, '')

  return { points, path, viewBox: `0 0 ${width} ${height}` }
}
