import { ROMAN_FORUM_STOP_IDS } from './forumWaypoints.js'

/** Walk order for Roma Antica — Colosseum through Forum, hills, and Circus Maximus. */
export const ROME_ANTICA_STOP_IDS = [
  'colosseum',
  'palatine-hill-cluster',
  'circus-maximus',
  ...ROMAN_FORUM_STOP_IDS,
  'capitoline-hill',
]

/** Roma Antica — ancient core (landing id `rome-essential`). */
export const ROME_ANTICA_TOUR = {
  id: 'rome-antica',
  productId: 'rome-essential',
  title: 'Roma Antica',
  subtitle:
    'Colosseum → Palatine terrace → Circus Maximus View → Forum → Capitoline Hill',
  stopIds: ROME_ANTICA_STOP_IDS,
  mapZoom: 16,
}
