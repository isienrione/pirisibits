import { getDistance } from '../utils/distance.js'
import { getManifestWaypointIds } from './mapStops.js'
import { getWaypoint } from './manifest.js'
import { pickJournalReflection } from './journalTimeline.js'
import { t } from '../i18n/t.js'

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
  if (meters < 1000) return t('letter.metres', { n: Math.round(meters) })
  return t('letter.kilometres', { n: (meters / 1000).toFixed(1) })
}

function formatPlaceList(names) {
  if (names.length === 2) return t('letter.listAnd', { a: names[0], b: names[1] })
  return t('letter.listJoin', {
    items: names.slice(0, -1).join(', '),
    last: names.at(-1),
  })
}

export function composeLetterBody(manifest, stops) {
  if (!stops.length) {
    return t('letter.blank')
  }

  const names = stops.map((stop) => stop.title)
  const walked = formatDistancePhrase(estimateLetterWalkedMeters(stops))
  const city = manifest?.name ?? t('letter.cityDefault')

  if (names.length === 1) {
    return t('letter.oneStop', { city, name: names[0] })
  }

  const route = formatPlaceList(names)
  const distanceLine = walked ? t('letter.distance', { walked }) : ''

  return t('letter.many', { city, route, distance: distanceLine })
}

const TRAVELER_NAME_KEY = 'cw_traveler_name_v1'

export function readTravelerName() {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(TRAVELER_NAME_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

export function writeTravelerName(name) {
  if (typeof window === 'undefined') return
  try {
    const cleaned = String(name ?? '').trim().slice(0, 40)
    if (cleaned) window.localStorage.setItem(TRAVELER_NAME_KEY, cleaned)
    else window.localStorage.removeItem(TRAVELER_NAME_KEY)
  } catch {
    /* ignore */
  }
}

export function buildJourneyLetter(manifest, context = {}) {
  const path = context.path ?? 'a'
  const stops = buildLetterStops(manifest, context.completedWaypointIds ?? [], path)
  const reflection = pickJournalReflection(manifest, stops.length)
  const body = composeLetterBody(manifest, stops)
  const walkedMeters = estimateLetterWalkedMeters(stops)
  const firstName = context.travelerName?.trim() || readTravelerName() || t('letter.traveler')

  return {
    city: manifest?.name ?? t('letter.cityDefault'),
    title: stops.length ? t('letter.title.path') : t('letter.title.await'),
    body,
    reflection,
    stops,
    stopCount: stops.length,
    walkedMeters,
    firstName,
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
