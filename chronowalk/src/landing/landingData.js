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
  tryFreeSneakPeek: 'Try free sneak peek',
  seeRoutes: 'See Rome routes from €9',
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
      'The full Rome walk — archaeological core, centro storico, outer loop, and your own stop order.',
    includesLabel: 'Roma Historica + Roma Antica + the full city loop',
    featuredBullet: '+ Choose and re-order your stops (own-pace itinerary)',
    bullets: [
      'All 22 stops — Colosseum and Forum to the Appian Way',
      'Every Threshold reconstruction on the route',
      'Pause and resume anytime — one day or spread across the trip',
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
  'trust',
  'faq',
  'after-rome',
  'final-cta',
]

/** Act landmarks for composition / a11y (not DOM ids). */
export const LANDING_ACTS = [
  {
    id: 'act-promise',
    label: 'Act I — The Promise',
    sections: ['hero', 'interlude', 'threshold', 'early-cta'],
  },
  {
    id: 'act-experience',
    label: 'Act II — The Experience',
    sections: ['user-flow', 'real-moment', 'monuments', 'benefits', 'try-free'],
  },
  {
    id: 'act-decision',
    label: 'Act III — The Decision',
    sections: ['pricing', 'trust', 'faq', 'after-rome', 'final-cta'],
  },
]

/**
 * Existing beats remounted lower in Act III so deep links / SEO copy stay live
 * until trust + After Rome fully replace them. Not part of the primary narrative order.
 */
export const LANDING_PRESERVED_LOWER_SECTIONS = ['who-its-for', 'comparison']

/** Legacy hash targets kept resolving while content is relocated. */
export const LANDING_LEGACY_DEEPLINK_IDS = ['rome-journey', 'letter']

export const LANDING_CONTENT = {
  hero: {
    id: 'top',
    eyebrow: 'Rome · Walk at your own pace',
    headline: 'Walk until the city starts talking.',
    /** Supporting line — place-tied stories under the transformation headline. */
    accentLine: 'Stories begin when you reach the places where they happened.',
    subheadline:
      'A self-guided Rome experience with cinematic narration, GPS-guided walking and evidence-based reconstructions — on your phone, at your pace.',
    primaryCta: 'Try one stop free',
    secondaryCta: 'Explore Rome routes from €9',
    trustLine: 'No group · No subscription · Download once',
    phoneLabel: 'Listening at a landmark',
    freeStoryMeta: FREE_PREVIEW.meta,
  },

  interlude: {
    id: 'interlude',
    eyebrow: 'Before the route',
    headline: 'Most of Rome is hiding in plain sight.',
    body: 'You stand before columns, arches, stones, and empty spaces. You know they mattered. Without the scene behind them, they stay quiet.',
  },

  'early-cta': {
    id: 'early-cta',
    headline: 'Hear one stop before you decide.',
    subheadline: 'A free Pantheon chapter — then the full Rome routes when you are ready.',
    primaryCta: LANDING_CTA.tryFreeSneakPeek,
    secondaryCta: LANDING_CTA.seeRoutes,
    hint: 'Free Pantheon preview · ~4 min · No account required',
  },

  'real-moment': {
    id: 'real-moment',
    eyebrow: 'In the city',
    headline: 'You arrive. The story opens here.',
    body: 'Reach the Pantheon, the Forum, or the Colosseum and narration begins where it happened — not as a podcast you could play anywhere, but as a scene tied to the stones in front of you.',
    aside: 'Keep your eyes up. The phone only needs to know you have arrived.',
  },

  trust: {
    id: 'trust',
    eyebrow: 'Grounded, not generic',
    headline: 'Cinematic, but researched.',
    subheadline:
      'Stories are thoroughly researched, reconstructions are evidence-based, and interpretive details are clearly noted. No fake certainty. No generic AI narration.',
    items: [
      {
        title: 'Stories where you stand',
        body: 'GPS-triggered narration starts when you reach each stop — built for heads-up walking.',
      },
      {
        title: 'Threshold reconstructions',
        body: 'At selected landmarks, press and hold to compare today’s view with a researched reconstruction of the same vantage.',
      },
      {
        title: 'Yours to keep',
        body: 'One-time purchase. Download once, walk offline — no subscription and no group timetable.',
      },
    ],
  },

  'after-rome': {
    id: 'after-rome',
    eyebrow: 'After the walk',
    headline: 'End with something worth keeping.',
    previewLabel: 'Your Journey Letter',
    reflection:
      'When the route is done, ChronoWalk leaves you with a letter for the day — a keepsake of the places you stopped and the scenes you heard, so Rome stays clearer than a folder of photos.',
    closing: 'The walk is temporary. The way you see the city does not have to be.',
  },

  'user-flow': {
    id: 'how-it-works',
    eyebrow: 'How it works',
    headline: 'Your walk, step by step.',
    subheadline:
      'From download to your first story — everything happens on your phone, on your schedule.',
    steps: [
      {
        step: '1',
        title: 'Download the route',
        body: 'At your hotel or before you fly. Map, stories, and reconstructions — ready offline.',
        mockup: 'journey',
      },
      {
        step: '2',
        title: 'Walk between landmarks',
        body: 'A simple map guides you through Rome. Keep your eyes on the city — GPS handles the rest.',
        mockup: 'map',
      },
      {
        step: '3',
        title: 'Stories start on arrival',
        body: 'Reach the Colosseum, Forum, or Pantheon and the narration opens where it happened.',
        mockup: 'audio',
      },
      {
        step: '4',
        title: 'See the past in place',
        body: 'Press and hold at selected ruins to compare today\'s view with ancient Rome.',
        mockup: 'threshold',
      },
      {
        step: '5',
        title: 'Pause anytime',
        body: 'Coffee, tickets, rain — pick up exactly where you left off. One day or seven mornings.',
        mockup: 'journey',
      },
    ],
  },

  monuments: {
    id: 'monuments',
    eyebrow: 'The route',
    headline: '22 places across ancient and living Rome.',
    subheadline:
      'Colosseum and Forum to Trevi, Navona, Castel Sant\'Angelo, and the Appian Way — each with its own story.',
  },

  benefits: {
    id: 'benefits',
    eyebrow: 'What you get',
    headline: 'A walking guide in your pocket — not a group tour.',
    items: [
      {
        title: 'Stories where you stand',
        body: 'Narration starts when you reach each stop. Keep your eyes on Rome, not your screen.',
      },
      {
        title: 'Never miss the context',
        body: 'Studio-written history tied to each place — the facts and scenes you\'d skip without a guide.',
      },
      {
        title: 'Your trip, your pace',
        body: 'No flag, no crowd of thirty, no timetable. Pause for espresso and continue when you like.',
      },
    ],
  },

  'try-free': {
    id: 'try-free',
    eyebrow: 'Try before you buy',
    headline: 'Free sneak peek — one stop, full experience.',
    subheadline:
      'Not the whole app — one Pantheon chapter, enough to hear the narration, feel the GPS trigger, and decide if ChronoWalk is for you.',
    card: FREE_PREVIEW,
    primaryCta: LANDING_CTA.tryFreeSneakPeek,
    secondaryCta: 'See full Rome routes',
    trustLine: 'No account required · Same stop included in every Rome package',
  },

  threshold: {
    id: 'threshold',
    eyebrow: 'What makes it different',
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

  comparison: {
    id: 'compare',
    eyebrow: 'Why ChronoWalk',
    headline: 'Freedom to wander — with the depth of a great guide.',
    columns: [
      { id: 'chrono', label: 'ChronoWalk', tag: 'Self-guided on your phone', featured: true },
      { id: 'apps', label: 'Other audio tour apps', tag: 'Downloadable tours' },
      { id: 'museums', label: 'Museum audioguides', tag: 'Indoor headsets' },
      { id: 'groups', label: 'Free walking tours', tag: 'Group on the street' },
    ],
    rows: [
      {
        feature: 'While you walk',
        chrono: 'Eyes on Rome — stories trigger when you arrive',
        apps: 'Often screen-first — map, quizzes, or checklists in the sun',
        museums: 'One building, one fixed path, one collection',
        groups: 'Follow the guide and the group pace',
      },
      {
        feature: 'The narration',
        chrono: 'One studio-written journey for this route',
        apps: 'Uneven quality across authors and cities',
        museums: 'Room-by-room facts, not a connected city story',
        groups: 'Depends on the guide that day',
      },
      {
        feature: 'Seeing the past',
        chrono: 'Press-and-hold reconstructions at the ruin',
        apps: false,
        museums: 'Usually labels and display cases only',
        groups: 'Verbal description only — hard to picture',
      },
      {
        feature: 'Your schedule',
        chrono: 'Pause anytime — one day or spread across the trip',
        apps: 'Flexible, but you plan the route yourself',
        museums: 'Opening hours and ticket windows',
        groups: 'Fixed start times — rain or shine',
      },
      {
        feature: 'Offline & outdoors',
        chrono: 'Download once — built for streets, piazzas, and ruins',
        apps: 'Varies by app; not always offline-ready',
        museums: 'Indoors only',
        groups: 'Outdoors, but tied to the group',
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
    headline: 'Pick how much of Rome you want.',
    subheadline:
      'Self-guided audio walking tours. One-time purchase — download the route and it is yours for the trip and after.',
    intro:
      'Every package includes GPS-triggered narration, offline download, and the Pantheon preview stop.',
    footnote:
      'Secure checkout · Instant access · Does not replace ticketed entry where tickets are required',
    tiers: ROME_TIERS,
  },

  header: {
    nav: [
      { label: 'Threshold', href: '#threshold' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Try free', href: '#try-free' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    cta: LANDING_CTA.tryFreeSneakPeek,
    ctaShort: 'Try free',
  },

  footer: {
    tagline:
      'Self-guided audio walking tours for Rome — researched, studio-written, and yours to keep.',
    nav: [
      { label: 'Threshold', href: '#threshold' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Try free', href: '#try-free' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
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
    highlightBullets: ['22 places', 'Your pace', 'Offline-ready'],
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
    headline: 'Ready to walk Rome?',
    primaryCta: LANDING_CTA.tryFreeSneakPeek,
    secondaryCta: LANDING_CTA.seeRoutes,
    footer: 'ChronoWalk · Rome · Self-guided walking journeys',
  },

  faq: {
    id: 'faq',
    headline: 'Questions before you walk',
    items: [
      {
        q: 'What is ChronoWalk?',
        a: 'A self-guided walking app for Rome. You follow a route on your phone; stories play when you arrive at each landmark. No tour group, no fixed schedule — wander freely with the history at every stop.',
      },
      {
        q: 'How is this different from a podcast or YouTube video?',
        a: 'ChronoWalk is tied to where you stand. Stories trigger by GPS when you reach each stop, and Threshold reconstructions match the view in front of you. It is one curated Rome route — not a generic audio file you could listen to anywhere.',
      },
      {
        q: 'How is this different from other audio tour apps?',
        a: 'One studio-written journey for Rome — not a marketplace of uneven tours. No quizzes while you walk. Narration is researched and produced for this route; reconstructions are evidence-based where we show the past.',
      },
      {
        q: 'Is this a group tour?',
        a: 'No. You walk alone or with whoever you brought. Start, pause, and continue on your own time.',
      },
      {
        q: 'What does the free sneak peek include?',
        a: 'One full Pantheon chapter — about four minutes of narration at the same stop included in every Rome package. Enough to hear the storytelling, test GPS triggering, and see if the app fits how you like to explore.',
      },
      {
        q: 'Do I need to create an account for the preview?',
        a: 'No account is required for the free Pantheon preview.',
      },
      {
        q: 'Does it work offline?',
        a: 'Yes. Download the route and stories before you walk. GPS works best outdoors in open streets and squares.',
      },
      {
        q: 'Do I need mobile data while walking?',
        a: 'Not after download. Load the package on Wi‑Fi at your hotel; then walk with offline maps and audio. GPS does not require a data connection.',
      },
      {
        q: 'Do I need tickets for every stop?',
        a: 'ChronoWalk complements Rome\'s open streets, ruins, piazzas, and viewpoints. It does not replace ticketed entry where tickets are required — but much of the experience happens in places you can reach on foot.',
      },
      {
        q: 'How long does the full Rome walk take?',
        a: 'However long you like. Some travelers finish in a single day; others spread it across mornings and come back when they feel like it. There is no schedule — pause and resume whenever you like.',
      },
      {
        q: 'Can I walk the stops in any order?',
        a: 'On the Complete package, yes — reorder stops to fit your days. Smaller packages follow a curated route, but you still pause and resume freely.',
      },
      {
        q: 'What is Threshold?',
        a: 'At selected landmarks, press and hold to compare today\'s ruins with an evidence-based reconstruction matched to your vantage point — not a stock illustration. Interpretive details are noted where historians disagree.',
      },
      {
        q: 'Is the narration AI-generated?',
        a: 'No. Stories are studio-written and researched for this route. We do not use generic text-to-speech tours.',
      },
      {
        q: 'Is it a subscription?',
        a: 'No. One-time purchase per package. Download the route and it is yours for the trip and after.',
      },
      {
        q: 'Can two people share one purchase?',
        a: 'Yes. Many travelers share one phone or use two sets of headphones. One purchase covers your device.',
      },
      {
        q: 'What if GPS is inaccurate?',
        a: 'GPS works best in open squares and streets. If a trigger is slow, you can start the story manually from the app. We design stops for outdoor vantage points.',
      },
      {
        q: 'What cities are available?',
        a: 'Rome is available now. ChronoWalk is built city by city — Rome is the first journey.',
      },
      {
        q: 'What phones does it work on?',
        a: 'ChronoWalk runs in your mobile browser as a progressive web app — no App Store download required. Use a modern iPhone or Android phone with location services enabled.',
      },
    ],
  },
}
