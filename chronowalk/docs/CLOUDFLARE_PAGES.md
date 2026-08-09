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
/landing    /    301
/*   /index.html   200
```

- Apex `/` serves the marketing SPA (HTTP 200 via the catch-all rewrite).
- Legacy `/landing` permanently redirects to `/` (301).
- `/`, `/walk-together`, and other React Router document routes are served the SPA shell via the catch-all rewrite (HTTP 200 `text/html`).
- **Do not** add `/assets/* … 404` rules. Deploy `8a799eb` proved that pattern can break SPA fallback on Cloudflare Pages and prevent Workbox from installing.

Missing hashed `/assets/*.js` files may still receive `index.html` from the catch-all. The service worker rejects/`scrub`s `text/html` under asset and module requests so that HTML is never evaluated as JavaScript.

### Pretty URLs + Workbox precache

Cloudflare Pages also **redirects** `/index.html` → `/` (308). Legacy `/landing` → `/` (301) means **`/landing` is not a valid Workbox precache URL** (install fails with `bad-precaching-response` on redirects).

The build maps `index.html` → **`/`** (stable HTTP 200) via `src/pwa/cloudflarePrecacheUrls.js`. Offline navigation falls back with `createHandlerBoundToURL('/')`.

Operator check after `npm run build`:

```bash
node scripts/verify-pwa-routing.mjs
# optional read-only live probes:
VERIFY_LIVE=1 node scripts/verify-pwa-routing.mjs
```

If a phone shows **This site can’t be reached / ERR_FAILED** for `chronowalk.com` while desktop curls still get HTTP 200, a stale/broken service worker is almost always the cause:

1. Open a **Private / Incognito** tab to confirm the live site loads.
2. Clear site data for `chronowalk.com` (Chrome: Site settings → Clear & reset).
3. Or wait for a fresh deploy: browsers fetch `/sw.js` outside the old SW and auto-activate the fixed worker (`skipWaiting` + `clientsClaim`).
4. Settings → **Refresh app** / error-boundary **Try again** runs one controlled cache+SW recovery without clearing credentials.
## Cache headers

`public/_headers` ships with the build and tells Cloudflare **not** to edge-cache the app shell or service worker (`/`, `/landing`, `/index.html`, `/sw.js`, workbox bundles). Hashed files under `/assets/` use a one-day `must-revalidate` cache (not year-long `immutable`) so a deploy-race miss that briefly serves the SPA shell under an asset URL can self-heal without a manual purge.

If testers still see an old UI after a deploy:

1. Confirm `/sw.js` contains `chronowalk-<latest-commit>` (e.g. open `https://chronowalk.com/sw.js`).
2. In Cloudflare: **Caching → Purge Everything** (or purge `/`, `/index.html`, `/sw.js`).
3. In the app: **Settings → Refresh app** (clears PWA caches and reloads).

## Verify a deploy

Settings footer (scroll to bottom): `Build <commit> · Walking UI <n>`.

Walking screen should be **dark obsidian** with a large map hero and floating dock — not the legacy compass layout or cream GUIDE/MAP tabs. Walking UI revision mismatches trigger a one-time cache wipe + reload (see `walkingUiRevision.js` and `walkingUiMigration.js`).
