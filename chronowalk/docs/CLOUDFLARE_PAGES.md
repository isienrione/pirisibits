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
| `VITE_LEMON_CHECKOUT_URL` | Roma Eterna Lemon buy URL | Optional override — app defaults to `https://chronowalk.lemonsqueezy.com/checkout/buy/1a82bca2-f4a8-4b40-812d-fb7398afb75d`. Set on Preview + Production to pin the same link. See `docs/LEMON_SQUEEZY_TRANSACTIONS.md`. |
| `VITE_LEMON_CHECKOUT_MODE` | `overlay` (default) or `hosted` | Overlay uses lemon.js; hosted does a full-page redirect. |
| `VITE_ALLOW_DEV_ACCESS` | `true` only on preview | Never on production chronowalk.com |

Recommended production value:

```bash
VITE_LEMON_CHECKOUT_URL=https://chronowalk.lemonsqueezy.com/checkout/buy/1a82bca2-f4a8-4b40-812d-fb7398afb75d
```

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
