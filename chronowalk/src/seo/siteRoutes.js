/**
 * Production SEO route inventory - keep in sync with AppRouter + footer legal links.
 * robots.txt / sitemap.xml under public/ are the deploy artifacts; this module is the
 * source of truth for tests and document meta (canonical vs noindex).
 */

export const PRODUCTION_ORIGIN = 'https://chronowalk.com'

/** Canonical public marketing / legal / contact paths (sitemap + indexable). */
export const INDEXABLE_PUBLIC_PATHS = Object.freeze([
  '/',
  '/contact',
  '/legal/terms',
  '/legal/privacy',
  '/legal/refund',
])

/**
 * Paths (or prefixes) that must not be indexed: credential, transactional,
 * paid app shell, and internal preview/debug surfaces.
 */
export const NOINDEX_PATH_PREFIXES = Object.freeze([
  '/access',
  '/invite',
  '/setup',
  '/begin',
  '/tour',
  '/journey',
  '/map',
  '/stops',
  '/journal',
  '/letter',
  '/settings',
  '/walk-together',
  '/purchase',
  '/checkout',
  '/no-ticket',
  '/welcome',
  '/preview',
  '/credits',
])

export function toAbsoluteUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${PRODUCTION_ORIGIN}${normalized}`
}

export function isIndexablePublicPath(pathname) {
  const path = String(pathname || '').split('?')[0].split('#')[0]
  return INDEXABLE_PUBLIC_PATHS.includes(path)
}

export function isNoindexPath(pathname) {
  const path = String(pathname || '').split('?')[0].split('#')[0]
  if (!path || path === '/') return false
  return NOINDEX_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

/**
 * Document SEO policy for a React Router pathname.
 * @returns {{ robots: string, canonicalHref: string | null }}
 */
export function resolveDocumentSeo(pathname) {
  const path = String(pathname || '').split('?')[0].split('#')[0] || '/'

  if (isIndexablePublicPath(path)) {
    return {
      robots: 'index,follow',
      // Homepage canonical must be exactly https://chronowalk.com/
      canonicalHref: path === '/' ? `${PRODUCTION_ORIGIN}/` : toAbsoluteUrl(path),
    }
  }

  if (isNoindexPath(path)) {
    return {
      robots: 'noindex,nofollow',
      canonicalHref: null,
    }
  }

  // Unknown / catch-all → do not advertise for indexing.
  return {
    robots: 'noindex,nofollow',
    canonicalHref: null,
  }
}
