/**
 * Focused copy for Google Ads acquisition pages.
 * Prices / stop counts for Roma Antica are resolved at render from product data.
 */

export const ACQUISITION_PATHS = Object.freeze([
  '/free-pantheon',
  '/ancient-rome',
  '/how-it-works',
])

export const FREE_PANTHEON_COPY = Object.freeze({
  path: '/free-pantheon',
  landingPageType: 'free_pantheon',
  eyebrow: 'FREE PANTHEON AUDIO EXPERIENCE',
  h1: 'Experience the Pantheon with a complete audio stop—free.',
  lead:
    'Stand beneath Rome’s most extraordinary ancient interior and understand what you are seeing through immersive audio, place-tied storytelling and visual reconstruction.',
  primaryCta: 'Start the Pantheon experience',
  secondaryCta: 'Explore the full 21-stop Rome tour',
  trustLine: 'No app-store download · Opens in your browser · No payment required',
  heroImage: '/landing/real-moment/pantheon.jpg',
  heroImageAlt: 'The Pantheon exterior in Rome',
  includesHeading: 'What the free experience includes',
  includes: [
    {
      title: 'A complete Pantheon story',
      body: 'Hear why the building survived and how Romans experienced it.',
    },
    {
      title: 'Place-tied audio',
      body: 'Follow the story while standing inside or near the monument.',
    },
    {
      title: 'Visual reconstruction',
      body: 'Reveal details that are difficult to imagine from the surviving structure alone.',
    },
  ],
  proofEyebrow: 'SEE HOW CHRONOWALK WORKS',
  proofHeading: 'The monument stops being background.',
  proofLead:
    'ChronoWalk helps you see the surviving building, imagine the world around it and understand why it mattered.',
  upgradeHeading: 'Continue beyond the Pantheon.',
  upgradeLead:
    'Unlock the complete Rome experience with 21 historic stops across the Colosseum, Roman Forum, Pantheon and the streets connecting them.',
  upgradeCta: 'Unlock all 21 stops · €14.99',
  compareCta: 'Compare Rome routes',
  faq: [
    {
      q: 'Is the Pantheon experience really free?',
      a: 'Yes. The complete Pantheon stop requires no payment and no signup.',
    },
    {
      q: 'Do I need to download an app?',
      a: 'No. ChronoWalk opens in your browser. No App Store download is required.',
    },
    {
      q: 'Does this include Pantheon admission?',
      a: 'No. Monument admission tickets are not included. ChronoWalk is an independent self-guided audio experience, not an official monument audio guide.',
    },
    {
      q: 'Can I use it before or during my visit?',
      a: 'Yes. Open it while connected to start. You can prepare the experience before walking if you want to use it offline.',
    },
  ],
})

export const ANCIENT_ROME_COPY = Object.freeze({
  path: '/ancient-rome',
  landingPageType: 'ancient_rome',
  eyebrow: 'SELF-GUIDED ANCIENT ROME AUDIO WALK',
  h1: 'Turn Ancient Rome’s ruins into a living city.',
  lead:
    'Explore the Colosseum, Roman Forum and the monuments around them through immersive audio, visual reconstruction and a route you can follow at your own pace.',
  primaryCtaPrefix: 'Explore the Ancient Rome route',
  secondaryCta: 'Unlock all 21 Rome stops · €14.99',
  trustLine: 'One payment · No app-store download · Prepare for offline walking',
  admissionNote: 'Admission tickets are not included.',
  heroImage: '/landing/real-moment/forum.jpg',
  heroImageAlt: 'Roman Forum ruins in Ancient Rome',
  experienceHeading: 'What you will experience',
  experienceSteps: [
    'See what survives',
    'Reveal what once stood there',
    'Hear the people and events connected to the place',
    'Continue through a curated route without joining a group',
  ],
  stopsHeading: 'Representative stops',
  stopsLead: 'A focused Ancient Rome walk through the Colosseum, Forum and nearby monuments.',
  seeCompleteRoute: 'See the complete route',
  thenNowEyebrow: 'THE RUIN BECOMES THE ROOM',
  thenNowHeading: 'Press and hold to reveal Ancient Rome.',
  thenNowLead:
    'See the surviving monument, reveal the reconstructed setting, then hear the story while standing where it happened.',
  choiceHeading: 'Choose your Rome walk',
  anticaCta: 'Choose Roma Antica',
  eternaCta: 'Unlock all 21 stops',
  eternaValueLine: 'Only €5 more for the complete 21-stop Rome experience.',
  faq: [
    {
      q: 'Does this include Colosseum or Forum tickets?',
      a: 'No. ChronoWalk does not include monument admission tickets. It is a self-guided audio walking experience you use on your own phone.',
    },
    {
      q: 'Can I start at any stop?',
      a: 'Yes. Start from a convenient included stop and continue flexibly — you are not locked to stop one.',
    },
    {
      q: 'Is this a live guided tour?',
      a: 'No. ChronoWalk is self-guided. You walk at your own pace without joining a group.',
    },
    {
      q: 'Can I use it offline?',
      a: 'Prepare and download the experience while connected before you head out. Initial opening requires connectivity.',
    },
  ],
})

export const HOW_IT_WORKS_COPY = Object.freeze({
  path: '/how-it-works',
  landingPageType: 'how_it_works',
  eyebrow: 'HOW CHRONOWALK WORKS',
  h1: 'A Rome audio guide that moves with you.',
  lead:
    'Open it in your browser, choose where to begin and explore Rome through immersive audio, flexible routes and Then/Now reconstruction.',
  primaryCta: 'Try the Pantheon stop free',
  secondaryCta: 'See all 21 stops',
  trustLine: 'No app-store download · One payment · Prepare before walking',
  heroImage: '/landing/hero-slides/then-now.png',
  heroImageAlt: 'ChronoWalk Then/Now reveal on a phone screen',
  stepsHeading: 'Three steps to start',
  steps: [
    {
      title: 'Open and prepare',
      body: 'Open ChronoWalk in your browser. Before heading out, load the experience while connected so it is ready for your walk.',
    },
    {
      title: 'Start where you are',
      body: 'Choose a nearby stop or begin with the route you planned. You are not required to join a group or follow a rigid schedule.',
    },
    {
      title: 'Listen, reveal and continue',
      body: 'Hear the story at the monument, press and hold to reveal Ancient Rome, then continue when you are ready.',
    },
  ],
  demoHeading: 'See the product in motion',
  reassureHeading: 'Common questions, answered',
  reassure: [
    {
      title: 'Do I need an app?',
      body: 'No. It opens directly in your browser.',
    },
    {
      title: 'Does it work without internet?',
      body: 'Prepare/download the experience before walking. Initial setup requires connectivity.',
    },
    {
      title: 'Do I have to begin at stop one?',
      body: 'No. Start from a convenient stop and continue flexibly.',
    },
    {
      title: 'Is it a subscription?',
      body: 'No. It is a one-time purchase.',
    },
  ],
  finalHeading: 'See it for yourself.',
  finalPrimaryCta: 'Experience the Pantheon free',
  finalSecondaryCta: 'Unlock all 21 stops · €14.99',
})

/** Representative Ancient Rome stop labels (subset for scannable list). */
export const ANCIENT_ROME_FEATURED_STOP_LABELS = Object.freeze([
  'Colosseum',
  'Arch of Titus',
  'Roman Forum',
  'Curia Julia',
  'Temple of Saturn',
  'Palatine viewpoints',
])
