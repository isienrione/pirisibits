import { HEART_OF_ANCIENT_ROME_TOUR } from '../data/heart-of-ancient-rome-tour'
import { ROMAN_FORUM_STOP_IDS } from '../data/forumWaypoints'
import { getWaypointGeo } from '../data/waypointGeo'
import { getTourProduct } from '../data/tourProducts'
import { getLocalWaypoint } from '../services/waypointMerge'
import { getDistance } from '../utils/distance'
import { estimateWalkMinutes } from '../utils/tourStats'
import { getLaunchDestination } from './launchDestinations'

const ROME_STOP_IDS = [...HEART_OF_ANCIENT_ROME_TOUR.stopIds, ...ROMAN_FORUM_STOP_IDS]

const ROME_PREVIEW_AUDIO = '/waypoints/colosseum/Audio_sample.mp3'

function buildStops(stopIds) {
  return stopIds.map((stopId, index) => {
    const geo = getWaypointGeo(stopId)
    const waypoint = getLocalWaypoint(stopId)
    const title = geo?.title ?? waypoint?.title ?? stopId

    return {
      id: stopId,
      number: index + 1,
      title,
      shortTitle: title.split(' ').slice(0, 2).join(' '),
      landmark: geo?.landmark ?? (waypoint ? { lat: waypoint.lat, lng: waypoint.lng } : null),
      heroImage:
        waypoint?.modern_poster_url ??
        waypoint?.ancient_poster_url ??
        waypoint?.modern_image_url ??
        null,
    }
  })
}

function sumRouteDistanceMeters(stops) {
  let total = 0
  for (let index = 1; index < stops.length; index += 1) {
    const from = stops[index - 1]?.landmark
    const to = stops[index]?.landmark
    if (from && to) {
      total += getDistance(from.lat, from.lng, to.lat, to.lng)
    }
  }
  return total
}

function formatDistanceKm(meters) {
  if (!meters) return '—'
  return `${(meters / 1000).toFixed(1)} km`
}

function formatWalkingTime(minutes) {
  if (!minutes) return '—'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

function buildRomeTourDetail() {
  const destination = getLaunchDestination('rome')
  const product = getTourProduct('rome-complete')
  const stops = buildStops(ROME_STOP_IDS)
  const distanceMeters = sumRouteDistanceMeters(stops)
  const walkingMinutes = estimateWalkMinutes(distanceMeters)

  return {
    destinationId: 'rome',
    title: 'Rome',
    subtitle: destination?.subtitle ?? 'The eternal city',
    tagline: product?.tagline ?? 'Forum cluster + city loop',
    description:
      'Two thousand years of empire, faith, and genius — restored where you stand, told at your pace.',
    heroImage: destination?.heroImage ?? `/tour-hero.jpg?v=${__APP_BUILD_ID__}`,
    productId: product?.id ?? 'rome-complete',
    priceUsd: product?.priceUsd ?? 15,
    stops,
    tour: {
      id: 'rome-launch-detail',
      stopIds: ROME_STOP_IDS,
    },
    stats: {
      duration: '4+ hours',
      distance: formatDistanceKm(distanceMeters),
      walkingTime: formatWalkingTime(walkingMinutes),
      stories: destination?.placeCount ?? stops.length,
    },
    previewAudio: {
      title: 'Colosseum — opening story',
      durationLabel: '4 minutes',
      src: ROME_PREVIEW_AUDIO,
    },
    anticipation: {
      headline: 'Rome is waiting.',
      sentence: 'When you are ready, the streets of the eternal city will open before you.',
    },
  }
}

const TOUR_DETAIL_BUILDERS = {
  rome: buildRomeTourDetail,
}

export function getLaunchTourDetail(destinationId) {
  const builder = TOUR_DETAIL_BUILDERS[destinationId]
  return builder ? builder() : null
}
