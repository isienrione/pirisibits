/** Rome journey pacing: tiered tour products (replaces the old two-day split). */

export const JOURNEY_PACE = {
  CENTRAL: 'central',
  CLASSIC: 'classic',
  HEROIC: 'heroic',
  OWN: 'own',
}

export const PACE_ORIENTATION =
  'You can change your mind at any time. Nothing expires. Nothing is skipped forever.'

/** Seven act slots for tier cards; null means the act is not in this tour. */
export const ACT_DOT_KEYS = ['act1', 'act2', 'act3', 'act4', 'act5', 'act6', 'encore']

export const PACE_OPTIONS = [
  {
    id: JOURNEY_PACE.HEROIC,
    title: 'Roma Eterna',
    badge: null,
    priceLabel: '€14.99',
    priceCents: 1499,
    description:
      "The complete 21-stop Rome walk: Colosseum, Forum, Circus Maximus View on Path B, Pantheon, historic center, Castel Sant'Angelo, and Via Appia.",
    includedSummary: 'Colosseum · Forum · Pantheon · historic center · Via Appia',
    actDots: ['act1', 'act2', 'act3', 'act4', 'act5', 'act6', 'encore'],
    imageKey: 'capitoline',
    default: true,
  },
  {
    id: JOURNEY_PACE.CENTRAL,
    title: 'Roma Historica',
    badge: null,
    priceLabel: '€9.99',
    priceCents: 999,
    description:
      "Eight stops through Rome’s historic center around the Pantheon: squares, fountains, streets, and monuments in front of you.",
    includedSummary: 'Pantheon · piazzas · fountains · the Tiber',
    actDots: [null, null, null, 'act4', 'act5', 'act6', 'encore'],
    imageKey: 'pantheon',
  },
  {
    id: JOURNEY_PACE.CLASSIC,
    title: 'Roma Antica',
    badge: null,
    priceLabel: '€9.99',
    priceCents: 999,
    description:
      'Twelve stops through Rome’s ancient core: Colosseum, Palatine Hill terrace, Circus Maximus View on Path B, Forum, and Capitoline Hill.',
    includedSummary: 'Colosseum · Palatine · Circus View · Forum · Capitoline',
    actDots: ['act1', 'act2', 'act3', null, null, null, null],
    imageKey: 'colosseum',
  },
  {
    id: JOURNEY_PACE.OWN,
    title: 'At your own pace',
    badge: null,
    priceLabel: '€14.99',
    priceCents: 1499,
    description:
      'Pick any stops you like, one morning or many. Build your own route through every landmark in the catalog.',
    includedSummary: 'Any act · any order · your itinerary',
    actDots: ['act1', 'act2', 'act3', 'act4', 'act5', 'act6', 'encore'],
    imageKey: 'trajan',
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
    waypoints: ['w04'],
    entry: 'The Palatine',
    promise: 'The hill that named every palace. The Forum laid out below.',
  },
  {
    id: 'act3',
    numeral: 'III',
    title: 'The Forum',
    waypoints: ['w03', 'w06', 'w07', 'w08', 'pause', 'w10', 'w11_12', 'w13'],
    entry: 'Arch of Titus',
    promise: 'The gate, the Sacred Way, and the centre of the world.',
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
    waypoints: ['w15', 'w16', 'w17', 'w23', 'w18', 'w19', 'w20'],
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
    title: 'Optional Encore',
    waypoints: ['w22'],
    entry: 'Optional Encore › Via Appia Antica',
    promise: 'Estimated 30 min drive · walk where legions and merchants left Rome.',
  },
]

export const JOURNEY_PATH = {
  A: 'a',
  B: 'b',
}

export function getPaceOption(paceId) {
  return PACE_OPTIONS.find((option) => option.id === paceId) ?? PACE_OPTIONS[0]
}

export function getDefaultPace() {
  return PACE_OPTIONS.find((option) => option.default)?.id ?? JOURNEY_PACE.HEROIC
}

export function getActForWaypoint(waypointId) {
  return ROME_ACTS.find((act) => act.waypoints.includes(waypointId)) ?? null
}

export function getActSummaries() {
  return ROME_ACTS.map((act) => ({
    id: act.id,
    label: `${act.numeral} · ${act.title}`,
    stopCount: act.waypoints.filter((waypointId) => waypointId !== 'pause').length,
    entry: act.entry,
    promise: act.promise,
  }))
}
