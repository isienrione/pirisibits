/**
 * Canonical city content types. Not Rome-specific.
 * A city may ship any subset of these.
 */
export const CONTENT_TYPES = Object.freeze({
  HERO: 'hero',
  DISCOVERY: 'discovery',
  REVEAL: 'reveal',
  POI: 'poi',
})

export const GEO_STATUS = Object.freeze({
  VERIFIED: 'VERIFIED',
  NEEDS_QA: 'NEEDS_QA',
  MISSING: 'MISSING',
})

export const MEDIA_STATUS = Object.freeze({
  READY: 'ready',
  PLACEHOLDER: 'placeholder',
  MISSING: 'missing',
  PLANNED: 'planned',
  NONE: 'none',
})

export const COPY_STATUS = Object.freeze({
  APPROVED: 'approved',
  PLACEHOLDER: 'placeholder',
})

export const ROME_CLUSTERS = Object.freeze({
  AVENTINE: 'aventine',
  FORUM_BOARIUM: 'forum-boarium',
  VELABRO: 'velabro',
  GHETTO: 'ghetto',
  MATTEI: 'mattei',
  CAMPO: 'campo',
  PANTHEON: 'pantheon',
  VENEZIA: 'venezia',
  CORSO: 'corso',
  FORUM: 'forum',
  PALATINE: 'palatine',
  CENTRO: 'centro',
  APPIA: 'appia',
})

export const ARCHETYPES = Object.freeze({
  VIEWPOINT: 'viewpoint',
  GARDEN: 'garden',
  CHURCH_DETAIL: 'church-detail',
  FOLKLORE: 'folklore',
  ANCIENT_TEMPLE: 'ancient-temple',
  MONUMENT: 'monument',
  STREET_FRAGMENT: 'street-fragment',
  COURTYARD: 'courtyard',
  PERSPECTIVE: 'perspective-illusion',
  PALAZZO: 'palazzo',
  TALKING_STATUE: 'talking-statue',
  PAINTING: 'painting',
  POLITICAL: 'political-site',
  ARCADE: 'arcade',
  HERO_EXPERIENCE: 'hero-experience',
  REVEAL: 'reveal',
})

export const BRAND_PLACEHOLDER_IMAGE = '/brand/emblem-dark.png'

/** Cluster → existing Rome photograph (Hero waypoint posters). */
export const CLUSTER_FALLBACK_PHOTOS = Object.freeze({
  [ROME_CLUSTERS.AVENTINE]: '/waypoints/circus-maximus/modern-poster.jpg',
  [ROME_CLUSTERS.FORUM_BOARIUM]: '/waypoints/circus-maximus/modern-poster.jpg',
  [ROME_CLUSTERS.VELABRO]: '/waypoints/capitoline-hill/modern-poster.jpg',
  [ROME_CLUSTERS.GHETTO]: '/waypoints/largo-argentina/modern-poster.jpg',
  [ROME_CLUSTERS.MATTEI]: '/waypoints/largo-argentina/modern-poster.jpg',
  [ROME_CLUSTERS.CAMPO]: '/waypoints/campo-de-fiori/modern-poster.jpg',
  [ROME_CLUSTERS.PANTHEON]: '/waypoints/pantheon/modern-poster.jpg',
  [ROME_CLUSTERS.VENEZIA]: '/waypoints/capitoline-hill/modern-poster.jpg',
  [ROME_CLUSTERS.CORSO]: '/waypoints/fontana-di-trevi/modern-poster.jpg',
  [ROME_CLUSTERS.FORUM]: '/waypoints/forum-cluster/forum-via-sacra/modern-poster.jpg',
  [ROME_CLUSTERS.PALATINE]: '/waypoints/palatine-hill-cluster/modern-poster.jpg',
  [ROME_CLUSTERS.CENTRO]: '/waypoints/piazza-navona/modern-poster.jpg',
  [ROME_CLUSTERS.APPIA]: '/waypoints/via-appia/modern-poster.jpg',
})

export const CITY_FALLBACK_PHOTO = '/waypoints/pantheon/modern-poster.jpg'
