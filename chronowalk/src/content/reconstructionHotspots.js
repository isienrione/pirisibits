import { COLOSSEUM_WAYPOINT } from '../data/colosseum'
import { t } from '../i18n/t.js'

/**
 * @typedef {Object} ReconstructionHotspot
 * @property {string} id
 * @property {number} x Normalized horizontal position (0–1)
 * @property {number} y Normalized vertical position (0–1)
 * @property {string} [label] Optional architectural label
 * @property {string} title
 * @property {string} body
 * @property {string} [era]
 */

/**
 * @typedef {Object} ReconstructionScene
 * @property {string} imageUrl
 * @property {ReconstructionHotspot[]} hotspots
 */

const COLOSSEUM_HOTSPOTS = [
  { id: 'velarium', x: 0.5, y: 0.14, label: 'Velarium' },
  { id: 'cavea', x: 0.78, y: 0.38, label: 'Cavea' },
  { id: 'arena', x: 0.5, y: 0.58, label: 'Arena' },
  { id: 'pulvinar', x: 0.22, y: 0.42, label: 'Pulvinar' },
  { id: 'hypogeum', x: 0.5, y: 0.72, label: 'Hypogeum' },
]

const DEFAULT_HOTSPOTS = [
  { id: 'facade', x: 0.5, y: 0.35 },
  { id: 'threshold', x: 0.5, y: 0.62 },
]

function localizeColosseumHotspot(hotspot) {
  const prefix = `hotspot.colosseum.${hotspot.id}`
  return {
    ...hotspot,
    title: t(`${prefix}.title`),
    era: t(`${prefix}.era`),
    body: t(`${prefix}.body`),
  }
}

function localizeDefaultHotspot(hotspot) {
  const prefix = `hotspot.default.${hotspot.id}`
  return {
    ...hotspot,
    label: t(`${prefix}.label`),
    title: t(`${prefix}.title`),
    body: t(`${prefix}.body`),
  }
}

const COLOSSEUM_SCENE = {
  imageUrl: COLOSSEUM_WAYPOINT.ancient_image_url,
  hotspots: COLOSSEUM_HOTSPOTS,
}

const DEFAULT_SCENE = {
  imageUrl: null,
  hotspots: DEFAULT_HOTSPOTS,
}

const SCENES_BY_STOP = {
  colosseum: COLOSSEUM_SCENE,
}

/**
 * @param {{ id?: string }} stop
 * @param {string | null | undefined} imageUrl
 * @returns {ReconstructionScene}
 */
export function getReconstructionScene(stop, imageUrl) {
  const sceneKey = SCENES_BY_STOP[stop?.id] ? stop.id : 'default'
  const scene = SCENES_BY_STOP[stop?.id] ?? DEFAULT_SCENE
  const localize = sceneKey === 'colosseum' ? localizeColosseumHotspot : localizeDefaultHotspot

  return {
    imageUrl: imageUrl ?? scene.imageUrl,
    hotspots: scene.hotspots.map(localize),
  }
}
