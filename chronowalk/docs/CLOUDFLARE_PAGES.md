# Cloudflare Pages — ChronoWalk production

Production is deployed from the **`figma`** branch to **chronowalk.com** via Cloudflare Pages (not Netlify). The repo still includes `netlify.toml` for reference; use the settings below in the Cloudflare dashboard.

## Build settings

| Setting | Value |
|---------|--------|
| Production branch | `figma` |
| Root directory | `chronowalk` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js version | 20 |

## Environment variables

Set in **Workers & Pages → your project → Settings → Environment variables** (Production + Preview as needed).

| Variable | Value | Notes |
|----------|--------|--------|
| `VITE_MAPBOX_TOKEN` | `pk.…` | Required for map |
| `VITE_MEDIA_BASE` | *(empty)* | Same as former Netlify production |
| `VITE_BUILD_ID` | *(optional)* | Omit to use `CF_PAGES_COMMIT_SHA` automatically |
| `VITE_PADDLE_ENV` | `sandbox` or `production` | Must match the client token / price ids |
| `VITE_PADDLE_CLIENT_TOKEN` | `test_…` / `live_…` | Paddle → Authentication → Client-side tokens |
| `VITE_PADDLE_PRICE_ROME_CENTRAL` | `pri_…` | One-time price from catalog seed |
| `VITE_PADDLE_PRICE_ROME_ESSENTIAL` | `pri_…` | One-time price from catalog seed |
| `VITE_PADDLE_PRICE_ROME_COMPLETE` | `pri_…` | One-time price from catalog seed |
| `VITE_ALLOW_DEV_ACCESS` | `true` only on preview | Never on production chronowalk.com |

Full commerce wiring: [`docs/PADDLE_SETUP.md`](./PADDLE_SETUP.md). Redeploy after changing any `VITE_*` value (baked in at build time).

`vite.config.js` resolves the deploy id in this order: `VITE_BUILD_ID` → `CF_PAGES_COMMIT_SHA` (first 7 chars) → `COMMIT_REF` → `GITHUB_SHA` → local `git rev-parse`. That id is baked into `__APP_BUILD_ID__` and the Workbox cache prefix (`chronowalk-<id>` in `/sw.js`).

## SPA routing

Cloudflare Pages reads `public/_redirects`:

```
/*    /index.html   200
```

### Pretty URLs warning (PWA)

Cloudflare Pages also **redirects** `/index.html` → `/` and `/offline.html` → `/offline` (308). Workbox must therefore precache those canonical paths and prefer the network for navigations. The custom service worker in `src/pwa/sw.js` does this.

If a phone shows **This site can’t be reached / ERR_FAILED** for `chronowalk.com` while desktop curls still get HTTP 200, a stale/broken service worker is almost always the cause:

1. Open a **Private / Incognito** tab to confirm the live site loads.
2. Clear site data for `chronowalk.com` (Chrome: Site settings → Clear & reset).
3. Or wait for a fresh deploy: browsers fetch `/sw.js` outside the old SW and auto-activate the fixed worker (`skipWaiting` + `clientsClaim`).

## Cache headers

`public/_headers` ships with the build and tells Cloudflare **not** to edge-cache the app shell or service worker (`/`, `/index.html`, `/sw.js`, workbox bundles). Hashed files under `/assets/` stay long-lived via content hashes.

If testers still see an old UI after a deploy:

1. Confirm `/sw.js` contains `chronowalk-<latest-commit>` (e.g. open `https://chronowalk.com/sw.js`).
2. In Cloudflare: **Caching → Purge Everything** (or purge `/`, `/index.html`, `/sw.js`).
3. In the app: **Settings → Refresh app** (clears PWA caches and reloads).

## Verify a deploy

Settings footer (scroll to bottom): `Build <commit> · Walking UI <n>`.

Walking screen should be **dark obsidian** with a large map hero and floating dock — not the legacy compass layout or cream GUIDE/MAP tabs. Walking UI revision mismatches trigger a one-time cache wipe + reload (see `walkingUiRevision.js` and `walkingUiMigration.js`).
