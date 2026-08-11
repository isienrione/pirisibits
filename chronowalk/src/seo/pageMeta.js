/**
 * Per-route document title / description / social image for indexable pages.
 * Canonical + robots remain in siteRoutes.js (DocumentSeo).
 */

import { LANDING_DOCUMENT, LANDING_DOCUMENT_ES } from '../landing/landingSeo.js'
import { LOCALES, normalizeLocale } from '../i18n/locales.js'
import { PRODUCTION_ORIGIN, toAbsoluteUrl } from './siteRoutes.js'

/** @typedef {{ title: string, description: string, ogImage: string, ogImageAlt?: string }} PageMeta */

/** Default OG image for ChronoWalk marketing pages. */
export const DEFAULT_OG_IMAGE = `${PRODUCTION_ORIGIN}/landing/real-moment/forum.jpg`

/** @type {Readonly<Record<string, PageMeta>>} */
export const PAGE_META_BY_PATH = Object.freeze({
  '/': Object.freeze({
    title: LANDING_DOCUMENT.title,
    description: LANDING_DOCUMENT.description,
    ogImage: `${PRODUCTION_ORIGIN}/landing/cinematic/hero/desktop.webp`,
    ogImageAlt: 'ChronoWalk self-guided Rome walking experience',
  }),
  '/free-pantheon': Object.freeze({
    title: 'Free Pantheon Audio Guide Experience | ChronoWalk Rome',
    description:
      'Try Pantheon Part 1 free: the full exterior chapter with immersive audio and Then/Now reconstruction. Opens in your browser; no payment required.',
    ogImage: `${PRODUCTION_ORIGIN}/landing/real-moment/pantheon.jpg`,
    ogImageAlt: 'The Pantheon exterior in Rome',
  }),
  '/ancient-rome': Object.freeze({
    title: 'Ancient Rome Self-Guided Audio Walking Tour | ChronoWalk',
    description:
      'Explore the Colosseum, Roman Forum and Palatine area through immersive audio, flexible walking routes and visual reconstructions.',
    ogImage: `${PRODUCTION_ORIGIN}/landing/real-moment/forum.jpg`,
    ogImageAlt: 'Ancient Rome ruins with ChronoWalk',
  }),
  '/how-it-works': Object.freeze({
    title: 'How ChronoWalk Works | Self-Guided Rome Audio Tour',
    description:
      'See how ChronoWalk opens in your browser, guides you through Rome, plays immersive audio and reveals Then/Now reconstructions.',
    ogImage: `${PRODUCTION_ORIGIN}/landing/hero-slides/then-now.png`,
    ogImageAlt: 'ChronoWalk Then/Now reconstruction on a phone',
  }),
  '/contact': Object.freeze({
    title: 'Contact · ChronoWalk',
    description: 'Contact ChronoWalk support for purchase, access, or refund questions.',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'ChronoWalk',
  }),
})

export const PAGE_META_ES_BY_PATH = Object.freeze({
  '/': Object.freeze({
    title: LANDING_DOCUMENT_ES.title,
    description: LANDING_DOCUMENT_ES.description,
    ogImage: `${PRODUCTION_ORIGIN}/landing/cinematic/hero/desktop.webp`,
    ogImageAlt: 'Experiencia autoguiada de ChronoWalk por Roma',
  }),
  '/free-pantheon': Object.freeze({
    title: 'Experiencia gratis con audioguía del Panteón | ChronoWalk Roma',
    description:
      'Prueba gratis la parte 1 del Panteón: el capítulo exterior completo con audio inmersivo y reconstrucción Antes/Ahora. Se abre en el navegador y no requiere pago.',
    ogImage: `${PRODUCTION_ORIGIN}/landing/real-moment/pantheon.jpg`,
    ogImageAlt: 'Exterior del Panteón de Roma',
  }),
  '/ancient-rome': Object.freeze({
    title: 'Recorrido autoguiado con audio por la Roma antigua | ChronoWalk',
    description:
      'Explora el Coliseo, el Foro Romano y el Palatino con audio inmersivo, rutas flexibles y reconstrucciones visuales.',
    ogImage: `${PRODUCTION_ORIGIN}/landing/real-moment/forum.jpg`,
    ogImageAlt: 'Ruinas de la Roma antigua con ChronoWalk',
  }),
  '/how-it-works': Object.freeze({
    title: 'Cómo funciona ChronoWalk | Audioguía autoguiada de Roma',
    description:
      'Descubre cómo ChronoWalk se abre en tu navegador, te guía por Roma, reproduce audio inmersivo y revela reconstrucciones Antes/Ahora.',
    ogImage: `${PRODUCTION_ORIGIN}/landing/hero-slides/then-now.png`,
    ogImageAlt: 'Reconstrucción Antes/Ahora de ChronoWalk en un teléfono',
  }),
  '/contact': Object.freeze({
    title: 'Contacto · ChronoWalk',
    description:
      'Contacta con el soporte de ChronoWalk para consultas sobre compras, acceso o reembolsos.',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'ChronoWalk',
  }),
})

export function getPageMeta(pathname, locale = LOCALES.EN) {
  const path = String(pathname || '').split('?')[0].split('#')[0] || '/'
  const pages = normalizeLocale(locale) === LOCALES.ES ? PAGE_META_ES_BY_PATH : PAGE_META_BY_PATH
  return pages[path] ?? null
}

export function absolutePageUrl(pathname) {
  const path = String(pathname || '').split('?')[0].split('#')[0] || '/'
  return path === '/' ? `${PRODUCTION_ORIGIN}/` : toAbsoluteUrl(path)
}
