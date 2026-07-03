import { loadRomeManifest, clearRomeManifestCache } from '../content/manifest.js'
import { mediaUrl } from './mediaUrl'

export async function loadTourManifest() {
  return loadRomeManifest()
}

export function clearTourManifestCache() {
  clearRomeManifestCache()
}

export {
  getWaypoint,
  getWaypointByIndex,
  getTransitAfter,
  getTransit,
  orderedWaypointIds,
  getTraversalSequence,
  getAct,
  getWaypointIndex,
  isTransitId,
  isWaypointId,
  getStepIdAtIndex,
  resolveJourneyStep,
  collectManifestAudioPaths,
} from '../content/manifest.js'

export function resolveWaypointMedia(waypoint) {
  if (!waypoint) return null

  return {
    ...waypoint,
    audioUrl: waypoint.chapters?.[0] ? mediaUrl(`/rome/audio/narration/${waypoint.chapters[0]}`) : null,
    photoUrl: mediaUrl(waypoint.photo),
    reconstruction: waypoint.reconstruction
      ? {
          ...waypoint.reconstruction,
          now: mediaUrl(waypoint.reconstruction.now),
          then: mediaUrl(waypoint.reconstruction.then),
          loop: mediaUrl(waypoint.reconstruction.loop),
        }
      : null,
  }
}

// Legacy helper — acts replaced days
export function allWaypointIdsForDay() {
  return []
}
