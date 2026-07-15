import { getModernPosterUrl } from '../content/modernPhotoRegistry.js'
import { LANDING_ROUTE_STOPS, LANDING_TIER_ROUTES } from './landingTierRoutes.js'

/** Highlight stops shown before expand — span Arena → Appian without a catalog. */
export const LANDING_ROUTE_PREVIEW_IDS = [
  'colosseum',
  'forum-arch-titus',
  'fontana-di-trevi',
  'pantheon',
  'castel-sant-angelo',
  'appian-way',
]

/**
 * Narrative chapters for the complete Rome walk.
 * Order follows LANDING_TIER_ROUTES['rome-complete'].
 */
export const LANDING_ROUTE_CHAPTERS = [
  {
    id: 'ancient-stage',
    label: 'The ancient stage',
    stopIds: [
      'colosseum',
      'palatine-hill-cluster',
      'forum-arch-titus',
      'forum-basilica-maxentius',
      'forum-via-sacra',
      'forum-temple-vesta',
      'forum-rostra',
      'forum-temple-saturn',
      'forum-curia-julia',
      'forum-arch-severus',
      'capitoline-hill',
      'trajan-market',
    ],
  },
  {
    id: 'living-centre',
    label: 'The living centre',
    stopIds: [
      'spanish-steps',
      'fontana-di-trevi',
      'pantheon',
      'piazza-navona',
      'campo-de-fiori',
      'largo-argentina',
      'castel-sant-angelo',
    ],
  },
  {
    id: 'beyond-the-walls',
    label: 'Beyond the walls',
    stopIds: ['circus-maximus', 'appian-way'],
  },
]

/** All monuments on the complete Rome route — ordered journey, not a catalog. */
export function getLandingMonuments() {
  const stopIds = LANDING_TIER_ROUTES['rome-complete'] ?? []

  return stopIds.map((id, index) => {
    const stop = LANDING_ROUTE_STOPS[id]
    return {
      id,
      index: index + 1,
      title: stop?.title ?? id,
      short: stop?.short ?? stop?.title ?? id,
      photo: getModernPosterUrl(id),
      featured: LANDING_ROUTE_PREVIEW_IDS.includes(id),
    }
  })
}

/**
 * Chaptered journey model for the landing continuous-route section.
 */
export function getLandingRouteJourney() {
  const stops = getLandingMonuments()
  const byId = Object.fromEntries(stops.map((stop) => [stop.id, stop]))

  const chapters = LANDING_ROUTE_CHAPTERS.map((chapter) => ({
    id: chapter.id,
    label: chapter.label,
    stops: chapter.stopIds.map((id) => byId[id]).filter(Boolean),
  }))

  const previewStops = LANDING_ROUTE_PREVIEW_IDS.map((id) => byId[id]).filter(Boolean)

  /** Preview beat + how many full-route stops sit after it before the next highlight. */
  const previewSegments = previewStops.map((stop, index) => {
    const next = previewStops[index + 1]
    const skippedAfter = next ? Math.max(0, next.index - stop.index - 1) : 0
    return { stop, skippedAfter }
  })

  return {
    stops,
    chapters,
    previewStops,
    previewSegments,
    totalStops: stops.length,
  }
}
