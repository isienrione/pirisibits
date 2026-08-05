/**
 * Shared navigation target shape and path helpers.
 */

/**
 * @typedef {Object} NavigationTarget
 * @property {string} kind
 * @property {string | null} [cityId]
 * @property {string | null} [productId]
 * @property {string | null} [routeId]
 * @property {string | null} [stopId]
 * @property {string} pathname Canonical or legacy pathname
 * @property {string} [legacyPath] Original path when aliased
 * @property {Record<string, string>} [query]
 * @property {boolean} [isLegacy]
 * @property {boolean} [isFuture] Future city/product URL capability (not public yet)
 * @property {boolean} [known] false for unknown routes
 */

export const NAVIGATION_KINDS = Object.freeze([
  'platform',
  'landing',
  'city',
  'product',
  'route',
  'journey',
  'begin',
  'complete',
  'preview',
  'purchase',
  'access',
  'invite',
  'setup',
  'tour',
  'map',
  'journal',
  'settings',
  'walk_together',
  'legal',
  'contact',
  'credits',
  'how_it_works',
  'ancient_rome',
  'no_ticket',
  'unknown',
])

/**
 * @param {Partial<NavigationTarget> & { kind: string, pathname: string }} partial
 * @returns {NavigationTarget}
 */
export function createNavigationTarget(partial) {
  return {
    kind: partial.kind,
    cityId: partial.cityId ?? null,
    productId: partial.productId ?? null,
    routeId: partial.routeId ?? null,
    stopId: partial.stopId ?? null,
    pathname: partial.pathname,
    legacyPath: partial.legacyPath ?? null,
    query: partial.query ?? {},
    isLegacy: Boolean(partial.isLegacy),
    isFuture: Boolean(partial.isFuture),
    known: partial.known !== false,
  }
}

/**
 * @param {string} pathOrUrl
 * @returns {{ pathname: string, search: string, query: Record<string, string> }}
 */
export function parsePathOrUrl(pathOrUrl) {
  const raw = String(pathOrUrl ?? '').trim() || '/'
  let pathname = raw
  let search = ''

  try {
    if (/^https?:\/\//i.test(raw)) {
      const url = new URL(raw)
      pathname = url.pathname || '/'
      search = url.search || ''
    } else {
      const q = raw.indexOf('?')
      if (q >= 0) {
        pathname = raw.slice(0, q) || '/'
        search = raw.slice(q)
      }
    }
  } catch {
    pathname = raw.split('?')[0] || '/'
  }

  pathname = normalizePathname(pathname)
  /** @type {Record<string, string>} */
  const query = {}
  if (search) {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`)
    for (const [key, value] of params.entries()) {
      query[key] = value
    }
  }
  return { pathname, search, query }
}

/**
 * @param {string} pathname
 * @returns {string}
 */
export function normalizePathname(pathname) {
  let path = String(pathname ?? '/').trim() || '/'
  if (!path.startsWith('/')) path = `/${path}`
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  return path.toLowerCase() === path ? path : path // keep case for ids; normalize separately for legacy map
}

/**
 * @param {string} slug
 * @returns {string}
 */
export function normalizeSlug(slug) {
  return String(slug ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\/+/g, '')
}
