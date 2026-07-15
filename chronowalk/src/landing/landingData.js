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
  title: 'The Pantheon stop',
  meta: 'Free · ~4 minutes',
  copy:
    'Hear the narration, experience the GPS-triggered arrival and try Threshold before choosing a route.',
}

/** Tiered Rome journey offerings shown on the landing product showcase. */
export const ROME_TIERS = [
  {
    id: 'rome-central',
    name: 'Roma Historica',
    /** @deprecated use `name` — retained for archive / older UI strings */
    eyebrow: 'Roma Historica',
    tierLabel: 'Central',
    bestFor: 'Best for a centro afternoon without park tickets.',
    outcome: 'Walk the living city around the Pantheon with stories that meet you at each stop.',
    price: '€9',
    priceCents: 900,
    priceNote: 'one-time',
    landmarkLine: 'The Pantheon + centro storico',
    description:
      'The Pantheon and the living city around it — Trevi, Navona, Campo, Argentina, and Castel Sant\'Angelo. Outside Parco Archeologico del Colosseo.',
    bullets: [
      'Full Pantheon chapters + Threshold (same stop as the free preview)',
      'Centro storico stops — no park ticket needed',
    ],
    expandLabel: 'See every stop and inclusion',
    primaryCta: 'Begin Journey',
  },
  {
    id: 'rome-essential',
    name: 'Roma Antica',
    eyebrow: 'Roma Antica',
    tierLabel: 'Ancient',
    bestFor: 'Best for the Colosseum and Forum in one focused walk.',
    outcome: 'Hear the ancient core where it happened — arena stones to Senate floor.',
    price: '€12',
    priceCents: 1200,
    priceNote: 'one-time',
    description:
      'The ancient core — Colosseum and Roman Forum — with the full ChronoWalk experience at each stop.',
    bullets: [
      'Colosseum and Roman Forum stops',
      'Threshold reconstructions at key landmarks',
    ],
    expandLabel: 'See every stop and inclusion',
    primaryCta: 'Begin Journey',
  },
  {
    id: 'rome-complete',
    name: 'Roma Eterna',
    eyebrow: 'Roma Eterna',
    tierLabel: 'Complete',
    bestFor: 'Best for the full city loop — and your own stop order.',
    outcome: 'One continuous Rome from the Arena to the Appian Way, at your pace.',
    price: '€17',
    priceCents: 1700,
    priceNote: 'one-time',
    badge: 'Most popular',
    description:
      'The full Rome walk — archaeological core, centro storico, outer loop, and your own stop order.',
    includesLabel: 'Roma Historica + Roma Antica + the full city loop',
    featuredBullet: 'Choose and re-order your stops (own-pace itinerary)',
    bullets: [
      'All 22 stops — Colosseum and Forum to the Appian Way',
      'Every Threshold reconstruction on the route',
    ],
    expandLabel: 'See every stop and inclusion',
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

/**
 * Approved traveler quotes for the landing trust section.
 * Keep empty until a quote is explicitly stored AND approved for marketing use.
 * Shape: { id, quote, attribution, context? }
 * Do not invent testimonials, ratings, or user counts.
 */
export const LANDING_VERIFIED_REVIEWS = []

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
  'why',
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
    sections: ['pricing', 'why', 'trust', 'faq', 'after-rome', 'final-cta'],
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
    eyebrow: 'Rome · On foot',
    headline: 'Walk until the city starts talking.',
    /** Supporting line — place-tied stories under the transformation headline. */
    accentLine: 'Stories begin when you reach the places where they happened.',
    subheadline:
      'A self-guided Rome experience — cinematic stories tied to the stones in front of you.',
    primaryCta: 'Try one stop free',
    secondaryCta: 'Explore Rome routes from €9',
    /** Purchase objections near CTA; feature depth lives once under `#benefits`. */
    trustLine: 'No group · No subscription · One-time purchase',
    phoneLabel: 'Listening at a landmark',
    freeStoryMeta: FREE_PREVIEW.meta,
  },

  interlude: {
    id: 'interlude',
    line1: 'Rome is loud.',
    line2: "History isn't.",
    line3: "That's why the story waits until you arrive.",
  },

  'early-cta': {
    id: 'early-cta',
    headline: null,
    subheadline: null,
    primaryCta: 'Try the Pantheon stop free',
    secondaryCta: null,
    hint: 'Free Pantheon preview · ~4 min · No account required',
  },

  'real-moment': {
    id: 'real-moment',
    eyebrow: 'Real moments',
    headline: 'Rome on your terms.',
    scenarios: [
      {
        prompt: 'No ticket?',
        lines: ['The monument may be sold out.', 'The city isn’t.'],
      },
      {
        prompt: 'Free afternoon?',
        lines: ['Begin where you are.', 'Pause when Rome distracts you.'],
      },
      {
        prompt: 'Love to wander?',
        lines: [
          'Keep the freedom, but skip the inevitable FOMO.',
          'Lose the feeling that you are missing everything.',
        ],
      },
      {
        prompt: 'History curious?',
        lines: ['The stones stop looking like rubble once the story begins.'],
      },
    ],
  },

  trust: {
    id: 'trust',
    eyebrow: 'How we build trust',
    headline: 'Honest about what we know — and what we don’t.',
    subheadline:
      'ChronoWalk is still early. We don’t invent reviews or star ratings. Here’s the product evidence we can stand behind today.',
    items: [
      {
        title: 'Uncertainty, labeled',
        body: 'Where the record is thin, we say so. Threshold captions note interpretive details — colors, crowds, and conjecture — so the image doesn’t pretend to be a photograph of the past.',
      },
      {
        title: 'Reconstructions from your viewpoint',
        body: 'At selected landmarks, press and hold to compare today’s stones with a researched reconstruction matched to the vantage in front of you — not a stock illustration.',
      },
      {
        title: 'Scripts written for this route',
        body: 'Narration is researched and produced for ChronoWalk’s Rome journey — one studio-written path for this city, not a mash-up of unrelated tours.',
      },
      {
        title: 'Try before you buy',
        body: 'The Pantheon preview needs no account. Paid packages are one-time purchases — no subscription.',
      },
      {
        title: 'Tickets stay honest',
        body: 'ChronoWalk does not replace ticketed entry where tickets are required. Much of the walk happens on streets, piazzas, and open viewpoints.',
      },
    ],
    imageryNote:
      'Present-day photographs and reconstruction notes are documented with sources where available.',
    imageryHref: '/credits',
    imageryCta: 'Imagery credits',
    /** Renders only when LANDING_VERIFIED_REVIEWS has approved entries. */
    verifiedReviewsEmptyNote:
      'Traveler quotes will appear here when we have approved ones to share — nothing fabricated in the meantime.',
  },

  why: {
    id: 'why-chronowalk',
    eyebrow: 'Why ChronoWalk',
    headline: 'Freedom to wander.\nThe depth of a great guide.',
    points: [
      'Stories tied to the place where they happened',
      'Evidence-based reconstructions from the viewpoint in front of you',
      'A route that pauses when you do',
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
    headline: 'Three steps. Then Rome.',
    subheadline: 'Ready in minutes.',
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
        body: 'A map that follows your walk.',
        mockup: 'map',
      },
      {
        step: '3',
        title: 'Arrive, listen, reveal',
        body: 'Open the story when you arrive.',
        mockup: 'audio',
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
        title: 'Stories right where you are standing',
        body: 'The narration begins at the place it belongs.',
      },
      {
        title: 'Your trip, your pace',
        body: 'Pause, split the route or return another morning.',
      },
      {
        title: 'Downloaded once',
        body: 'The journey works without relying on a constant signal.',
      },
      {
        title: 'Yours to keep',
        body: 'Return to the stories after the trip.',
      },
    ],
  },

  'try-free': {
    id: 'try-free',
    eyebrow: 'Try before you buy',
    headline: 'One stop.\nThe full ChronoWalk feeling.',
    subheadline:
      'Hear the narration, experience the GPS-triggered arrival and try Threshold before choosing a route.',
    card: FREE_PREVIEW,
    primaryCta: 'Try the Pantheon stop free',
    secondaryCta: 'Explore all Rome routes',
    trustLine: 'No account required.',
    included: 'Included: one Pantheon chapter (~4 min) — narration, GPS arrival, and Threshold.',
    notIncluded: 'Not included: the full Rome route or every stop on a paid package.',
  },

  threshold: {
    id: 'threshold',
    eyebrow: 'Threshold',
    headline: 'Press and hold. The ruin becomes the room.',
    headlineLines: ['Press and hold.', 'The ruin becomes the room.'],
    body: 'At selected landmarks, compare what stands today with an evidence-based reconstruction from the same viewpoint.',
    support: 'Where historians disagree, we say so.',
    disclaimer:
      'Colors and crowd details are interpretive where noted — we do not fake certainty. Gaps in the record are acknowledged in the experience.',
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
    headline: 'Freedom to wander — with the depth of a great guide.',
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
    subheadline: 'One-time purchase per package — yours for the trip and after.',
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
      { label: 'What stays', href: '#benefits' },
      { label: 'Try free', href: '#try-free' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    cta: LANDING_CTA.tryFreeSneakPeek,
    ctaShort: 'Try free',
  },

  footer: {
    tagline: 'Self-guided walking stories for Rome — researched and yours to keep.',
    nav: [
      { label: 'Threshold', href: '#threshold' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'What stays', href: '#benefits' },
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
        q: 'How is this different from a podcast?',
        a: 'ChronoWalk is tied to where you stand. Stories open when you reach each stop, and Threshold reconstructions match the view in front of you — so the place becomes part of the scene, not a soundtrack you could play anywhere.',
      },
      {
        q: 'How is this different from other audio tours?',
        a: 'One studio-written journey for this Rome route: researched narration, place-triggered stories, and evidence-based reconstructions where we show the past. Built for heads-up walking outdoors — not a checklist of rooms indoors.',
      },
      {
        q: 'Is this a group tour?',
        a: 'No. You walk alone or with whoever you brought. Start, pause, and continue on your own time — there is no flag, fixed start, or group pace to keep.',
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
