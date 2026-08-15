import { getWaypointGeo } from '../data/waypointGeo'
import { getLocalWaypoint } from '../services/waypointMerge'
import { getModernPosterUrl } from './modernPhotoRegistry'
import { deriveShortTitle, normalizeManifestStop } from './manifest.schema'

/**
 * Build a launch manifest stop from legacy waypoint seeds and geo data.
 * @param {string} stopId
 * @param {number} index
 * @param {string | null} nextStopId
 */
export function buildStopFromLegacy(stopId, index, nextStopId) {
  const waypoint = getLocalWaypoint(stopId)
  const geo = getWaypointGeo(stopId)
  const title = waypoint?.title ?? geo?.title ?? stopId
  const shortTitle = deriveShortTitle(title, stopId)
  const subtitle = waypoint?.arrival_subtitle ?? ''
  const landmark = geo?.landmark ?? (waypoint ? { lat: waypoint.lat, lng: waypoint.lng } : null)
  // ETA should reflect where a traveler actually stands/approaches (camera POV),
  // not always the map/geofence "landmark center".
  const walkCoords =
    waypoint?.viewpoint?.lat != null && waypoint?.viewpoint?.lng != null
      ? { lat: waypoint.viewpoint.lat, lng: waypoint.viewpoint.lng }
      : landmark ?? { lat: 0, lng: 0 }

  return normalizeManifestStop({
    id: stopId,
    number: index + 1,
    title,
    shortTitle,
    subtitle,
    coords: landmark ?? { lat: 0, lng: 0 },
    walkCoords,
    radiusM: geo?.geofenceThresholdM ?? 30,
    heroImage:
      waypoint?.modern_poster_url ??
      waypoint?.modern_image_url ??
      getModernPosterUrl(stopId),
    audio: waypoint?.arrival_immersive_url ?? waypoint?.ambient_url,
    transcript: waypoint?.arrival_transcript,
    reconstructionNow: waypoint?.modern_video_url ?? waypoint?.modern_image_url,
    reconstructionThen: waypoint?.ancient_video_url ?? waypoint?.ancient_image_url,
    reconstructionLoop: waypoint?.ancient_video_url ?? waypoint?.modern_video_url,
    arrivalLine: waypoint?.arrival_headline,
    nextStopId,
  })
}
