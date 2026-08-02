/* ChronoWalk service worker
 *
 * Cloudflare Pages SPA fallback (`/* → /index.html 200`) returns HTML for
 * missing paths - including missing hashed `/assets/*.js` URLs. If that HTML
 * is cached under a module key, dynamic `import()` fails with:
 *   TypeError: Failed to fetch dynamically imported module
 * even while a direct network fetch of a live asset returns real JavaScript.
 *
 * Legacy `/landing` → `/` (301). Workbox cannot precache `/landing` (redirects
 * fail install). The SPA shell is therefore precached at `/` (HTTP 200).
 *
 * Rules:
 * 1. Never serve/cache the SPA HTML for script, style, worker, or /assets/*.
 * 2. Navigation fallback only for genuine document navigations.
 * 3. Reject / scrub HTML responses stored under asset URLs.
 * 4. Hashed assets: cache only non-HTML 200 responses; miss → network.
 */
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { clientsClaim, setCacheNameDetails } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import {
  asSafariSafeResponse,
  isAssetOrModuleRequest,
  isHtmlPoisonedAssetEntry,
  isHtmlResponse,
  shouldDenyNavigationFallback,
} from './swAssetGuards.js'
import { APP_SHELL_PRECACHE_URL, OFFLINE_PRECACHE_URL } from './cloudflarePrecacheUrls.js'

// Defined by Vite (`define.__APP_BUILD_ID__`). Keep as a string concat so the
// built sw.js still contains a literal `chronowalk-<id>` for ensureFreshBuild.
/* global __APP_BUILD_ID__ */
const BUILD_PREFIX = 'chronowalk-' + __APP_BUILD_ID__
setCacheNameDetails({ prefix: BUILD_PREFIX })

self.skipWaiting()
clientsClaim()

const rejectHtmlAssetPlugin = {
  cacheWillUpdate: async ({ response }) => {
    if (!response || response.status !== 200) return null
    if (isHtmlResponse(response)) return null
    return response
  },
  cachedResponseWillBeUsed: async ({ cachedResponse, request }) => {
    if (!cachedResponse) return null
    if (request && isAssetOrModuleRequest(request, new URL(request.url))) {
      if (isHtmlResponse(cachedResponse)) return null
    }
    return cachedResponse
  },
}

// Injection point - must stay exactly `self.__WB_MANIFEST` for vite-plugin-pwa.
// HTML-guard plugins prevent SPA fallback bodies from sticking under /assets/*.js keys.
precacheAndRoute(self.__WB_MANIFEST, {
  ignoreURLParametersMatching: [/^_/],
  plugins: [rejectHtmlAssetPlugin],
})
cleanupOutdatedCaches()

/** Remove any Cache Storage entry where a JS/CSS URL holds text/html. */
async function scrubHtmlPoisonedCaches() {
  if (!self.caches?.keys) return
  const names = await self.caches.keys()
  await Promise.all(
    names.map(async (name) => {
      const cache = await self.caches.open(name)
      const requests = await cache.keys()
      await Promise.all(
        requests.map(async (request) => {
          const response = await cache.match(request)
          if (response && isHtmlPoisonedAssetEntry(request.url, response)) {
            await cache.delete(request)
          }
        }),
      )
    }),
  )
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await scrubHtmlPoisonedCaches()
      // Drop prior build navigation shells so a new deploy cannot keep an HTML
      // document that still references obsolete hashed chunks.
      const names = await self.caches.keys()
      await Promise.all(
        names
          .filter(
            (name) =>
              name.includes('-navigations') && !name.startsWith(BUILD_PREFIX),
          )
          .map((name) => self.caches.delete(name)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  if (event.data?.type === 'SCRUB_POISONED_CACHES') {
    event.waitUntil(scrubHtmlPoisonedCaches())
  }
})

// ─── Hashed build assets / module scripts (never HTML) ─────────────────────
// Registered before media routes. Precache still wins for exact precache hits;
// this covers cache misses and rejects HTML poison on read/write.
registerRoute(
  ({ request, url }) => isAssetOrModuleRequest(request, url),
  new NetworkFirst({
    cacheName: BUILD_PREFIX + '-assets',
    networkTimeoutSeconds: 8,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      rejectHtmlAssetPlugin,
      new ExpirationPlugin({
        maxEntries: 96,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
  'GET',
)

const navigationNetworkFirst = new NetworkFirst({
  cacheName: BUILD_PREFIX + '-navigations',
  networkTimeoutSeconds: 4,
  plugins: [
    new CacheableResponsePlugin({ statuses: [200] }),
    new ExpirationPlugin({
      maxEntries: 32,
      maxAgeSeconds: 60 * 60 * 24,
    }),
  ],
})

const cachedAppShell = createHandlerBoundToURL(APP_SHELL_PRECACHE_URL)
const cachedOfflinePage = createHandlerBoundToURL(OFFLINE_PRECACHE_URL)

async function handleNavigation(params) {
  const { request, url } = params
  // Belt-and-suspenders: never treat asset fetches as navigations.
  if (isAssetOrModuleRequest(request, url)) {
    return asSafariSafeResponse(await fetch(request))
  }
  if (shouldDenyNavigationFallback(`${url.pathname}${url.search}`)) {
    return asSafariSafeResponse(await fetch(request))
  }

  // Legacy `/landing` is a Cloudflare 301 → /. Never fetch `/landing` inside the
  // SW: Safari rejects redirected Responses from service workers. Let the
  // browser follow that redirect (denylist below); serve the apex shell here.
  if (url.pathname === '/landing') {
    try {
      return asSafariSafeResponse(await cachedAppShell(params))
    } catch {
      return asSafariSafeResponse(await cachedOfflinePage(params))
    }
  }

  try {
    const response = await navigationNetworkFirst.handle(params)
    if (response && !isHtmlResponse(response) && request.destination === 'document') {
      return asSafariSafeResponse(response)
    }
    if (response) return asSafariSafeResponse(response)
  } catch {
    // Fall through to the precached SPA shell.
  }

  try {
    return asSafariSafeResponse(await cachedAppShell(params))
  } catch {
    // Never return a failed opaque network error - that surfaces Safari’s native
    // offline interstitial mid Home Screen session / package download.
    // Serve our offline page instead.
    try {
      return asSafariSafeResponse(await cachedOfflinePage(params))
    } catch {
      return new Response(
        '<!doctype html><title>ChronoWalk</title><body style="font-family:system-ui;padding:2rem;background:#16130f;color:#f5efe3">ChronoWalk is offline. Reopen the app when you have a signal - your access stays on this device.</body>',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
      )
    }
  }
}

registerRoute(
  new NavigationRoute(handleNavigation, {
    denylist: [
      // Let the browser follow Cloudflare's /landing → / 301 itself.
      /^\/landing$/,
      /^\/offline$/,
      /^\/offline\.html$/,
      /^\/reset-shell$/,
      /^\/reset-shell\.html$/,
      /^\/rome\//,
      /^\/waypoints\//,
      /^\/assets\//,
      // Never serve the SPA shell for requests that look like files.
      /\.[a-zA-Z0-9]+$/,
    ],
  }),
)

registerRoute(
  ({ sameOrigin, url }) =>
    sameOrigin &&
    url.pathname.startsWith('/landing/') &&
    /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i.test(url.pathname),
  new StaleWhileRevalidate({
    // Landing stills must paint fast on return visits; revalidate in background.
    cacheName: 'chronowalk-landing-media-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      rejectHtmlAssetPlugin,
      new ExpirationPlugin({
        maxEntries: 48,
        maxAgeSeconds: 60 * 60 * 24 * 14,
      }),
    ],
  }),
  'GET',
)

registerRoute(
  ({ sameOrigin, url }) =>
    sameOrigin &&
    url.pathname.startsWith('/landing/') &&
    /\.(?:mp4|webm)$/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'chronowalk-landing-video-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      rejectHtmlAssetPlugin,
      new ExpirationPlugin({
        maxEntries: 6,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
  'GET',
)

registerRoute(
  ({ sameOrigin, request, url }) =>
    sameOrigin &&
    request.destination !== 'document' &&
    !isAssetOrModuleRequest(request, url) &&
    // Landing marketing stills are handled above (StaleWhileRevalidate).
    !url.pathname.startsWith('/landing/') &&
    /\.(?:png|jpg|jpeg|svg|gif|webp|mp3|mp4|woff2?)$/i.test(url.pathname),
  new CacheFirst({
    // Bump when media strategy changes so stale runtime caches are abandoned.
    cacheName: 'chronowalk-media-v3',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
      new CacheableResponsePlugin({ statuses: [200] }),
      rejectHtmlAssetPlugin,
    ],
  }),
  'GET',
)

registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'chronowalk-google-fonts-stylesheets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  }),
  'GET',
)

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'chronowalk-google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  }),
  'GET',
)

/** Same name as `ROME_MAP_TILE_CACHE` in map/offlineMapTiles.js (keep in sync). */
const ROME_MAP_TILE_CACHE = 'chronowalk-rome-map-tiles-v2'

function normalizeMapboxRequestUrl(url) {
  try {
    const parsed = new URL(url)
    parsed.searchParams.delete('sku')
    parsed.searchParams.delete('pluginName')
    parsed.searchParams.delete('fresh')
    return parsed.toString()
  } catch {
    return url
  }
}

async function matchRomeMapTile(request) {
  const cache = await caches.open(ROME_MAP_TILE_CACHE)
  const direct = await cache.match(request)
  if (direct) return direct

  const normalized = normalizeMapboxRequestUrl(request.url)
  if (normalized !== request.url) {
    const normalizedMatch = await cache.match(normalized)
    if (normalizedMatch) return normalizedMatch
  }

  try {
    const target = new URL(request.url)
    const keys = await cache.keys()
    for (const key of keys) {
      try {
        const keyUrl = new URL(key.url)
        if (keyUrl.hostname === target.hostname && keyUrl.pathname === target.pathname) {
          const hit = await cache.match(key)
          if (hit) return hit
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
  return null
}

// Cache-first for Rome offline tiles (style JSON + vector PBFs). Network when online
// so maps keep working after a package download; never NetworkOnly (bricks offline).
registerRoute(
  ({ url }) =>
    url.hostname === 'api.mapbox.com' ||
    url.hostname.endsWith('.tiles.mapbox.com') ||
    url.hostname === 'tiles.mapbox.com',
  async ({ request }) => {
    const cached = await matchRomeMapTile(request)
    if (cached) return cached
    try {
      return await fetch(request)
    } catch {
      return new Response('', { status: 503, statusText: 'Map tile unavailable offline' })
    }
  },
  'GET',
)
