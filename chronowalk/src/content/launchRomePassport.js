import { collectVisitedStops } from './launchJourneyLetter'

const STAMP_INSCRIPTIONS = {
  colosseum: 'Arena of Empire',
  'palatine-hill-cluster': 'Hill of Emperors',
  'capitoline-hill': 'Temple of Jupiter',
  'trajan-market': 'Market of Trajan',
  pantheon: 'Dome of Light',
  'fontana-di-trevi': 'Fountain of Wishes',
  'largo-argentina': 'Sacred Ground',
  'campo-de-fiori': 'Field of Flowers',
  'piazza-navona': 'Square of Fountains',
  'castel-sant-angelo': 'Angel\'s Keep',
  'circus-maximus': 'Chariots & Crowds',
  'appian-way': 'Road of Stone',
  default: 'Monument of Rome',
}

/**
 * @typedef {Object} PassportStamp
 * @property {string} id
 * @property {string} title
 * @property {string} inscription
 * @property {number} order
 */

/**
 * @typedef {Object} RomePassport
 * @property {string} title
 * @property {string} subtitle
 * @property {string} holderName
 * @property {string} edition
 * @property {PassportStamp[]} stamps
 */

/**
 * @param {{ id?: string, shortTitle?: string, title?: string, number?: number }} stop
 */
function getStampInscription(stop) {
  return STAMP_INSCRIPTIONS[stop?.id] ?? STAMP_INSCRIPTIONS.default
}

/**
 * @param {{
 *   travelerName?: string,
 *   manifest?: import('./manifest.schema.js').RomeTourManifest | null,
 *   context?: { completedStopIds?: string[], currentStopId?: string | null },
 * }} options
 * @returns {RomePassport}
 */
export function buildRomePassport({ travelerName = 'Traveler', manifest, context }) {
  const visitedStops = collectVisitedStops(manifest, context)
  const visitedIds = new Set(visitedStops.map((stop) => stop.id))

  const orderedStops = (manifest?.stopOrder ?? [])
    .map((stopId) => manifest?.stopsById?.[stopId])
    .filter((stop) => stop && visitedIds.has(stop.id))

  const stamps = orderedStops.map((stop, index) => ({
    id: stop.id,
    title: stop.shortTitle ?? stop.title,
    inscription: getStampInscription(stop),
    order: index + 1,
  }))

  return {
    title: 'Rome Passport',
    subtitle: 'A keepsake of the monuments you visited on foot.',
    holderName: travelerName,
    edition: 'Ancient Rome · ChronoWalk',
    stamps,
  }
}

export function getStampInscriptionForStop(stop) {
  return getStampInscription(stop)
}
