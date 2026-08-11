import { DEFAULT_LOCALE, LOCALES, normalizeLocale } from '../locales.js'
import esWaypoints from './es/waypoints.json'
import esActs from './es/acts.json'
import esReflections from './es/reflections.json'
import esTransits from './es/transits.json'
import esSystem from './es/system.json'

/** Known English reconstruction captions → Spanish (preserve epistemic hedging). */
const ES_RECONSTRUCTION_CAPTIONS = Object.freeze({
  'Interpretive reconstruction informed by archaeology and scholarship.':
    'Reconstrucción interpretativa basada en la arqueología y en la investigación académica.',
  'Evidence-based reconstruction · awning colours are informed conjecture':
    'Reconstrucción basada en evidencias · los colores del toldo son una conjetura informada',
  'Evidence-based reconstruction · relief details simplified for clarity':
    'Reconstrucción basada en evidencias · detalles del relieve simplificados para mayor claridad',
  'Evidence-based reconstruction · portico bronze finish is informed conjecture':
    'Reconstrucción basada en evidencias · el acabado en bronce del pórtico es una conjetura informada',
})

const OVERLAYS = Object.freeze({
  [LOCALES.ES]: {
    waypoints: esWaypoints,
    acts: esActs,
    reflections: esReflections,
    transits: esTransits,
    system: esSystem,
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

function mergeReconstruction(base, overlay) {
  if (!base || !overlay) return base
  return {
    ...base,
    ...(overlay.caption != null ? { caption: overlay.caption } : {}),
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

  if (base.reconstruction) {
    let reconstruction = base.reconstruction
    if (overlay.reconstruction) {
      reconstruction = mergeReconstruction(base.reconstruction, overlay.reconstruction)
    } else if (overlay.reconstructionCaption) {
      reconstruction = {
        ...base.reconstruction,
        caption: overlay.reconstructionCaption,
      }
    }
    const caption = reconstruction.caption
    if (caption && ES_RECONSTRUCTION_CAPTIONS[caption]) {
      reconstruction = {
        ...reconstruction,
        caption: ES_RECONSTRUCTION_CAPTIONS[caption],
      }
    }
    next.reconstruction = reconstruction
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

function mergeTransit(base, overlay) {
  if (!overlay) return base
  const next = {
    ...base,
    ...(overlay.title != null ? { title: overlay.title } : {}),
    ...(overlay.transcript != null ? { transcript: overlay.transcript } : {}),
  }

  if (base.variant_meta && overlay.variant_meta) {
    const variantMeta = { ...base.variant_meta }
    for (const [key, value] of Object.entries(overlay.variant_meta)) {
      variantMeta[key] = {
        ...(variantMeta[key] ?? {}),
        ...value,
      }
    }
    next.variant_meta = variantMeta
  }

  return next
}

function mergeSystem(base, overlay) {
  if (!base || !overlay) return base
  const next = { ...base }

  if (Array.isArray(overlay.no_ticket) && Array.isArray(base.no_ticket)) {
    // Keep shipping filename order; attach Spanish title/transcript metadata for UI/transcripts.
    next.no_ticket_meta = overlay.no_ticket
  }

  if (overlay.resume) {
    next.resume_meta = overlay.resume
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

  let transits = manifest.transits
  if (transits && overlay.transits) {
    if (Array.isArray(transits)) {
      transits = transits.map((transit) => mergeTransit(transit, overlay.transits[transit.id]))
    } else {
      transits = { ...transits }
      for (const [id, base] of Object.entries(transits)) {
        transits[id] = mergeTransit(base, overlay.transits[id])
      }
    }
  }

  const system = mergeSystem(manifest.system, overlay.system)

  return {
    ...manifest,
    waypoints,
    ...(acts ? { acts } : {}),
    ...(reflections ? { reflections } : {}),
    ...(transits ? { transits } : {}),
    ...(system ? { system } : {}),
  }
}

export function listOverlayWaypointIds(locale = LOCALES.ES) {
  return Object.keys(OVERLAYS[normalizeLocale(locale)]?.waypoints ?? {})
}
