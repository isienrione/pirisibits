import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

function resolveBuildId() {
  if (process.env.VITE_BUILD_ID) return process.env.VITE_BUILD_ID
  if (process.env.CF_PAGES_COMMIT_SHA) {
    return process.env.CF_PAGES_COMMIT_SHA.slice(0, 7)
  }
  if (process.env.COMMIT_REF) return process.env.COMMIT_REF
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 12)
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'dev'
  }
}

function readWalkingUiRevision() {
  const root = join(dirname(fileURLToPath(import.meta.url)), 'src/content')
  const source = readFileSync(join(root, 'walkingUiRevision.js'), 'utf8')
  const match = source.match(/WALKING_UI_REVISION\s*=\s*(\d+)/)
  if (!match) throw new Error('walkingUiRevision.js missing WALKING_UI_REVISION')
  return Number(match[1])
}

const walkingUiRevision = readWalkingUiRevision()
const buildId = resolveBuildId()

function walkingUiRevisionPlugin() {
  return {
    name: 'walking-ui-revision',
    transformIndexHtml(html) {
      const tags = [
        `<meta name="cw-app-build" content="${buildId}" />`,
        `<meta name="cw-walking-ui-rev" content="${walkingUiRevision}" />`,
      ]
      return html.replace('</head>', `    ${tags.join('\n    ')}\n  </head>`)
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'walking-ui-revision.json',
        source: `${JSON.stringify({ revision: walkingUiRevision }, null, 2)}\n`,
      })
    },
  }
}

const pwaRegisterMock = fileURLToPath(new URL('./src/test/mocks/pwa-register.js', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    walkingUiRevisionPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'favicon-32.png',
        'favicon-16.png',
        'brand/emblem-dark.png',
        'offline.html',
        'tour-hero.jpg',
        'pwa/icon-192.png',
        'pwa/icon-512.png',
        'pwa/icon-maskable-512.png',
        'pwa/apple-touch-icon.png',
        'pwa/screenshot-mobile.jpg',
        'pwa/screenshot-wide.jpg',
      ],
      manifest: {
        id: '/',
        name: 'ChronoWalk',
        short_name: 'ChronoWalk',
        description:
          'GPS-guided walking tours of Rome with place-aware audio and historical reveals.',
        theme_color: '#16130F',
        background_color: '#16130F',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/landing',
        categories: ['travel', 'navigation'],
        icons: [
          {
            src: 'pwa/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: 'pwa/screenshot-mobile.jpg',
            sizes: '540x720',
            type: 'image/jpeg',
            form_factor: 'narrow',
            label: 'GPS-guided walking tour with place-aware audio on mobile',
          },
          {
            src: 'pwa/screenshot-wide.jpg',
            sizes: '1280x720',
            type: 'image/jpeg',
            form_factor: 'wide',
            label: 'ChronoWalk immersive Rome tour on desktop',
          },
        ],
      },
      workbox: {
        // Tie precache identity to the deploy commit so stale walking-screen chunks
        // are replaced after branch deploys (figma → production).
        cacheId: `chronowalk-${buildId}`,
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2,json}'],
        globIgnores: ['**/waypoints/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/offline\.html$/,
          /^\/rome\//,
          /^\/waypoints\//,
          /^\/assets\//,
          // Never serve the SPA shell for any request to a file with an extension
          // (mp3, mp4, jpg, json, …). Prevents caching HTML under an asset URL.
          /\.[a-zA-Z0-9]+$/,
        ],
        runtimeCaching: [
          {
            urlPattern: ({ sameOrigin, request, url }) =>
              sameOrigin &&
              request.destination !== 'document' &&
              /\.(?:png|jpg|jpeg|svg|gif|webp|mp3|mp4|woff2?)$/i.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              // Bumped cache name to abandon entries poisoned with HTML from a
              // previous SPA-fallback (200 index.html served for missing media).
              cacheName: 'chronowalk-media-v2',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'chronowalk-google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'chronowalk-google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    modulePreload: {
      polyfill: false,
      resolveDependencies: (_filename, deps) =>
        deps.filter((dep) => !dep.includes('mapbox')),
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-compare-slider')) {
            return 'compare-slider'
          }
          if (id.includes('node_modules/@supabase')) {
            return 'supabase'
          }
          if (id.includes('node_modules/mapbox-gl')) {
            return 'mapbox'
          }
          if (
            id.includes('/src/config/env') ||
            id.includes('/src/design/tokens') ||
            id.includes('/src/components/ui/') ||
            id.includes('/src/utils/lazyWithRecovery') ||
            id.includes('lucide-react')
          ) {
            return 'app-shared'
          }
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    alias: {
      'virtual:pwa-register': pwaRegisterMock,
    },
  },
})
