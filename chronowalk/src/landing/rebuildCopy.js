/**
 * Compact landing copy — CRO-trimmed, product-led.
 * Product counts/prices come from landingProduct.js at render time.
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

export const REBUILD_TRUST_STRIP = 'Opens in your browser · Offline after prep · No subscription'

export const REBUILD_HERO = {
  organic: {
    eyebrow: 'Self-guided audio walk of Rome',
    headlineLines: ['See what stood here.', 'Hear what happened.', 'Keep walking.'],
    headline: 'See what stood here. Hear what happened. Keep walking.',
    support: 'Place-tied audio, Then vs Now reconstructions, and a flexible Rome route.',
    definition: `${eterna.stopCount} stops · ${eterna.priceLabel} once`,
    primaryCta: `Unlock all ${eterna.stopCount} stops · ${eterna.priceLabel}`,
    secondaryCta: 'Try the Pantheon stop free',
    reassurance: '',
    thresholdHint: 'Press and hold to reveal Then vs Now',
  },
  geo: {
    eyebrow: 'Self-guided audio walk of Rome',
    headlineLines: ['Standing in front of history?', 'See what was here.'],
    headline: 'Standing in front of history? See what was here.',
    support: 'Reveal Then and Now, hear the place, continue from any stop.',
    definition: `${eterna.stopCount} stops · ${eterna.priceLabel} once`,
    primaryCta: 'Try the Pantheon stop free',
    secondaryCta: `See the complete Rome walk · ${eterna.priceLabel}`,
    reassurance: 'Free chapter · No purchase required',
    thresholdHint: 'Press and hold to reveal Then vs Now',
  },
  qr: {
    eyebrow: 'Self-guided audio walk of Rome',
    headlineLines: ['See what stood here.', 'Hear what happened.', 'Keep walking.'],
    headline: 'See what stood here. Hear what happened. Keep walking.',
    support: 'Buy tonight. Open tomorrow from any included stop.',
    definition: `${eterna.stopCount} stops · ${eterna.priceLabel} once`,
    primaryCta: `Unlock all ${eterna.stopCount} stops · ${eterna.priceLabel}`,
    secondaryCta: 'Try the Pantheon stop free',
    reassurance: '',
    thresholdHint: 'Press and hold to reveal Then vs Now',
  },
}

/** Support-line experiment variants (H1 stays clarity-first). */
export const REBUILD_HERO_SUPPORT_EXP = Object.freeze({
  a: REBUILD_HERO.organic.support,
  b: REBUILD_HERO.organic.support,
})

export const REBUILD_PROMISE = {
  id: 'promise',
  headline: 'The ruin becomes the room.',
  body: 'Then vs Now turns fragments into a place you can finally understand.',
}

export const REBUILD_THRESHOLD = {
  eyebrow: 'Then vs Now',
  headline: 'The ruin becomes the room.',
  explanation: 'Press and hold to compare Then and Now from the same viewpoint.',
  instruction: 'Press and hold to reveal ancient Rome',
  tapAlternative: 'Or tap to reveal',
  methodology: 'Where evidence is uncertain, ChronoWalk tells you.',
}

export const REBUILD_PROOF = {
  id: 'product-proof',
  headline: 'Everything follows where you are.',
  support: '',
  cards: [
    {
      id: 'reveal',
      title: 'Reveal Ancient Rome',
      body: 'Press and hold to compare Then and Now.',
      methodology: 'Where evidence is uncertain, ChronoWalk tells you.',
    },
    {
      id: 'hear',
      title: 'Hear the story',
      body: 'Each chapter points to what is in front of you.',
      playerLabel: 'Real audio · Pantheon opening',
      teaserFile: 'w17_ch1.mp3',
      transcript:
        'You’re standing before the Pantheon. Look up at the porch—the columns, the pediment, the weight of the stone.',
    },
    {
      id: 'place',
      title: 'Keep walking',
      body: 'Pause anytime. Your place stays saved.',
    },
  ],
  /** @deprecated kept for architecture tests / propositions */
  tabs: [
    {
      id: 'reveal',
      label: 'Reveal the past',
      title: 'Reveal Ancient Rome',
      body: 'Press and hold to compare Then and Now.',
      methodology: 'Where evidence is uncertain, ChronoWalk tells you.',
    },
    {
      id: 'hear',
      label: 'Hear the story',
      title: 'Hear the story',
      body: 'Each chapter points to what is in front of you.',
      playerLabel: 'Real audio · Pantheon opening',
      teaserFile: 'w17_ch1.mp3',
      transcript:
        'You’re standing before the Pantheon. Look up at the porch—the columns, the pediment, the weight of the stone.',
    },
    {
      id: 'place',
      label: 'Keep your place',
      title: 'Keep walking',
      body: 'Pause anytime. Your place stays saved.',
    },
  ],
}

export const REBUILD_AUDIO = {
  id: 'audio-proof',
  headline: 'Hear what happened here.',
  body: 'Each chapter points to what is in front of you.',
  playerLabel: 'Real audio · Pantheon opening',
  headphones: 'Headphones recommended.',
  wantComplete: 'Want the complete experience?',
  previewCta: 'Try the Pantheon stop free',
  previewNote: `One complete chapter. No purchase required.`,
  teaserFile: 'w17_ch1.mp3',
  transcript:
    'You’re standing before the Pantheon. Look up at the porch—the columns, the pediment, the weight of the stone.',
}

export const REBUILD_PANTHEON = {
  id: 'pantheon-preview',
  label: 'Free',
  badge: 'Complete stop',
  headline: 'Try the Pantheon free',
  body: '',
  cta: 'Start the free Pantheon stop',
  reassurance: 'No purchase required',
}

export const REBUILD_SITUATIONS = {
  id: 'situations',
  headline: 'What kind of Rome day are you having?',
  items: [],
  ticketNote: '',
}

export const REBUILD_PRICING = {
  id: 'pricing',
  headline: 'Choose your Rome walk.',
  subhead: 'One-time access. No subscription.',
  eternaLabel: 'The complete Rome walk',
  eternaName: eterna.name,
  eternaBlurb: 'Colosseum to Pantheon to Appian Way.',
  eternaBullets: [
    `All ${eterna.stopCount} stops`,
    'Audio and Then vs Now',
    'Start at any stop',
    'Prepare offline · keep progress',
  ],
  eternaCta: `Unlock all ${eterna.stopCount} stops · ${eterna.priceLabel}`,
  valueCompare: `Only ${eternaUpgradeDeltaLabel()} more than one shorter route.`,
  checkoutNote: 'Secure checkout by Paddle · Access by email',
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
      thumbStopId: 'pantheon',
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
  togetherBenefits: [
    'One purchase, multiple seats',
    'Own phone each',
    'Shared walk progress',
  ],
}

export const REBUILD_WALK_TOGETHER = {
  id: 'walk-together',
  eyebrow: 'Couple & Family',
  headline: 'Share the walk—not the earbuds.',
  body: 'Everyone gets the complete Rome walk on their own phone.',
  steps: [
    'Choose Couple or Family.',
    'Send invitation links.',
    'Each person claims a seat.',
  ],
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
    seats: `Up to ${family.seatLimit} people`,
    price: family.priceLabel,
    detail: `Up to ${family.seatLimit} people · Full ${eterna.name}`,
  },
  changes: [
    'Multiple seats on one purchase',
    'Each person uses their own phone',
    'Shared walk progress',
  ],
  syncNote:
    'Shared tour progress stays connected. Exact word-for-word audio sync is not guaranteed in every browser.',
}

export const REBUILD_ADAPTIVE = {
  id: 'adaptive-walk',
  headline: 'A Rome guide that moves with you.',
  promise: 'Start anywhere. Pause anytime. Never lose your place.',
  steps: [],
  locationNote: '',
}

export const REBUILD_CURATED = {
  id: 'curated-certainty',
  headline: 'The certainty of a planned tour. The freedom of walking alone.',
  body: 'Essential places, the route between them, and the story that connects them.',
  secondary: 'Rome is already planned. Your day doesn’t have to be.',
}

export const REBUILD_ROUTE = {
  id: 'route-proof',
  headline: 'Never lose your place.',
  subhead: 'Rome can interrupt your day. ChronoWalk remembers.',
  stopsLabel: `${eterna.stopCount} stops included`,
  expandLabel: 'See all 21 stops',
  collapseLabel: 'Hide stop list',
  story: [
    { id: 'start', label: 'Start', detail: 'Any included stop' },
    { id: 'lunch', label: 'Lunch', detail: 'Pause freely' },
    { id: 'shopping', label: 'Wander', detail: 'Change direction' },
    { id: 'resume', label: 'Resume', detail: 'Pick up mid-route' },
    { id: 'finish', label: 'Finish', detail: 'When you’re ready' },
  ],
  behaviors: ['Start anywhere', 'Pause when Rome distracts you', 'Continue where you left off'],
  featuredLabels: {
    colosseum: 'Arena',
    'forum-via-sacra': 'Forum',
    'capitoline-hill': 'Capitoline',
    pantheon: 'Living city',
    'appian-way': 'Appian Way',
  },
}

export const REBUILD_DIFFERENCE = {
  id: 'difference',
  headline: 'Why ChronoWalk feels different',
  rows: [
    {
      typical: 'Describes a monument',
      chronowalk: 'Ties the story to what is in front of you',
    },
    {
      typical: 'Shows either the past or the present',
      chronowalk: 'Lets you compare Then and Now from the same viewpoint',
    },
    {
      typical: 'Everyone manages their own route',
      chronowalk: 'Groups can follow shared tour progress on their own phones',
    },
    {
      typical: 'May require an app installation',
      chronowalk: 'Opens directly in the browser',
    },
  ],
}

export const REBUILD_FAQ = {
  id: 'faq',
  headline: 'Questions before you walk',
  items: [
    {
      q: 'What exactly is ChronoWalk?',
      a: 'A self-guided Rome audio walk in your browser—place-tied narration, Then vs Now, and a flexible route that remembers progress.',
    },
    {
      q: 'Do I need to install an app?',
      a: 'No. It opens in your mobile browser and can be added to your home screen.',
    },
    {
      q: 'Can I use it offline?',
      a: 'Download needs a connection. After you prepare the tour, you can walk offline.',
    },
    {
      q: 'Can I start at any stop?',
      a: 'Yes. Begin with any included stop, then continue or choose another nearby.',
    },
    {
      q: 'Can I pause and continue later?',
      a: 'Yes. Completed stops and your place stay saved on your device.',
    },
    {
      q: 'Do I need entrance tickets?',
      a: 'No ticket is required to begin. Many stories unfold in streets and public spaces.',
    },
    {
      q: `What is included in ${eterna.name}?`,
      a: `All ${eterna.stopCount} stops, Then vs Now where available, narration, and offline preparation.`,
    },
    {
      q: 'How do Couple and Family passes work?',
      a: 'Buy seats for the complete walk. Each person claims a seat by invitation link on their own phone.',
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
  support: 'See what stood here. Hear what happened. Continue at your pace.',
  primaryCta: `Unlock all ${eterna.stopCount} stops · ${eterna.priceLabel}`,
  secondaryCta: 'Try the Pantheon stop free',
  reassurance: 'Opens in your browser · One-time purchase · Prepare before walking',
}

export const REBUILD_PROPOSITIONS = {
  guide: {
    primary: 'Start anywhere. Wander freely. Never lose your place.',
    support: 'Pause, change direction, or return later—your progress stays saved.',
  },
  past: {
    primary: 'See what is here. Reveal what was here.',
    support: REBUILD_THRESHOLD.explanation,
    brand: 'The ruin becomes the room.',
  },
  story: {
    primary: 'Hear what happened here.',
    support: REBUILD_PROOF.cards[1].body,
  },
  work: {
    primary: 'A planned route that never traps you.',
    support: REBUILD_ROUTE.subhead,
  },
}

export { CHECKOUT_REASSURANCE, TAX_NOTE }
