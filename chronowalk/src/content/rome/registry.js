import { ARCHETYPES, CONTENT_TYPES, GEO_STATUS, MEDIA_STATUS, ROME_CLUSTERS } from '../registry/constants.js'
import { resolveContentMedia } from '../registry/media.js'
import { loadRomeManifest } from '../manifest.js'
import { getRomeHeroCatalog } from './heroCatalog.js'
import { ROME_DISCOVERIES } from './discoveries.js'
import { ROME_SCOPE_IDS } from './coverage.js'

const HERO_CLUSTER = Object.freeze({
  w01: ROME_CLUSTERS.FORUM,
  w02: ROME_CLUSTERS.FORUM,
  w03: ROME_CLUSTERS.FORUM,
  w04: ROME_CLUSTERS.PALATINE,
  enc_circus: ROME_CLUSTERS.PALATINE,
  w06: ROME_CLUSTERS.FORUM,
  w07: ROME_CLUSTERS.FORUM,
  w08: ROME_CLUSTERS.FORUM,
  w10: ROME_CLUSTERS.FORUM,
  w11_12: ROME_CLUSTERS.FORUM,
  w13: ROME_CLUSTERS.FORUM,
  w14: ROME_CLUSTERS.CENTRO,
  w15: ROME_CLUSTERS.CENTRO,
  w16: ROME_CLUSTERS.CENTRO,
  w17: ROME_CLUSTERS.PANTHEON,
  w23: ROME_CLUSTERS.PANTHEON,
  w18: ROME_CLUSTERS.CENTRO,
  w19: ROME_CLUSTERS.CAMPO,
  w20: ROME_CLUSTERS.CAMPO,
  w21: ROME_CLUSTERS.CENTRO,
  w22: ROME_CLUSTERS.APPIA,
})

function attachMedia(item) {
  const resolved = resolveContentMedia(item)
  return {
    ...item,
    photo: resolved.url,
    mediaResolved: resolved,
  }
}

export function heroToRegistryItem(hero) {
  const geo = hero.geo
    ? { lat: hero.geo.lat, lng: hero.geo.lng, status: GEO_STATUS.VERIFIED, note: 'Rome manifest geofence' }
    : { lat: null, lng: null, status: GEO_STATUS.MISSING, note: 'Missing manifest geofence' }
  const imageReady = Boolean(hero.photo)
  return attachMedia({
    id: hero.heroId,
    heroId: hero.heroId,
    experienceId: hero.experienceId,
    placeId: hero.placeId,
    cityId: 'rome',
    contentType: CONTENT_TYPES.HERO,
    title: hero.title,
    shortTitle: hero.title,
    clusterId: HERO_CLUSTER[hero.heroId] || ROME_CLUSTERS.CENTRO,
    geo,
    interestTags: hero.interestTags || [],
    avoidTags: [],
    timeCostMin: hero.timeCostMin,
    whyWorthIt: hero.whyWorthIt,
    archetype: ARCHETYPES.HERO_EXPERIENCE,
    indoorOutdoor: 'mix',
    weatherFit: 'any',
    crowdSensitivity: 'medium',
    urbanComfort: 'visitor-areas',
    accessNotes: '',
    relatedContentIds: hero.revealAvailable ? [`reveal:${hero.heroId}`] : [],
    unlockScopes: hero.unlockScopes || [ROME_SCOPE_IDS.COMPLETE],
    media: {
      image: { status: imageReady ? MEDIA_STATUS.READY : MEDIA_STATUS.PLACEHOLDER, path: hero.photo || null },
      audio: { status: MEDIA_STATUS.READY, path: null },
      visual: {
        status: hero.revealAvailable ? MEDIA_STATUS.READY : MEDIA_STATUS.NONE,
        path: null,
      },
    },
    assetStatus: imageReady ? MEDIA_STATUS.READY : MEDIA_STATUS.PLACEHOLDER,
    intrinsicPriority: hero.intrinsicPriority,
    revealAvailable: Boolean(hero.revealAvailable),
    photo: hero.photo || null,
  })
}

export function revealFromHero(hero) {
  if (!hero?.revealAvailable) return null
  return attachMedia({
    id: `reveal:${hero.heroId}`,
    cityId: 'rome',
    contentType: CONTENT_TYPES.REVEAL,
    title: `${hero.title} reveal`,
    shortTitle: 'Reveal',
    clusterId: HERO_CLUSTER[hero.heroId] || ROME_CLUSTERS.CENTRO,
    geo: hero.geo
      ? { lat: hero.geo.lat, lng: hero.geo.lng, status: GEO_STATUS.VERIFIED, note: 'Tied to Hero geofence' }
      : { lat: null, lng: null, status: GEO_STATUS.MISSING, note: '' },
    interestTags: hero.interestTags || [],
    avoidTags: [],
    timeCostMin: 2,
    whyWorthIt: 'An existing reconstruction belongs to this experience.',
    archetype: ARCHETYPES.REVEAL,
    indoorOutdoor: 'mix',
    weatherFit: 'any',
    crowdSensitivity: 'low',
    urbanComfort: 'visitor-areas',
    accessNotes: 'Opens inside the Hero experience when the asset is ready.',
    relatedContentIds: [hero.heroId],
    unlockScopes: hero.unlockScopes || [ROME_SCOPE_IDS.COMPLETE],
    media: {
      image: { status: hero.photo ? MEDIA_STATUS.READY : MEDIA_STATUS.PLACEHOLDER, path: hero.photo || null },
      audio: { status: MEDIA_STATUS.NONE, path: null },
      visual: { status: MEDIA_STATUS.READY, path: null },
    },
    assetStatus: MEDIA_STATUS.READY,
    intrinsicPriority: Math.max(10, (hero.intrinsicPriority || 0) - 20),
    photo: hero.photo || null,
  })
}

let cachedDefaultRegistry = null

export function getRomeRegistry(manifest) {
  const usingDefault = manifest === undefined
  if (usingDefault && cachedDefaultRegistry) return cachedDefaultRegistry
  const source = manifest || loadRomeManifest()
  const heroCatalog = getRomeHeroCatalog(source)
  const heroes = heroCatalog.map(heroToRegistryItem)
  const discoveries = ROME_DISCOVERIES.map(attachMedia)
  const reveals = heroCatalog.map(revealFromHero).filter(Boolean)
  const pois = []
  const items = [...heroes, ...discoveries, ...reveals, ...pois]
  const registry = {
    cityId: 'rome',
    items,
    byId: Object.fromEntries(items.map((item) => [item.id, item])),
    heroes,
    discoveries,
    reveals,
    pois,
  }
  if (usingDefault) cachedDefaultRegistry = registry
  return registry
}

export function getRomeRankableCatalog(manifest = loadRomeManifest()) {
  const registry = getRomeRegistry(manifest)
  return [...registry.heroes, ...registry.discoveries]
}

export function getRegistryItem(id, manifest = loadRomeManifest()) {
  if (!id) return null
  return getRomeRegistry(manifest).byId[id] || null
}

export function isHeroItem(item) {
  return item?.contentType === CONTENT_TYPES.HERO
}

export function isDiscoveryItem(item) {
  return item?.contentType === CONTENT_TYPES.DISCOVERY
}

export function contentRoute(item) {
  if (!item) return '/home'
  if (item.contentType === CONTENT_TYPES.DISCOVERY) return `/discovery/${item.id}`
  if (item.contentType === CONTENT_TYPES.REVEAL) {
    const heroId = item.relatedContentIds?.[0]
    return heroId ? `/experience/${heroId}` : '/home'
  }
  return `/experience/${item.heroId || item.id}`
}
