/* ChronoWalk service worker
 *
 * Cloudflare Pages "Pretty URLs" 308-redirect `/index.html` → `/` and
 * `/offline.html` → `/offline`. Workbox's default navigateFallback bound to
 * `/index.html` then fails to find a usable precache entry, and Chrome surfaces
 * that as ERR_FAILED for every navigation (/, /landing, /setup, …).
 *
 * Fix (see also injectManifest.manifestTransforms in vite.config.js):
 * 1. Precache Cloudflare's canonical paths (`/`, `/offline`) instead of *.html.
 * 2. Prefer the network for navigations; fall back to the cached app shell.
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
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies'

// Defined by Vite (`define.__APP_BUILD_ID__`). Keep as a string concat so the
// built sw.js still contains a literal `chronowalk-<id>` for ensureFreshBuild.
setCacheNameDetails({ prefix: 'chronowalk-' + __APP_BUILD_ID__ })

self.skipWaiting()
clientsClaim()

// Injection point — must stay exactly `self.__WB_MANIFEST` for vite-plugin-pwa.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

const navigationNetworkFirst = new NetworkFirst({
  cacheName: 'chronowalk-' + __APP_BUILD_ID__ + '-navigations',
  networkTimeoutSeconds: 4,
  plugins: [
    new CacheableResponsePlugin({ statuses: [200] }),
    new ExpirationPlugin({
      maxEntries: 32,
      maxAgeSeconds: 60 * 60 * 24,
    }),
  ],
})

const cachedAppShell = createHandlerBoundToURL('/')

async function handleNavigation(params) {
  try {
    const response = await navigationNetworkFirst.handle(params)
    if (response) return response
  } catch {
    // Fall through to the precached SPA shell.
  }

  try {
    return await cachedAppShell(params)
  } catch {
    return Response.error()
  }
}

registerRoute(
  new NavigationRoute(handleNavigation, {
    denylist: [
      /^\/offline$/,
      /^\/offline\.html$/,
      /^\/rome\//,
      /^\/waypoints\//,
      /^\/assets\//,
      // Never serve the SPA shell for requests that look like files.
      /\.[a-zA-Z0-9]+$/,
    ],
  }),
)

registerRoute(
  ({ sameOrigin, request, url }) =>
    sameOrigin &&
    request.destination !== 'document' &&
    /\.(?:png|jpg|jpeg|svg|gif|webp|mp3|mp4|woff2?)$/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'chronowalk-media-v2',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
      new CacheableResponsePlugin({ statuses: [200] }),
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

registerRoute(/^https:\/\/api\.mapbox\.com\/.*/i, new NetworkOnly(), 'GET')
