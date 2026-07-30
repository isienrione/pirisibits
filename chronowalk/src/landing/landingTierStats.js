import { getDistance } from '../utils/distance.js'
import { estimateWalkMinutes } from '../utils/tourStats.js'
import { getLandingTierRouteStops } from './landingTierRoutes.js'

/** Urban walking routes are longer than straight-line stop-to-stop legs. */
const WALK_ROUTE_FACTOR = 1.35

/** Studio narration totals · rounded for pricing cards. */
const AUDIO_MINUTES_BY_TIER = {
  'rome-central': 70,
  'rome-essential': 80,
  'rome-complete': 195,
}

/** Product-truth overrides where geo estimates under/over-shoot. */
const DISTANCE_KM_OVERRIDE = {
  'rome-essential': 2.5,
  'rome-complete': 8,
}

/** Upper bound adds pauses, threshold holds, photos, and self-paced detours. */
const ROUTE_TIME_HIGH_BUFFER = 0.3

function sumRouteMeters(stops) {
  let total = 0
  for (let index = 1; index < stops.length; index += 1) {
    const from = stops[index - 1]
    const to = stops[index]
    total += getDistance(from.lat, from.lng, to.lat, to.lng)
  }
  return total
}

function kmToMiles(km) {
  return Math.round(km * 0.621371 * 10) / 10
}

function roundDownTo(minutes, step) {
  return Math.floor(minutes / step) * step
}

function roundUpTo(minutes, step) {
  return Math.ceil(minutes / step) * step
}

function formatDurationMinutes(minutes) {
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  if (Number.isInteger(hours)) return `${hours} hr`
  return `${Math.round(hours * 2) / 2} hr`
}

function formatAudioMinutes(minutes) {
  if (!minutes) return '–'
  return `~${formatDurationMinutes(minutes)}`
}

function formatRouteTimeRange(minMinutes, maxMinutes) {
  if (!minMinutes || !maxMinutes) return '–'
  if (minMinutes === maxMinutes) return `~${formatDurationMinutes(minMinutes)}`

  const minLabel = formatDurationMinutes(minMinutes)
  const maxLabel = formatDurationMinutes(maxMinutes)
  const minUnit = minLabel.includes('hr') ? 'hr' : 'min'
  const maxUnit = maxLabel.includes('hr') ? 'hr' : 'min'

  if (minUnit === maxUnit) {
    const minValue = minLabel.replace(` ${minUnit}`, '')
    const maxValue = maxLabel.replace(` ${maxUnit}`, '')
    return `~${minValue}–${maxValue} ${minUnit}`
  }

  return `~${minLabel}–${maxLabel}`
}

function formatDistance(km) {
  if (!km) return '–'
  const miles = kmToMiles(km)
  return `${km.toFixed(1)} km / ${miles} mi`
}

/**
 * Landing pricing stats · audio minutes, on-route time range, and distance.
 * On-route time = narration + walking between stops, shown as a low–high estimate.
 * @param {string} tierId
 */
export function getLandingTierStats(tierId) {
  const stops = getLandingTierRouteStops(tierId)
  const straightMeters = sumRouteMeters(stops)
  const routeMeters = straightMeters * WALK_ROUTE_FACTOR
  const distanceKm = DISTANCE_KM_OVERRIDE[tierId] ?? Math.round((routeMeters / 1000) * 10) / 10
  const walkMinutes = estimateWalkMinutes(distanceKm * 1000)
  const audioMinutes = AUDIO_MINUTES_BY_TIER[tierId] ?? null
  const baseRouteMinutes = (audioMinutes ?? 0) + (walkMinutes ?? 0)
  const routeTimeMinMinutes = roundDownTo(baseRouteMinutes, 15)
  const routeTimeMaxMinutes = roundUpTo(baseRouteMinutes * (1 + ROUTE_TIME_HIGH_BUFFER), 15)
  const routeTimeLabel = formatRouteTimeRange(routeTimeMinMinutes, routeTimeMaxMinutes)

  return {
    stopCount: stops.length,
    audioMinutes,
    audioLabel: formatAudioMinutes(audioMinutes),
    walkMinutes,
    routeTimeMinMinutes,
    routeTimeMaxMinutes,
    routeTimeLabel,
    distanceKm,
    distanceMiles: kmToMiles(distanceKm),
    distanceLabel: formatDistance(distanceKm),
    line: [formatAudioMinutes(audioMinutes), routeTimeLabel, formatDistance(distanceKm)].join(' · '),
  }
}
