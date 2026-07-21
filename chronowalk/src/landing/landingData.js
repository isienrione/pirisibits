/** Scroll target for the Rome journey / purchase section. */
export const ROME_JOURNEY_SECTION_ID = 'rome-journey'

/** Token replaced at render time with the live price label (e.g. €14.99). */
export const PRICE_PLACEHOLDER = '{price}'

/** Landing-only price fallback — full bundle; do not duplicate elsewhere. */
export const LANDING_PRICE_FALLBACK_CENTS = 1499
export const LANDING_PRICE_FALLBACK_LABEL = '€14.99'

export const hostBannerPrefix = 'Recommended by'

/** Pantheon free-sample narration (manifest.system.preview · ~4 min exterior chapter). */
export const LANDING_PREVIEW_AUDIO_FILE = 'w17_ch1.mp3'

/** Shared CTA labels used across sections. */
export const LANDING_CTA = {
  begin: 'Begin Rome',
  tryFree: 'Try one stop free',
  tryFreeSneakPeek: 'Try one stop free',
  seeRoutes: 'See packages',
  tryOneStopFree: 'Try one stop free',
  /** Secondary CTAs that scroll to `#pricing` (packages), not the route map. */
  exploreRomeRoutes: 'See packages',
}

/** Explicit free-preview product block — Pantheon sample before purchase. */
export const FREE_PREVIEW = {
  title: 'The Pantheon stop',
  meta: 'Free · ~4 minutes',
  copy: 'Narration, GPS arrival, and Threshold — one Pantheon stop before you buy.',
}

/** Tiered Rome journey offerings shown on the landing product showcase. Prices in EUR. */
export const ROME_TIERS = [
  {
    id: 'rome-central',
    name: 'Roma Historica',
    /** @deprecated use `name` — retained for archive / older UI strings */
    eyebrow: 'Roma Historica',
    tierLabel: 'Central',
    bestFor: 'Best for a centro afternoon without park tickets.',
    outcome: 'Walk the living city around the Pantheon — stories at each stop.',
    price: '€9.99',
    priceCents: 999,
    priceNote: 'one-time · taxes included where applicable',
    landmarkLine: "Trajan's Market + Pantheon + centro storico",
    description:
      "Trajan's Market and the living city around the Pantheon — Trevi, Navona, Campo, Argentina, and Castel Sant'Angelo. Outside Parco Archeologico del Colosseo.",
    bullets: [
      "Trajan's Market + full Pantheon chapters + Threshold (same stop as the free preview)",
      'Centro storico stops — no park ticket needed',
    ],
    expandLabel: 'See stop list & inclusions',
    primaryCta: 'Choose Roma Historica',
  },
  {
    id: 'rome-essential',
    name: 'Roma Antica',
    eyebrow: 'Roma Antica',
    tierLabel: 'Ancient',
    bestFor: 'Best for the Colosseum and Forum in one focused walk.',
    outcome: 'Hear the ancient core where it happened — arena to Senate floor.',
    price: '€9.99',
    priceCents: 999,
    priceNote: 'one-time · taxes included where applicable',
    description:
      'The ancient core — Colosseum, Palatine Hill terrace, Roman Forum, Capitoline Hill, and Circus Maximus — with place-tied stories and Threshold at each stop.',
    bullets: [
      'Colosseum, Palatine terrace, Forum, Capitoline Hill & Circus Maximus',
      'Threshold reconstructions at key landmarks',
    ],
    expandLabel: 'See stop list & inclusions',
    primaryCta: 'Choose Roma Antica',
  },
  {
    id: 'rome-complete',
    name: 'Roma Eterna',
    eyebrow: 'Roma Eterna',
    tierLabel: 'Complete',
    bestFor: 'Best for the full city loop — and your own stop order.',
    outcome: 'One continuous Rome from the Arena to the Appian Way, at your pace.',
    price: '€14.99',
    priceCents: 1499,
    priceNote: 'one-time · taxes included where applicable',
    badge: 'Full city loop',
    description:
      'The full Rome walk — archaeological core, centro storico, outer loop, and your own stop order.',
    includesLabel: 'Roma Historica + Roma Antica + the full city loop',
    featuredBullet: 'Choose and re-order your stops (own-pace itinerary)',
    bullets: [
      'All 22 stops — Colosseum and Forum to the Appian Way',
      'Every Threshold reconstruction on the route',
    ],
    expandLabel: 'See stop list & inclusions',
    primaryCta: 'Choose Roma Eterna',
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
  primary: `Begin Rome · ${PRICE_PLACEHOLDER}`,
  secondary: 'Try one stop free',
}

/**
 * Editorial architecture — Act I Promise → Act II Experience → Act III Decision.
 * Keys match LANDING_CONTENT; see docs/LANDING_EDITORIAL_ARCHITECTURE.md.
 */
export const LANDING_SECTION_ORDER = [
  // Act I — The Promise
  'hero',
  'interlude',
  'threshold',
  'early-cta',
  // Act II — The Experience
  'user-flow',
  'real-moment',
  'monuments',
  'benefits',
  'try-free',
  // Act III — The Decision
  'pricing',
  'why',
  'trust',
  'after-rome',
  'faq',
  'final-cta',
]

/** Act landmarks for composition / a11y / navigation (`#act-*`). */
export const LANDING_ACTS = [
  {
    id: 'act-promise',
    label: 'Act I — The Promise',
    index: 'I',
    name: 'The Promise',
    sections: ['hero', 'interlude', 'threshold', 'early-cta'],
  },
  {
    id: 'act-experience',
    label: 'Act II — The Experience',
    index: 'II',
    name: 'The Experience',
    sections: ['user-flow', 'real-moment', 'monuments', 'benefits', 'try-free'],
  },
  {
    id: 'act-decision',
    label: 'Act III — The Decision',
    index: 'III',
    name: 'The Decision',
    sections: ['pricing', 'why', 'trust', 'after-rome', 'faq', 'final-cta'],
  },
]

/**
 * Existing beats remounted lower in Act III so deep links / SEO copy stay live
 * until trust + After Rome fully replace them. Not part of the primary narrative order.
 * Phase 9 — comparison feature matrix removed; benefits appear once only.
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
    eyebrow: 'ChronoWalk · Rome',
    headline: 'Walk until the city starts talking.',
    /** Mirrored by LANDING_EXP_HERO_COPY.a — live headline may be A/B via landingExperiments. */
    accentLine: 'Walk freely. Keep the context.',
    subheadline:
      'Self-guided Rome walks — narration and Threshold tied to the stones in front of you.',
    primaryCta: LANDING_CTA.tryOneStopFree,
    secondaryCta: LANDING_CTA.exploreRomeRoutes,
    /** Calm purchase cue — feature depth lives once under `#benefits`. */
    trustLine: 'One purchase. No subscription. Your pace.',
    phoneLabel: 'Listening at a landmark',
    freeStoryMeta: FREE_PREVIEW.meta,
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
    eyebrow: 'How we build trust',
    headline: 'Evidence you can check.',
    subheadline:
      'Uncertainty is labeled. Reconstructions match the viewpoint in front of you. Sources live where they belong.',
    items: [
      {
        title: 'Uncertainty, labeled',
        body: 'Where the record is thin, we say so. Threshold captions note interpretive details — colors, crowds, conjecture — so the image does not pretend to be a photograph of the past.',
        icon: 'label',
      },
      {
        title: 'Reconstructions from your viewpoint',
        body: 'At selected landmarks, press and hold to compare today’s stones with a researched reconstruction matched to the vantage in front of you — not a stock illustration.',
        icon: 'viewpoint',
      },
      {
        title: 'Scripts written for this route',
        body: 'Narration is researched and produced for ChronoWalk’s Rome walk — curated for this city, not an LLM-only mash-up of unrelated tours.',
        icon: 'script',
      },
      {
        title: 'Preview without an account',
        body: 'The Pantheon stop opens free. Paid packages are one-time purchases — no subscription.',
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
    /** @deprecated Phase 14 — letter card framing replaced by editorial verse. */
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
        /* Listening fills the frame with photo + player — matches the step copy. */
        mockup: 'listening',
      },
    ],
  },

  monuments: {
    id: 'monuments',
    eyebrow: 'The route',
    headline: 'One city.\nOne continuous story.',
    subheadline:
      'From the Arena to the Appian Way, each place changes the meaning of the next.',
    /** Always-on SEO / continuity line — full ordered names stay in the DOM via the trail. */
    routeName: 'Roma Eterna',
    expandLabel: 'See every stop on the route',
    collapseLabel: 'Show the journey highlights',
    previewAriaLabel: 'Journey highlights across Rome',
    fullAriaLabel: 'Complete Rome route by chapter',
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
        title: 'Online when you can — offline when you need',
        body: 'The ideal walk uses the live map. Download the tour on hotel Wi‑Fi first if you’ll turn on airplane mode or lose signal.',
      },
      {
        title: 'Yours to keep',
        body: 'The route stays after the trip — one device per purchase, with discounted shared bundles available.',
      },
    ],
  },

  'try-free': {
    id: 'try-free',
    eyebrow: 'Free sample',
    headline: 'One stop.\nBefore you buy.',
    subheadline: FREE_PREVIEW.copy,
    card: FREE_PREVIEW,
    primaryCta: LANDING_CTA.tryOneStopFree,
    secondaryCta: LANDING_CTA.exploreRomeRoutes,
    trustLine: 'No account.',
    included: 'One Pantheon chapter — narration, arrival, and Threshold (~4 min).',
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
      'At selected landmarks, compare today’s stones with an evidence-based reconstruction of the same view. Colors and crowd details are interpretive where noted — we do not fake certainty.',
    bullets: [
      'Matched to the vantage point in front of you, not a stock illustration',
      'Audio opens when you reach each stop — built for heads-up walking',
      'Reconstructions are researched; gaps are acknowledged in the copy',
    ],
    holdLabel: 'Hold to reveal',
  },

  /**
   * @deprecated Phase 7 — persona cards replaced by `real-moment` scenarios.
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
        body: 'You\'ve seen the names — now hear the scenes, tied to the stones in front of you. The Forum stops feeling like rubble without context.',
      },
      {
        tag: 'Without a group tour',
        title: 'No flag. No crowd of thirty.',
        body: 'Share headphones with a partner, pause for coffee, split the walk across mornings. The route waits — no schedule attached.',
      },
      {
        tag: 'Sold out or no ticket',
        title: 'The city still has stories.',
        body: 'Tickets sold out? Many landmarks are best understood from the edge, the square, or the street. ChronoWalk is built for the Rome you can reach on foot.',
      },
    ],
  },

  /**
   * @deprecated Phase 12 — competitor matrix removed from the live landing.
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
        { value: '22', label: 'places' },
        { value: '9.4 km', label: 'walked' },
        { value: '20', label: 'centuries' },
      ],
    },
  },

  pricing: {
    id: 'pricing',
    headline: 'Pick how much of Rome you want.',
    subheadline: 'One-time purchase — yours for the trip and after.',
    intro:
      'GPS narration, offline download, and the Pantheon preview in every package. One device per purchase — discounted couple, family, and group bundles add synced sharing.',
    footnote:
      'Secure checkout first · Access link arrives by email · Taxes included where applicable · Does not replace ticketed entry where tickets are required',
    accessLinkLabel: 'Already purchased? Enter your access link',
    accessHref: '/access',
    metaTimeLabel: 'Est. duration',
    metaStopsLabel: 'Key stops',
    tiers: ROME_TIERS,
  },

  header: {
    nav: [
      { label: 'Threshold', href: '#threshold' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'What stays', href: '#benefits' },
      { label: 'Try free', href: '#try-free' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    cta: LANDING_CTA.tryOneStopFree,
    ctaShort: 'Try free',
  },

  footer: {
    tagline: 'Self-guided walks for Rome — researched and yours to keep.',
    nav: [
      { label: 'Threshold', href: '#threshold' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'What stays', href: '#benefits' },
      { label: 'Try free', href: '#try-free' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    credit: 'Made for people on foot · ChronoWalk',
    accessLinkLabel: 'Already purchased? Enter access',
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
    headline: 'A private guide for ancient Rome, in your pocket.',
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
        copy: 'Start when you are ready. Every legendary stop on one route — take it in a day or across the trip.',
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
          'Heads-up exploration. GPS triggers the audio automatically so your phone stays in your hand, and your eyes stay on Rome.',
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
    headline: 'Pick how much of Rome you want.',
    subheadline: 'One-time purchase per package — yours for the trip and after.',
    tiers: ROME_TIERS,
  },

  [ROME_JOURNEY_SECTION_ID]: {
    id: ROME_JOURNEY_SECTION_ID,
    headline: 'Your first city: Rome.',
    productTitle: 'ChronoWalk Rome',
    routeStops: ['Colosseum', 'Roman Forum', 'The Pantheon', 'Trevi Fountain', 'Spanish Steps'],
    highlightBullets: ['23 places', 'Your pace', 'Offline-ready'],
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
    /** Prompt 16 — film-frame closing; minimal copy, no pricing/feature repetition. */
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
    headline: 'Questions before you walk',
    groups: [
      {
        id: 'understanding',
        label: 'Understanding the product',
        items: [
          {
            id: 'what-is-chronowalk',
            q: 'What is ChronoWalk?',
            a: 'A self-guided Rome walk on your phone. Stories open when you reach each stop — no tour group, no fixed timetable.',
          },
          {
            id: 'different-from-podcast',
            q: 'How is it different from a podcast?',
            a: 'It is tied to where you stand. Stories and Threshold views match the place in front of you, not a soundtrack you could play anywhere.',
          },
          {
            id: 'different-from-audio-tours',
            q: 'How is it different from other audio tours?',
            a: 'One researched journey written for this Rome route — place-triggered stories and viewpoint reconstructions, built for walking outdoors with your eyes up.',
          },
          {
            id: 'group-tour',
            q: 'Is it a group tour?',
            a: 'No. You walk alone or with whoever you brought, on your own time.',
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
            a: 'The ideal Rome walk works online. If you need airplane mode or lose signal, download the tour on your phone over Wi‑Fi first — then maps and audio stay with you. GPS works best outdoors in open streets and squares.',
          },
          {
            id: 'mobile-data',
            q: 'Do I need mobile data?',
            a: 'Not after you download. Load the tour on hotel or café Wi‑Fi before you leave, then walk offline. GPS does not need a data connection.',
          },
          {
            id: 'gps-inaccurate',
            q: 'What happens if GPS is inaccurate?',
            a: 'You can start the story manually from the app. Triggers work best in open squares and streets.',
          },
          {
            id: 'pause-continue',
            q: 'Can I pause and continue later?',
            a: 'Yes. Pause anytime and pick up again later — one morning or several across the trip.',
          },
          {
            id: 'tickets',
            q: 'Do I need tickets for every stop?',
            a: 'No. Much of the walk is streets, piazzas, and open viewpoints. ChronoWalk does not replace tickets where entry is required.',
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
            a: 'No. One-time purchase per package.',
          },
          {
            id: 'keep-access',
            q: 'How long do I keep access?',
            a: 'The downloaded route stays yours for the trip and after — reopen the stories whenever you like.',
          },
          {
            id: 'share-purchase',
            q: 'Can two people share one purchase?',
            a: 'Each standard purchase unlocks one device. Share headphones on that phone, or choose a discounted couple, family, or group bundle for synced devices on the same walk.',
          },
          {
            id: 'device-limit',
            q: 'How many devices does one purchase cover?',
            a: 'One device per standard purchase. Couple, family, and group bundles add shared seats so each phone can walk in sync.',
          },
          {
            id: 'phones',
            q: 'What phones does it work on?',
            a: 'Modern iPhone or Android in the mobile browser — no App Store download. Location services should be on.',
          },
          {
            id: 'account',
            q: 'Do I need an account?',
            a: 'Not for the free Pantheon preview — you can try it without creating one.',
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
            a: 'No — scripts are researched and studio-written for this Rome route, not an LLM spewing a generic tour. The makers use ordinary tools (some of them AI-assisted) to draft and polish; every line is curated before it reaches you.',
          },
          {
            id: 'reconstructions-researched',
            q: 'How are reconstructions researched?',
            a: 'At selected landmarks, Threshold compares today’s view with a reconstruction matched to that vantage. We draw on archaeological and historical sources; captions note what is interpretive.',
          },
          {
            id: 'historians-disagree',
            q: 'What happens when historians disagree?',
            a: 'We say so. Gaps and uncertainty are labeled in the copy — we do not fake certainty.',
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
