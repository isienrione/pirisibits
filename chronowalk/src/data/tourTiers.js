import { JOURNEY_PACE, ROME_ACTS } from './romePacing.js'

/** Fixed waypoint order for tiered tours (path A walking order). */
export const TOUR_TIER_WAYPOINTS = {
  /** Roma Centrale — centro storico + Pantheon (no Colosseum or Forum). */
  [JOURNEY_PACE.CENTRAL]: [
    'w14',
    'w15',
    'w16',
    'w17',
    'w23',
    'w18',
    'w19',
    'w20',
    'w21',
    'w22',
  ],
  /** Roma Antica — Colosseum, Palatine, Circus Maximus View (Path B), Forum, Capitoline. */
  [JOURNEY_PACE.CLASSIC]: [
    'w01',
    'w02',
    'w04',
    'enc_circus',
    'w03',
    'w06',
    'w07',
    'w08',
    'pause',
    'w10',
    'w11_12',
    'w13',
  ],
}

/** Act ids included per tier — used for dots + My Tour grouping. */
export const TOUR_TIER_ACT_IDS = {
  [JOURNEY_PACE.CENTRAL]: ['act4', 'act5', 'act6', 'encore'],
  [JOURNEY_PACE.CLASSIC]: ['act1', 'act2', 'act3'],
  [JOURNEY_PACE.HEROIC]: ROME_ACTS.map((act) => act.id),
  [JOURNEY_PACE.OWN]: ROME_ACTS.map((act) => act.id),
}

export function getTierWaypointIds(pace) {
  return TOUR_TIER_WAYPOINTS[pace] ?? null
}

export function getTierActIds(pace) {
  return TOUR_TIER_ACT_IDS[pace] ?? null
}

export function isFixedTierPace(pace) {
  return pace === JOURNEY_PACE.CENTRAL || pace === JOURNEY_PACE.CLASSIC
}
