/**
 * Legacy Rome public URL table.
 * AppRouter continues to own these paths — this module only resolves them.
 */

import { resolveLegacyStopId, getRomePreviewStopId } from '../catalog/index.js'
import { resolveInternalProductId } from '../commerce/index.js'
import { createNavigationTarget, normalizePathname, parsePathOrUrl } from './navigationRegistry.js'

const ROME = 'rome'
const ROME_PRODUCT = 'rome-eternal'

/**
 * Exact pathname → NavigationTarget factory (query applied by caller).
 * @type {Record<string, () => import('./navigationRegistry.js').NavigationTarget>}
 */
const LEGACY_EXACT = {
  '/': () =>
    createNavigationTarget({
      kind: 'landing',
      pathname: '/',
      isLegacy: true,
    }),
  '/landing': () =>
    createNavigationTarget({
      kind: 'landing',
      pathname: '/',
      legacyPath: '/landing',
      isLegacy: true,
    }),
  '/begin': () =>
    createNavigationTarget({
      kind: 'begin',
      cityId: ROME,
      productId: ROME_PRODUCT,
      pathname: '/begin',
      isLegacy: true,
    }),
  '/journey': () =>
    createNavigationTarget({
      kind: 'journey',
      cityId: ROME,
      productId: ROME_PRODUCT,
      routeId: 'rome-eternal-main',
      pathname: '/journey',
      isLegacy: true,
    }),
  '/letter': () =>
    createNavigationTarget({
      kind: 'complete',
      cityId: ROME,
      productId: ROME_PRODUCT,
      pathname: '/letter',
      isLegacy: true,
    }),
  '/complete': () =>
    createNavigationTarget({
      kind: 'complete',
      cityId: ROME,
      productId: ROME_PRODUCT,
      pathname: '/letter',
      legacyPath: '/complete',
      isLegacy: true,
    }),
  '/tour': () =>
    createNavigationTarget({
      kind: 'tour',
      cityId: ROME,
      productId: ROME_PRODUCT,
      pathname: '/tour',
      isLegacy: true,
    }),
  '/map': () =>
    createNavigationTarget({
      kind: 'map',
      cityId: ROME,
      productId: ROME_PRODUCT,
      pathname: '/map',
      isLegacy: true,
    }),
  '/stops': () =>
    createNavigationTarget({
      kind: 'tour',
      cityId: ROME,
      productId: ROME_PRODUCT,
      pathname: '/tour',
      legacyPath: '/stops',
      isLegacy: true,
    }),
  '/journal': () =>
    createNavigationTarget({
      kind: 'journal',
      cityId: ROME,
      productId: ROME_PRODUCT,
      pathname: '/journal',
      isLegacy: true,
    }),
  '/settings': () =>
    createNavigationTarget({
      kind: 'settings',
      pathname: '/settings',
      isLegacy: true,
    }),
  '/walk-together': () =>
    createNavigationTarget({
      kind: 'walk_together',
      cityId: ROME,
      productId: ROME_PRODUCT,
      pathname: '/walk-together',
      isLegacy: true,
    }),
  '/setup': () =>
    createNavigationTarget({
      kind: 'setup',
      cityId: ROME,
      productId: ROME_PRODUCT,
      pathname: '/setup',
      isLegacy: true,
    }),
  '/welcome': () =>
    createNavigationTarget({
      kind: 'setup',
      cityId: ROME,
      productId: ROME_PRODUCT,
      pathname: '/setup',
      legacyPath: '/welcome',
      isLegacy: true,
    }),
  '/purchase': () =>
    createNavigationTarget({
      kind: 'purchase',
      cityId: ROME,
      pathname: '/purchase',
      isLegacy: true,
    }),
  '/checkout': () =>
    createNavigationTarget({
      kind: 'purchase',
      cityId: ROME,
      pathname: '/purchase',
      legacyPath: '/checkout',
      isLegacy: true,
    }),
  '/access': () =>
    createNavigationTarget({
      kind: 'access',
      pathname: '/access',
      isLegacy: true,
    }),
  '/access/confirmed': () =>
    createNavigationTarget({
      kind: 'access',
      pathname: '/access/confirmed',
      isLegacy: true,
    }),
  '/invite': () =>
    createNavigationTarget({
      kind: 'invite',
      pathname: '/invite',
      isLegacy: true,
    }),
  '/free-pantheon': () =>
    createNavigationTarget({
      kind: 'preview',
      cityId: ROME,
      stopId: getRomePreviewStopId() ?? 'w17',
      pathname: '/free-pantheon',
      isLegacy: true,
    }),
  '/preview': () =>
    createNavigationTarget({
      kind: 'preview',
      cityId: ROME,
      stopId: getRomePreviewStopId() ?? 'w17',
      pathname: '/preview',
      isLegacy: true,
    }),
  '/preview/colosseum': () =>
    createNavigationTarget({
      kind: 'preview',
      cityId: ROME,
      stopId: 'w01',
      pathname: '/preview/colosseum',
      isLegacy: true,
    }),
  '/credits': () =>
    createNavigationTarget({
      kind: 'credits',
      pathname: '/credits',
      isLegacy: true,
    }),
  '/contact': () =>
    createNavigationTarget({
      kind: 'contact',
      pathname: '/contact',
      isLegacy: true,
    }),
  '/how-it-works': () =>
    createNavigationTarget({
      kind: 'how_it_works',
      pathname: '/how-it-works',
      isLegacy: true,
    }),
  '/ancient-rome': () =>
    createNavigationTarget({
      kind: 'ancient_rome',
      cityId: ROME,
      pathname: '/ancient-rome',
      isLegacy: true,
    }),
  '/no-ticket': () =>
    createNavigationTarget({
      kind: 'no_ticket',
      cityId: ROME,
      pathname: '/no-ticket',
      isLegacy: true,
    }),
  '/legal/terms': () =>
    createNavigationTarget({
      kind: 'legal',
      pathname: '/legal/terms',
      isLegacy: true,
    }),
  '/legal/privacy': () =>
    createNavigationTarget({
      kind: 'legal',
      pathname: '/legal/privacy',
      isLegacy: true,
    }),
  '/legal/refund': () =>
    createNavigationTarget({
      kind: 'legal',
      pathname: '/legal/refund',
      isLegacy: true,
    }),
}

/**
 * @param {string} pathOrUrl
 * @returns {import('./navigationRegistry.js').NavigationTarget | null}
 */
export function resolveLegacyRomeRoute(pathOrUrl) {
  const { pathname, query } = parsePathOrUrl(pathOrUrl)
  const path = normalizePathname(pathname)

  const exact = LEGACY_EXACT[path]
  if (exact) {
    const target = exact()
    return applyLegacyQuery(target, query)
  }

  // /journal/:waypointId
  const journalMatch = /^\/journal\/([^/]+)$/.exec(path)
  if (journalMatch) {
    const stopId = resolveLegacyStopId(journalMatch[1]) ?? journalMatch[1]
    return applyLegacyQuery(
      createNavigationTarget({
        kind: 'journal',
        cityId: ROME,
        productId: ROME_PRODUCT,
        stopId,
        pathname: `/journal/${journalMatch[1]}`,
        isLegacy: true,
      }),
      query,
    )
  }

  // /preview/waypoint/:waypointId
  const previewMatch = /^\/preview\/waypoint\/([^/]+)$/.exec(path)
  if (previewMatch) {
    const stopId = resolveLegacyStopId(previewMatch[1]) ?? previewMatch[1]
    return applyLegacyQuery(
      createNavigationTarget({
        kind: 'preview',
        cityId: ROME,
        stopId,
        pathname: `/preview/waypoint/${previewMatch[1]}`,
        isLegacy: true,
      }),
      query,
    )
  }

  // Launch-era /complete/* aliases → letter
  if (path.startsWith('/complete/')) {
    return applyLegacyQuery(
      createNavigationTarget({
        kind: 'complete',
        cityId: ROME,
        productId: ROME_PRODUCT,
        pathname: '/letter',
        legacyPath: path,
        isLegacy: true,
      }),
      query,
    )
  }

  return null
}

/**
 * @param {import('./navigationRegistry.js').NavigationTarget} target
 * @param {Record<string, string>} query
 */
function applyLegacyQuery(target, query) {
  const next = { ...target, query: { ...query } }

  if (target.kind === 'purchase' && query.tier) {
    const sku = resolveInternalProductId(query.tier) ?? query.tier
    next.productId = sku
    // Catalog package product for platform navigation context
    next.cityId = ROME
  }

  if (target.kind === 'access' && query.token) {
    next.query = { ...next.query, token: query.token }
  }

  if (target.kind === 'invite' && query.code) {
    next.query = { ...next.query, code: query.code }
  }

  return next
}

/**
 * All exact legacy pathnames currently recognized (for tests / docs).
 * @returns {string[]}
 */
export function listLegacyRomePathnames() {
  return Object.keys(LEGACY_EXACT).sort()
}
