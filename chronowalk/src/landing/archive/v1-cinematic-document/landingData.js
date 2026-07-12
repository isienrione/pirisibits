/** Scroll target for the Rome journey / purchase section. */
export const ROME_JOURNEY_SECTION_ID = 'rome-journey'

/** Token replaced at render time with the live price label (e.g. €17). */
export const PRICE_PLACEHOLDER = '{price}'

/** Landing-only price fallback — do not duplicate elsewhere. */
export const LANDING_PRICE_FALLBACK_CENTS = 1700
export const LANDING_PRICE_FALLBACK_LABEL = '€17'

export const hostBannerPrefix = 'Recommended by'

/** Shared CTA labels used across sections. */
export const LANDING_CTA = {
  begin: 'Begin your journey',
  tryFree: 'Try a free story',
}

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
  'problem',
  'rescue',
  'promise',
  'how-it-works',
  'threshold',
  'rome-journey',
  'credibility',
  'letter',
  'faq',
]

export const LANDING_CONTENT = {
  hero: {
    id: 'hero',
    headline: 'Rome, as it once was.',
    subheadline:
      'A cinematic walking companion with GPS-guided stories, ancient reconstructions, and a ready-made route through the city’s most legendary places.',
    primaryCta: LANDING_CTA.begin,
    secondaryCta: LANDING_CTA.tryFree,
    supportLine: 'No group. No planning spiral. Start today.',
    audioPreview: {
      label: 'Hear the Pantheon',
      meta: 'Free · 4 minutes',
    },
  },

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
      },
      {
        title: 'Follow the route',
        copy: 'A warm, simple map guides you between landmarks. Download before you leave the hotel.',
      },
      {
        title: 'Arrive and listen',
        copy: 'When you reach a landmark, ChronoWalk opens the story exactly where it happened.',
      },
      {
        title: 'Reveal the past',
        copy: 'Press and hold to cross from today’s ruins into a reconstruction of the ancient scene.',
      },
    ],
  },

  threshold: {
    id: 'threshold',
    headline: 'Press and hold to cross into the past.',
    subheadline:
      'At selected landmarks, ChronoWalk reveals what once stood there — matched to the place in front of you.',
    caption:
      'Evidence-based reconstruction · some colors and crowd details are informed conjecture.',
  },

  [ROME_JOURNEY_SECTION_ID]: {
    id: ROME_JOURNEY_SECTION_ID,
    headline: 'Your first city: Rome.',
    productTitle: 'ChronoWalk Rome',
    routeStops: ['Colosseum', 'Roman Forum', 'Pantheon', 'Trevi', 'Spanish Steps'],
    highlightBullets: ['22 places', 'Two self-paced days', 'Offline-ready'],
    bullets: [
      '22 places',
      'Two self-paced days',
      'GPS-guided stories',
      'Then-and-now reconstructions',
      'Offline-ready',
    ],
    priceLine: `${PRICE_PLACEHOLDER} · one purchase · two self-paced days`,
    primaryCta: LANDING_CTA.begin,
    secondaryCta: LANDING_CTA.tryFree,
  },

  credibility: {
    id: 'credibility',
    headline: 'Cinematic, but grounded.',
    copy:
      'Stories are thoroughly researched, reconstructions are evidence-based, and interpretive details are clearly noted. No fake certainty. No generic AI narration.',
  },

  letter: {
    id: 'letter',
    headline: 'End with something worth keeping.',
    copy:
      'After your walk, ChronoWalk creates a quiet journey letter — a visual memory of where you stood, what you heard, and how far through time you traveled.',
    preview: {
      date: 'Rome · 12 August 2026',
      reflection: 'Today you stood where an empire decided the fate of the world.',
      stats: '22 places · 9.4 km · twenty centuries',
    },
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
