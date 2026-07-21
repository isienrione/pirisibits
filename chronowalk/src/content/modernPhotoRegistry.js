/**
 * Canonical modern-day photo paths for Rome waypoints.
 * Used for launch UI fallbacks and placeholder resolution.
 */

const WP = '/waypoints'

/** @type {Record<string, { exterior: string, poster: string }>} */
export const MODERN_PHOTO_PATHS = {
  colosseum: {
    exterior: `${WP}/colosseum/exterior/modern-exterior.jpg`,
    poster: `${WP}/colosseum/exterior/modern-poster.jpg`,
  },
  'colosseum-interior': {
    exterior: `${WP}/colosseum/interior/modern-exterior.jpg`,
    poster: `${WP}/colosseum/interior/modern-poster.jpg`,
  },
  'palatine-hill-cluster': {
    exterior: `${WP}/palatine-hill-cluster/modern-exterior.jpg`,
    poster: `${WP}/palatine-hill-cluster/modern-poster.jpg`,
  },
  'capitoline-hill': {
    exterior: `${WP}/capitoline-hill/modern-exterior.jpg`,
    poster: `${WP}/capitoline-hill/modern-poster.jpg`,
  },
  'trajan-market': {
    exterior: `${WP}/trajan-market/modern-exterior.jpg`,
    poster: `${WP}/trajan-market/modern-poster.jpg`,
  },
  pantheon: {
    exterior: `${WP}/pantheon/modern-exterior.jpg`,
    poster: `${WP}/pantheon/modern-poster.jpg`,
  },
  // Temporary: reuse exterior media until interior stills/reconstructions ship.
  'pantheon-interior': {
    exterior: `${WP}/pantheon/modern-exterior.jpg`,
    poster: `${WP}/pantheon/modern-poster.jpg`,
  },
  'fontana-di-trevi': {
    exterior: `${WP}/fontana-di-trevi/modern-exterior.jpg`,
    poster: `${WP}/fontana-di-trevi/modern-poster.jpg`,
  },
  'largo-argentina': {
    exterior: `${WP}/largo-argentina/modern-exterior.jpg`,
    poster: `${WP}/largo-argentina/modern-poster.jpg`,
  },
  'campo-de-fiori': {
    exterior: `${WP}/campo-de-fiori/modern-exterior.jpg`,
    poster: `${WP}/campo-de-fiori/modern-poster.jpg`,
  },
  'piazza-navona': {
    exterior: `${WP}/piazza-navona/modern-exterior.jpg`,
    poster: `${WP}/piazza-navona/modern-poster.jpg`,
  },
  'castel-sant-angelo': {
    exterior: `${WP}/castel-sant-angelo/modern-exterior.jpg`,
    poster: `${WP}/castel-sant-angelo/modern-poster.jpg`,
  },
  'circus-maximus': {
    exterior: `${WP}/circus-maximus/modern-exterior.jpg`,
    poster: `${WP}/circus-maximus/modern-poster.jpg`,
  },
  'appian-way': {
    exterior: `${WP}/via-appia/modern-exterior.jpg`,
    poster: `${WP}/via-appia/modern-poster.jpg`,
  },
  'forum-arch-titus': {
    exterior: `${WP}/forum-cluster/forum-arch-titus/modern-exterior.jpg`,
    poster: `${WP}/forum-cluster/forum-arch-titus/modern-poster.jpg`,
  },
  'forum-basilica-maxentius': {
    exterior: `${WP}/forum-cluster/forum-basilica-maxentius/modern-exterior.jpg`,
    poster: `${WP}/forum-cluster/forum-basilica-maxentius/modern-poster.jpg`,
  },
  'forum-via-sacra': {
    exterior: `${WP}/forum-cluster/forum-via-sacra/modern-exterior.jpg`,
    poster: `${WP}/forum-cluster/forum-via-sacra/modern-poster.jpg`,
  },
  'forum-temple-vesta': {
    exterior: `${WP}/forum-cluster/forum-temple-vesta/modern-exterior.jpg`,
    poster: `${WP}/forum-cluster/forum-temple-vesta/modern-poster.jpg`,
  },
  'forum-rostra': {
    exterior: `${WP}/forum-cluster/forum-rostra/modern-exterior.jpg`,
    poster: `${WP}/forum-cluster/forum-rostra/modern-poster.jpg`,
  },
  'forum-temple-saturn': {
    exterior: `${WP}/forum-cluster/forum-temple-saturn/modern-exterior.jpg`,
    poster: `${WP}/forum-cluster/forum-temple-saturn/modern-poster.jpg`,
  },
  'forum-curia-julia': {
    exterior: `${WP}/forum-cluster/forum-curia-julia/modern-exterior.jpg`,
    poster: `${WP}/forum-cluster/forum-curia-julia/modern-poster.jpg`,
  },
  'forum-arch-severus': {
    exterior: `${WP}/forum-cluster/forum-arch-severus/modern-exterior.jpg`,
    poster: `${WP}/forum-cluster/forum-arch-severus/modern-poster.jpg`,
  },
  'spanish-steps': {
    exterior: `${WP}/spanish-steps/modern-exterior.jpg`,
    poster: `${WP}/spanish-steps/modern-poster.jpg`,
  },
}

/** Default tour / app hero when no stop-specific image is set. */
export const TOUR_HERO_PHOTO = MODERN_PHOTO_PATHS.colosseum.poster

/** @param {string | null | undefined} stopId */
export function getModernPhotoPaths(stopId) {
  if (!stopId) return MODERN_PHOTO_PATHS.colosseum
  return MODERN_PHOTO_PATHS[stopId] ?? MODERN_PHOTO_PATHS.colosseum
}

/** @param {string | null | undefined} stopId */
export function getModernPosterUrl(stopId) {
  return getModernPhotoPaths(stopId).poster
}

/** @param {string | null | undefined} stopId */
export function getModernExteriorUrl(stopId) {
  return getModernPhotoPaths(stopId).exterior
}
