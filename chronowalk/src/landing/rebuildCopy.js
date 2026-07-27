/**
 * Landing v4 — product-first copy. Prefer demonstration. Delete explanation.
 */
import {
  CHECKOUT_REASSURANCE,
  LANDING_PRODUCT,
  TAX_NOTE,
  eternaUpgradeDeltaLabel,
} from './landingProduct.js'

const eterna = LANDING_PRODUCT.eterna
const historica = LANDING_PRODUCT.historica
const antica = LANDING_PRODUCT.antica
const couple = LANDING_PRODUCT.couple
const family = LANDING_PRODUCT.family

export const REBUILD_TRUST_CHIPS = [
  'Opens in your browser',
  'Offline after prep',
  'No subscription',
  'Paddle checkout',
]

/** Above-the-fold hero chips — keep secondary to the phone. */
export const REBUILD_HERO_TRUST_CHIPS = ['Opens in your browser', 'No subscription']

export const REBUILD_TRUST_STRIP = REBUILD_TRUST_CHIPS.join(' · ')

export const REBUILD_HERO = {
  organic: {
    eyebrow: 'ChronoWalk',
    headlineLines: ['See what stood here.', 'Hear what happened.'],
    headline: 'See what stood here. Hear what happened.',
    support: '',
    definition: `${eterna.stopCount} stops · ${eterna.priceLabel} once`,
    /** Act I — curiosity (quiet). */
    primaryCta: 'Try the Pantheon stop free',
    secondaryCta: `See the complete Rome walk · ${eterna.priceLabel}`,
    reassurance: '',
  },
  geo: {
    eyebrow: 'ChronoWalk',
    headlineLines: ['Standing in front of history?', 'See what was here.'],
    headline: 'Standing in front of history? See what was here.',
    support: '',
    definition: `${eterna.stopCount} stops · ${eterna.priceLabel} once`,
    primaryCta: 'Try the Pantheon stop free',
    secondaryCta: `See the complete Rome walk · ${eterna.priceLabel}`,
    reassurance: '',
  },
  qr: {
    eyebrow: 'ChronoWalk',
    headlineLines: ['See what stood here.', 'Hear what happened.'],
    headline: 'See what stood here. Hear what happened.',
    support: 'Buy tonight. Open tomorrow from any stop.',
    definition: `${eterna.stopCount} stops · ${eterna.priceLabel} once`,
    primaryCta: 'Try the Pantheon stop free',
    secondaryCta: `See the complete Rome walk · ${eterna.priceLabel}`,
    reassurance: '',
  },
}

export const REBUILD_HERO_SUPPORT_EXP = Object.freeze({
  a: REBUILD_HERO.organic.support,
  b: REBUILD_HERO.organic.support,
})

export const REBUILD_PROMISE = {
  id: 'promise',
  headline: 'The ruin becomes the room.',
  body: '',
}

export const REBUILD_HEAR = {
  id: 'hear-rome',
  headline: 'Hear Rome.',
  body: '',
  transcript: '',
}

export const REBUILD_EXPERIENCE = {
  id: 'experience',
  thresholdHint: 'Drag the seam',
  tapAlternative: 'Or tap to reveal',
  playerLabel: 'Hear what happened here',
  teaserFile: 'w17_ch1.mp3',
  transcript:
    'You’re standing before the Pantheon. Look up at the porch—the columns, the pediment, the weight of the stone.',
  confidence: '',
}

export const REBUILD_THRESHOLD = {
  eyebrow: 'Then vs Now',
  headline: 'The ruin becomes the room.',
  explanation: '',
  instruction: 'Drag the seam',
  tapAlternative: 'Or tap to reveal',
  methodology: 'Where evidence is uncertain, ChronoWalk tells you.',
}

export const REBUILD_PROOF = {
  id: 'product-proof',
  headline: '',
  support: '',
  cards: [],
  tabs: [],
}

export const REBUILD_AUDIO = {
  id: 'audio-proof',
  headline: REBUILD_HEAR.headline,
  body: '',
  playerLabel: 'Hear what happened here',
  headphones: '',
  wantComplete: '',
  previewCta: 'Try the Pantheon free',
  previewNote: '',
  teaserFile: 'w17_ch1.mp3',
  transcript: REBUILD_EXPERIENCE.transcript,
}

export const REBUILD_ROME_DAY = {
  id: 'rome-day',
  headline: 'Rome becomes one continuous story.',
  subhead: 'Walk wherever your day takes you. ChronoWalk always knows where the story continues.',
  body: '',
  scenarios: [],
  highlights: [
    'colosseum',
    'forum-via-sacra',
    'palatine-hill-cluster',
    'pantheon',
    'fontana-di-trevi',
    'spanish-steps',
    'piazza-navona',
    'castel-sant-angelo',
    'appian-way',
  ],
  moments: [
    { id: 'start', icon: 'colosseum', label: 'Start at the Colosseum' },
    { id: 'lunch', icon: 'lunch', label: 'Lunch' },
    { id: 'museum', icon: 'museum', label: 'Visit another museum' },
    { id: 'coffee', icon: 'coffee', label: 'Coffee' },
    { id: 'pantheon', icon: 'pantheon', label: 'Continue at the Pantheon' },
    { id: 'night', icon: 'night', label: 'Finish later tonight' },
  ],
  resume:
    'ChronoWalk remembers exactly where you stopped. Continue whenever you want. Everything else is automatic.',
  appHeadline: 'Then it becomes real.',
  appBody: 'Buy the walk — GPS takes over. Satellite map, live distance, next turns.',
  gpsHeadline: 'Live on the street.',
  gpsCards: [
    {
      id: 'approach',
      title: 'GPS detects you’re arriving.',
      body: 'Distance updates. The door to the story opens.',
      shotTitle: 'Approaching Arch of Titus',
      shotMeta: '42 m · almost there',
      cta: "I'm here",
    },
    {
      id: 'threshold',
      title: 'You’re standing there.',
      body: 'Threshold appears. Press & hold. Reveal ancient Rome.',
      cta: 'Press & hold',
      nowSrc: '/landing/threshold/colosseum-now.jpg',
      thenSrc: '/landing/threshold/colosseum-then.jpg',
    },
    {
      id: 'story',
      title: 'Story unlocked.',
      body: 'Audio automatically ready. Continue walking.',
      shotTitle: 'Arch of Titus',
      shotMeta: 'Audio ready · Continue walking',
      shotSrc: '/landing/phone-screens/listen-pantheon.jpg',
    },
  ],
}

/** Photo-only atmosphere — street + archaeological texture. */
export const REBUILD_STREET = {
  id: 'street-beat',
  ariaLabel: 'Rome street and ruin atmosphere',
  headline: '',
  body: '',
}

export const REBUILD_JOURNEY = {
  id: 'flexible-journey',
  headline: REBUILD_ROME_DAY.headline,
  body: '',
}

export const REBUILD_PANTHEON = {
  id: 'pantheon-preview',
  label: 'Free',
  badge: 'Complete stop',
  headline: 'Try the Pantheon free',
  body: '',
  /** Soft mid-beat — still curiosity, not the purchase ask. */
  cta: 'Start free',
  reassurance: '',
}

export const REBUILD_SITUATIONS = {
  id: 'situations',
  headline: '',
  items: [],
  ticketNote: '',
}

export const REBUILD_PRICING = {
  id: 'pricing',
  headline: 'Choose your Rome walk.',
  subhead: '',
  eternaLabel: 'The complete Rome walk',
  eternaName: eterna.name,
  eternaBlurb: '',
  eternaBullets: [`All ${eterna.stopCount} stops`, 'Audio and Then vs Now'],
  eternaCta: `Unlock all ${eterna.stopCount} · ${eterna.priceLabel}`,
  valueCompare: `Only ${eternaUpgradeDeltaLabel()} more than a shorter route.`,
  checkoutNote: '',
  taxNote: TAX_NOTE,
  shortHeading: 'Shorter routes',
  shortRoutes: [
    {
      id: historica.id,
      name: historica.name,
      stops: historica.stopCount,
      price: historica.priceLabel,
      blurb: '',
      cta: `Choose ${historica.name}`,
      thumbStopId: 'fontana-di-trevi',
    },
    {
      id: antica.id,
      name: antica.name,
      stops: antica.stopCount,
      price: antica.priceLabel,
      blurb: '',
      cta: `Choose ${antica.name}`,
      thumbStopId: 'colosseum',
    },
  ],
  togetherHeading: 'Walking together?',
  togetherBody: '',
  togetherBenefits: ['Multiple seats', 'Own phone each', 'Shared progress'],
}

export const REBUILD_WALK_TOGETHER = {
  id: 'walk-together',
  eyebrow: 'Couple & Family',
  headline: 'Share the walk—not the earbuds.',
  body: '',
  steps: [],
  couple: {
    id: couple.id,
    label: `Couple · ${couple.seatLimit} · ${couple.priceLabel}`,
    seats: `${couple.seatLimit} people`,
    price: couple.priceLabel,
    detail: `${couple.seatLimit} · Full ${eterna.name}`,
  },
  family: {
    id: family.id,
    label: `Family · Up to ${family.seatLimit} · ${family.priceLabel}`,
    seats: `Up to ${family.seatLimit}`,
    price: family.priceLabel,
    detail: `Up to ${family.seatLimit} · Full ${eterna.name}`,
  },
  changes: ['Own phone each', 'Shared progress'],
  syncNote: 'Exact audio sync is not guaranteed.',
}

export const REBUILD_TRUST = {
  id: 'trust',
  headline: 'Built for walking Rome.',
  cards: [
    { title: 'Works in browser', body: '' },
    { title: 'Offline after download', body: '' },
    { title: 'One-time purchase', body: '' },
    { title: 'Secure checkout', body: '' },
    { title: 'Real historians', body: '' },
    { title: 'Saved progress', body: '' },
  ],
}

export const REBUILD_ADAPTIVE = {
  id: 'adaptive-walk',
  headline: REBUILD_ROME_DAY.headline,
  promise: '',
  steps: [],
  locationNote: '',
}

export const REBUILD_CURATED = {
  id: 'curated-certainty',
  headline: '',
  body: '',
  secondary: '',
}

export const REBUILD_ROUTE = {
  id: 'route-proof',
  headline: REBUILD_ROME_DAY.headline,
  subhead: '',
  stopsLabel: `${eterna.stopCount} stops`,
  expandLabel: `See all ${eterna.stopCount} stops`,
  collapseLabel: 'Hide list',
  story: [],
  behaviors: [],
  featuredLabels: {},
}

export const REBUILD_DIFFERENCE = {
  id: 'difference',
  headline: 'Why ChronoWalk feels different',
  rows: [
    { typical: 'Describes a monument', chronowalk: 'Ties the story to what is in front of you' },
    { typical: 'Past or present only', chronowalk: 'Then and Now from the same viewpoint' },
    { typical: 'Separate routes', chronowalk: 'Shared progress on each phone' },
    { typical: 'App install', chronowalk: 'Opens in the browser' },
  ],
}

export const REBUILD_FAQ = {
  id: 'faq',
  headline: 'Before you walk',
  items: [
    {
      q: 'What is ChronoWalk?',
      a: 'A self-guided Rome audio walk in your browser.',
    },
    {
      q: 'Do I need an app?',
      a: 'No. It opens in your mobile browser.',
    },
    {
      q: 'Does it work offline?',
      a: 'Prepare on Wi‑Fi, then walk offline.',
    },
    {
      q: 'Can I start at any stop?',
      a: 'Yes.',
    },
    {
      q: 'Can I pause and return?',
      a: 'Yes. Your place stays saved.',
    },
    {
      q: 'Do I need entrance tickets?',
      a: 'No ticket is required to begin.',
    },
    {
      q: `What’s in ${eterna.name}?`,
      a: `All ${eterna.stopCount} stops, Then vs Now, and offline prep.`,
    },
    {
      q: 'Couple & Family?',
      a: 'Buy seats. Each person joins on their own phone.',
    },
  ],
  legalLinks: [
    { href: '/legal/refund', label: 'Refunds' },
    { href: '/legal/privacy', label: 'Privacy' },
    { href: '/legal/terms', label: 'Terms' },
    { href: '/contact', label: 'Support' },
  ],
}

export const REBUILD_FINAL = {
  id: 'final-cta',
  headline: 'Rome is already around you.',
  support: 'Open it on the street. Keep it forever.',
  /** Act III — urgency (loudest). */
  primaryCta: `Unlock all ${eterna.stopCount} stops · ${eterna.priceLabel}`,
  secondaryCta: 'Or try the Pantheon free',
  reassurance: '',
}

export const REBUILD_PROPOSITIONS = {
  guide: {
    primary: REBUILD_ROME_DAY.headline,
    support: '',
  },
  past: {
    primary: 'See what is here. Reveal what was here.',
    support: '',
    brand: 'The ruin becomes the room.',
  },
  story: {
    primary: 'Hear what happened here.',
    support: '',
  },
  work: {
    primary: REBUILD_ROME_DAY.headline,
    support: '',
  },
}

export { CHECKOUT_REASSURANCE, TAX_NOTE }
