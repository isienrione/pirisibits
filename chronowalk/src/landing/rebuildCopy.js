/**
 * Rebuild landing copy — clarity-first, product-led.
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

export const REBUILD_TRUST_STRIP = [
  'Opens in your browser',
  'Download before walking',
  'No subscription',
]

export const REBUILD_HERO = {
  organic: {
    eyebrow: 'A self-guided audio walk of Rome',
    headline: 'See what stood here. Hear what happened. Keep walking.',
    support: 'ChronoWalk shows what’s nearby, brings each place to life and remembers where you left off.',
    definition: `${eterna.stopCount} Rome landmarks · Audio and Then vs Now reconstructions · Opens in your browser`,
    primaryCta: `Unlock all ${eterna.stopCount} stops · ${eterna.priceLabel}`,
    secondaryCta: 'Try the complete Pantheon stop free',
    reassurance: 'One-time purchase · Download before walking · Start at any stop',
  },
  geo: {
    eyebrow: 'Your Rome guide, right where you are',
    headline: 'Standing in front of history? See what was here.',
    support:
      'Find the story tied to the place around you, reveal Then and Now, and continue from whichever stop suits your day.',
    definition: `${eterna.stopCount} Rome landmarks · Audio and Then vs Now · Opens in your browser`,
    primaryCta: 'Try the Pantheon stop free',
    secondaryCta: `See the complete Rome walk · ${eterna.priceLabel}`,
    reassurance: 'One complete free chapter · No purchase required',
  },
  qr: {
    eyebrow: 'A self-guided audio walk of Rome',
    headline: 'See what stood here. Hear what happened. Keep walking.',
    support: 'Buy tonight. Open it tomorrow from any included stop.',
    definition: `${eterna.stopCount} Rome landmarks · Audio and Then vs Now reconstructions · Opens in your browser`,
    primaryCta: `Unlock the complete Rome walk · ${eterna.priceLabel}`,
    secondaryCta: 'Try the Pantheon stop free',
    reassurance: 'One-time purchase · Download before walking · Start at any stop',
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
    'Press and hold to compare what survives today with an evidence-based reconstruction from the same viewpoint.',
  instruction: 'Press and hold to reveal ancient Rome',
  tapAlternative: 'Tap to reveal',
  methodology: 'Evidence-based reconstruction. Where the evidence is uncertain, ChronoWalk tells you.',
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
  /** Prefer a short Pantheon opening beat already used for preview handoff. */
  teaserFile: 'w17_ch1.mp3',
  transcript:
    'You’re standing before the Pantheon. Look up at the porch—the columns, the pediment, the weight of the stone. The story begins with what you can still see.',
}

export const REBUILD_SITUATIONS = {
  id: 'situations',
  headline: 'What kind of Rome day are you having?',
  items: [
    {
      id: 'at-monument',
      title: 'I’m already at a monument',
      support: 'Start with a free stop now',
      action: 'preview',
    },
    {
      id: 'planning',
      title: 'I’m planning tomorrow',
      support: `See the complete ${eterna.stopCount}-stop walk`,
      action: 'pricing',
    },
    {
      id: 'no-tickets',
      title: 'I couldn’t get entrance tickets',
      support: 'Discover the stories Rome still reveals outside',
      action: 'adaptive',
    },
    {
      id: 'with-people',
      title: 'I’m walking with other people',
      support: 'Compare Couple and Family passes',
      action: 'walk-together',
    },
  ],
  ticketNote:
    'No entrance ticket is required to begin the walk. Many ChronoWalk stories unfold in Rome’s streets and public spaces.',
}

export const REBUILD_PRICING = {
  id: 'pricing',
  headline: 'Choose how much of Rome you want.',
  subhead: 'One-time access. No subscription.',
  eternaLabel: 'The complete Rome walk',
  eternaName: eterna.name,
  eternaBullets: [
    `All ${eterna.stopCount} stops — Historica and Antica included`,
    'Appian Way included',
    'Complete available Then vs Now access',
    'Narration and reading mode',
    'Prepare/download for offline walking',
    'Start at any included stop',
    'Saved progress on your device',
  ],
  eternaCta: `Unlock all ${eterna.stopCount} stops · ${eterna.priceLabel}`,
  valueCompare: `The complete walk costs only ${eternaUpgradeDeltaLabel()} more than one shorter route.`,
  checkoutNote: CHECKOUT_REASSURANCE,
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
    },
    {
      id: antica.id,
      name: antica.name,
      stops: antica.stopCount,
      price: antica.priceLabel,
      blurb: 'Ancient core — Colosseum, Forum, Capitoline, and related stops.',
      cta: `Choose ${antica.name}`,
    },
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
    label: `Walk together · ${couple.seatLimit} people · ${couple.priceLabel}`,
    seats: `${couple.seatLimit} people/devices`,
    price: couple.priceLabel,
    detail: `${couple.seatLimit} people/devices · Full ${eterna.name} (${eterna.stopCount} stops)`,
  },
  family: {
    id: family.id,
    label: `Walk together · Up to ${family.seatLimit} people · ${family.priceLabel}`,
    seats: `Up to ${family.seatLimit} people/devices`,
    price: family.priceLabel,
    detail: `Up to ${family.seatLimit} people/devices · Full ${eterna.name} (${eterna.stopCount} stops)`,
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
  steps: [
    {
      title: 'Start where you are',
      copy: 'See the included stops around you and begin with whichever one suits your day.',
      screen: 'map',
    },
    {
      title: 'The story belongs to the place',
      copy: 'When you reach a stop, ChronoWalk connects the narration and reconstruction to what is in front of you.',
      screen: 'listening',
    },
    {
      title: 'Stop and return whenever you want',
      copy: 'Pause for lunch, change direction or return later. Your completed stops and place in the journey are saved.',
      screen: 'journey',
    },
  ],
  locationNote:
    'With your permission, ChronoWalk uses your location to show what’s nearby and help you continue.',
}

export const REBUILD_CURATED = {
  id: 'curated-certainty',
  headline: 'The certainty of a planned tour. The freedom of walking alone.',
  body: 'ChronoWalk brings together the essential places, the route between them and the story that connects them. Follow the suggested journey, choose another stop or let Rome interrupt your plans.',
  secondary: 'Rome is already planned. Your day doesn’t have to be.',
}

export const REBUILD_ROUTE = {
  id: 'route-proof',
  headline: 'One city. One continuous story.',
  subhead: 'From the Arena to the Appian Way, each place changes the meaning of the next.',
  stopsLabel: `${eterna.stopCount} stops included`,
  expandLabel: 'See all included stops',
  collapseLabel: 'Hide stop list',
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
      a: 'A self-guided audio walk of Rome that opens in your browser. Place-tied narration, Then vs Now reconstructions, and a flexible route that remembers your progress.',
    },
    {
      q: 'Do I need to install an app?',
      a: 'No App Store install is required. ChronoWalk opens in your mobile browser and can be added to your home screen like a web app.',
    },
    {
      q: 'Does it work offline?',
      a: 'Opening and downloading need a connection. After you prepare the tour, downloaded content can be used while you walk offline.',
    },
    {
      q: 'When does it use location?',
      a: 'Only with your permission, while you use a walking experience—to show nearby stops and help confirm when you have arrived.',
    },
    {
      q: 'Can I start at any stop?',
      a: 'Yes. Begin with whichever included stop suits your day, then continue in a suggested order or choose another nearby stop.',
    },
    {
      q: 'Can I pause and continue another day?',
      a: 'Yes. Completed stops and your place in the journey are saved on your device so you can return later.',
    },
    {
      q: 'Do I need entrance tickets?',
      a: 'No entrance ticket is required to begin the walk. Many stories unfold in streets and public spaces. Some landmarks may have separate ticketed interiors you can visit on your own.',
    },
    {
      q: 'What does the free Pantheon preview include?',
      a: `One complete Pantheon chapter (${LANDING_PRODUCT.previewLabel}) with narration and Threshold—no purchase required.`,
    },
    {
      q: `What is included in ${eterna.name}?`,
      a: `All ${eterna.stopCount} stops on the complete Rome walk, Then vs Now where available, narration and reading mode, and the ability to prepare content for offline walking.`,
    },
    {
      q: 'How do Couple and Family passes work?',
      a: 'You purchase seats for the complete Rome walk. Each person claims a seat with an invitation link and follows shared tour progress on their own phone.',
    },
    {
      q: 'Is this a subscription?',
      a: 'No. ChronoWalk Rome packages are one-time purchases.',
    },
    {
      q: 'How is access delivered?',
      a: 'After checkout, access is delivered by email so you can open ChronoWalk and begin.',
    },
    {
      q: 'What happens if audio playback is interrupted?',
      a: 'You can resume from the player. Your progress in the journey remains saved so you do not lose your place.',
    },
    {
      q: 'Which devices and browsers are supported?',
      a: 'Modern mobile browsers (Safari and Chrome recommended). A stable connection helps the first open and download.',
    },
    {
      q: 'Refunds and support?',
      a: 'See our Refund Policy and Contact page for current support details. Email support@chronowalk.com.',
    },
  ],
}

export const REBUILD_FINAL = {
  id: 'final-cta',
  headline: 'Rome is already around you.',
  support: 'See what stood here, hear what happened and continue at your own pace.',
  primaryCta: `Unlock all ${eterna.stopCount} stops · ${eterna.priceLabel}`,
  secondaryCta: 'Try the Pantheon stop free',
  reassurance: 'Opens in your browser · One-time purchase · Download before walking',
}

export const REBUILD_PROPOSITIONS = {
  guide: {
    primary: 'Start anywhere. Wander freely. Never lose your place.',
    support:
      'With your permission, ChronoWalk uses your location to show what’s nearby and help you continue. Pause for lunch, change direction or return later—your progress is saved so you can see where you left off and what comes next.',
  },
  past: {
    primary: 'See what is here. Reveal what was here.',
    support:
      'Compare what survives today with an evidence-based reconstruction from the same viewpoint, so the fragments in front of you finally make sense.',
    brand: 'The ruin becomes the room.',
  },
  story: {
    primary: 'Hear what happened here. Notice what others walk past.',
    support:
      'Each chapter is tied to the view around you, pointing out the doorway, inscription, column or empty space that makes the story real.',
  },
  work: {
    primary: 'The certainty of a planned tour. The freedom of walking alone.',
    support:
      'ChronoWalk brings together the essential places, the route between them and the story that connects them. Start anywhere, change the order and stop whenever you want.',
  },
}
