/**
 * Compact six-block landing copy — clarity-first, product-led.
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

export const REBUILD_TRUST_STRIP =
  'Opens in your browser · Works offline after preparation · No subscription'

export const REBUILD_HERO = {
  organic: {
    eyebrow: 'Self-guided audio walk of Rome',
    headlineLines: ['See what stood here.', 'Hear what happened.', 'Keep walking.'],
    headline: 'See what stood here. Hear what happened. Keep walking.',
    support:
      'ChronoWalk brings Rome’s landmarks to life with place-tied audio, Then vs Now reconstructions and a route you can follow flexibly.',
    definition: `${eterna.stopCount} stops · Opens in your browser · ${eterna.priceLabel} once`,
    primaryCta: `Unlock all ${eterna.stopCount} stops · ${eterna.priceLabel}`,
    secondaryCta: 'Try the complete Pantheon stop free',
    reassurance: '',
    thresholdHint: 'Press and hold to reveal Then vs Now',
  },
  geo: {
    eyebrow: 'Self-guided audio walk of Rome',
    headlineLines: ['Standing in front of history?', 'See what was here.'],
    headline: 'Standing in front of history? See what was here.',
    support:
      'Find the story tied to the place around you, reveal Then and Now, and continue from whichever stop suits your day.',
    definition: `${eterna.stopCount} stops · Opens in your browser · ${eterna.priceLabel} once`,
    primaryCta: 'Try the Pantheon stop free',
    secondaryCta: `See the complete Rome walk · ${eterna.priceLabel}`,
    reassurance: 'One complete free chapter · No purchase required',
    thresholdHint: 'Press and hold to reveal Then vs Now',
  },
  qr: {
    eyebrow: 'Self-guided audio walk of Rome',
    headlineLines: ['See what stood here.', 'Hear what happened.', 'Keep walking.'],
    headline: 'See what stood here. Hear what happened. Keep walking.',
    support: 'Buy tonight. Open it tomorrow from any included stop.',
    definition: `${eterna.stopCount} stops · Opens in your browser · ${eterna.priceLabel} once`,
    primaryCta: `Unlock all ${eterna.stopCount} stops · ${eterna.priceLabel}`,
    secondaryCta: 'Try the complete Pantheon stop free',
    reassurance: '',
    thresholdHint: 'Press and hold to reveal Then vs Now',
  },
}

/** Support-line experiment variants (H1 stays clarity-first). */
export const REBUILD_HERO_SUPPORT_EXP = Object.freeze({
  a: REBUILD_HERO.organic.support,
  b: 'Start anywhere on the route, reveal Then vs Now, and keep your place when Rome interrupts your plans.',
})

export const REBUILD_THRESHOLD = {
  eyebrow: 'Then vs Now',
  headline: 'The ruin becomes the room.',
  explanation:
    'Press and hold to compare what survives with an evidence-based reconstruction from the same viewpoint.',
  instruction: 'Press and hold to reveal ancient Rome',
  tapAlternative: 'Or tap to reveal',
  methodology: 'Where the evidence is uncertain, ChronoWalk tells you.',
}

export const REBUILD_PROOF = {
  id: 'product-proof',
  headline: 'Everything follows where you are.',
  support: 'Reveal the past, hear the story and continue without losing your place.',
  tabs: [
    {
      id: 'reveal',
      label: 'Reveal the past',
      title: 'The ruin becomes the room.',
      body: 'Press and hold to compare what survives with an evidence-based reconstruction from the same viewpoint.',
      methodology: 'Where the evidence is uncertain, ChronoWalk tells you.',
    },
    {
      id: 'hear',
      label: 'Hear the story',
      title: 'Notice what others walk past.',
      body: 'Each chapter points to the doorway, inscription, column or empty space in front of you.',
      playerLabel: 'Pantheon opening',
      teaserFile: 'w17_ch1.mp3',
      transcript:
        'You’re standing before the Pantheon. Look up at the porch—the columns, the pediment, the weight of the stone. The story begins with what you can still see.',
    },
    {
      id: 'place',
      label: 'Keep your place',
      title: 'Pause for lunch, change direction or return later.',
      body: 'ChronoWalk remembers your completed stops and helps you see what comes next.',
    },
  ],
}

export const REBUILD_AUDIO = {
  id: 'audio-proof',
  headline: 'Hear what happened here.',
  body: 'Each chapter is written for the place around you—pointing out the details that turn a monument into a human story.',
  playerLabel: 'Hear a short excerpt',
  headphones: 'Headphones recommended.',
  wantComplete: 'Want the complete experience?',
  previewCta: 'Try the complete Pantheon stop free',
  previewNote: `One complete chapter, ${LANDING_PRODUCT.previewLabel}. No purchase required.`,
  teaserFile: 'w17_ch1.mp3',
  transcript:
    'You’re standing before the Pantheon. Look up at the porch—the columns, the pediment, the weight of the stone. The story begins with what you can still see.',
}

export const REBUILD_PANTHEON = {
  id: 'pantheon-preview',
  label: 'Free complete stop',
  headline: 'Experience the Pantheon before you buy',
  body: `A complete four-minute chapter with place-tied audio and Then vs Now.`,
  cta: 'Start the free Pantheon stop',
  reassurance: 'No purchase required',
}

export const REBUILD_SITUATIONS = {
  id: 'situations',
  headline: 'What kind of Rome day are you having?',
  items: [
    { id: 'at-monument', title: 'Already in Rome', support: '', action: 'preview' },
    { id: 'planning', title: 'Planning tomorrow', support: '', action: 'pricing' },
    { id: 'no-tickets', title: 'No entrance tickets', support: '', action: 'route' },
    { id: 'with-people', title: 'Walking together', support: '', action: 'walk-together' },
  ],
  ticketNote:
    'No entrance ticket is required to begin the walk. Many ChronoWalk stories unfold in Rome’s streets and public spaces.',
}

export const REBUILD_PRICING = {
  id: 'pricing',
  headline: 'Choose your Rome walk.',
  subhead: 'One-time access. No subscription.',
  eternaLabel: 'The complete Rome walk',
  eternaName: eterna.name,
  eternaBlurb: 'From the Colosseum to the Pantheon and Appian Way.',
  eternaBullets: [
    'All Roma Historica and Roma Antica stops',
    'Audio and available Then vs Now reconstructions',
    'Start at any included stop',
    'Prepare for offline walking and keep your progress',
  ],
  eternaCta: `Unlock all ${eterna.stopCount} stops · ${eterna.priceLabel}`,
  valueCompare: `The complete walk costs only ${eternaUpgradeDeltaLabel()} more than one shorter route.`,
  checkoutNote: 'Secure checkout by Paddle · Access delivered by email',
  taxNote: TAX_NOTE,
  shortHeading: 'Only exploring one part of Rome?',
  shortRoutes: [
    {
      id: historica.id,
      name: historica.name,
      stops: historica.stopCount,
      price: historica.priceLabel,
      blurb: 'Centro afternoon around the Pantheon — streets and public spaces.',
      cta: `Choose ${historica.name}`,
      thumbStopId: 'pantheon',
    },
    {
      id: antica.id,
      name: antica.name,
      stops: antica.stopCount,
      price: antica.priceLabel,
      blurb: 'Ancient core — Colosseum, Forum, Capitoline, and related stops.',
      cta: `Choose ${antica.name}`,
      thumbStopId: 'colosseum',
    },
  ],
  togetherHeading: 'Walking together?',
  togetherBody: 'Everyone joins from their own phone using an invitation link.',
  togetherBenefits: [
    'One purchase, multiple seats',
    'Each person uses their own phone',
    'Shared walk progress',
  ],
}

export const REBUILD_WALK_TOGETHER = {
  id: 'walk-together',
  eyebrow: 'Couple & Family passes',
  headline: 'Share the walk—not the earbuds.',
  body: 'Give everyone the complete Rome walk on their own phone and follow the shared tour progress together.',
  steps: [
    'Choose a Couple or Family pass.',
    'Send each person their invitation link.',
    'They claim their seat and join the shared walk.',
  ],
  couple: {
    id: couple.id,
    label: `Couple · ${couple.seatLimit} people · ${couple.priceLabel}`,
    seats: `${couple.seatLimit} people`,
    price: couple.priceLabel,
    detail: `${couple.seatLimit} people · Full ${eterna.name}`,
  },
  family: {
    id: family.id,
    label: `Family · Up to ${family.seatLimit} people · ${family.priceLabel}`,
    seats: `Up to ${family.seatLimit} people`,
    price: family.priceLabel,
    detail: `Up to ${family.seatLimit} people · Full ${eterna.name}`,
  },
  changes: [
    'Multiple seats on one purchase',
    'Each person uses their own phone',
    'Invitation links to claim a seat',
    'Shared walk progress across the group',
  ],
  syncNote:
    'Shared walks keep tour progress connected. Exact word-for-word audio sync across phones is not guaranteed in every browser.',
}

export const REBUILD_ADAPTIVE = {
  id: 'adaptive-walk',
  headline: 'A Rome guide that moves with you.',
  promise: 'Start anywhere. Wander freely. Never lose your place.',
  steps: [],
  locationNote:
    'With your permission, ChronoWalk uses your location to show what’s nearby and help you continue.',
}

export const REBUILD_CURATED = {
  id: 'curated-certainty',
  headline: 'The certainty of a planned tour. The freedom of walking alone.',
  body: 'ChronoWalk brings together the essential places, the route between them and the story that connects them.',
  secondary: 'Rome is already planned. Your day doesn’t have to be.',
}

export const REBUILD_ROUTE = {
  id: 'route-proof',
  headline: 'A planned route that never traps you.',
  subhead: 'Follow the suggested journey, begin with another nearby stop or pause and return later.',
  stopsLabel: `${eterna.stopCount} stops included`,
  expandLabel: 'See all 21 stops',
  collapseLabel: 'Hide stop list',
  behaviors: [
    'Start anywhere',
    'Pause when Rome distracts you',
    'Continue where you left off',
  ],
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
      a: 'A self-guided audio walk of Rome that opens in your browser—place-tied narration, Then vs Now reconstructions, and a flexible route that remembers your progress.',
    },
    {
      q: 'Do I need to install an app?',
      a: 'No App Store install is required. ChronoWalk opens in your mobile browser and can be added to your home screen.',
    },
    {
      q: 'Can I use it offline?',
      a: 'Opening and downloading need a connection. After you prepare the tour, downloaded content can be used while you walk offline.',
    },
    {
      q: 'Can I start at any stop?',
      a: 'Yes. Begin with whichever included stop suits your day, then continue in a suggested order or choose another nearby stop.',
    },
    {
      q: 'Can I pause and continue later?',
      a: 'Yes. Completed stops and your place in the journey are saved on your device so you can return later.',
    },
    {
      q: 'Do I need entrance tickets?',
      a: 'No entrance ticket is required to begin. Many stories unfold in streets and public spaces. Some landmarks may have separate ticketed interiors.',
    },
    {
      q: `What is included in ${eterna.name}?`,
      a: `All ${eterna.stopCount} stops on the complete Rome walk, Then vs Now where available, narration and reading mode, and the ability to prepare content for offline walking.`,
    },
    {
      q: 'How do Couple and Family passes work?',
      a: 'You purchase seats for the complete Rome walk. Each person claims a seat with an invitation link and follows shared tour progress on their own phone.',
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
  support: 'See what stood here, hear what happened and continue at your own pace.',
  primaryCta: `Unlock all ${eterna.stopCount} stops · ${eterna.priceLabel}`,
  secondaryCta: 'Try the Pantheon stop free',
  reassurance: 'Opens in your browser · One-time purchase · Prepare before walking',
}

export const REBUILD_PROPOSITIONS = {
  guide: {
    primary: 'Start anywhere. Wander freely. Never lose your place.',
    support:
      'With your permission, ChronoWalk uses your location to show what’s nearby and help you continue.',
  },
  past: {
    primary: 'See what is here. Reveal what was here.',
    support: REBUILD_THRESHOLD.explanation,
    brand: 'The ruin becomes the room.',
  },
  story: {
    primary: 'Hear what happened here. Notice what others walk past.',
    support: REBUILD_PROOF.tabs[1].body,
  },
  work: {
    primary: 'The certainty of a planned tour. The freedom of walking alone.',
    support: REBUILD_ROUTE.subhead,
  },
}

export { CHECKOUT_REASSURANCE, TAX_NOTE }
