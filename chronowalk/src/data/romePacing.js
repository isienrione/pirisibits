/** Rome journey pacing — acts model (replaces the old two-day split). */

export const JOURNEY_PACE = {
  CLASSIC: 'classic',
  HEROIC: 'heroic',
  OWN: 'own',
}

export const PACE_ORIENTATION =
  'You can change your mind at any time. Nothing expires. Nothing is skipped forever.'

export const PACE_OPTIONS = [
  {
    id: JOURNEY_PACE.CLASSIC,
    title: 'The Classic Split',
    badge: 'Most loved',
    description: 'The ancient city one outing, the living city another. Acts I–IV, then V–VI.',
    default: true,
  },
  {
    id: JOURNEY_PACE.HEROIC,
    title: 'The Heroic Day',
    description: 'All of it, dawn to golden hour. Bring real shoes and real ambition.',
  },
  {
    id: JOURNEY_PACE.OWN,
    title: 'Your Own Pace',
    description: "Any act, any order, as many mornings as you like. I'll keep your place.",
  },
]

export const ROME_ACTS = [
  {
    id: 'act1',
    numeral: 'I',
    title: 'The Arena',
    waypoints: ['w01', 'w02'],
    entry: 'The Colosseum',
    promise: 'Where the crowd roar still lives in the stone.',
  },
  {
    id: 'act2',
    numeral: 'II',
    title: 'The Gate & the Hill',
    waypoints: ['w03', 'w04'],
    entry: 'Arch of Titus',
    promise: 'Two doors into ancient Rome — you choose at the piazza.',
  },
  {
    id: 'act3',
    numeral: 'III',
    title: 'The Forum',
    waypoints: ['w06', 'w07', 'w08', 'pause', 'w10', 'w11_12', 'w13'],
    entry: 'Basilica of Maxentius',
    promise: 'Nine stops, one drained swamp, the centre of the world.',
  },
  {
    id: 'act4',
    numeral: 'IV',
    title: 'The Market',
    waypoints: ['w14'],
    entry: "Trajan's Market",
    promise: 'Rome’s vertical city, still legible in brick.',
  },
  {
    id: 'act5',
    numeral: 'V',
    title: 'The Living City',
    waypoints: ['w15', 'w16', 'w17', 'w18', 'w19', 'w20'],
    entry: 'Spanish Steps',
    promise: 'Fountains, piazzas, and the water that follows you.',
  },
  {
    id: 'act6',
    numeral: 'VI',
    title: 'The River',
    waypoints: ['w21'],
    entry: 'Castel Sant’Angelo',
    promise: 'A tomb that refused to stay a tomb.',
  },
  {
    id: 'encore',
    numeral: 'Encore',
    title: 'The Long Games & the Long Road',
    waypoints: ['enc_circus', 'w22'],
    entry: 'Circus Maximus floor',
    promise: 'The window from the hill, paid off on the ground.',
  },
]

export const JOURNEY_PATH = {
  A: 'a',
  B: 'b',
}

export function getPaceOption(paceId) {
  return PACE_OPTIONS.find((option) => option.id === paceId) ?? PACE_OPTIONS[0]
}

export function getActForWaypoint(waypointId) {
  return ROME_ACTS.find((act) => act.waypoints.includes(waypointId)) ?? null
}

export function getActSummaries() {
  return ROME_ACTS.map((act) => ({
    id: act.id,
    label: `${act.numeral} · ${act.title}`,
    stopCount: act.waypoints.length,
    entry: act.entry,
    promise: act.promise,
  }))
}
