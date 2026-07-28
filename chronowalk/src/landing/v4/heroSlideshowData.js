/**
 * Secondary hero slides — full-bleed art from public/landing/hero-slides/.
 * Slide 0 in the hero carousel remains LANDING_HERO (Rome sky); these five
 * follow it. Assets are portrait (≈9:16) marketing frames.
 *
 * width/height are intrinsic pixel sizes so the frame does not collapse before
 * decode (especially important on iOS when slides toggle via opacity/inert).
 */
export const HERO_SLIDESHOW_SLIDES = [
  {
    id: 'then-now',
    title: 'ChronoWalk Rome. Walk freely, keep the context.',
    src: '/landing/hero-slides/then-now.png',
    width: 1024,
    height: 1536,
  },
  {
    id: 'ruin-room',
    title: 'The ruin becomes the room.',
    src: '/landing/hero-slides/ruin-room.png',
    width: 941,
    height: 1672,
  },
  {
    id: 'gps-guidance',
    title: 'Smart GPS Guidance.',
    src: '/landing/hero-slides/gps-guidance.png',
    width: 1024,
    height: 1536,
  },
  {
    id: 'audio-narratives',
    title: 'Deep Audio Narratives.',
    src: '/landing/hero-slides/audio-narratives.png',
    width: 1086,
    height: 1448,
  },
  {
    id: 'choose-your-walk',
    title: 'Choose your Roman walk.',
    src: '/landing/hero-slides/choose-your-walk.png',
    width: 1024,
    height: 1536,
  },
]

/** Portrait phone screens for mockups elsewhere on the landing. */
export const LANDING_PHONE_MOCKUPS = [
  '/landing/phone-mockups/screen-01.png',
  '/landing/phone-mockups/screen-02.png',
  '/landing/phone-mockups/screen-03.png',
  '/landing/phone-mockups/screen-04.png',
]
