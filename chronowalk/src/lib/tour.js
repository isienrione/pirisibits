import { mediaUrl } from './mediaUrl'

const MANIFEST_URL = '/tours/rome/manifest.json'

let cachedManifest = null

export async function loadTourManifest() {
  if (cachedManifest) return cachedManifest

  const response = await fetch(MANIFEST_URL)
  if (!response.ok) {
    throw new Error(`Failed to load tour manifest: ${response.status}`)
  }

  cachedManifest = await response.json()
  return cachedManifest
}

export function clearTourManifestCache() {
  cachedManifest = null
}

export function getWaypoint(manifest, waypointId) {
  return manifest?.waypoints?.find((waypoint) => waypoint.id === waypointId) ?? null
}

export function getWaypointByIndex(manifest, index) {
  const id = manifest?.waypoints?.[index]?.id
  return id ? getWaypoint(manifest, id) : null
}

export function getTransitAfter(manifest, waypointId) {
  return manifest?.transits?.find((transit) => transit.after === waypointId) ?? null
}

export function resolveWaypointMedia(waypoint) {
  if (!waypoint) return null

  return {
    ...waypoint,
    audioUrl: mediaUrl(waypoint.audio),
    photoUrl: mediaUrl(waypoint.photo),
    transcriptUrl: mediaUrl(waypoint.transcript),
    reconstruction: waypoint.reconstruction
      ? {
          ...waypoint.reconstruction,
          now: mediaUrl(waypoint.reconstruction.now),
          then: mediaUrl(waypoint.reconstruction.then),
          loop: mediaUrl(waypoint.reconstruction.loop),
        }
      : null,
    faq: (waypoint.faq ?? []).map(mediaUrl),
  }
}

export function allWaypointIdsForDay(manifest, dayNumber) {
  const day = manifest?.days?.find((entry) => entry.day === dayNumber)
  return day?.waypoints ?? []
}

export function orderedWaypointIds(manifest) {
  return manifest?.waypoints?.map((waypoint) => waypoint.id) ?? []
}
