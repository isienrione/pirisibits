import { COLOSSEUM } from '../data/colosseum.js'
import { PANTHEON } from '../data/pantheon.js'
import { FONTANA_DI_TREVI } from '../data/fontana-di-trevi.js'
import { PIAZZA_NAVONA } from '../data/piazza-navona.js'
import { CAMPO_DE_FIORI } from '../data/campo-de-fiori.js'
import { LARGO_ARGENTINA } from '../data/largo-argentina.js'
import { CASTEL_SANT_ANGELO } from '../data/castel-sant-angelo.js'
import { CAPITOLINE_HILL } from '../data/capitoline-hill.js'
import { ROMAN_FORUM_STOP_IDS } from '../data/forumWaypoints.js'
import { EXPANSION_STOP_META } from '../data/expansionWaypoints.js'
import { CENTRAL_ROME_TOUR } from '../data/central-rome-tour.js'

/** Geo anchors for landing tier route maps (landing-only). */
export const LANDING_ROUTE_STOPS = {
  colosseum: { title: 'Colosseum', short: 'Colosseum', ...COLOSSEUM },
  'palatine-hill-cluster': {
    title: 'Palatine Hill',
    short: 'Palatine',
    lat: EXPANSION_STOP_META['palatine-hill-cluster'].lat,
    lng: EXPANSION_STOP_META['palatine-hill-cluster'].lng,
  },
  'forum-arch-titus': { title: 'Arch of Titus', short: 'Titus', lat: 41.8905, lng: 12.48835 },
  'forum-basilica-maxentius': { title: 'Basilica of Maxentius', short: 'Basilica', lat: 41.89175, lng: 12.488 },
  'forum-via-sacra': { title: 'Via Sacra', short: 'Via Sacra', lat: 41.89255, lng: 12.48535 },
  'forum-temple-vesta': { title: 'Temple of Vesta', short: 'Vesta', lat: 41.89182, lng: 12.48715 },
  'forum-rostra': { title: 'The Rostra', short: 'Rostra', lat: 41.89282, lng: 12.48518 },
  'forum-temple-saturn': { title: 'Temple of Saturn', short: 'Saturn', lat: 41.89239, lng: 12.48498 },
  'forum-curia-julia': { title: 'Curia Julia', short: 'Curia', lat: 41.89223, lng: 12.48528 },
  'forum-arch-severus': { title: 'Arch of Septimius Severus', short: 'Severus', lat: 41.89301, lng: 12.48442 },
  'capitoline-hill': { title: 'Capitoline Hill', short: 'Capitoline', ...CAPITOLINE_HILL },
  'trajan-market': {
    title: "Trajan's Market",
    short: 'Trajan',
    lat: EXPANSION_STOP_META['trajan-market'].lat,
    lng: EXPANSION_STOP_META['trajan-market'].lng,
  },
  'spanish-steps': { title: 'Spanish Steps', short: 'Spanish Steps', lat: 41.90597, lng: 12.48259 },
  'fontana-di-trevi': { title: 'Fontana di Trevi', short: 'Trevi', ...FONTANA_DI_TREVI },
  pantheon: { title: 'The Pantheon', short: 'Pantheon', ...PANTHEON },
  'piazza-navona': { title: 'Piazza Navona', short: 'Navona', ...PIAZZA_NAVONA },
  'campo-de-fiori': { title: "Campo de' Fiori", short: 'Campo', ...CAMPO_DE_FIORI },
  'largo-argentina': { title: 'Largo Argentina', short: 'Argentina', ...LARGO_ARGENTINA },
  'castel-sant-angelo': { title: "Castel Sant'Angelo", short: 'Castel', ...CASTEL_SANT_ANGELO },
  'circus-maximus': {
    title: 'Circus Maximus',
    short: 'Circus',
    lat: EXPANSION_STOP_META['circus-maximus'].lat,
    lng: EXPANSION_STOP_META['circus-maximus'].lng,
  },
  'appian-way': {
    title: 'Appian Way',
    short: 'Appian',
    lat: EXPANSION_STOP_META['appian-way'].lat,
    lng: EXPANSION_STOP_META['appian-way'].lng,
  },
}

const ESSENTIAL_ROUTE = ['colosseum', ...ROMAN_FORUM_STOP_IDS]

const COMPLETE_ROUTE = [
  'colosseum',
  'palatine-hill-cluster',
  ...ROMAN_FORUM_STOP_IDS,
  'capitoline-hill',
  'trajan-market',
  'spanish-steps',
  'fontana-di-trevi',
  'pantheon',
  'piazza-navona',
  'campo-de-fiori',
  'largo-argentina',
  'castel-sant-angelo',
  'circus-maximus',
  'appian-way',
]

/** Wide Rome frame — complete tier and legacy helpers. */
export const ROME_LANDING_MAP_BOUNDS = {
  minLat: 41.854,
  maxLat: 41.907,
  minLng: 12.464,
  maxLng: 12.514,
}

const TIER_MAP_PADDING = {
  'rome-central': 0.38,
  'rome-essential': 0.34,
  'rome-complete': 0.14,
}

const MIN_MAP_LAT_SPAN = 0.011
const MIN_MAP_LNG_SPAN = 0.013

/** Build a padded bounding box around a stop cluster. */
export function buildBoundsFromStops(stops, paddingRatio = 0.25) {
  if (!stops.length) return ROME_LANDING_MAP_BOUNDS

  const lats = stops.map((stop) => stop.lat)
  const lngs = stops.map((stop) => stop.lng)
  let minLat = Math.min(...lats)
  let maxLat = Math.max(...lats)
  let minLng = Math.min(...lngs)
  let maxLng = Math.max(...lngs)

  const latSpan = Math.max(maxLat - minLat, MIN_MAP_LAT_SPAN)
  const lngSpan = Math.max(maxLng - minLng, MIN_MAP_LNG_SPAN)
  const centerLat = (minLat + maxLat) / 2
  const centerLng = (minLng + maxLng) / 2

  minLat = centerLat - latSpan / 2
  maxLat = centerLat + latSpan / 2
  minLng = centerLng - lngSpan / 2
  maxLng = centerLng + lngSpan / 2

  const latPad = latSpan * paddingRatio
  const lngPad = lngSpan * paddingRatio

  return {
    minLat: minLat - latPad,
    maxLat: maxLat + latPad,
    minLng: minLng - lngPad,
    maxLng: maxLng + lngPad,
  }
}

/** Per-tier map frame — central and ancient tiers zoom into their clusters. */
export function getLandingTierMapBounds(tierId) {
  const stops = getLandingTierRouteStops(tierId)
  const padding = TIER_MAP_PADDING[tierId] ?? 0.2
  return buildBoundsFromStops(stops, padding)
}

const TIBER_GEO = [
  { lat: 41.906, lng: 12.466 },
  { lat: 41.898, lng: 12.468 },
  { lat: 41.89, lng: 12.471 },
  { lat: 41.882, lng: 12.477 },
  { lat: 41.872, lng: 12.488 },
  { lat: 41.858, lng: 12.504 },
]

/** Walk order per landing tier — used for route lines on pricing maps. */
export const LANDING_TIER_ROUTES = {
  'rome-central': [...CENTRAL_ROME_TOUR.stopIds],
  'rome-essential': ESSENTIAL_ROUTE,
  'rome-complete': COMPLETE_ROUTE,
}

export function getLandingTierRouteStops(tierId) {
  const ids = LANDING_TIER_ROUTES[tierId] ?? []
  return ids
    .map((id) => {
      const stop = LANDING_ROUTE_STOPS[id]
      if (!stop) return null
      return { id, ...stop }
    })
    .filter(Boolean)
}

function resolveBounds(stops, bounds) {
  if (bounds) return bounds
  const lats = stops.map((s) => s.lat)
  const lngs = stops.map((s) => s.lng)
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  }
}

/** Project lat/lng stops into SVG coordinates. */
export function projectRouteStops(
  stops,
  { width = 100, height = 72, padding = 8, bounds = null } = {}
) {
  if (!stops.length) return []

  const { minLat, maxLat, minLng, maxLng } = resolveBounds(stops, bounds)
  const latSpan = maxLat - minLat || 0.001
  const lngSpan = maxLng - minLng || 0.001

  return stops.map((stop, index) => ({
    ...stop,
    index,
    x: padding + ((stop.lng - minLng) / lngSpan) * (width - padding * 2),
    y: padding + (1 - (stop.lat - minLat) / latSpan) * (height - padding * 2),
  }))
}

export function getLandingTierTiberPath(options = {}) {
  const points = projectRouteStops(TIBER_GEO, {
    ...options,
    bounds: options.bounds ?? ROME_LANDING_MAP_BOUNDS,
  })
  return buildRoutePathD(points)
}

export function buildRoutePathD(points) {
  if (points.length < 2) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
}
