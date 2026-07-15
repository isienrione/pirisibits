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

Set in **Workers & Pages → your project → Settings → Environment variables** (Production):

| Variable | Value | Notes |
|----------|--------|--------|
| `VITE_MAPBOX_TOKEN` | `pk.…` | Required for map |
| `VITE_MEDIA_BASE` | *(empty)* | Same as former Netlify production |
| `VITE_BUILD_ID` | *(optional)* | Omit to use `CF_PAGES_COMMIT_SHA` automatically |
| `VITE_LEMON_CHECKOUT_URL` | Lemon buy link | **Required for live pay.** Without it, package **Begin Rome** opens `/purchase` (buyer steps + restore access). Preview + Production both need this. See `docs/LEMON_SQUEEZY_TRANSACTIONS.md`. |
| `VITE_ALLOW_DEV_ACCESS` | `true` only on preview | Never on production chronowalk.com |

Set the same `VITE_LEMON_CHECKOUT_URL` on **Preview** deployments if you want branch previews to open Lemon instead of the `/purchase` placeholder.

`vite.config.js` resolves the deploy id in this order: `VITE_BUILD_ID` → `CF_PAGES_COMMIT_SHA` (first 7 chars) → `COMMIT_REF` → `GITHUB_SHA` → local `git rev-parse`. That id is baked into `__APP_BUILD_ID__` and the Workbox cache prefix (`chronowalk-<id>` in `/sw.js`).

## SPA routing

Cloudflare Pages reads `public/_redirects`:

```
/*    /index.html   200
```

## Cache headers

`public/_headers` ships with the build and tells Cloudflare **not** to edge-cache the app shell or service worker (`/`, `/index.html`, `/sw.js`, workbox bundles). Hashed files under `/assets/` stay long-lived via content hashes.

If testers still see an old UI after a deploy:

1. Confirm `/sw.js` contains `chronowalk-<latest-commit>` (e.g. open `https://chronowalk.com/sw.js`).
2. In Cloudflare: **Caching → Purge Everything** (or purge `/`, `/index.html`, `/sw.js`).
3. In the app: **Settings → Refresh app** (clears PWA caches and reloads).

## Verify a deploy

Settings footer (scroll to bottom): `Build <commit> · Walking UI <n>`.

Walking screen should be **dark obsidian** with a large map hero and floating dock — not the legacy compass layout or cream GUIDE/MAP tabs. Walking UI revision mismatches trigger a one-time cache wipe + reload (see `walkingUiRevision.js` and `walkingUiMigration.js`).
