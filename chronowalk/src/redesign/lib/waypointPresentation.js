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
  if (waypoint?.reconstruction?.now) return resolvePhotoUrl(waypoint.reconstruction.now)
  if (waypoint?.photo) return resolvePhotoUrl(waypoint.photo)
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
  const loop = waypoint?.reconstruction?.loop ?? inferredReconstructionLoopPath(waypoint)
  if (!loop) return null
  return resolvePhotoUrl(loop)
}

/** Infer standard ancient-reconstruction.mp4 path from the waypoint photo folder. */
export function inferredReconstructionLoopPath(waypoint) {
  const photo = waypoint?.photo ?? ''
  if (!photo.includes('/waypoints/')) return null

  const nested = photo.match(/^(\/waypoints\/(?:forum-cluster\/)?[^/]+\/(?:exterior|interior)\/)/)
  if (nested) return `${nested[1]}ancient-reconstruction.mp4`

  const flat = photo.match(/^(\/waypoints\/[^/]+\/)/)
  if (flat) return `${flat[1]}ancient-reconstruction.mp4`

  return null
}

/** True when the unified immersive player should embed then/now threshold. */
export function hasImmersiveThreshold(waypoint) {
  if (!waypoint || waypoint.scripted_rest) return false
  if (waypoint.reconstruction) return true
  return Boolean(legacyStopIdFromWaypoint(waypoint))
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

/** Tiny footer copy for reconstruction / present-day image sourcing. */
export function reconstructionSourceNoteForWaypoint(waypoint) {
  const parts = []
  const reconstructionCaption =
    waypoint?.reconstruction?.caption ?? waypoint?.reconstruction?.honesty ?? null
  if (reconstructionCaption) parts.push(reconstructionCaption)
  if (waypoint?.now_image?.source === 'ai_generated') {
    parts.push('Present-day view: AI-assisted rendering.')
  }
  return parts.length ? parts.join(' · ') : null
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
  // Keep the public name; memory-book quote resolution lives in journalMemory.
  // Prefer authored lines, then arrival beat (most waypoints have this).
  if (waypoint?.sigLine?.trim()) return waypoint.sigLine.trim()
  if (waypoint?.reflection?.trim()) return waypoint.reflection.trim()
  if (waypoint?.arrivalLine) {
    return String(waypoint.arrivalLine).replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim()
  }
  return 'The city keeps its place for you.'
}
