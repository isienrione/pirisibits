import { collectVisitedStops } from './launchJourneyLetter'
import { getStoryReflectionSentence } from './launchStoryReflections'
import { formatDistanceToNext, estimateDistanceBetweenStops } from './journeyProgress'

export const TIMELINE_MOMENT_KINDS = {
  WALKING: 'walking',
  ARRIVAL: 'arrival',
  AUDIO: 'audio',
  THRESHOLD: 'threshold',
  PHOTO: 'photo',
}

const ARRIVAL_LINES = {
  colosseum: 'The amphitheatre opened before you - stone that once held an empire watching.',
  pantheon: 'You stood beneath a dome that has outlasted nearly everything Rome built after it.',
  default: 'You arrived, and the present made room for you to linger.',
}

const WALKING_LINES = {
  default: 'Rome asked you to walk - not rush - between the places that still remember.',
}

const AUDIO_LINES = {
  default: 'You listened until the story settled into the stones around you.',
}

const THRESHOLD_LINES = {
  default: 'You crossed the threshold - from what is, into what Rome once dared to build.',
}

const PHOTO_LINES = {
  default: 'You held the camera to time and let the ancient settle over the modern, even for a moment.',
}

/**
 * @typedef {Object} TimelineMoment
 * @property {string} id
 * @property {import('./launchJourneyTimeline.js').typeof TIMELINE_MOMENT_KINDS[keyof typeof TIMELINE_MOMENT_KINDS]} kind
 * @property {string} stopId
 * @property {string} title
 * @property {string} body
 * @property {string} [imageUrl]
 */

/**
 * @typedef {Object} JourneyTimeline
 * @property {string} intro
 * @property {string} routeLabel
 * @property {{ id: string, title: string }[]} monuments
 * @property {TimelineMoment[]} moments
 */

function getLine(map, stop) {
  return map[stop?.id] ?? map.default
}

/**
 * @param {import('./manifest.schema.js').ManifestStop} fromStop
 * @param {import('./manifest.schema.js').ManifestStop} toStop
 */
function getWalkingLine(fromStop, toStop) {
  const distance = estimateDistanceBetweenStops(fromStop, toStop)
  const distanceLabel = formatDistanceToNext(distance)
  const fromTitle = fromStop.shortTitle ?? fromStop.title
  const toTitle = toStop.shortTitle ?? toStop.title

  if (distanceLabel) {
    return `You walked ${distanceLabel} from ${fromTitle} toward ${toTitle}. ${WALKING_LINES.default}`
  }

  return `You walked from ${fromTitle} toward ${toTitle}. ${WALKING_LINES.default}`
}

/**
 * @param {{
 *   manifest?: import('./manifest.schema.js').RomeTourManifest | null,
 *   context?: { completedStopIds?: string[], currentStopId?: string | null },
 *   recap?: import('../utils/journeyRecapStorage.js').JourneyRecap,
 * }} options
 * @returns {JourneyTimeline}
 */
export function buildJourneyTimeline({ manifest, context, recap }) {
  const visitedStops = collectVisitedStops(manifest, context)
  const visitedIds = new Set(visitedStops.map((stop) => stop.id))

  const orderedStops = (manifest?.stopOrder ?? [])
    .map((stopId) => manifest?.stopsById?.[stopId])
    .filter((stop) => stop && visitedIds.has(stop.id))

  const photoStopIds = new Set((recap?.photos ?? []).map((entry) => entry.stopId))
  const audioStopIds = new Set((recap?.audioListened ?? []).map((entry) => entry.stopId))

  /** @type {TimelineMoment[]} */
  const moments = []

  orderedStops.forEach((stop, index) => {
    const previousStop = index > 0 ? orderedStops[index - 1] : null

    if (previousStop) {
      moments.push({
        id: `${stop.id}-walking`,
        kind: TIMELINE_MOMENT_KINDS.WALKING,
        stopId: stop.id,
        title: 'On the path',
        body: getWalkingLine(previousStop, stop),
      })
    }

    moments.push({
      id: `${stop.id}-arrival`,
      kind: TIMELINE_MOMENT_KINDS.ARRIVAL,
      stopId: stop.id,
      title: stop.shortTitle ?? stop.title,
      body: getLine(ARRIVAL_LINES, stop),
      imageUrl: stop.heroImage,
    })

    if (audioStopIds.has(stop.id)) {
      moments.push({
        id: `${stop.id}-audio`,
        kind: TIMELINE_MOMENT_KINDS.AUDIO,
        stopId: stop.id,
        title: 'Story listened',
        body: `${getLine(AUDIO_LINES, stop)} ${getStoryReflectionSentence(stop)}`,
      })
    }

    moments.push({
      id: `${stop.id}-threshold`,
      kind: TIMELINE_MOMENT_KINDS.THRESHOLD,
      stopId: stop.id,
      title: 'Through the threshold',
      body: getLine(THRESHOLD_LINES, stop),
    })

    if (photoStopIds.has(stop.id)) {
      moments.push({
        id: `${stop.id}-photo`,
        kind: TIMELINE_MOMENT_KINDS.PHOTO,
        stopId: stop.id,
        title: 'Photo captured',
        body: getLine(PHOTO_LINES, stop),
        imageUrl: stop.heroImage,
      })
    }
  })

  const monumentTitles = orderedStops.map((stop) => stop.shortTitle ?? stop.title)

  return {
    intro:
      monumentTitles.length > 0
        ? 'This is the path you walked - not measured in efficiency, but in the moments you chose to keep.'
        : 'Your journey is still unfolding. When you return, this timeline will hold what you walked, heard, and captured.',
    routeLabel:
      monumentTitles.length > 1
        ? `${monumentTitles.length} monuments along your route`
        : monumentTitles.length === 1
          ? 'One monument along your route'
          : 'Your route',
    monuments: orderedStops.map((stop) => ({
      id: stop.id,
      title: stop.shortTitle ?? stop.title,
    })),
    moments,
  }
}
