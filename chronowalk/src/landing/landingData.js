/** Stable document anchor for the Rome journey section. */
export const ROME_JOURNEY_SECTION_ID = 'rome-journey'

/** Token replaced at render time with the live price label (e.g. €17). */
export const PRICE_PLACEHOLDER = '{price}'

/** Single landing price fallback — do not duplicate elsewhere. */
export const LANDING_PRICE_FALLBACK_CENTS = 1700
export const LANDING_PRICE_FALLBACK_LABEL = '€17'

export const hostBannerPrefix = 'Recommended by'

export const stickyCta = {
  primary: `Begin Rome · ${PRICE_PLACEHOLDER}`,
  secondary: 'Try free story',
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

export const LANDING_SECTION_ORDER = [
  'hero',
  'problem',
  'no-perfect-itinerary',
  'core-promise',
  'how-it-works',
  'threshold-demo',
  'free-story',
  ROME_JOURNEY_SECTION_ID,
  'better-than',
  'what-you-get',
  'credibility',
  'journey-letter',
  'social-proof',
  'faq',
  'final-cta',
]

export const LANDING_CONTENT = {
  hero: {
    id: 'hero',
    headline: 'Rome,\nas it once was.',
    subheadline:
      'A cinematic walking companion with GPS-guided stories, ancient reconstructions, and a ready-made route through the city’s most legendary places.',
    primaryCta: 'Begin your journey',
    secondaryCta: 'Try a free story',
    supportLines: [
      'No group. No planning spiral. Start today.',
      `Two self-paced days · offline-ready · ${PRICE_PLACEHOLDER}`,
    ],
    audioPreview: {
      title: 'Hear the Pantheon',
      meta: 'Free · 4 minutes',
    },
  },

  problem: {
    id: 'problem',
    headline: 'Most of Rome is hiding in plain sight.',
    paragraphs: [
      'You stand before columns, arches, stones, and empty spaces. You know they mattered. But without the story, they stay silent.',
      'ChronoWalk turns those places back into scenes.',
    ],
  },

  'no-perfect-itinerary': {
    id: 'no-perfect-itinerary',
    headline: 'No perfect itinerary required.',
    paragraphs: [
      'Maybe the tickets sold out. Maybe your tabs are a mess. Maybe you just want to wake up, start walking, and know the day will be worth it.',
      'ChronoWalk gives you a ready-made Rome experience: where to go, what to notice, what happened there, and when to keep walking.',
    ],
    cta: 'Start Rome without the research spiral',
  },

  'core-promise': {
    id: 'core-promise',
    headline: 'A private guide for ancient Rome, in your pocket.',
    subcopy:
      'ChronoWalk guides you from landmark to landmark, begins each story when you arrive, and lets you reveal the ancient city from where you stand.',
    cards: [
      {
        title: 'Walk at your own pace',
        copy: 'No group. No flag. No schedule. Pause for coffee, continue tomorrow, and never feel rushed past the thing you came to see.',
      },
      {
        title: 'Stories where they happened',
        copy: 'The audio begins at the landmark, so the place in front of you becomes part of the story.',
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
        copy: 'Start when you are ready. Walk alone, with a partner, or at your own pace across two days.',
      },
      {
        title: 'Follow the route',
        copy: 'A warm, simple map guides you between landmarks. Download the day before you leave the hotel, and keep walking even with spotty data.',
      },
      {
        title: 'Arrive and listen',
        copy: 'When you reach a landmark, ChronoWalk pauses the map and opens the story exactly where it happened.',
      },
      {
        title: 'Reveal the past',
        copy: 'Press and hold to cross from today’s ruins into a reconstruction of the ancient scene.',
      },
    ],
  },

  'threshold-demo': {
    id: 'threshold-demo',
    headline: 'Press and hold to cross into the past.',
    subheadline:
      'At selected landmarks, ChronoWalk reveals what once stood there — matched to the place in front of you.',
    caption: 'Evidence-based reconstruction · some colors and crowd details are informed conjecture.',
  },

  'free-story': {
    id: 'free-story',
    headline: 'Try one story free.',
    subheadline:
      'Hear the guide, feel the pace, and see how Rome changes when the story begins where it happened.',
    card: {
      title: 'The Pantheon',
      meta: 'Free preview · 4 minutes',
    },
    primaryCta: 'Play free story',
    secondaryCta: 'See the full Rome journey',
  },

  [ROME_JOURNEY_SECTION_ID]: {
    id: ROME_JOURNEY_SECTION_ID,
    headline: 'Your first city: Rome.',
    subheadline:
      'A two-day walk through the places where ancient Rome still presses through the modern city.',
    productTitle: 'ChronoWalk Rome',
    bullets: [
      '22 places',
      'Two self-paced days',
      'GPS-guided stories',
      'Then-and-now reconstructions',
      'Offline-ready',
      'Yours for the journey',
    ],
    primaryCta: 'Begin your journey',
    secondaryCta: 'Try a free story',
    routeLandmarks: ['Colosseum', 'Roman Forum', 'Pantheon', 'Trevi', 'Spanish Steps'],
  },

  'better-than': {
    id: 'better-than',
    headline: 'Better than overplanning. Better than wandering blind.',
    cards: [
      {
        title: 'No research spiral',
        copy: 'ChronoWalk already knows the route, the context, and the moments worth stopping for.',
      },
      {
        title: 'No flag to follow',
        copy: 'Walk at your own pace. Pause for shade, coffee, photos, or a longer look.',
      },
      {
        title: 'No silent stones',
        copy: 'Hear what happened there, who stood there, and what the place once looked like.',
      },
      {
        title: 'No wasted day',
        copy: 'Even when tickets are gone, Rome’s open streets still hold extraordinary stories.',
      },
    ],
  },

  'what-you-get': {
    id: 'what-you-get',
    headline: 'Everything you need for Rome’s ancient heart.',
    items: [
      'A ready-made ancient Rome route',
      'GPS-guided walking between landmarks',
      'Premium stories that begin on location',
      'Then-and-now reconstructions',
      'Offline access for the day',
      'Readable transcripts',
      'Pause, detour, and resume anytime',
      'Clear next steps after every stop',
      'A journey summary to save or share',
    ],
    valueLine: `${PRICE_PLACEHOLDER} · one purchase · two self-paced days`,
  },

  credibility: {
    id: 'credibility',
    headline: 'Cinematic, but grounded.',
    copy: 'ChronoWalk is designed to make ancient Rome vivid without pretending certainty where history is incomplete. Stories are researched, reconstructions are evidence-based, and interpretive details are clearly noted.',
    trustMarkers: [
      'Historically researched scripts',
      'Evidence-based reconstruction notes',
      'Clear distinction between known and interpretive details',
      'No fake certainty',
      'No generic AI narration',
    ],
  },

  'journey-letter': {
    id: 'journey-letter',
    headline: 'End with something worth keeping.',
    copy: 'After your walk, ChronoWalk creates a quiet journey letter — a visual memory of where you stood, what you heard, and how far through time you traveled.',
    mockLetter: {
      date: 'Rome · 12 August 2026',
      reflection: 'Today you stood where an empire decided the fate of the world.',
      stats: '22 places · 9.4 km · twenty centuries',
    },
  },

  'social-proof': {
    id: 'social-proof',
    headline: 'For travelers who want more than photos.',
    quotes: [
      'I finally understood what I was looking at.',
      'It felt like Rome changed while I was standing there.',
      'Way better than following a group with a flag.',
      'The reconstruction moment sold it.',
    ],
  },

  faq: {
    id: 'faq',
    items: [
      {
        q: 'Is this a group tour?',
        a: 'No. ChronoWalk is self-guided. Start when you want, pause when you want, and walk at your own pace.',
      },
      {
        q: 'Does it work offline?',
        a: 'ChronoWalk is designed so you can download the day’s route and stories before walking. GPS works best outdoors, especially in open streets and squares.',
      },
      {
        q: 'Is it just an audio guide?',
        a: 'No. Audio is only part of it. ChronoWalk guides your route, begins stories when you arrive, and reveals then-and-now reconstructions at selected landmarks.',
      },
      {
        q: 'Is it historically accurate?',
        a: 'The stories are researched, and reconstructions are presented with notes when details are interpretive or uncertain.',
      },
      {
        q: 'What if tickets are sold out?',
        a: 'ChronoWalk does not replace ticketed entry where tickets are required, but it turns Rome’s open streets, ruins, piazzas, façades, and viewpoints into a guided historical experience.',
      },
      {
        q: 'Can I use it with someone else?',
        a: 'Yes. Many people will walk with a partner or friend. Use headphones, share earbuds, or listen quietly where appropriate.',
      },
      {
        q: 'How long does it take?',
        a: 'The Rome journey is designed across two self-paced walking days. You can stop and continue later.',
      },
      {
        q: 'What if I get lost?',
        a: 'The map helps you return to the route gently. And if Rome distracts you, that is part of the walk.',
      },
    ],
  },

  'final-cta': {
    id: 'final-cta',
    paragraphs: [
      'Rome is already waiting.',
      'The stones are there.\nThe streets are there.\nThe stories are still there.',
      'You do not need a perfect itinerary.\nYou just need to start walking.',
    ],
    primaryCta: 'Begin your journey',
    secondaryCta: 'Try a free story',
    trustLine: `Rome · two self-paced days · 22 places · ${PRICE_PLACEHOLDER}`,
  },
}

/**
 * Skeleton-friendly section list for the current landing JSX.
 * Full structured copy lives in LANDING_CONTENT.
 */
export const LANDING_SECTIONS = LANDING_SECTION_ORDER.map((sectionId) => {
  const section = LANDING_CONTENT[sectionId]
  const headline = section.headline ?? sectionId
  const placeholder =
    section.paragraphs?.[0] ??
    section.subheadline ??
    section.subcopy ??
    section.copy ??
    headline

  return {
    id: sectionId,
    title: headline,
    placeholder,
    content: section,
  }
})
