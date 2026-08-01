/** Scroll target for the Rome journey / purchase section. */
export const ROME_JOURNEY_SECTION_ID = 'rome-journey'

/** Token replaced at render time with the live price label (e.g. €14.99). */
export const PRICE_PLACEHOLDER = '{price}'

/** Landing-only price fallback: full bundle; do not duplicate elsewhere. */
export const LANDING_PRICE_FALLBACK_CENTS = 1499
export const LANDING_PRICE_FALLBACK_LABEL = '€14.99'

export const hostBannerPrefix = 'Recommended by'

/** Pantheon free-sample narration (manifest.system.preview · ~4 min exterior chapter). */
export const LANDING_PREVIEW_AUDIO_FILE = 'w17_ch1.mp3'

/** Shared CTA labels used across sections. */
export const LANDING_CTA = {
  begin: 'Choose a Rome walk',
  /** Primary purchase-path CTA (Roma Eterna). */
  unlockRome: 'Unlock all 21 stops',
  tryFree: 'Get a free sneak peek',
  /** Primary free-stop CTA (complete Pantheon stop). */
  tryFreeSneakPeek: 'Get a free sneak peek',
  /** Hero unpaid CTA — complete Pantheon free stop (not a teaser). */
  experienceCompleteStop: 'Experience a complete stop',
  seeRoutes: 'See all Rome walks',
  tryOneStopFree: 'Get a free sneak peek',
  /** Secondary CTAs that scroll to `#pricing` (Rome walks), not the route map. */
  exploreRomeRoutes: 'See all Rome walks',
  chooseTour: 'Choose your walk',
  howItWorks: 'How does ChronoWalk work?',
  getApp: 'Get the tour',
  reviews: '★★★★★ Reviews',
}

/** Explicit free complete-stop block (Pantheon) before purchase. */
export const FREE_PREVIEW = {
  title: 'The Pantheon',
  meta: 'Free complete stop · ~4 minutes',
  /** Hero helper under the unpaid free-stop CTA. */
  heroCtaMeta: 'The Pantheon · 4 minutes · Free · No signup',
  copy: 'Place-tied audio and a Then vs Now reconstruction at one complete Pantheon stop.',
}

/** Tiered Rome journey offerings shown on the landing product showcase. Prices in EUR. */
export const ROME_TIERS = [
  {
    id: 'rome-complete',
    name: 'Roma Eterna',
    eyebrow: 'Roma Eterna',
    tierLabel: 'THE COMPLETE ROME WALK',
    theme: 'eterna',
    tag: 'Complete experience',
    tagline: 'The complete city loop',
    bestFor: 'All 21 stops, from ancient Rome to the historic center and Via Appia.',
    outcome:
      'One city. One continuous story. From ancient Rome to the historic center. The full ChronoWalk experience.',
    price: '€14.99',
    priceCents: 1499,
    priceNote: 'One-time purchase. No subscription. Yours forever.',
    badge: 'Complete experience',
    description:
      'The full journey through ancient Rome and the historic center. Twenty-one stops. Two thousand years of story.',
    durationLabel: '4.5 – 5.5 hr',
    stopsLabel: '21 stops',
    distanceLabel: '~6 km',
    mapImage: '/landing/rome-pricing-basemap-complete.jpg',
    cardImage: '/landing/hero-slides/package-roma-eterna.png',
    cardWidth: 1024,
    cardHeight: 1536,
    legend: [
      { tone: 'full', label: 'Full route (21 stops)', detail: '~6 km · 4.5 – 5.5 hr' },
      {
        tone: 'optional',
        label: 'Optional loop (4 stops)',
        detail: 'Palatine, Circus Maximus View, Forum overview',
      },
    ],
    includesLabel: 'Includes all highlights in the city + optional loop',
    featuredBullet: 'Only €5 more than either shorter route.',
    bullets: [
      'All 21 stops, from ancient Rome to the historic center and Via Appia',
      'Then vs Now reconstructions across the route',
      'Directions and saved progress',
    ],
    expandLabel: 'See all 21 stops',
    primaryCta: 'Choose Roma Eterna',
    footFeatures: [
      { icon: 'pin', title: 'Start anywhere', body: 'Begin at any stop' },
      { icon: 'download', title: 'Download & go', body: 'Use offline' },
      { icon: 'bookmark', title: 'Pick up anytime', body: 'Your progress is saved' },
    ],
  },
  {
    id: 'rome-essential',
    name: 'Roma Antica',
    eyebrow: 'Roma Antica',
    tierLabel: 'ANCIENT ROME',
    theme: 'antica',
    tag: 'Ancient Rome',
    tagline: 'Colosseum, Palatine & Ancient Rome Core',
    bestFor: 'Best for the Colosseum, Palatine, Forum, and Capitoline area.',
    outcome: 'Walk through the heart of Ancient Rome, from the Colosseum and Palatine Hill to the Roman Forum.',
    price: '€9.99',
    priceCents: 999,
    priceNote: 'One-time payment and it’s yours forever.',
    description:
      'Walk through the heart of Ancient Rome, from the Colosseum and Palatine Hill to the Roman Forum.',
    durationLabel: '~2.5 – 3 hr',
    stopsLabel: '12 stops',
    distanceLabel: '~3 km',
    mapImage: '/landing/rome-pricing-basemap-ancient.jpg',
    cardImage: '/landing/hero-slides/package-roma-antica.png',
    cardWidth: 1024,
    cardHeight: 1536,
    legend: [
      {
        tone: 'short',
        label: 'Short route (9 stops)',
        detail: 'Direct path without optional loop · ~1.5 – 2 hr · ~2.2 km',
      },
      {
        tone: 'full',
        label: 'Full route (12 stops)',
        detail: 'Includes optional loop · ~2.5 – 3 hr · ~3 km',
      },
      {
        tone: 'optional',
        label: 'Optional loop (3 stops)',
        detail: 'Palatine, Circo Massimo & Forum overview · ~30 – 45 min',
      },
    ],
    bullets: [
      'Place-tied audio at each stop',
      'Then vs Now reconstructions where available',
      'Directions and saved progress',
    ],
    expandLabel: 'See all 12 stops',
    primaryCta: 'Choose Roma Antica',
    footFeatures: [
      { icon: 'pin', title: 'Start anywhere', body: 'Begin at any stop' },
      { icon: 'download', title: 'Download & go', body: 'Use offline' },
      { icon: 'bookmark', title: 'Pick up anytime', body: 'Your progress is saved' },
    ],
  },
  {
    id: 'rome-central',
    name: 'Roma Historica',
    /** @deprecated use `name` - retained for archive / older UI strings */
    eyebrow: 'Roma Historica',
    tierLabel: 'CENTRAL ROME',
    theme: 'historica',
    tag: 'Centro Storico',
    tagline: 'Centro Storico & Pantheon deep dive',
    bestFor: 'Best for an afternoon through Rome’s historic center.',
    outcome:
      'Perfect for an afternoon through Rome’s historic heart, with a deep dive into the Pantheon.',
    price: '€9.99',
    priceCents: 999,
    priceNote: 'One-time payment and it’s yours forever.',
    description:
      'Perfect for an afternoon through Rome’s historic heart, with a deep dive into the Pantheon.',
    durationLabel: '~2.5 – 3 hr',
    stopsLabel: '8 stops',
    distanceLabel: '~4 km',
    mapImage: '/landing/rome-pricing-basemap-central.jpg',
    cardImage: '/landing/hero-slides/package-roma-historica.png',
    cardWidth: 941,
    cardHeight: 1672,
    legend: [
      { tone: 'full', label: 'Historic center route', detail: '8 stops · ~2.5 – 3 hr · ~4 km' },
    ],
    bullets: [
      'Place-tied audio at each stop',
      'Then vs Now reconstructions where available',
      'Directions and saved progress',
    ],
    expandLabel: 'See all 8 stops',
    primaryCta: 'Choose Roma Historica',
    footFeatures: [
      { icon: 'pin', title: 'Start anywhere', body: 'Begin at any stop' },
      { icon: 'download', title: 'Download & go', body: 'Use offline' },
      { icon: 'bookmark', title: 'Pick up anytime', body: 'Your progress is saved' },
    ],
  },
]

/**
 * Shared-experience Couple / Family offers: full Roma Eterna content per seat.
 * Seat limits and content_product_id remain server-authoritative (catalog).
 */
export const ROME_BUNDLES = [
  {
    id: 'rome-couple',
    name: 'Couple',
    bestFor: 'For two people walking Rome on their own phones.',
    outcome: 'Full Roma Eterna for each included person, with shared tour progress.',
    price: '€25',
    priceCents: 2500,
    priceNote: 'once · taxes included where applicable',
    badge: 'Save €4.98',
    seatLabel: '2 people and devices',
    seatDetail: 'Two seats total, including the purchaser',
    contentTitle: 'Full Roma Eterna for each person',
    contentStops: 'All 21 stops',
    contentLoop: 'Shared tour progress',
    contentLine: 'Full Roma Eterna · 21 stops',
    perPerson: '€12.50 per person',
    savingsLine: 'Save €4.98 compared with two separate Roma Eterna purchases.',
    description:
      'Two people and devices. Full Roma Eterna for each person, with shared tour progress.',
    bullets: [
      '2 people and devices',
      'Full Roma Eterna for each person',
      'All 21 stops',
      'Shared tour progress',
    ],
    primaryCta: 'Choose Couple',
  },
  {
    id: 'rome-family',
    name: 'Family',
    bestFor: 'For up to four people sharing one Rome walk.',
    outcome: 'Full Roma Eterna for each included person, with shared tour progress.',
    price: '€35',
    priceCents: 3500,
    priceNote: 'once · taxes included where applicable',
    badge: 'Save up to €24.96',
    seatLabel: 'Up to 4 people and devices',
    seatDetail: 'Up to four seats total, including the purchaser',
    contentTitle: 'Full Roma Eterna for each person',
    contentStops: 'All 21 stops',
    contentLoop: 'Shared tour progress',
    contentLine: 'Full Roma Eterna · 21 stops',
    perPerson: 'As little as €8.75 per person',
    savingsLine: 'Save up to €24.96 when all four seats are used.',
    description:
      'Up to 4 people and devices. Full Roma Eterna for each person, with shared tour progress.',
    bullets: [
      'Up to 4 people and devices',
      'Full Roma Eterna for each person',
      'All 21 stops',
      'Shared tour progress',
    ],
    primaryCta: 'Choose Family',
  },
]

/**
 * Replace `{price}` in landing copy strings.
 * @param {string} text
 * @param {{ price?: string }} vars
 */
export function formatLandingCopy(text, vars = {}) {
  if (!text || typeof text !== 'string') return text
  const price = vars.price ?? ''
  return text.split(PRICE_PLACEHOLDER).join(price)
}

/** @param {string[]} lines @param {{ price?: string }} vars */
export function formatLandingLines(lines, vars = {}) {
  return (lines ?? []).map((line) => formatLandingCopy(line, vars))
}

/**
 * Approved traveler quotes for the landing trust section.
 * Keep empty until a quote is explicitly stored AND approved for marketing use.
 * Shape: { id, quote, attribution, context? }
 * Do not invent testimonials, ratings, or user counts.
 */
export const LANDING_VERIFIED_REVIEWS = []

export const stickyCta = {
  primary: `Choose a Rome walk · ${PRICE_PLACEHOLDER}`,
  secondary: 'Get a free sneak peek',
}

/**
 * Hero reviews capsule (testing period).
 * Hidden by default; enable via LandingReviewsDevToggle or ?landing_reviews=1.
 * Replace quote/attribution only with approved traveler reviews before launch.
 */
export const LANDING_HERO_REVIEWS = {
  rating: 4.9,
  quote: 'Finally a Rome walk that lets you wander and still understand what you are looking at.',
  attribution: 'Testing placeholder · replace with an approved review',
  seeMoreLabel: 'See more',
  seeMoreHref: '#trust',
}

/**
 * Product-story architecture (Landing V4).
 * Intro compresses into nav · sticky phone demo · capability sections.
 * Keys match LANDING_CONTENT.
 */
export const LANDING_SECTION_ORDER = [
  'hero',
  'product-demo',
  'monuments',
  'personas',
  'pricing',
  'faq',
  'trust',
]

/** Narrative acts for composition / a11y / navigation (`#act-*`). */
export const LANDING_ACTS = [
  {
    id: 'act-open',
    label: 'Act I: The Open',
    index: 'I',
    name: 'The Open',
    sections: ['hero', 'product-demo'],
  },
  {
    id: 'act-walk',
    label: 'Act II: The Walk',
    index: 'II',
    name: 'The Walk',
    sections: ['monuments', 'personas'],
  },
  {
    id: 'act-choose',
    label: 'Act III: The Choice',
    index: 'III',
    name: 'The Choice',
    sections: ['pricing', 'faq', 'trust'],
  },
]

/**
 * Existing beats remounted lower in Act III so deep links / SEO copy stay live
 * until trust + After Rome fully replace them. Not part of the primary narrative order.
 * Phase 9: comparison feature matrix removed; benefits appear once only.
 */
export const LANDING_PRESERVED_LOWER_SECTIONS = []

/** Legacy hash targets kept resolving while content is relocated. */
export const LANDING_LEGACY_DEEPLINK_IDS = [
  'rome-journey',
  'letter',
  'who-its-for',
  'compare',
  'trust',
]

export const LANDING_CONTENT = {
  hero: {
    id: 'top',
    eyebrow: null,
    headline: 'Rome, at your own pace.',
    accentLine: null,
    subheadline:
      'The best self-guided audio tour of the Eternal City. Wander freely without missing what matters.',
    subheadlineHighlight: 'best self-guided audio tour of the Eternal City',
    primaryCta: LANDING_CTA.experienceCompleteStop,
    primaryCtaAriaLabel: 'Experience a complete Pantheon stop for free',
    primaryCtaMeta: FREE_PREVIEW.heroCtaMeta,
    secondaryCta: LANDING_CTA.howItWorks,
    secondaryHref: '#how-it-works',
    /** Gold CTA keeps the Get App destination; label emphasizes unlocking the full route. */
    getAppCta: LANDING_CTA.unlockRome,
    getAppHref: '#get-app',
    reviewsCta: 'See more',
    reviewsHref: '#trust',
    primaryHref: '/preview',
    trustLine: null,
    phoneLabel: 'Listening at a landmark',
    freeStoryMeta: FREE_PREVIEW.meta,
  },

  'product-demo': {
    id: 'how-it-works',
    eyebrow: 'The App',
    headline: 'How does ChronoWalk work?',
    subheadline: 'Scroll to follow the phone from choosing a route to hearing the story on site.',
    chapters: [
      {
        id: 'choose',
        title: 'Choose your Rome walk.',
        body: 'Take the complete 21-stop route, or choose a shorter walk for the part of Rome you have time for. Start at any included stop. Follow the suggested order, skip ahead, or change direction.',
        component: 'B4PaceSelector',
        beats: ['ROMA ETERNA', 'SHORTER WALKS', 'START ANYWHERE'],
      },
      {
        id: 'arrive',
        title: 'Arrive. The right story is ready.',
        body: 'ChronoWalk uses your location to show the stop in front of you. Press and hold to reveal an evidence-based reconstruction from the same viewpoint.',
        component: 'A2FreePreviewStory',
        beats: ['CURRENT STOP', 'PRESS AND HOLD', 'THEN AND NOW', 'REVEAL'],
        emotional: true,
      },
      {
        id: 'listen',
        title: 'Hear what happened here.',
        body: 'Play the chapter at the landmark, or read instead. Prepare the walk before you leave Wi-Fi, then keep listening when mobile signal fades.',
        component: 'A2FreePreviewStory',
        beats: ['AUDIO', 'READ INSTEAD', 'OFFLINE READY'],
      },
      {
        id: 'walk',
        title: 'Wander freely. Never lose your place.',
        body: 'Pause for lunch, take a detour, or continue tomorrow. ChronoWalk keeps your progress and shows you where to pick up the route. Use the map when you need it. Ignore it when Rome distracts you.',
        component: 'C2Walking',
        beats: ['MAP', 'STEPS', 'PAUSE', 'CONTINUE'],
      },
    ],
  },

  personas: {
    id: 'who-its-for',
    eyebrow: null,
    headline: 'ChronoWalk is your reliable companion',
    subheadline: null,
    items: [
      {
        id: 'no-tickets',
        headline: 'No Colosseum ticket?',
        body: 'The monument may be sold out. The city is not. Follow the stories, façades, viewpoints, and public spaces still open around you.',
        imageKey: 'trevi',
        cta: 'See the Rome walks',
        href: '#pricing',
      },
      {
        id: 'rigid',
        headline: 'Not a fan of rigid tour schedules?',
        body: 'No meeting point, no flag or umbrella to follow around. No pressure to keep up or overwhelming large groups.',
        imageKey: 'wander',
        cta: 'See the Rome walks',
        href: '#pricing',
      },
      {
        id: 'history',
        headline: 'Want to wander freely, but missing history facts gives you FOMO?',
        body: 'Hear the story tied to the stones in front of you, with full reconstructions to help you immerse yourself in historic details, without giving your whole day to a group tour.',
        imageKey: 'forum',
        cta: LANDING_CTA.tryFreeSneakPeek,
        href: '#how-it-works',
        preview: true,
      },
      {
        id: 'itineraries',
        headline: 'Overwhelmed by infinite tour options and mixed reviews?',
        body: 'Close all those tabs, you can trust us. Start with one researched route and know the day will be worth taking.',
        imageKey: 'pantheon',
        cta: 'Compare the walks',
        href: '#pricing',
      },
      {
        id: 'guides',
        headline: 'Guided tours outside your budget?',
        body: 'Get the structure, context, and narration of a guided walk for a one-time price.',
        imageKey: 'street',
        cta: 'Choose a Rome walk',
        href: '#pricing',
      },
    ],
  },

  interlude: {
    id: 'interlude',
    line1: 'Rome is loud.',
    line2: "History isn't always.",
    line3: 'ChronoWalk helps you catch the silent, hidden parts of the Eternal City.',
  },

  'early-cta': {
    id: 'early-cta',
    headline: null,
    subheadline: null,
    primaryCta: LANDING_CTA.tryOneStopFree,
    secondaryCta: null,
    hint: 'Pantheon · about four minutes',
  },

  'real-moment': {
    id: 'real-moment',
    eyebrow: 'In Rome',
    headline: 'Begin where you are.',
    scenarios: [
      {
        id: 'no-ticket',
        prompt: 'No ticket?',
        lines: ['The monument may be sold out.', 'The city isn’t.'],
        accent: '#c4a574',
        imageKey: 'street',
      },
      {
        id: 'free-afternoon',
        prompt: 'Free afternoon?',
        lines: ['Begin where you are.', 'Pause when Rome distracts you.'],
        accent: '#e07a5f',
        imageKey: 'pantheon',
      },
      {
        id: 'wander',
        prompt: 'Love to wander?',
        lines: ['Let the streets choose the order.', 'Nothing on the route rushes you.'],
        accent: '#7a9e8a',
        imageKey: 'wander',
      },
      {
        id: 'history',
        prompt: 'History curious?',
        lines: ['The stones stop looking like rubble once the story begins.'],
        accent: '#d4a017',
        imageKey: 'forum',
      },
    ],
  },

  trust: {
    id: 'trust',
    eyebrow: null,
    headline: null,
    subheadline: null,
    checklist: [
      {
        id: 'browser',
        title: 'Works in your browser',
        body: 'Open ChronoWalk from your access link. No App Store installation required.',
      },
      {
        id: 'offline',
        title: 'Prepare for offline use',
        body: 'Open and download the walk while connected, then use the prepared content when mobile signal fades.',
      },
      {
        id: 'one-time',
        title: 'One-time purchase',
        body: 'Pay once for the selected walk. There is no subscription.',
      },
      {
        id: 'gps',
        title: 'Uses your location',
        body: 'ChronoWalk helps identify the stop in front of you and shows where to continue.',
      },
      {
        id: 'evidence',
        title: 'Evidence stated honestly',
        body: 'Reconstructions distinguish established evidence from informed conjecture.',
      },
      {
        id: 'progress',
        title: 'Progress saved',
        body: 'Pause the walk and return later without starting again.',
      },
    ],
    /** Retained for archive / deep content; checklist is the live surface. */
    items: [
      {
        title: 'Uncertainty, labeled',
        body: 'Where the record is thin, we say so. Threshold captions note interpretive details (colors, crowds, conjecture) so the image does not pretend to be a photograph of the past.',
        icon: 'label',
      },
      {
        title: 'Reconstructions from your viewpoint',
        body: 'At selected landmarks, press and hold to compare today’s stones with a researched reconstruction matched to the vantage in front of you, not a stock illustration.',
        icon: 'viewpoint',
      },
      {
        title: 'Scripts written for this route',
        body: 'Narration is researched and produced for ChronoWalk’s Rome walk, curated for this city, not an LLM-only mash-up of unrelated tours.',
        icon: 'script',
      },
      {
        title: 'Preview without an account',
        body: 'The Pantheon stop opens free. Paid packages are one-time purchases, not a subscription.',
        icon: 'preview',
      },
      {
        title: 'Tickets stay honest',
        body: 'ChronoWalk does not replace ticketed entry where tickets are required. Much of the walk happens on streets, piazzas, and open viewpoints.',
        icon: 'ticket',
      },
    ],
    imageryNote:
      'Present-day photographs and reconstruction notes are documented with sources where available.',
    imageryHref: '/credits',
    imageryCta: 'Imagery credits',
    /**
     * Kept for when LANDING_VERIFIED_REVIEWS gains approved entries.
     * Empty state is not rendered on the live page (Phase 22).
     */
    verifiedReviewsEmptyNote:
      'Traveler quotes appear here only when we have approved ones to share.',
  },

  why: {
    id: 'why-chronowalk',
    eyebrow: 'Why ChronoWalk',
    headline: 'Tied to the stones.\nYours to keep.',
    points: [
      'Stories tied to the place where they happened',
      'Evidence-based reconstructions from the viewpoint in front of you',
      'A route that pauses when you do',
    ],
  },

  'after-rome': {
    id: 'after-rome',
    eyebrow: 'After Rome',
    headlineLines: ['Months later,', 'you’ll forget the queue.', 'You’ll remember the story.'],
    /** Accurate: one-time purchase keeps the downloaded route after the trip (see FAQ / pricing). */
    body: 'Your route remains yours after the trip, so the city can return whenever you do.',
    linkLabel: 'Keep the stories',
    linkHref: '#pricing',
    /** @deprecated Phase 14: letter card framing replaced by editorial verse. */
    headline: 'Months later, you’ll forget the queue.',
    previewLabel: 'Your Journey Letter',
    reflection:
      'Months later, you’ll forget the queue. You’ll remember the story.',
    closing: 'Your route remains yours after the trip, so the city can return whenever you do.',
  },

  'user-flow': {
    id: 'how-it-works',
    eyebrow: 'How it works',
    headline: 'Three steps. Then Rome.',
    subheadline: 'Download once. Walk when you want.',
    steps: [
      {
        step: '1',
        title: 'Choose your Rome',
        body: 'Pick the route that fits the time you have.',
        mockup: 'journey',
      },
      {
        step: '2',
        title: 'Walk freely',
        body: 'The map follows you.',
        mockup: 'map',
      },
      {
        step: '3',
        title: 'Arrive, listen, reveal',
        body: 'When you arrive, the chapter opens.',
        /* Listening fills the frame with photo + player; matches the step copy. */
        mockup: 'listening',
      },
    ],
  },

  monuments: {
    id: 'monuments',
    eyebrow: 'THE STOPS',
    headline: 'Browse through all the different waypoints you can discover with ChronoWalk',
    subheadline: 'Swipe through the stops that carry the story across the city.',
    /** Always-on SEO / continuity line - full ordered names stay in the DOM via the trail. */
    routeName: 'Roma Eterna',
    expandLabel: 'See every stop on the route',
    collapseLabel: 'Show the route highlights',
    previewAriaLabel: 'Route highlights across Rome',
    fullAriaLabel: 'Complete Rome route by stop',
  },

  benefits: {
    id: 'benefits',
    eyebrow: 'Carry with you',
    headline: 'What stays with you.',
    items: [
      {
        title: 'Stories where you stand',
        body: 'Narration opens at the landmark in front of you.',
      },
      {
        title: 'Your pace',
        body: 'Pause, split the day, or return tomorrow.',
      },
      {
        title: 'Online when you can, offline when you need',
        body: 'The ideal walk uses the live map. Download the tour on hotel Wi‑Fi first if you’ll turn on airplane mode or lose signal.',
      },
      {
        title: 'Yours to keep',
        body: 'The route stays after the trip. One device per purchase, with Couple and Family options for walking together.',
      },
    ],
  },

  'try-free': {
    id: 'try-free',
    eyebrow: 'Free complete stop',
    headline: 'One complete stop.\nBefore you buy.',
    subheadline: FREE_PREVIEW.copy,
    card: FREE_PREVIEW,
    primaryCta: LANDING_CTA.tryOneStopFree,
    secondaryCta: LANDING_CTA.exploreRomeRoutes,
    trustLine: 'Opens in your browser.',
    included: 'One complete Pantheon stop: narration, arrival, and Then vs Now (~4 min).',
    notIncluded: 'Full packages open every stop on the route.',
  },

  threshold: {
    id: 'threshold',
    eyebrow: 'Threshold',
    headline: 'Press and hold. The ruin becomes the room.',
    headlineLines: ['Press and hold.', 'The ruin becomes the room.'],
    body: 'At selected landmarks, compare what stands today with an evidence-based reconstruction from the same viewpoint.',
    support: 'Where historians disagree, we say so.',
    disclaimer:
      'Colors and crowd details are interpretive where noted. Gaps in the record appear in the copy.',
    holdHint: 'Press and hold',
    revealLabel: 'Reveal the past',
    hideLabel: 'Show today',
    /** @deprecated legacy fields retained for archived components */
    subheadline:
      'At selected landmarks, compare today’s stones with an evidence-based reconstruction of the same view. Colors and crowd details are interpretive where noted. We do not fake certainty.',
    bullets: [
      'Matched to the vantage point in front of you, not a stock illustration',
      'Audio opens when you reach each stop, built for heads-up walking',
      'Reconstructions are researched; gaps are acknowledged in the copy',
    ],
    holdLabel: 'Hold to reveal',
  },

  /**
   * @deprecated Phase 7: persona cards replaced by `real-moment` scenarios.
   * `#who-its-for` deeplink is hosted inside LandingRealMomentSection.
   * Content retained for archive / reference only (component renders null).
   */
  'who-its-for': {
    id: 'who-its-for',
    eyebrow: 'Who it\'s for',
    headline: 'Built for anyone walking Rome without a guide.',
    subheadline: 'You don\'t need a history degree or a perfect itinerary.',
    items: [
      {
        tag: 'First trip to Rome',
        title: 'Close the tabs. Open one route.',
        body: 'Overwhelmed by pins and blog posts? Download one curated walk and trust the day is worth taking. Much of Rome\'s greatest history is visible from open squares and façades.',
      },
      {
        tag: 'The history lover',
        title: 'Ruins that finally make sense.',
        body: 'You\'ve seen the names. Now hear the scenes, tied to the stones in front of you. The Forum stops feeling like rubble without context.',
      },
      {
        tag: 'Without a group tour',
        title: 'No flag. No crowd of thirty.',
        body: 'Share headphones with a partner, pause for coffee, split the walk across mornings. The route waits. No schedule attached.',
      },
      {
        tag: 'Sold out or no ticket',
        title: 'The city still has stories.',
        body: 'Tickets sold out? Many landmarks are best understood from the edge, the square, or the street. ChronoWalk is built for the Rome you can reach on foot.',
      },
    ],
  },

  /**
   * @deprecated Phase 12: competitor matrix removed from the live landing.
   * Objection-handling lives in `why` + FAQ. `#compare` resolves on Why ChronoWalk.
   */
  comparison: {
    id: 'compare',
    eyebrow: 'Why ChronoWalk',
    headline: 'Walk freely. Keep the context.',
    columns: [],
    rows: [],
  },

  letter: {
    id: 'letter',
    eyebrow: 'After the walk',
    headline: 'End with something worth keeping.',
    preview: {
      label: 'Your Journey Letter',
      date: 'Rome · 12 August 2026',
      reflection:
        'Today you stood where senators argued, emperors passed, and ordinary Romans lived their lives.',
      stats: [
        { value: '21', label: 'stops' },
        { value: '9.4 km', label: 'walked' },
        { value: '20', label: 'centuries' },
      ],
    },
  },

  pricing: {
    id: 'pricing',
    eyebrow: 'CHOOSE YOUR WALK',
    headline: 'Choose your Roman walk.',
    subheadline:
      'Three self-guided routes. Same offline audio, maps, and progress saving. Pick the chapter that matches your day.',
    intro: '',
    footnote:
      'Secure checkout by Paddle · Access arrives by email · Entrance tickets are not included · Taxes included where applicable',
    accessLinkLabel: 'Already purchased? Open your access link',
    accessHref: '/access',
    metaTimeLabel: 'Est. duration',
    metaStopsLabel: 'Stops',
    tiers: ROME_TIERS,
    sharedExperience: {
      id: 'shared-experience',
      eyebrow: 'WALK TOGETHER',
      headline: 'Share the walk, not the earbuds.',
      lead:
        'Each person follows the complete Roma Eterna walk on their own phone. Shared progress keeps the group connected as the day unfolds. Exact audio timing may vary between browsers.',
      bundles: ROME_BUNDLES,
    },
  },

  header: {
    nav: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Stops', href: '#monuments' },
      { label: 'Rome walks', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    /** Shown in the nav only after the hero leaves the viewport. */
    cta: LANDING_CTA.getApp,
    ctaHref: '#get-app',
    ctaShort: 'Get Tour',
  },

  footer: {
    tagline: 'Self-guided audio walks for Rome, researched and yours to keep.',
    nav: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Stops', href: '#monuments' },
      { label: 'Rome walks', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    credit: 'Made for people on foot · ChronoWalk',
    accessLinkLabel: 'Already purchased? Open your access link',
    accessHref: '/access',
  },

  /** Legacy keys kept for archive components */
  problem: {
    id: 'problem',
    headline: 'Most of Rome is hiding in plain sight.',
    body:
      'You stand before columns, arches, stones, and empty spaces. You know they mattered. But without the story, they stay silent.',
    pullquote: 'ChronoWalk turns those places back into scenes.',
  },

  rescue: {
    id: 'rescue',
    headline: 'No perfect itinerary required.',
    copy:
      'Maybe the tickets sold out. Maybe your tabs are a mess. Maybe you just want to wake up, start walking, and know the day will be worth it.',
  },

  promise: {
    id: 'promise',
    headline: 'Rome walks researched for the stones in front of you.',
    scrollCta: 'Start Rome without the research spiral →',
    cards: [
      {
        title: 'Walk at your own pace',
        copy: 'No group, no flag, no schedule. Pause for coffee, continue tomorrow, and never feel rushed past the thing you came to see.',
      },
      {
        title: 'Stories where they happened',
        copy: 'The audio begins when you arrive, so the place in front of you becomes part of the story.',
      },
      {
        title: 'Step through time',
        copy: 'At selected landmarks, press and hold to compare what you see today with an evidence-based reconstruction of ancient Rome.',
      },
    ],
  },

  'how-it-works': {
    id: 'how-it-works',
    headline: 'Start walking. Rome will meet you there.',
    steps: [
      {
        title: 'Choose the Rome journey',
        copy: 'Start when you are ready. Every stop on one route. Take it in a day or across the trip.',
        mockup: 'journey',
      },
      {
        title: 'Follow the route',
        copy: 'A warm, simple map guides you between landmarks. Download before you leave the hotel.',
        mockup: 'map',
      },
      {
        title: 'Arrive and listen',
        copy: 'When you reach a landmark, ChronoWalk opens the story exactly where it happened.',
        mockup: 'audio',
      },
      {
        title: 'Reveal the past',
        copy: 'Press and hold to cross from today’s ruins into a reconstruction of the ancient scene.',
        mockup: 'threshold',
      },
    ],
  },

  lifestyle: {
    banners: [
      {
        id: 'shared-moments',
        tone: 'warm',
        imageKey: 'forum',
        placeholderLabel: 'Couple sharing headphones at the Roman Forum',
        caption:
          'Designed for shared moments. Pause for espresso, step into shade, or explore at your own pace.',
      },
      {
        id: 'heads-up',
        tone: 'cool',
        imageKey: 'pantheon',
        placeholderLabel: 'Traveler looking up at the Pantheon portico',
        caption:
          'Heads-up walking. ChronoWalk uses your location to identify the stop in front of you so your eyes stay on Rome.',
      },
    ],
  },

  'free-preview': {
    id: 'free-preview',
    ...FREE_PREVIEW,
    cta: 'The Pantheon',
  },

  'rome-tiers': {
    id: 'pricing',
    headline: 'Choose how much of Rome you want.',
    subheadline: 'One purchase. No subscription. Prepare the walk before you leave Wi-Fi and keep access afterward.',
    tiers: ROME_TIERS,
  },

  [ROME_JOURNEY_SECTION_ID]: {
    id: ROME_JOURNEY_SECTION_ID,
    headline: 'Your first city: Rome.',
    productTitle: 'ChronoWalk Rome',
    routeStops: ['Colosseum', 'Roman Forum', 'The Pantheon', 'Trevi Fountain', 'Spanish Steps'],
    highlightBullets: ['21 stops', 'Your pace', 'Offline-ready'],
    bullets: ROME_TIERS[1].bullets,
    tiers: ROME_TIERS,
    priceLine: `${PRICE_PLACEHOLDER} · one purchase · yours to walk whenever`,
    primaryCta: LANDING_CTA.begin,
    secondaryCta: LANDING_CTA.tryFree,
    secondaryPreview: FREE_PREVIEW,
  },

  credibility: {
    id: 'credibility',
    headline: 'Cinematic, but grounded.',
    copy:
      'Stories are thoroughly researched, reconstructions are evidence-based, and interpretive details are clearly noted. No fake certainty. No generic AI narration.',
  },

  'final-cta': {
    id: 'final-cta',
    /** Prompt 16: film-frame closing; minimal copy, no pricing/feature repetition. */
    headline: 'Rome has waited two thousand years.',
    bodyLines: [
      'You do not have to understand it all in one day.',
      'Begin where you are. Continue at your own pace.',
    ],
    primaryCta: LANDING_CTA.tryOneStopFree,
    secondaryCta: LANDING_CTA.exploreRomeRoutes,
  },

  faq: {
    id: 'faq',
    eyebrow: null,
    headline: 'Frequently Asked Questions',
    groups: [
      {
        id: 'understanding',
        label: 'Understanding the product',
        items: [
          {
            id: 'what-is-chronowalk',
            q: 'What is ChronoWalk?',
            a: 'ChronoWalk is a self-guided audio walking tour of Rome that opens in your browser. It uses your location to show the relevant stop, play the story tied to that place, and help you continue through the route at your own pace.',
          },
          {
            id: 'different-from-podcast',
            q: 'How is it different from a podcast?',
            a: 'A podcast normally plays in a fixed sequence. ChronoWalk ties each chapter to a real stop and combines the narration with directions, maps, Then vs Now reconstructions, and saved progress.',
          },
          {
            id: 'different-from-audio-tours',
            q: 'How is it different from other audio tours?',
            a: 'ChronoWalk combines place-tied narration, evidence-based reconstructions, flexible stop order, directions, offline preparation, and saved progress in one browser-based walk.',
          },
          {
            id: 'group-tour',
            q: 'Is it a group tour?',
            a: 'No. There is no guide, meeting point, or fixed departure time. You walk independently or use a Couple or Family purchase to walk together on separate phones.',
          },
        ],
      },
      {
        id: 'using-in-rome',
        label: 'Using it in Rome',
        items: [
          {
            id: 'offline',
            q: 'Does it work offline?',
            a: 'You need a connection to open and prepare the walk initially. Once the required content has been prepared, you can continue using that content when mobile signal is weak or unavailable.',
          },
          {
            id: 'mobile-data',
            q: 'Do I need mobile data?',
            a: 'Not throughout the walk if you prepare the content in advance. Location services may still be used by your phone, but the prepared audio and visual content does not require continuous mobile data.',
          },
          {
            id: 'gps-inaccurate',
            q: 'What happens if GPS is inaccurate?',
            a: 'You can open the relevant stop manually from the app. Location works best outdoors in open streets and squares.',
          },
          {
            id: 'pause-continue',
            q: 'Can I pause and continue later?',
            a: 'Yes. You can leave the route, return later, and continue from your saved progress where supported.',
          },
          {
            id: 'tickets',
            q: 'Do I need tickets for every stop?',
            a: 'No. Many ChronoWalk stops are experienced from public streets, squares, paths, or viewpoints. Where a stop involves a ticketed site, ChronoWalk does not include or replace the required entrance ticket.',
          },
        ],
      },
      {
        id: 'purchase-access',
        label: 'Purchase and access',
        items: [
          {
            id: 'subscription',
            q: 'Is it a subscription?',
            a: 'No. ChronoWalk is a one-time purchase.',
          },
          {
            id: 'keep-access',
            q: 'How long do I keep access?',
            a: 'Your purchase stays available for the trip and after. Reopen your access link whenever you want to return to the stories.',
          },
          {
            id: 'share-purchase',
            q: 'Can two people share one standard purchase?',
            a: 'A standard purchase is for one person and device. Choose Couple or Family when several people want to use ChronoWalk on their own phones.',
          },
          {
            id: 'device-limit',
            q: 'How many devices does one purchase cover?',
            a: 'One device per standard purchase. Couple includes two people and devices. Family includes up to four. Each redeemed seat receives the full Roma Eterna walk on its own phone.',
          },
          {
            id: 'phones',
            q: 'What phones does it work on?',
            a: 'Modern iPhone or Android in the mobile browser. No App Store installation is required. Location services should be on.',
          },
          {
            id: 'account',
            q: 'Do I need an account?',
            a: 'Access arrives by email as an access link after purchase. The free Pantheon stop opens without creating an account.',
          },
        ],
      },
      {
        id: 'content-trust',
        label: 'Content and trust',
        items: [
          {
            id: 'narration-ai',
            q: 'Is the narration AI-generated?',
            a: 'Scripts are researched and studio-written for this Rome route, not an LLM producing a generic tour. Ordinary tools (some AI-assisted) may help draft and polish; every line is curated before it reaches you.',
          },
          {
            id: 'reconstructions-researched',
            q: 'How are reconstructions researched?',
            a: 'At selected landmarks, Then vs Now compares today’s view with a reconstruction matched to that vantage. We draw on archaeological and historical sources, and captions note what is interpretive.',
          },
          {
            id: 'historians-disagree',
            q: 'What happens when historians disagree?',
            a: 'ChronoWalk identifies uncertainty and distinguishes supported reconstruction from informed conjecture. We do not claim academic consensus where it does not exist.',
          },
        ],
      },
    ],
  },
}

/** Flat FAQ Q&A list for schema, tests, and deep-link resolution. */
export function getLandingFaqItems(faq = LANDING_CONTENT.faq) {
  return (faq.groups ?? []).flatMap((group) => group.items)
}
