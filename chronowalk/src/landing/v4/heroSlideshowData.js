/**
 * Secondary hero slides — full-bleed art from public/landing/hero-slides/.
 * Keep these images intact; only swap files when design exports are corrected.
 *
 * Known baked-in art deltas vs live catalog (re-export when ready):
 * - coverage.png: says 22 stops (product is 21; no Forum of Augustus)
 * - packages.png: $17.99 / $12 / 13 / 7 stops (live: €14.99 / €9.99, 12 / 8)
 * - intelligent-nav.png: phone map shows Santiago streets (demo GPS fixture)
 */
export const HERO_SLIDESHOW_SLIDES = [
  {
    id: 'then-now',
    title: 'ChronoWalk Rome. Walk freely, keep the context.',
    src: '/landing/hero-slides/then-now.png',
  },
  {
    id: 'ruin-room',
    title: 'The Ruin Becomes the Room.',
    src: '/landing/hero-slides/ruin-room.png',
  },
  {
    id: 'gps-guidance',
    title: 'Smart GPS Guidance.',
    src: '/landing/hero-slides/gps-guidance.png',
  },
  {
    id: 'audio-narratives',
    title: 'Deep Audio Narratives.',
    src: '/landing/hero-slides/audio-narratives.png',
  },
  {
    id: 'intelligent-nav',
    title: 'Intelligent Navigation.',
    src: '/landing/hero-slides/intelligent-nav.png',
  },
  {
    id: 'evidence',
    title: 'Evidence You Can Check.',
    src: '/landing/hero-slides/evidence.png',
  },
  {
    id: 'coverage',
    title: 'Comprehensive Coverage.',
    src: '/landing/hero-slides/coverage.png',
  },
  {
    id: 'packages',
    title: 'Flexible Packages.',
    src: '/landing/hero-slides/packages.png',
  },
]

/** Portrait phone screens for mockups elsewhere on the landing. */
export const LANDING_PHONE_MOCKUPS = [
  '/landing/phone-mockups/screen-01.png',
  '/landing/phone-mockups/screen-02.png',
  '/landing/phone-mockups/screen-03.png',
  '/landing/phone-mockups/screen-04.png',
]
