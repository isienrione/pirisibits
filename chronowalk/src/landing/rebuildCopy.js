/**
 * Landing v4 — product-first editorial copy. Prefer demonstration over explanation.
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
    support: 'Rome, unlocked from where you stand.',
    definition: `${eterna.stopCount} stops · ${eterna.priceLabel} once`,
    primaryCta: `Unlock all ${eterna.stopCount} stops · ${eterna.priceLabel}`,
    secondaryCta: 'Try the Pantheon stop free',
    reassurance: '',
  },
  geo: {
    eyebrow: 'ChronoWalk',
    headlineLines: ['Standing in front of history?', 'See what was here.'],
    headline: 'Standing in front of history? See what was here.',
    support: 'Reveal Then and Now. Hear the place.',
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
    primaryCta: `Unlock all ${eterna.stopCount} stops · ${eterna.priceLabel}`,
    secondaryCta: 'Try the Pantheon stop free',
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
  body: 'Fragments turn into a place you can finally feel.',
}

export const REBUILD_HEAR = {
  id: 'hear-rome',
  headline: 'Hear Rome.',
  body: 'Narration tied to what is in front of you.',
  transcript:
    'You’re standing before the Pantheon. Look up at the porch—the columns, the pediment, the weight of the stone.',
}

export const REBUILD_EXPERIENCE = {
  id: 'experience',
  thresholdHint: 'Drag the seam',
  tapAlternative: 'Or tap to reveal',
  playerLabel: 'Hear what happened here',
  teaserFile: 'w17_ch1.mp3',
  transcript: REBUILD_HEAR.transcript,
  confidence: 'Where evidence is uncertain, ChronoWalk tells you.',
}

export const REBUILD_THRESHOLD = {
  eyebrow: 'Then vs Now',
  headline: 'The ruin becomes the room.',
  explanation: 'Drag the seam to compare Then and Now.',
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
  body: REBUILD_HEAR.body,
  playerLabel: 'Hear what happened here',
  headphones: '',
  wantComplete: '',
  previewCta: 'Try the Pantheon free',
  previewNote: '',
  teaserFile: 'w17_ch1.mp3',
  transcript: REBUILD_HEAR.transcript,
}

export const REBUILD_ROME_DAY = {
  id: 'rome-day',
  headline: 'Rome becomes one continuous story.',
  body: 'Begin anywhere. Wander freely. ChronoWalk always knows where to continue.',
  scenarios: [
    'Start at the Colosseum',
    'Pause for lunch',
    'Return later',
  ],
  highlights: [
    'colosseum',
    'forum-via-sacra',
    'palatine-hill-cluster',
    'capitoline-hill',
    'pantheon',
    'piazza-navona',
    'fontana-di-trevi',
    'spanish-steps',
    'circus-maximus',
    'appian-way',
  ],
}

export const REBUILD_JOURNEY = {
  id: 'flexible-journey',
  headline: REBUILD_ROME_DAY.headline,
  body: REBUILD_ROME_DAY.body,
}

export const REBUILD_PANTHEON = {
  id: 'pantheon-preview',
  label: 'Free',
  badge: 'Complete stop',
  headline: 'Try the Pantheon free',
  body: 'No purchase required.',
  cta: 'Start free',
  reassurance: 'No purchase required',
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
  subhead: 'One-time. No subscription.',
  eternaLabel: 'The complete Rome walk',
  eternaName: eterna.name,
  eternaBlurb: 'Colosseum to Pantheon to Appian Way.',
  eternaBullets: [
    `All ${eterna.stopCount} stops`,
    'Audio and Then vs Now',
    'Start at any stop',
  ],
  eternaCta: `Unlock all ${eterna.stopCount} · ${eterna.priceLabel}`,
  valueCompare: `Only ${eternaUpgradeDeltaLabel()} more than a shorter route.`,
  checkoutNote: 'Paddle checkout · Access by email',
  taxNote: TAX_NOTE,
  shortHeading: 'Shorter routes',
  shortRoutes: [
    {
      id: historica.id,
      name: historica.name,
      stops: historica.stopCount,
      price: historica.priceLabel,
      blurb: 'Centro around the Pantheon.',
      cta: `Choose ${historica.name}`,
      thumbStopId: 'fontana-di-trevi',
    },
    {
      id: antica.id,
      name: antica.name,
      stops: antica.stopCount,
      price: antica.priceLabel,
      blurb: 'Colosseum, Forum, Capitoline.',
      cta: `Choose ${antica.name}`,
      thumbStopId: 'colosseum',
    },
  ],
  togetherHeading: 'Walking together?',
  togetherBody: 'Everyone joins from their own phone.',
  togetherBenefits: ['Multiple seats', 'Own phone each', 'Shared progress'],
}

export const REBUILD_WALK_TOGETHER = {
  id: 'walk-together',
  eyebrow: 'Couple & Family',
  headline: 'Share the walk—not the earbuds.',
  body: 'One purchase. Everyone on their own phone.',
  steps: [],
  couple: {
    id: couple.id,
    label: `Couple · ${couple.seatLimit} · ${couple.priceLabel}`,
    seats: `${couple.seatLimit} people`,
    price: couple.priceLabel,
    detail: `${couple.seatLimit} people · Full ${eterna.name}`,
  },
  family: {
    id: family.id,
    label: `Family · Up to ${family.seatLimit} · ${family.priceLabel}`,
    seats: `Up to ${family.seatLimit}`,
    price: family.priceLabel,
    detail: `Up to ${family.seatLimit} · Full ${eterna.name}`,
  },
  changes: ['Multiple seats', 'Own phone each', 'Shared progress'],
  syncNote: 'Shared progress stays connected. Exact audio sync is not guaranteed.',
}

export const REBUILD_TRUST = {
  id: 'trust',
  headline: 'Built for walking Rome.',
  cards: [
    { title: 'Works in browser', body: 'No app install.' },
    { title: 'Offline after download', body: 'Prepare on Wi‑Fi, then walk.' },
    { title: 'One-time purchase', body: 'No subscription.' },
    { title: 'Secure checkout', body: 'Paddle.' },
    { title: 'Real historians', body: 'Evidence-based reconstructions.' },
    { title: 'Saved progress', body: 'Pause and return anytime.' },
  ],
}

export const REBUILD_ADAPTIVE = {
  id: 'adaptive-walk',
  headline: REBUILD_ROME_DAY.headline,
  promise: REBUILD_ROME_DAY.body,
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
  subhead: REBUILD_ROME_DAY.body,
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
      a: 'A self-guided Rome audio walk in your browser—place-tied narration, Then vs Now, and saved progress.',
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
      a: 'Yes. Begin anywhere on the route.',
    },
    {
      q: 'Can I pause and return?',
      a: 'Yes. Your place stays saved on your device.',
    },
    {
      q: 'Do I need entrance tickets?',
      a: 'No ticket is required to begin. Many stories unfold outdoors.',
    },
    {
      q: `What’s in ${eterna.name}?`,
      a: `All ${eterna.stopCount} stops, Then vs Now where available, and offline prep.`,
    },
    {
      q: 'Couple & Family?',
      a: 'Buy seats. Each person joins by invitation link on their own phone.',
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
  support: 'See what stood here. Hear what happened.',
  primaryCta: `Unlock all ${eterna.stopCount} stops · ${eterna.priceLabel}`,
  secondaryCta: 'Try the Pantheon stop free',
  reassurance: '',
}

export const REBUILD_PROPOSITIONS = {
  guide: {
    primary: REBUILD_ROME_DAY.headline,
    support: REBUILD_ROME_DAY.body,
  },
  past: {
    primary: 'See what is here. Reveal what was here.',
    support: REBUILD_THRESHOLD.explanation,
    brand: 'The ruin becomes the room.',
  },
  story: {
    primary: 'Hear what happened here.',
    support: '',
  },
  work: {
    primary: REBUILD_ROME_DAY.headline,
    support: REBUILD_ROME_DAY.body,
  },
}

export { CHECKOUT_REASSURANCE, TAX_NOTE }
