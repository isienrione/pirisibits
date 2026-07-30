/**
 * Pure request/response guards for the ChronoWalk service worker.
 * Kept free of Workbox imports so Vitest can cover SPA/HTML poison cases.
 */

/** @param {Request | null | undefined} request */
export function isNavigationRequest(request) {
  if (!request) return false
  if (request.mode === 'navigate') return true
  return request.destination === 'document'
}

/**
 * True for JS modules, CSS, workers, and hashed Vite build assets.
 * These must never receive the SPA HTML shell.
 *
 * @param {Request | null | undefined} request
 * @param {URL | { pathname?: string }} url
 */
export function isAssetOrModuleRequest(request, url) {
  const pathname = typeof url?.pathname === 'string' ? url.pathname : ''
  if (pathname.startsWith('/assets/')) return true
  if (pathname === '/sw.js' || pathname.startsWith('/workbox-')) return true

  const destination = request?.destination
  if (destination === 'script' || destination === 'style' || destination === 'worker') {
    return true
  }

  if (/\.(?:m?js|css|map)(?:$|\?)/i.test(pathname)) return true
  return false
}

/**
 * Paths that must never use the offline/SPA navigation fallback.
 * @param {string} pathnameWithSearch
 */
export function shouldDenyNavigationFallback(pathnameWithSearch) {
  const path = String(pathnameWithSearch || '')
  if (path.startsWith('/assets/')) return true
  if (path.startsWith('/rome/')) return true
  if (path.startsWith('/waypoints/')) return true
  if (/^\/offline(?:\.html)?(?:\?|$)/.test(path)) return true
  if (/\.[a-zA-Z0-9]+(?:\?|$)/.test(path)) return true
  return false
}

/** @param {Response | null | undefined} response */
export function isHtmlResponse(response) {
  if (!response) return false
  const contentType = response.headers?.get?.('content-type') || ''
  return /text\/html/i.test(contentType)
}

/**
 * Navigation fallback may run only for genuine document navigations that are
 * not asset-like paths.
 *
 * @param {{ request?: Request, url?: URL }} param0
 */
export function shouldHandleAsNavigation({ request, url } = {}) {
  if (!isNavigationRequest(request)) return false
  const path = `${url?.pathname || ''}${url?.search || ''}`
  if (shouldDenyNavigationFallback(path)) return false
  if (isAssetOrModuleRequest(request, url || { pathname: url?.pathname })) return false
  return true
}

/**
 * Detect Cache API entries where a JS/CSS URL was poisoned with HTML
 * (Cloudflare SPA `/* → /index.html 200` for missing files).
 *
 * @param {string} requestUrl
 * @param {Response} response
 */
export function isHtmlPoisonedAssetEntry(requestUrl, response) {
  if (!response || !isHtmlResponse(response)) return false
  try {
    const url = new URL(requestUrl, 'https://chronowalk.local')
    if (url.pathname.startsWith('/assets/')) return true
    if (url.pathname === '/sw.js' || url.pathname.startsWith('/workbox-')) return true
    if (/\.(?:m?js|css|map)$/i.test(url.pathname)) return true
    return false
  } catch {
    return false
  }
}

/**
 * Safari / WebKit rejects navigation responses from a service worker when
 * `response.redirected === true` ("Response served by service worker has
 * redirections"). Cloudflare serves `/` → `/landing` 302; if the SW follows
 * that redirect and returns the final Response, Safari refuses to open the page.
 *
 * Rebuild a same-content Response so the redirected flag is cleared.
 *
 * @param {Response | null | undefined} response
 * @returns {Promise<Response | null | undefined>}
 */
export async function asSafariSafeResponse(response) {
  if (!response || !response.redirected) return response
  const buffer = await response.arrayBuffer()
  const headers = new Headers(response.headers)
  return new Response(buffer, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
