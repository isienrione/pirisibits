/**
 * Redesign screen photos — local NOW images from public/waypoints/.
 */
import {
  getModernExteriorUrl,
  getModernPosterUrl,
  TOUR_HERO_PHOTO,
} from '../content/modernPhotoRegistry.js'

const bust = typeof __APP_BUILD_ID__ !== 'undefined' ? `?v=${__APP_BUILD_ID__}` : ''

function now(stopId) {
  return `${getModernPosterUrl(stopId)}${bust}`
}

function nowExterior(stopId) {
  return `${getModernExteriorUrl(stopId)}${bust}`
}

export const colosseumNow = now('colosseum')
export const colosseumInteriorNow = now('colosseum-interior')
export const pantheonNow = now('pantheon')
export const capitolineNow = now('capitoline-hill')
export const spanishSteps = now('spanish-steps')
export const severusNow = now('forum-arch-severus')
export const trajansNow = now('trajan-market')
export const archTitusNow = now('forum-arch-titus')
export const palatineNow = now('palatine-hill-cluster')
export const basilicaNow = now('forum-basilica-maxentius')
export const viaSacraNow = now('forum-via-sacra')
export const templeVestaNow = now('forum-temple-vesta')
export const rostraNow = now('forum-rostra')
export const templeSaturnNow = now('forum-temple-saturn')
export const curiaNow = now('forum-curia-julia')
export const treviNow = now('fontana-di-trevi')
export const navonaNow = now('piazza-navona')
export const campoNow = now('campo-de-fiori')
export const argentinaNow = now('largo-argentina')
export const castelNow = now('castel-sant-angelo')
export const circusNow = now('circus-maximus')
export const appiaNow = now('appian-way')

/** Placeholder THEN stills until reconstruction animations ship. */
export const THEN_colosseum = nowExterior('colosseum')
export const THEN_pantheon = nowExterior('pantheon')

export const tourHero = `${TOUR_HERO_PHOTO}${bust}`

/** Lookup by legacy stop id — used when wiring screens to real waypoint data. */
export function getNowPhotoUrl(stopId) {
  return now(stopId)
}
