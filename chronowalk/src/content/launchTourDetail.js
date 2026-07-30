import { HEART_OF_ANCIENT_ROME_TOUR } from '../data/heart-of-ancient-rome-tour'
import { getTourProduct } from '../data/tourProducts'
import { getDistance } from '../utils/distance'
import { estimateWalkMinutes } from '../utils/tourStats'
import { getLaunchDestination } from './launchDestinations'
import { loadRomeManifest } from './manifest.js'
import { getWaypoint } from './manifest.js'
import { getTourProductTruth } from './tourProductTruth.js'
import { TOUR_HERO_PHOTO, getModernPosterUrl } from './modernPhotoRegistry.js'

const ROME_PREVIEW_AUDIO = '/waypoints/colosseum/Audio_sample.mp3'

function buildStopsFromManifest(manifest, visitStopIds) {
  return visitStopIds.map((stopId, index) => {
    const waypoint = getWaypoint(manifest, stopId)
    const geofence = waypoint?.geofence

    return {
      id: stopId,
      number: index + 1,
      title: waypoint?.title ?? stopId,
      shortTitle: (waypoint?.title ?? stopId).split(' ').slice(0, 2).join(' '),
      landmark: geofence ? { lat: geofence.lat, lng: geofence.lng } : null,
      heroImage: waypoint?.photo ? waypoint.photo : getModernPosterUrl(stopId),
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
  const manifest = loadRomeManifest()
  const truth = getTourProductTruth(manifest)
  const destination = getLaunchDestination('rome')
  const product = getTourProduct('rome-complete')
  const stops = buildStopsFromManifest(manifest, truth.visitStopIds)
  const distanceMeters = sumRouteDistanceMeters(stops)
  const walkingMinutes = estimateWalkMinutes(distanceMeters)

  return {
    destinationId: 'rome',
    title: 'Rome',
    subtitle: destination?.subtitle ?? 'The eternal city',
    tagline: product?.tagline ?? 'Forum cluster + city loop',
    description:
      'Two thousand years of empire, faith, and genius — restored where you stand, told at your pace.',
    heroImage: destination?.heroImage ?? TOUR_HERO_PHOTO,
    productId: product?.id ?? 'rome-complete',
    priceUsd: product?.priceUsd ?? 14.99,
    stops,
    tour: {
      id: HEART_OF_ANCIENT_ROME_TOUR.id,
      stopIds: truth.visitStopIds,
    },
    stats: {
      duration: truth.durationLabel,
      distance: truth.distanceLabel !== '—' ? truth.distanceLabel : formatDistanceKm(distanceMeters),
      walkingTime: formatWalkingTime(walkingMinutes),
      stories: truth.publicPlaceCount,
      visitStops: truth.visitStopCount,
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
    productTruth: truth,
  }
}

const TOUR_DETAIL_BUILDERS = {
  rome: buildRomeTourDetail,
}

export function getLaunchTourDetail(destinationId) {
  const builder = TOUR_DETAIL_BUILDERS[destinationId]
  return builder ? builder() : null
}
