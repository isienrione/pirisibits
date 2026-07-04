/** @typedef {{ lat: number, lng: number }} ManifestCoords */

/**
 * @typedef {Object} ManifestStop
 * @property {string} id
 * @property {number} number
 * @property {string} title
 * @property {string} shortTitle
 * @property {string} subtitle
 * @property {ManifestCoords} coords
 * @property {number} radiusM
 * @property {string} heroImage
 * @property {string} audio
 * @property {string} transcript
 * @property {string} reconstructionNow
 * @property {string} reconstructionThen
 * @property {string | null | undefined} [reconstructionLoop]
 * @property {string} arrivalLine
 * @property {string} approachLine
 * @property {string | null} nextStopId
 */

/**
 * @typedef {Object} RomeTourManifest
 * @property {string} id
 * @property {string} title
 * @property {string} subtitle
 * @property {string[]} stopOrder
 * @property {ManifestStop[]} stops
 * @property {Record<string, ManifestStop>} stopsById
 */

export const MANIFEST_STOP_FIELDS = [
  'id',
  'number',
  'title',
  'shortTitle',
  'subtitle',
  'coords',
  'radiusM',
  'heroImage',
  'audio',
  'transcript',
  'reconstructionNow',
  'reconstructionThen',
  'arrivalLine',
  'approachLine',
  'nextStopId',
]

export const PLACEHOLDER_MEDIA = {
  heroImage: '/waypoints/placeholder/modern-poster.jpg',
  audio: '/waypoints/placeholder/Audio_sample.mp3',
  transcript: '/waypoints/placeholder/transcript.txt',
  reconstructionNow: '/waypoints/placeholder/modern.mp4',
  reconstructionThen: '/waypoints/placeholder/ancient-reconstruction.mp4',
}

export function placeholderPathsForStop(stopId) {
  const base = `/waypoints/${stopId}`
  return {
    heroImage: `${base}/modern-poster.jpg`,
    audio: `${base}/Audio_sample.mp3`,
    transcript: `${base}/transcript.txt`,
    reconstructionNow: `${base}/modern.mp4`,
    reconstructionThen: `${base}/ancient-reconstruction.mp4`,
    reconstructionLoop: `${base}/modern.mp4`,
  }
}

export function deriveShortTitle(title, fallbackId = '') {
  const raw = String(title || fallbackId).trim()
  if (!raw) return fallbackId || 'Stop'
  return raw.replace(/^The\s+/i, '')
}

function pickMediaUrl(...candidates) {
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}

/**
 * @param {Partial<ManifestStop> | null | undefined} raw
 * @returns {ManifestStop}
 */
export function normalizeManifestStop(raw) {
  if (!raw?.id) {
    throw new Error('normalizeManifestStop: stop id is required')
  }

  const placeholders = placeholderPathsForStop(raw.id)

  const coords = raw.coords ?? { lat: 0, lng: 0 }
  const title = String(raw.title ?? raw.id)
  const shortTitle = raw.shortTitle ?? deriveShortTitle(title, raw.id)

  /** @type {ManifestStop} */
  const stop = {
    id: raw.id,
    number: Number.isFinite(raw.number) ? raw.number : 1,
    title,
    shortTitle,
    subtitle: String(raw.subtitle ?? ''),
    coords: {
      lat: Number(coords.lat) || 0,
      lng: Number(coords.lng) || 0,
    },
    radiusM: Number.isFinite(raw.radiusM) ? raw.radiusM : 30,
    heroImage: pickMediaUrl(raw.heroImage, placeholders.heroImage, PLACEHOLDER_MEDIA.heroImage),
    audio: pickMediaUrl(raw.audio, placeholders.audio, PLACEHOLDER_MEDIA.audio),
    transcript: pickMediaUrl(raw.transcript, placeholders.transcript, PLACEHOLDER_MEDIA.transcript),
    reconstructionNow: pickMediaUrl(
      raw.reconstructionNow,
      placeholders.reconstructionNow,
      PLACEHOLDER_MEDIA.reconstructionNow
    ),
    reconstructionThen: pickMediaUrl(
      raw.reconstructionThen,
      placeholders.reconstructionThen,
      PLACEHOLDER_MEDIA.reconstructionThen
    ),
    arrivalLine: String(raw.arrivalLine ?? `You've arrived at ${shortTitle}.`),
    approachLine: String(raw.approachLine ?? `Continue toward ${shortTitle}.`),
    nextStopId: raw.nextStopId ?? null,
  }

  const loop = pickMediaUrl(raw.reconstructionLoop, placeholders.reconstructionLoop)
  if (loop) stop.reconstructionLoop = loop

  return stop
}

/** @param {ManifestStop} stop */
export function assertManifestStopShape(stop) {
  for (const field of MANIFEST_STOP_FIELDS) {
    if (!(field in stop)) {
      throw new Error(`Manifest stop missing field: ${field}`)
    }
  }

  if (typeof stop.coords?.lat !== 'number' || typeof stop.coords?.lng !== 'number') {
    throw new Error('Manifest stop coords must include lat and lng numbers')
  }

  return true
}
