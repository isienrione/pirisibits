/**
 * Normalized hotspot regions on pack route posters (percent of image box).
 * left/top/width/height are 0–100 relative to the poster art.
 *
 * Roma Eterna sticker numbers follow the illustrated route card, not waypoint ids.
 * Optional green loop 3–5 maps to Palatine terrace chapters (Hill / Circus view /
 * Forum-from-the-railing). Severus + Curia share w11_12 with different chapters.
 */

/**
 * @typedef {{
 *   id: string,
 *   waypointId: string,
 *   label: string,
 *   left: number,
 *   top: number,
 *   width: number,
 *   height: number,
 *   chapterIndex?: number,
 * }} RoutePosterHotspot
 */

/** @type {RoutePosterHotspot[]} */
export const ROMA_ETERNA_ROUTE_HOTSPOTS = [
  { id: 'art-1', waypointId: 'w01', label: 'Colosseum exterior', left: 68.5, top: 2.8, width: 10.5, height: 5.8 },
  { id: 'art-2', waypointId: 'w02', label: 'Colosseum interior', left: 68.5, top: 7.8, width: 10.5, height: 5.8 },
  {
    id: 'art-3',
    waypointId: 'w04',
    label: 'Palatine Hill Terrace',
    left: 46.5,
    top: 12.8,
    width: 11,
    height: 6.2,
    chapterIndex: 0,
  },
  {
    id: 'art-4',
    waypointId: 'w04',
    label: 'Circus Maximus View',
    left: 46,
    top: 22.5,
    width: 11.5,
    height: 6.2,
    chapterIndex: 1,
  },
  {
    id: 'art-5',
    waypointId: 'w04',
    label: 'Roman Forum General View',
    left: 47.5,
    top: 33.2,
    width: 12,
    height: 6.5,
    chapterIndex: 2,
  },
  { id: 'art-6', waypointId: 'w03', label: 'Arch of Titus', left: 77, top: 15.2, width: 11, height: 6 },
  { id: 'art-7', waypointId: 'w06', label: 'Basilica of Maxentius', left: 78.5, top: 25.5, width: 11.5, height: 6.2 },
  { id: 'art-8', waypointId: 'w07', label: 'Via Sacra', left: 74, top: 33.5, width: 11, height: 5.8 },
  { id: 'art-9', waypointId: 'w08', label: 'Temple of the Vestals', left: 74, top: 39.5, width: 11.5, height: 6 },
  { id: 'art-10', waypointId: 'w10', label: 'The Rostra', left: 74, top: 47.5, width: 11, height: 5.8 },
  {
    id: 'art-11',
    waypointId: 'w11_12',
    label: 'Arch of Septimius Severus',
    left: 72.5,
    top: 55.5,
    width: 12,
    height: 6.2,
    chapterIndex: 0,
  },
  {
    id: 'art-12',
    waypointId: 'w11_12',
    label: 'Curia Julia',
    left: 73.5,
    top: 68,
    width: 11.5,
    height: 6.2,
    chapterIndex: 1,
  },
  { id: 'art-13', waypointId: 'w14', label: "Trajan's Market", left: 81.5, top: 74.5, width: 12, height: 6.5 },
  { id: 'art-15', waypointId: 'w15', label: 'Spanish Steps', left: 49.5, top: 86.8, width: 11.5, height: 6.5 },
  { id: 'art-16', waypointId: 'w20', label: 'Largo di Torre Argentina', left: 34.5, top: 84.5, width: 12, height: 6.5 },
  { id: 'art-14', waypointId: 'w16', label: 'Trevi Fountain', left: 54.5, top: 95.2, width: 12, height: 4.6 },
  { id: 'art-17', waypointId: 'w17', label: 'Pantheon exterior', left: 31, top: 73.5, width: 11.5, height: 6.2 },
  { id: 'art-18', waypointId: 'w23', label: 'Pantheon interior', left: 31.2, top: 62, width: 11.5, height: 6.2 },
  { id: 'art-19', waypointId: 'w18', label: 'Piazza Navona', left: 44.5, top: 58, width: 12, height: 6.2 },
  { id: 'art-20', waypointId: 'w19', label: "Campo de' Fiori", left: 30.5, top: 49, width: 11.5, height: 6.2 },
  { id: 'art-21', waypointId: 'w21', label: "Castel Sant'Angelo", left: 31.8, top: 34.5, width: 12, height: 6.5 },
  { id: 'art-22', waypointId: 'w22', label: 'Via Appia Antica', left: 76, top: 93, width: 12, height: 6.5 },
]

const HOTSPOTS_BY_TIER = {
  'rome-complete': ROMA_ETERNA_ROUTE_HOTSPOTS,
}

/** Hotspots for a marketing pack tier id, or empty when none are mapped yet. */
export function getRoutePosterHotspots(tierId) {
  return HOTSPOTS_BY_TIER[tierId] ?? []
}
