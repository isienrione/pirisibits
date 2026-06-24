/**
 * Curated walking tour — ordered stops and legs.
 *
 * To add a stop between Colosseum and Pantheon, insert its waypoint id in
 * `stopIds` (e.g. ['colosseum', 'forum-romanum', 'pantheon']). Legs are derived
 * automatically between consecutive ids.
 */
export const ROME_CORE_TOUR = {
  id: 'rome-core',
  title: 'Heart of Ancient Rome',
  subtitle: 'Colosseum → Pantheon → Piazza Navona',
  /** Ordered waypoint ids — insert new stops anywhere in this list. */
  stopIds: ['colosseum', 'pantheon', 'piazza-navona'],
  /** Default map zoom when fitting the full tour */
  mapZoom: 14,
}
