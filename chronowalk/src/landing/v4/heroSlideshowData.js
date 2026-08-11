/**
 * Secondary hero slides - full-bleed art from public/landing/hero-slides/.
 * Slide 0 in the hero carousel remains LANDING_HERO (Rome sky); these frames
 * follow it. Assets are portrait (≈9:16) marketing frames.
 *
 * Package posters (Historica → Antica → Eterna) sit immediately before
 * “Choose your Roman walk”, in ascending list/promo price order.
 * Optional `pricingTarget` deep-links the Buy band to `#pricing` / that tier.
 *
 * width/height are intrinsic pixel sizes so the frame does not collapse before
 * decode (especially important on iOS when slides toggle via opacity).
 *
 * Spanish locale swaps in localized marketing frames under hero-slides/es/
 * when present; English assets and behavior stay untouched.
 */

import { LOCALES, normalizeLocale } from '../../i18n/locales.js'

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
    id: 'package-historica',
    title: 'Roma Historica — Centro Storico & Pantheon.',
    src: '/landing/hero-slides/package-roma-historica.png',
    width: 941,
    height: 1672,
    pricingTarget: 'rome-central',
  },
  {
    id: 'package-antica',
    title: 'Roma Antica — Colosseum, Palatine & Forum.',
    src: '/landing/hero-slides/package-roma-antica.png',
    width: 1024,
    height: 1536,
    pricingTarget: 'rome-essential',
  },
  {
    id: 'package-eterna',
    title: 'Roma Eterna — the complete city loop.',
    src: '/landing/hero-slides/package-roma-eterna.png',
    width: 1024,
    height: 1536,
    pricingTarget: 'rome-complete',
  },
  {
    id: 'choose-your-walk',
    title: 'Choose your Roman walk.',
    src: '/landing/hero-slides/choose-your-walk.png',
    width: 1024,
    height: 1536,
  },
]

/** Spanish marketing frames keyed by English slide id. Missing ids keep EN art. */
export const HERO_SLIDESHOW_ES_BY_ID = Object.freeze({
  'then-now': Object.freeze({
    title: 'ChronoWalk Roma. Camina libremente, mantén el contexto.',
    src: '/landing/hero-slides/es/then-now.png',
    width: 1086,
    height: 1448,
  }),
  'ruin-room': Object.freeze({
    title: 'La ruina se convierte en la sala.',
    src: '/landing/hero-slides/es/ruin-room.png',
    width: 941,
    height: 1672,
  }),
  'gps-guidance': Object.freeze({
    title: 'Guía GPS inteligente.',
    src: '/landing/hero-slides/es/gps-guidance.png',
    width: 1023,
    height: 1537,
  }),
  'audio-narratives': Object.freeze({
    title: 'Narrativas de audio profundas.',
    src: '/landing/hero-slides/es/audio-narratives.png',
    width: 1086,
    height: 1448,
  }),
  'package-historica': Object.freeze({
    title: 'Roma Histórica — Centro histórico y el Panteón.',
    src: '/landing/hero-slides/es/package-roma-historica.png',
    width: 1086,
    height: 1448,
  }),
  'package-antica': Object.freeze({
    title: 'Roma Antigua — Coliseo, Palatino y Foro.',
    src: '/landing/hero-slides/es/package-roma-antica.png',
    width: 1024,
    height: 1535,
  }),
  'package-eterna': Object.freeze({
    title: 'Roma Eterna — el circuito completo de la ciudad.',
    src: '/landing/hero-slides/es/package-roma-eterna.png',
    width: 1086,
    height: 1448,
  }),
})

/** Spanish package poster paths used by pricing cards. */
export const HERO_PACKAGE_CARD_IMAGE_ES = Object.freeze({
  'rome-complete': '/landing/hero-slides/es/package-roma-eterna.png',
  'rome-essential': '/landing/hero-slides/es/package-roma-antica.png',
  'rome-central': '/landing/hero-slides/es/package-roma-historica.png',
})

/**
 * Locale-aware hero story slides. English returns the canonical list unchanged.
 */
export function getHeroSlideshowSlides(locale = LOCALES.EN) {
  if (normalizeLocale(locale) !== LOCALES.ES) return HERO_SLIDESHOW_SLIDES
  return HERO_SLIDESHOW_SLIDES.map((slide) => {
    const override = HERO_SLIDESHOW_ES_BY_ID[slide.id]
    return override ? { ...slide, ...override } : slide
  })
}

/** Portrait phone screens for mockups elsewhere on the landing. */
export const LANDING_PHONE_MOCKUPS = [
  '/landing/phone-mockups/screen-01.png',
  '/landing/phone-mockups/screen-02.png',
  '/landing/phone-mockups/screen-03.png',
  '/landing/phone-mockups/screen-04.png',
]
