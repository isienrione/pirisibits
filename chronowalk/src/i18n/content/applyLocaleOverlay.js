import { DEFAULT_LOCALE, LOCALES, normalizeLocale } from '../locales.js'
import esWaypoints from './es/waypoints.json'
import esActs from './es/acts.json'
import esReflections from './es/reflections.json'

const OVERLAYS = Object.freeze({
  [LOCALES.ES]: {
    waypoints: esWaypoints,
    acts: esActs,
    reflections: esReflections,
  },
})

function mergeChapter(baseChapter, overlayChapter) {
  if (!overlayChapter) return baseChapter
  if (typeof baseChapter === 'string') {
    return {
      file: baseChapter,
      title: overlayChapter.title,
      transcript: overlayChapter.transcript,
      ...(overlayChapter.photo ? { photo: overlayChapter.photo } : {}),
    }
  }
  return {
    ...baseChapter,
    ...(overlayChapter.title != null ? { title: overlayChapter.title } : {}),
    ...(overlayChapter.transcript != null ? { transcript: overlayChapter.transcript } : {}),
  }
}

function mergeWaypoint(base, overlay) {
  if (!overlay) return base
  const next = {
    ...base,
    ...(overlay.title != null ? { title: overlay.title } : {}),
    ...(overlay.approachLine != null ? { approachLine: overlay.approachLine } : {}),
    ...(overlay.arrivalLine != null ? { arrivalLine: overlay.arrivalLine } : {}),
    ...(overlay.transcript != null ? { transcript: overlay.transcript } : {}),
  }

  if (Array.isArray(base.chapters) && Array.isArray(overlay.chapters)) {
    const byFile = new Map(
      overlay.chapters.filter((c) => c?.file).map((c) => [c.file, c]),
    )
    next.chapters = base.chapters.map((chapter, index) => {
      const file = typeof chapter === 'string' ? chapter : chapter?.file
      const overlayChapter = byFile.get(file) ?? overlay.chapters[index]
      return mergeChapter(chapter, overlayChapter)
    })
    // Keep waypoint-level transcript aligned with first chapter when overlay provides it.
    const first = next.chapters[0]
    if (first && typeof first === 'object' && first.transcript) {
      next.transcript = first.transcript
    }
  }

  return next
}

/**
 * Apply locale text overlays onto a parsed Rome manifest.
 * Audio filenames stay English; path prefixing is handled by audioPaths.
 */
export function applyLocaleOverlay(manifest, locale = DEFAULT_LOCALE) {
  const key = normalizeLocale(locale)
  if (key === DEFAULT_LOCALE) return manifest

  const overlay = OVERLAYS[key]
  if (!overlay) return manifest

  const waypoints = { ...manifest.waypoints }
  for (const [id, base] of Object.entries(waypoints)) {
    waypoints[id] = mergeWaypoint(base, overlay.waypoints?.[id])
  }

  let acts = manifest.acts
  if (Array.isArray(acts) && overlay.acts) {
    acts = acts.map((act) => {
      const actOverlay = overlay.acts[act.id]
      if (!actOverlay) return act
      return {
        ...act,
        ...(actOverlay.title != null ? { title: actOverlay.title } : {}),
        ...(actOverlay.numeral != null ? { numeral: actOverlay.numeral } : {}),
        ...(actOverlay.subtitle != null ? { subtitle: actOverlay.subtitle } : {}),
        ...(actOverlay.promise != null ? { promise: actOverlay.promise } : {}),
      }
    })
  }

  let reflections = manifest.reflections
  if (Array.isArray(reflections) && Array.isArray(overlay.reflections)) {
    reflections = reflections.map((entry, index) => {
      const refOverlay = overlay.reflections[index]
      if (typeof entry === 'string' && typeof refOverlay === 'string') return refOverlay
      if (entry && typeof entry === 'object' && refOverlay && typeof refOverlay === 'object') {
        return { ...entry, ...refOverlay }
      }
      return entry
    })
  }

  return {
    ...manifest,
    waypoints,
    ...(acts ? { acts } : {}),
    ...(reflections ? { reflections } : {}),
  }
}

export function listOverlayWaypointIds(locale = LOCALES.ES) {
  return Object.keys(OVERLAYS[normalizeLocale(locale)]?.waypoints ?? {})
}
