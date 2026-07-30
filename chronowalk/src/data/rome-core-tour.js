import { HEART_OF_ANCIENT_ROME_TOUR } from './heart-of-ancient-rome-tour'
import { ROMAN_FORUM_TOUR } from './roman-forum-tour'

/**
 * Legacy full-route tour (all stops). Prefer `roman-forum` + `heart-of-ancient-rome` products.
 */
export const ROME_CORE_TOUR = {
  id: 'rome-core',
  title: 'Heart of Ancient Rome (full)',
  subtitle: 'Roman Forum + city loop — all stops',
  stopIds: [...ROMAN_FORUM_TOUR.stopIds, ...HEART_OF_ANCIENT_ROME_TOUR.stopIds],
  mapZoom: 14,
}
