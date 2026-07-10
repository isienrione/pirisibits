/** Scroll target for the Rome journey / purchase section. */
export const ROME_JOURNEY_SECTION_ID = 'rome-journey'

/** Token replaced at render time with the live price label (e.g. €17). */
export const PRICE_PLACEHOLDER = '{price}'

/** Landing-only price fallback — do not duplicate elsewhere. */
export const LANDING_PRICE_FALLBACK_CENTS = 1700
export const LANDING_PRICE_FALLBACK_LABEL = '€17'

export const hostBannerPrefix = 'Recommended by'

/** Pantheon free-sample narration (manifest.system.preview · ~4 min exterior chapter). */
export const LANDING_PREVIEW_AUDIO_FILE = 'w17_ch1.mp3'

/** Shared CTA labels used across sections. */
export const LANDING_CTA = {
  begin: 'Begin your journey',
  tryFree: 'Try the Pantheon free',
}

/** Explicit free-preview product block — Pantheon sample before purchase. */
export const FREE_PREVIEW = {
  title: 'The Pantheon Sneak Peek',
  meta: 'Free Preview · 4 minutes',
  copy:
    'Test the cinematic narration, walk the location, and experience exactly how the GPS triggers before spending a single euro.',
}

/** Tiered Rome journey offerings shown on the landing product showcase. */
export const ROME_TIERS = [
  {
    id: 'rome-central',
    eyebrow: 'Roma Historica',
    tierLabel: 'Central',
    price: '€9',
    priceCents: 900,
    priceNote: 'one-time',
    landmarkLine: 'The Pantheon + centro storico',
    description:
      'The Pantheon and the living city around it — Trevi, Navona, Campo, Argentina, and Castel Sant\'Angelo. Outside Parco Archeologico del Colosseo.',
    bullets: [
      'Full Pantheon chapters + Threshold (same stop as the free preview)',
      'Studio-written narration · GPS-triggered on arrival',
      'Download once, walk offline — no park ticket needed',
    ],
    primaryCta: 'Begin Journey',
  },
  {
    id: 'rome-essential',
    eyebrow: 'Roma Antica',
    tierLabel: 'Ancient',
    price: '€12',
    priceCents: 1200,
    priceNote: 'one-time',
    description:
      'The ancient core — Colosseum and Roman Forum — with the full ChronoWalk experience at each stop.',
    bullets: [
      'Studio-written narration (not generic audio tours)',
      'Stories start when you arrive — GPS-triggered',
      'Threshold reconstructions at key landmarks',
      'Download once, walk offline',
    ],
    primaryCta: 'Begin Journey',
  },
  {
    id: 'rome-complete',
    eyebrow: 'Roma Eterna',
    tierLabel: 'Complete',
    price: '€17',
    priceCents: 1700,
    priceNote: 'one-time',
    badge: 'Most Popular',
    description:
      'The full two-day Rome walk — archaeological core, centro storico, outer loop, and your own stop order.',
    includesLabel: 'Roma Historica + Roma Antica + the full city loop',
    featuredBullet: '+ Choose and re-order your stops (own-pace itinerary)',
    bullets: [
      'All 22 stops — Colosseum and Forum to the Appian Way',
      'Every Threshold reconstruction on the route',
      'Journey Letter keepsake after your walk',
    ],
    primaryCta: 'Begin Journey',
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

export const stickyCta = {
  primary: `Begin Rome · ${PRICE_PLACEHOLDER}`,
  secondary: 'Try free story',
}

export const LANDING_SECTION_ORDER = [
  'hero',
  'threshold',
  'experience',
  'personas',
  'comparison',
  'letter',
  'pricing',
]

export const LANDING_CONTENT = {
  hero: {
    id: 'top',
    eyebrow: 'Self-guided walking companion · Rome',
    headline: 'Rome, as it once was.',
    subheadline:
      'Studio-written stories that begin when you arrive. Press and hold to see ancient Rome from where you are standing. One curated route — download it, walk at your pace, no group and no planning spiral.',
    primaryCta: LANDING_CTA.begin,
    secondaryCta: LANDING_CTA.tryFree,
    stats: [
      { value: 'Free', label: 'Pantheon preview before you buy' },
      { value: '2 days', label: 'Self-paced, offline-ready route' },
      { value: '1×', label: 'One-time purchase — no subscription' },
    ],
    freeStoryCta: 'The Pantheon',
    freeStoryMeta: FREE_PREVIEW.meta,
  },

  threshold: {
    id: 'threshold',
    eyebrow: 'The Threshold',
    headline: 'Press and hold. The ruin becomes the room.',
    subheadline:
      'At selected landmarks, compare today’s stones with an evidence-based reconstruction of the same view. Colors and crowd details are interpretive where noted — we do not fake certainty.',
    bullets: [
      'Matched to the vantage point in front of you, not a stock illustration',
      'Audio opens when you reach each stop — built for heads-up walking',
      'Reconstructions are researched; gaps are acknowledged in the copy',
    ],
    holdLabel: 'Hold to reveal',
  },

  experience: {
    id: 'experience',
    eyebrow: 'How it feels',
    headline: 'Walk. Listen. Remember.',
    subheadline:
      'Not a trivia game or a marketplace of random tours — one continuous Rome journey, designed to feel calm on the street.',
    screens: [
      {
        imageKey: 'map',
        title: 'One route, ready to go',
        body: 'A warm map between landmarks. Download at the hotel, then walk without worrying about signal.',
      },
      {
        imageKey: 'listening',
        title: 'Stories where they happened',
        body: 'When you reach a stop, the narration opens. Prefer reading? Switch to the transcript anytime.',
      },
      {
        imageKey: 'letter',
        title: 'The journey letter',
        body: 'After your walk, a quiet keepsake — where you stood, how far you walked, and how deep into time you went.',
      },
    ],
  },

  personas: {
    id: 'personas',
    eyebrow: 'Made for real Rome days',
    headline: 'You do not need a perfect plan to have a perfect walk.',
    items: [
      {
        tag: 'The history lover',
        title: 'You know the names. Now hear the scenes.',
        body: 'You arrive with context in your head, but the Forum can still feel like rubble without a guide. ChronoWalk gives you researched, studio-written narration tied to each place.',
      },
      {
        tag: 'The night-before planner',
        title: 'Close the tabs. Open one route.',
        body: 'You do not need another spreadsheet of pins. Download the journey, wake up, and trust that the day is already worth taking.',
      },
      {
        tag: 'Without a ticket',
        title: 'Sold out is not the end of the story.',
        body: 'Much of Rome’s greatest history is visible from open squares, edges, and façades. ChronoWalk is built for walking the city you can actually reach on foot.',
      },
      {
        tag: 'On your own terms',
        title: 'No flag. No crowd of thirty.',
        body: 'Share headphones, pause for coffee, split the walk across two mornings — the route waits for you.',
      },
    ],
  },

  comparison: {
    id: 'compare',
    eyebrow: 'Why ChronoWalk',
    headline: 'Built for walkers — not screen tourists.',
    columns: [
      { id: 'chrono', label: 'ChronoWalk', tag: 'One curated journey', featured: true },
      { id: 'questo', label: 'Questo', tag: 'Gamified tours' },
      { id: 'voicemap', label: 'VoiceMap', tag: 'Audio marketplace' },
    ],
    rows: [
      {
        feature: 'While you walk',
        chrono: 'Eyes on Rome — stories trigger when you arrive',
        questo: 'Eyes on the phone — puzzles and quizzes in the sun',
        voicemap: 'Eyes on a map — podcasts pinned to coordinates',
      },
      {
        feature: 'The narration',
        chrono: 'One studio-produced epic, written for this route',
        questo: 'Prompt-driven play, not sustained storytelling',
        voicemap: 'Uneven catalog, often text-to-speech',
      },
      {
        feature: 'Seeing the past',
        chrono: 'Press-and-hold Threshold reconstructions',
        questo: false,
        voicemap: false,
      },
      {
        feature: 'The itinerary',
        chrono: 'One offline-ready two-day walk, start to finish',
        questo: 'Variable depth, built around game loops',
        voicemap: 'Pick-and-mix quality across authors',
      },
    ],
    /** @deprecated v1 two-column layout */
    problemColumn: 'The Problem with General Apps',
    solutionColumn: 'The ChronoWalk Experience',
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
    headline: 'Pick your depth. Walk at your own pace.',
    subheadline:
      'One-time purchase. No subscription. Download the route and it is yours for the trip — and after.',
    footnote:
      'Secure checkout · Instant access · Does not replace ticketed entry where tickets are required',
    tiers: ROME_TIERS,
  },

  header: {
    nav: [
      { label: 'The Threshold', href: '#threshold' },
      { label: 'How it works', href: '#experience' },
      { label: 'Why ChronoWalk', href: '#compare' },
      { label: 'Pricing', href: '#pricing' },
    ],
    cta: 'Begin your journey',
  },

  footer: {
    tagline:
      'Cinematic walking stories for ancient Rome — researched, studio-written, and yours to keep.',
    nav: [
      { label: 'The Threshold', href: '#threshold' },
      { label: 'How it works', href: '#experience' },
      { label: 'Pricing', href: '#pricing' },
    ],
    credit: 'Made for travelers on foot.',
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
        copy: 'Start when you are ready. Two self-paced days through the city’s most legendary places.',
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
    headline: 'Pick your depth. Walk at your own pace.',
    subheadline:
      'One-time purchases. No rolling subscriptions. Yours for the whole journey.',
    tiers: ROME_TIERS,
  },

  [ROME_JOURNEY_SECTION_ID]: {
    id: ROME_JOURNEY_SECTION_ID,
    headline: 'Your first city: Rome.',
    productTitle: 'ChronoWalk Rome',
    routeStops: ['Colosseum', 'Roman Forum', 'The Pantheon', 'Trevi Fountain', 'Spanish Steps'],
    highlightBullets: ['22 places', 'Two self-paced days', 'Offline-ready'],
    bullets: ROME_TIERS[1].bullets,
    tiers: ROME_TIERS,
    priceLine: `${PRICE_PLACEHOLDER} · one purchase · two self-paced days`,
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
    headline: 'Rome is already waiting.',
    primaryCta: LANDING_CTA.begin,
    secondaryCta: LANDING_CTA.tryFree,
    footer: 'ChronoWalk · Rome · Self-guided walking journeys',
  },

  faq: {
    id: 'faq',
    headline: 'Frequently asked questions (FAQ)',
    items: [
      {
        q: 'Is this a group tour?',
        a: 'No. ChronoWalk is self-guided. Start when you want, pause when you want, and walk at your own pace.',
      },
      {
        q: 'Does it work offline?',
        a: 'Yes. Download the route and stories before you walk. GPS works best outdoors in open streets and squares.',
      },
      {
        q: 'Do I need tickets for every stop?',
        a: 'ChronoWalk complements Rome’s open streets, ruins, piazzas, and viewpoints. It does not replace ticketed entry where tickets are required — but most of the experience happens in places you can reach on foot.',
      },
      {
        q: 'How long does it take?',
        a: 'The Rome journey is designed across two self-paced walking days. Stop and continue whenever you like.',
      },
    ],
  },
}
