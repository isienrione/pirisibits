/**
 * Normalized hotspot regions on pack route posters (percent of image box).
 * left/top/width/height are 0–100 relative to the poster art.
 *
 * Roma Eterna sticker numbers follow the illustrated route card, not waypoint ids.
 * Optional green loop 3–5 maps to Palatine terrace chapters (Hill / Circus view /
 * Forum-from-the-railing). Severus + Curia share w11_12 with different chapters.
 *
 * Roma Antica stickers 2–4 are the green optional loop (Palatine / Circus /
 * Forum overview). Circus Maximus is the dedicated enc_circus stop on Antica.
 *
 * Roma Historica stickers follow the 8 centro-storico illustrations on the card
 * (Pantheon deep-dive pack; Appia / Pantheon-interior are not drawn as stickers).
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

/** @type {RoutePosterHotspot[]} */
export const ROMA_ANTICA_ROUTE_HOTSPOTS = [
  { id: 'antica-1', waypointId: 'w01', label: 'Colosseum', left: 73, top: 4, width: 15, height: 15 },
  {
    id: 'antica-2',
    waypointId: 'w04',
    label: 'Palatine Hill Terrace',
    left: 43,
    top: 7,
    width: 14,
    height: 12,
    chapterIndex: 0,
  },
  { id: 'antica-3', waypointId: 'enc_circus', label: 'Circo Massimo', left: 29, top: 29, width: 17, height: 13 },
  {
    id: 'antica-4',
    waypointId: 'w04',
    label: 'Roman Forum General View',
    left: 53,
    top: 31,
    width: 15,
    height: 13,
    chapterIndex: 2,
  },
  { id: 'antica-5', waypointId: 'w03', label: 'Arch of Titus', left: 79, top: 28, width: 13, height: 11 },
  { id: 'antica-6', waypointId: 'w06', label: 'Basilica di Maxentius', left: 81, top: 42, width: 13, height: 11 },
  { id: 'antica-7', waypointId: 'w07', label: 'Via Sacra', left: 76, top: 58, width: 13, height: 11 },
  { id: 'antica-8', waypointId: 'w08', label: 'Temple of the Vestals', left: 72, top: 70, width: 13, height: 11 },
  { id: 'antica-9', waypointId: 'w10', label: 'The Rostra', left: 58, top: 84, width: 14, height: 11 },
  {
    id: 'antica-10',
    waypointId: 'w11_12',
    label: 'Arch of Septimius Severus',
    left: 39,
    top: 69,
    width: 14,
    height: 12,
    chapterIndex: 0,
  },
  {
    id: 'antica-11',
    waypointId: 'w11_12',
    label: 'Curia Julia',
    left: 37,
    top: 52,
    width: 14,
    height: 12,
    chapterIndex: 1,
  },
  { id: 'antica-12', waypointId: 'w13', label: 'Capitoline Hill', left: 49, top: 46, width: 14, height: 12 },
]

/** @type {RoutePosterHotspot[]} */
export const ROMA_HISTORICA_ROUTE_HOTSPOTS = [
  { id: 'historica-1', waypointId: 'w17', label: 'Pantheon', left: 57, top: 5, width: 17, height: 16 },
  { id: 'historica-2', waypointId: 'w16', label: 'Trevi Fountain', left: 73, top: 18, width: 17, height: 16 },
  { id: 'historica-3', waypointId: 'w18', label: 'Piazza Navona', left: 48, top: 33, width: 15, height: 16 },
  {
    id: 'historica-4',
    waypointId: 'w20',
    label: 'Torre di Largo Argentina',
    left: 72,
    top: 42,
    width: 17,
    height: 15,
  },
  { id: 'historica-5', waypointId: 'w14', label: 'Mercato Traiano', left: 68, top: 62, width: 17, height: 15 },
  { id: 'historica-6', waypointId: 'w19', label: "Campo de' Fiori", left: 48, top: 73, width: 17, height: 15 },
  {
    id: 'historica-7',
    waypointId: 'w21',
    label: "Castel Sant'Angelo",
    left: 26,
    top: 68,
    width: 18,
    height: 17,
  },
  { id: 'historica-8', waypointId: 'w15', label: 'Spanish Steps', left: 28, top: 38, width: 15, height: 16 },
]

const HOTSPOTS_BY_TIER = {
  'rome-complete': ROMA_ETERNA_ROUTE_HOTSPOTS,
  'rome-essential': ROMA_ANTICA_ROUTE_HOTSPOTS,
  'rome-central': ROMA_HISTORICA_ROUTE_HOTSPOTS,
}

/** Hotspots for a marketing pack tier id, or empty when none are mapped yet. */
export function getRoutePosterHotspots(tierId) {
  return HOTSPOTS_BY_TIER[tierId] ?? []
}
