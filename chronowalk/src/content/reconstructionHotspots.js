import { COLOSSEUM_WAYPOINT } from '../data/colosseum'

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

const COLOSSEUM_SCENE = {
  imageUrl: COLOSSEUM_WAYPOINT.ancient_image_url,
  hotspots: [
    {
      id: 'velarium',
      x: 0.5,
      y: 0.14,
      label: 'Velarium',
      title: 'The velarium',
      era: 'c. 80 AD',
      body: 'A vast awning of canvas and rope shielded spectators from the Roman sun. Its engineering was as public as the games themselves · proof that spectacle required infrastructure.',
    },
    {
      id: 'cavea',
      x: 0.78,
      y: 0.38,
      label: 'Cavea',
      title: 'The seating tiers',
      era: 'c. 80 AD',
      body: 'Stone terraces rose in strict social order. Senators low and close, plebeians high above. The architecture made hierarchy visible before the first trumpet sounded.',
    },
    {
      id: 'arena',
      x: 0.5,
      y: 0.58,
      label: 'Arena',
      title: 'The sand floor',
      era: 'c. 80 AD',
      body: 'The arena floor was a stage for blood, ceremony, and imperial generosity. What looked like earth from above concealed lifts, cages, and the machinery of surprise.',
    },
    {
      id: 'pulvinar',
      x: 0.22,
      y: 0.42,
      label: 'Pulvinar',
      title: 'The imperial box',
      era: 'c. 80 AD',
      body: 'From the pulvinar, emperors watched Rome watch them. Power was performed as proximity · the ruler visible, the crowd accountable to his gaze.',
    },
    {
      id: 'hypogeum',
      x: 0.5,
      y: 0.72,
      label: 'Hypogeum',
      title: 'Beneath the arena',
      era: 'c. 80 AD',
      body: 'Below the sand, corridors and chambers held animals, gladiators, and scenery. The audience saw myth; slaves and craftsmen made it arrive on cue.',
    },
  ],
}

const DEFAULT_SCENE = {
  imageUrl: null,
  hotspots: [
    {
      id: 'facade',
      x: 0.5,
      y: 0.35,
      label: 'Facade',
      title: 'The public face',
      body: 'Rome built monuments to be read from the street. Every arch and inscription taught citizens what to remember about power, piety, and permanence.',
    },
    {
      id: 'threshold',
      x: 0.5,
      y: 0.62,
      label: 'Threshold',
      title: 'The crossing',
      body: 'To step inside was to leave the ordinary city. Thresholds in Rome were not merely doors · they were contracts between crowd, ritual, and empire.',
    },
  ],
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
  const scene = SCENES_BY_STOP[stop?.id] ?? DEFAULT_SCENE

  return {
    imageUrl: imageUrl ?? scene.imageUrl,
    hotspots: scene.hotspots,
  }
}
