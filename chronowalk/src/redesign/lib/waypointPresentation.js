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

/** Merge waypoint reconstruction with an optional chapter-level override. */
export function resolveWaypointReconstruction(waypoint, chapterIndex = 0) {
  const chapter = waypoint?.chapters?.[chapterIndex]
  const chapterRec =
    chapter && typeof chapter === 'object' && chapter.reconstruction
      ? chapter.reconstruction
      : null
  const base = waypoint?.reconstruction ?? null
  if (!chapterRec && !base) return null

  return {
    now: chapterRec?.now ?? base?.now ?? null,
    then: chapterRec?.then ?? base?.then ?? null,
    loop: chapterRec?.loop ?? base?.loop ?? null,
    caption: chapterRec?.caption ?? base?.caption ?? null,
    era: chapterRec?.era ?? base?.era ?? null,
    honesty: chapterRec?.honesty ?? base?.honesty ?? null,
  }
}

export function photoForWaypoint(waypoint, chapterIndex = 0) {
  const chapter = waypoint?.chapters?.[chapterIndex]
  if (chapter && typeof chapter === 'object' && chapter.photo) {
    return resolvePhotoUrl(chapter.photo)
  }

  const reconstruction = resolveWaypointReconstruction(waypoint, chapterIndex)
  if (reconstruction?.now) return resolvePhotoUrl(reconstruction.now)
  if (waypoint?.photo) return resolvePhotoUrl(waypoint.photo)
  const stopId = legacyStopIdFromWaypoint(waypoint)
  if (stopId) return getNowPhotoUrl(stopId)
  return getNowPhotoUrl('colosseum')
}

/** Sibling ancient still when reconstruction.then was wrongly set to the modern poster. */
function inferredAncientPosterPath(waypoint) {
  const loop =
    resolveWaypointReconstruction(waypoint)?.loop ?? inferredReconstructionLoopPath(waypoint)
  if (!loop || !loop.includes('/waypoints/')) return null
  const fromLoop = loop.replace(/ancient-reconstruction\.mp4$/i, 'ancient-poster.jpg')
  if (fromLoop !== loop) return fromLoop
  const photo = waypoint?.photo ?? ''
  const flat = photo.match(/^(\/waypoints\/[^/]+\/)/)
  return flat ? `${flat[1]}ancient-poster.jpg` : null
}

export function thenPhotoForWaypoint(waypoint, chapterIndex = 0) {
  const reconstruction = resolveWaypointReconstruction(waypoint, chapterIndex)

  if (reconstruction?.loop) {
    // Prefer the ancient still as the video poster when available.
    // Guard: then === now means the reveal has no era change if the video fails.
    if (reconstruction.then && reconstruction.then !== reconstruction.now) {
      return resolvePhotoUrl(reconstruction.then)
    }
    const inferredThen = inferredAncientPosterPath(waypoint)
    if (inferredThen) return resolvePhotoUrl(inferredThen)
    if (reconstruction.then) return resolvePhotoUrl(reconstruction.then)
    return resolvePhotoUrl(reconstruction.now ?? waypoint?.photo)
  }

  if (reconstruction?.then) {
    return resolvePhotoUrl(reconstruction.then)
  }

  if (waypoint?.id) {
    const manifestThen = resolvePhotoUrl(`/rome/img/${waypoint.id}_then.avif`)
    if (manifestThen) return manifestThen
  }

  const stopId = legacyStopIdFromWaypoint(waypoint)
  if (stopId) {
    return getModernExteriorUrl(stopId)
  }

  return photoForWaypoint(waypoint, chapterIndex)
}

export function thenLoopForWaypoint(waypoint, chapterIndex = 0) {
  if (!hasImmersiveThreshold(waypoint)) return null

  const reconstruction = resolveWaypointReconstruction(waypoint, chapterIndex)
  const loop = reconstruction?.loop ?? inferredReconstructionLoopPath(waypoint)
  if (!loop) return null
  return resolvePhotoUrl(loop)
}

/** Infer standard ancient-reconstruction.mp4 path from the waypoint photo folder. */
export function inferredReconstructionLoopPath(waypoint) {
  const photo = waypoint?.photo ?? ''
  if (!photo.includes('/waypoints/')) return null

  const nested = photo.match(/^(\/waypoints\/(?:forum-cluster\/)?[^/]+\/(?:exterior|interior)\/)/)
  if (nested) return `${nested[1]}ancient-reconstruction.mp4`

  // Forum cluster stops live one level deeper: /waypoints/forum-cluster/<stop>/
  const forum = photo.match(/^(\/waypoints\/forum-cluster\/[^/]+\/)/)
  if (forum) return `${forum[1]}ancient-reconstruction.mp4`

  const flat = photo.match(/^(\/waypoints\/[^/]+\/)/)
  if (flat) return `${flat[1]}ancient-reconstruction.mp4`

  return null
}

/** True when the unified immersive player should embed then/now threshold. */
export function hasImmersiveThreshold(waypoint) {
  if (!waypoint || waypoint.scripted_rest) return false
  if (waypoint.threshold === false) return false
  if (waypoint.reconstruction) return true
  return Boolean(legacyStopIdFromWaypoint(waypoint))
}

/** True when THEN uses a dedicated reconstruction asset (not poster fallback). */
export function hasDistinctThenPhoto(waypoint, chapterIndex = 0) {
  const reconstruction = resolveWaypointReconstruction(waypoint, chapterIndex)
  if (reconstruction?.loop) return true
  if (reconstruction?.then) return true
  const stopId = legacyStopIdFromWaypoint(waypoint)
  if (!stopId) return false
  const nowPath = waypoint?.photo ?? getModernPosterUrl(stopId)
  const thenPath = getModernExteriorUrl(stopId)
  return nowPath !== thenPath
}

export function thenLabelForWaypoint(waypoint, chapterIndex = 0) {
  const reconstruction = resolveWaypointReconstruction(waypoint, chapterIndex)
  return reconstruction?.era ?? waypoint?.era ?? 'ANCIENT ROME'
}

export function honestyCaptionForWaypoint(waypoint, chapterIndex = 0) {
  const reconstruction = resolveWaypointReconstruction(waypoint, chapterIndex)
  if (!reconstruction) return null
  return (
    reconstruction?.caption ??
    reconstruction?.honesty ??
    'Interpretive reconstruction informed by archaeology and scholarship.'
  )
}

/** Tiny footer copy for reconstruction / present-day image sourcing. */
export function reconstructionSourceNoteForWaypoint(waypoint, chapterIndex = 0) {
  const parts = []
  const reconstruction = resolveWaypointReconstruction(waypoint, chapterIndex)
  const reconstructionCaption = reconstruction?.caption ?? reconstruction?.honesty ?? null
  if (reconstructionCaption) parts.push(reconstructionCaption)
  if (!reconstruction && waypoint?.now_image?.credit) {
    const license = waypoint.now_image.license ? ` (${waypoint.now_image.license})` : ''
    parts.push(`Photo: ${waypoint.now_image.credit}${license}`)
  }
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
  return waypoint?.approachLine ?? 'Keep walking · Rome is just ahead.'
}

export function arrivalCopy(waypoint) {
  const line = waypoint?.arrivalLine ?? 'Take a second. Look up.'
  return line.replace(/\s*\/\s*/g, '\n')
}

export function signatureLine(waypoint) {
  return waypoint?.sigLine ?? waypoint?.reflection ?? 'The city keeps its place for you.'
}
