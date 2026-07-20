import { collectVisitedStops } from './launchJourneyLetter'

export const MEMORY_SECTIONS = {
  PLACES: 'places',
  STORIES: 'stories',
  PHOTOS: 'photos',
  JOURNAL: 'journal',
}

export const MEMORY_SECTION_LABELS = {
  [MEMORY_SECTIONS.PLACES]: 'Places',
  [MEMORY_SECTIONS.STORIES]: 'Stories',
  [MEMORY_SECTIONS.PHOTOS]: 'Photos',
  [MEMORY_SECTIONS.JOURNAL]: 'Journal',
}

const PLACE_LINES = {
  colosseum: 'Where an empire once held its breath.',
  pantheon: 'Beneath a dome that outlasted emperors.',
  default: 'Where you stood long enough for the city to speak.',
}

function getPlaceLine(stop) {
  return PLACE_LINES[stop?.id] ?? PLACE_LINES.default
}

function formatMemoryDate(iso) {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric' }).format(new Date(iso))
  } catch {
    return ''
  }
}

function resolveStop(manifest, stopId) {
  return manifest?.stopsById?.[stopId] ?? null
}

/**
 * @typedef {Object} MemoryPlace
 * @property {string} id
 * @property {string} title
 * @property {string} line
 * @property {string} [heroImage]
 */

/**
 * @typedef {Object} MemoryStory
 * @property {string} id
 * @property {string} title
 * @property {string} audioUrl
 * @property {string} listenedLabel
 */

/**
 * @typedef {Object} MemoryPhoto
 * @property {string} id
 * @property {string} title
 * @property {string} capturedLabel
 * @property {string} [heroImage]
 */

/**
 * @typedef {Object} MemoryJournalEntry
 * @property {string} id
 * @property {string} title
 * @property {string} text
 * @property {string} recordedLabel
 */

/**
 * @typedef {Object} JourneyMemoriesArchive
 * @property {string} title
 * @property {string} subtitle
 * @property {MemoryPlace[]} places
 * @property {MemoryStory[]} stories
 * @property {MemoryPhoto[]} photos
 * @property {MemoryJournalEntry[]} journal
 */

/**
 * @param {{
 *   manifest?: import('./manifest.schema.js').RomeTourManifest | null,
 *   context?: { completedStopIds?: string[], currentStopId?: string | null },
 *   recap?: import('../utils/journeyRecapStorage.js').JourneyRecap,
 * }} options
 * @returns {JourneyMemoriesArchive}
 */
export function buildJourneyMemories({ manifest, context, recap }) {
  const visitedStops = collectVisitedStops(manifest, context)
  const visitedIds = new Set(visitedStops.map((stop) => stop.id))

  const orderedStops = (manifest?.stopOrder ?? [])
    .map((stopId) => manifest?.stopsById?.[stopId])
    .filter((stop) => stop && visitedIds.has(stop.id))

  const places = orderedStops.map((stop) => ({
    id: stop.id,
    title: stop.shortTitle ?? stop.title,
    line: getPlaceLine(stop),
    heroImage: stop.heroImage,
  }))

  const stories = (recap?.audioListened ?? [])
    .map((entry) => {
      const stop = resolveStop(manifest, entry.stopId)
      if (!stop?.audio) return null

      return {
        id: entry.stopId,
        title: stop.shortTitle ?? stop.title,
        audioUrl: stop.audio,
        listenedLabel: formatMemoryDate(entry.listenedAt),
      }
    })
    .filter(Boolean)

  const photos = (recap?.photos ?? [])
    .map((entry) => {
      const stop = resolveStop(manifest, entry.stopId)
      if (!stop) return null

      return {
        id: entry.stopId,
        title: stop.shortTitle ?? stop.title,
        capturedLabel: formatMemoryDate(entry.capturedAt),
        heroImage: stop.heroImage,
      }
    })
    .filter(Boolean)

  const journal = (recap?.journal ?? [])
    .map((entry) => {
      const stop = resolveStop(manifest, entry.stopId)

      return {
        id: entry.stopId,
        title: stop?.shortTitle ?? stop?.title ?? 'Reflection',
        text: entry.text,
        recordedLabel: formatMemoryDate(entry.recordedAt),
      }
    })
    .filter((entry) => entry.text)

  return {
    title: 'Memories',
    subtitle: 'A personal archive of the path you walked, heard, and kept.',
    places,
    stories,
    photos,
    journal,
  }
}
