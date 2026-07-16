import { ROMAN_FORUM_STOP_IDS } from './forumWaypoints.js'

/** Walk order for Roma Antica — Colosseum through Forum, hills, and Circus Maximus. */
export const ROME_ANTICA_STOP_IDS = [
  'colosseum',
  'palatine-hill-cluster',
  ...ROMAN_FORUM_STOP_IDS,
  'capitoline-hill',
  'circus-maximus',
]

/** Roma Antica — ancient core (landing id `rome-essential`). */
export const ROME_ANTICA_TOUR = {
  id: 'rome-antica',
  productId: 'rome-essential',
  title: 'Roma Antica',
  subtitle:
    'Colosseum → Palatine terrace → Forum → Capitoline Hill → Circus Maximus',
  stopIds: ROME_ANTICA_STOP_IDS,
  mapZoom: 16,
}
