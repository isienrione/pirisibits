import { HERO_STOP_IDS } from '../../i18n/audio/heroStopAudioMap.js'
import { getWaypoint } from '../manifest.js'
import { ROME_HERO_META } from './heroRecommendationMeta.js'

/**
 * Join city-specific recommendation metadata with the Rome manifest.
 * Ranker code stays generic over this catalog shape.
 */
export function getRomeHeroCatalog(manifest) {
  return HERO_STOP_IDS.map((heroId) => {
    const meta = ROME_HERO_META[heroId]
    const waypoint = manifest ? getWaypoint(manifest, heroId) : null
    const geofence = waypoint?.geofence
    const reconstruction = waypoint?.reconstruction
    return {
      heroId,
      experienceId: meta?.experienceId ?? `rome:${heroId}`,
      placeId: meta?.placeId ?? heroId,
      title: meta?.title ?? waypoint?.title ?? waypoint?.name ?? heroId,
      interestTags: meta?.interestTags ?? [],
      timeCostMin: meta?.timeCostMin ?? 10,
      whyWorthIt: meta?.whyWorthIt ?? '',
      unlockScopes: meta?.unlockScopes ?? [],
      intrinsicPriority: meta?.intrinsicPriority ?? 0,
      geo:
        geofence && Number.isFinite(Number(geofence.lat)) && Number.isFinite(Number(geofence.lng))
          ? { lat: Number(geofence.lat), lng: Number(geofence.lng) }
          : null,
      photo: waypoint?.photo ?? reconstruction?.now ?? null,
      revealAvailable: Boolean(reconstruction?.loop || reconstruction?.then),
      zone: waypoint?.zone ?? null,
    }
  })
}
