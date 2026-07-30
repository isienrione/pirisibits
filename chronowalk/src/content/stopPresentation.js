import { getWaypoint } from './manifest.js'
import { mediaUrl } from '../lib/mediaUrl.js'

const STATUS_SUBTITLE = {
  completed: 'Explore',
  current: 'Current Stop',
  upcoming: 'Next Stop',
  locked: 'Locked',
}

/**
 * Maps manifest map-stop records to shell row props · keeps UI free of content shape.
 */
export function toStopRowModel(manifest, stop, index) {
  const waypoint = getWaypoint(manifest, stop.id)

  return {
    id: stop.id,
    index,
    title: stop.title ?? waypoint?.title ?? stop.id,
    subtitle: STATUS_SUBTITLE[stop.status] ?? STATUS_SUBTITLE.upcoming,
    imageUrl: waypoint?.photo ? mediaUrl(waypoint.photo) : null,
    status: stop.status,
  }
}

export function toWalkCardModel(manifest, stop, distanceM) {
  if (!stop) return null

  const waypoint = getWaypoint(manifest, stop.id)

  return {
    title: stop.title ?? waypoint?.title ?? stop.id,
    distanceM,
    imageUrl: waypoint?.photo ? mediaUrl(waypoint.photo) : null,
  }
}
