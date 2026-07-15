/** Rome journey pacing — post-purchase tour layouts (not for sale on /begin). */

export const JOURNEY_PACE = {
  CENTRAL: 'central',
  CLASSIC: 'classic',
  HEROIC: 'heroic',
  OWN: 'own',
}

/** How a purchaser starts the tour they already own. */
export const START_MODE = {
  FULL: 'full',
  OWN: 'own',
}

export const PACE_ORIENTATION =
  'Confirm your layout next. You can change stops anytime — nothing expires.'

/** Seven act slots for package cards — null means the act is not in this tour. */
export const ACT_DOT_KEYS = ['act1', 'act2', 'act3', 'act4', 'act5', 'act6', 'encore']

/**
 * Purchasable tour packages (mirrors landing tiers).
 * Pricing lives only on /landing — these objects describe layout, not checkout.
 */
export const PACE_OPTIONS = [
  {
    id: JOURNEY_PACE.HEROIC,
    productId: 'rome-complete',
    title: 'Roma Eterna',
    badge: 'Full Rome',
    description:
      "The complete Rome — Colosseum, the Roman Forum, Circus Maximus, Pantheon, Centro Storico, Castel Sant'Angelo, and Via Appia in one continuous walk.",
    includedSummary: 'Colosseum · Forum · Pantheon · centro storico · Via Appia',
    actDots: ['act1', 'act2', 'act3', 'act4', 'act5', 'act6', 'encore'],
    imageKey: 'capitoline',
    default: true,
  },
  {
    id: JOURNEY_PACE.CENTRAL,
    productId: 'rome-central',
    title: 'Roma Historica',
    badge: null,
    description:
      "Centro storico and the Pantheon — Spanish Steps, Trevi, Navona, Campo de' Fiori, Trajan's Market, Largo Argentina, Castel Sant'Angelo, and Via Appia.",
    includedSummary: 'Pantheon · piazzas · fountains · the Tiber · Via Appia',
    actDots: [null, null, null, 'act4', 'act5', 'act6', 'encore'],
    imageKey: 'pantheon',
  },
  {
    id: JOURNEY_PACE.CLASSIC,
    productId: 'rome-essential',
    title: 'Roma Antica',
    badge: null,
    description:
      'The Colosseum and the full Forum walk — from the Arena through the Arch of Titus and every Forum stop to the Capitoline.',
    includedSummary: 'Colosseum · Arch of Titus · Roman Forum',
    actDots: ['act1', 'act2', 'act3', null, null, null, null],
    imageKey: 'colosseum',
  },
]

/** Own-pace is a start mode, not a purchasable package. */
export const OWN_PACE_OPTION = {
  id: JOURNEY_PACE.OWN,
  title: 'At your own pace',
  badge: null,
  description:
    'Pick any stops from the package you purchased — one morning or many. Build your own route.',
  includedSummary: 'Your stops · your order · your itinerary',
  actDots: ['act1', 'act2', 'act3', 'act4', 'act5', 'act6', 'encore'],
  imageKey: 'trajan',
}

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
    title: 'The Long Road',
    waypoints: ['w22'],
    entry: 'Via Appia Antica',
    promise: 'Walk where legions and merchants left Rome.',
  },
]

export const JOURNEY_PATH = {
  A: 'a',
  B: 'b',
}

const PRODUCT_TO_PACE = Object.fromEntries(
  PACE_OPTIONS.filter((option) => option.productId).map((option) => [option.productId, option.id]),
)

export function getPaceOption(paceId) {
  if (paceId === JOURNEY_PACE.OWN) return OWN_PACE_OPTION
  return PACE_OPTIONS.find((option) => option.id === paceId) ?? PACE_OPTIONS[0]
}

export function getDefaultPace() {
  return PACE_OPTIONS.find((option) => option.default)?.id ?? JOURNEY_PACE.HEROIC
}

export function getPaceForProductId(productId) {
  if (!productId) return getDefaultPace()
  return PRODUCT_TO_PACE[productId] ?? getDefaultPace()
}

export function getPackageOptionForProductId(productId) {
  return getPaceOption(getPaceForProductId(productId))
}

/**
 * Start-mode cards shown after purchase — full purchased route vs customize.
 * @param {ReturnType<typeof getPaceOption>} packageOption
 */
export function getBeginStartModes(packageOption) {
  const pkg = packageOption ?? getPaceOption(getDefaultPace())
  return [
    {
      id: START_MODE.FULL,
      paceId: pkg.id,
      title: 'Full route',
      description: `Walk every stop in ${pkg.title} — the guided layout included in your purchase.`,
      includedSummary: pkg.includedSummary,
      actDots: pkg.actDots,
      imageKey: pkg.imageKey,
      badge: pkg.title,
    },
    {
      id: START_MODE.OWN,
      paceId: JOURNEY_PACE.OWN,
      title: 'Customize stops',
      description: `Pick a subset of the stops included in ${pkg.title}. Your order, your pace.`,
      includedSummary: `Only ${pkg.title} stops · your itinerary`,
      actDots: pkg.actDots,
      imageKey: OWN_PACE_OPTION.imageKey,
      badge: null,
    },
  ]
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
