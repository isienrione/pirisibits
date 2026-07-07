import { T } from '../tokens.js'
import { getNowPhotoUrl } from '../images.js'
import { getAct } from '../../content/manifest.js'
import { getModernExteriorUrl, getModernPosterUrl } from '../../content/modernPhotoRegistry.js'
import { mediaUrl } from '../../lib/mediaUrl.js'

const ACT_COLOR = {
  act1: T.actI,
  act2: T.actII,
  act3: T.actIII,
  act4: T.actIV,
  act5: T.actV,
  act6: T.actVI,
  encore: T.encore,
}

const ACT_NUMERAL = {
  act1: 'I',
  act2: 'II',
  act3: 'III',
  act4: 'IV',
  act5: 'V',
  act6: 'VI',
  encore: 'ENC',
}

const PHOTO_STOP_ALIASES = {
  'via-appia': 'appian-way',
}

/** Map manifest photo paths to modernPhotoRegistry stop ids. */
export function legacyStopIdFromWaypoint(waypoint) {
  const photo = waypoint?.photo ?? ''
  if (photo.includes('/colosseum/interior/')) return 'colosseum-interior'

  const forumMatch = photo.match(/forum-cluster\/([^/]+)/)
  if (forumMatch) return forumMatch[1]

  const directMatch = photo.match(/\/waypoints\/([^/]+)/)
  if (!directMatch) return null

  const slug = directMatch[1]
  if (slug === 'forum-cluster') return null
  return PHOTO_STOP_ALIASES[slug] ?? slug
}

export function accentForWaypoint(waypoint, manifest) {
  const actId = waypoint?.act
  if (actId && ACT_COLOR[actId]) return ACT_COLOR[actId]
  if (actId && manifest) {
    const act = getAct(manifest, actId)
    if (act?.numeral && ACT_COLOR[`act${act.numeral.toLowerCase().replace('enc', 'encore')}`]) {
      return ACT_COLOR[actId]
    }
  }
  return T.actI
}

export function numeralForWaypoint(waypoint) {
  return ACT_NUMERAL[waypoint?.act] ?? 'I'
}

export function resolvePhotoUrl(path) {
  if (!path) return null
  return mediaUrl(path) ?? path
}

export function photoForWaypoint(waypoint) {
  if (waypoint?.photo) return resolvePhotoUrl(waypoint.photo)
  if (waypoint?.reconstruction?.now) return resolvePhotoUrl(waypoint.reconstruction.now)
  const stopId = legacyStopIdFromWaypoint(waypoint)
  if (stopId) return getNowPhotoUrl(stopId)
  return getNowPhotoUrl('colosseum')
}

export function thenPhotoForWaypoint(waypoint) {
  if (waypoint?.reconstruction?.loop) {
    return resolvePhotoUrl(waypoint.reconstruction.now ?? waypoint.photo)
  }

  if (waypoint?.reconstruction?.then) {
    return resolvePhotoUrl(waypoint.reconstruction.then)
  }

  if (waypoint?.id) {
    const manifestThen = resolvePhotoUrl(`/rome/img/${waypoint.id}_then.avif`)
    if (manifestThen) return manifestThen
  }

  const stopId = legacyStopIdFromWaypoint(waypoint)
  if (stopId) {
    return getModernExteriorUrl(stopId)
  }

  return photoForWaypoint(waypoint)
}

export function thenLoopForWaypoint(waypoint) {
  if (!waypoint?.reconstruction?.loop) return null
  return resolvePhotoUrl(waypoint.reconstruction.loop)
}

/** True when THEN uses a dedicated reconstruction asset (not poster fallback). */
export function hasDistinctThenPhoto(waypoint) {
  if (waypoint?.reconstruction?.loop) return true
  if (waypoint?.reconstruction?.then) return true
  const stopId = legacyStopIdFromWaypoint(waypoint)
  if (!stopId) return false
  const nowPath = waypoint?.photo ?? getModernPosterUrl(stopId)
  const thenPath = getModernExteriorUrl(stopId)
  return nowPath !== thenPath
}

export function thenLabelForWaypoint(waypoint) {
  return waypoint?.reconstruction?.era ?? waypoint?.era ?? 'ANCIENT ROME'
}

export function honestyCaptionForWaypoint(waypoint) {
  return (
    waypoint?.reconstruction?.caption ??
    waypoint?.reconstruction?.honesty ??
    'Interpretive reconstruction informed by archaeology and scholarship.'
  )
}

/** Every stop supports the threshold slider. */
export function supportsThresholdExperience() {
  return true
}

export function titleForWaypoint(waypoint) {
  return waypoint?.title ?? waypoint?.name ?? 'Rome'
}

export function approachCopy(waypoint) {
  return waypoint?.approachLine ?? 'Keep walking — Rome is just ahead.'
}

export function arrivalCopy(waypoint) {
  const line = waypoint?.arrivalLine ?? 'Take a second. Look up.'
  return line.replace(/\s*\/\s*/g, '\n')
}

export function signatureLine(waypoint) {
  return waypoint?.sigLine ?? waypoint?.reflection ?? 'The city keeps its place for you.'
}
