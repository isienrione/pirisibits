/**
 * Per-route document title / description / social image for indexable pages.
 * Canonical + robots remain in siteRoutes.js (DocumentSeo).
 */

import { LANDING_DOCUMENT } from '../landing/landingSeo.js'
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
      'Experience a complete Pantheon audio stop free. Explore its history through immersive storytelling and visual reconstruction directly in your browser.',
    ogImage: `${PRODUCTION_ORIGIN}/landing/real-moment/pantheon.jpg`,
    ogImageAlt: 'The Pantheon in Rome',
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

export function getPageMeta(pathname) {
  const path = String(pathname || '').split('?')[0].split('#')[0] || '/'
  return PAGE_META_BY_PATH[path] ?? null
}

export function absolutePageUrl(pathname) {
  const path = String(pathname || '').split('?')[0].split('#')[0] || '/'
  return path === '/' ? `${PRODUCTION_ORIGIN}/` : toAbsoluteUrl(path)
}
