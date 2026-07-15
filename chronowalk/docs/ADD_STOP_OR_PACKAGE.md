# Adding a stop, location, or package — complete checklist

**Read this every time** you add or materially change a Rome stop, a purchasable package, stop media, pricing, or (eventually) a new city.

Production deploys from the **`figma`** branch to **chronowalk.com** (Cloudflare Pages). Landing copy and package IDs on `figma` are what travelers see.

Do **not** edit `src/landing/archive/` unless restoring a dated baseline.

---

## Two ID systems (keep them in sync)

ChronoWalk Rome has **two parallel ID systems**. Most bugs from “new stop” work are mismatched IDs.

| Layer | Canonical place | Example IDs |
|-------|-----------------|-------------|
| Live journey / narration | `src/content/rome/manifest.json` (generated) | `w01` … `w22`, `pause`, `enc_circus` |
| Media folders + landing + offline seeds | kebab slugs under `public/waypoints/` | `colosseum`, `forum-arch-titus`, `appian-way` |
| Landing packages | `src/landing/landingData.js` → `ROME_TIERS` | `rome-central`, `rome-essential`, `rome-complete` |
| Catalog products | `src/data/tourProducts.js` | `rome-central`, `roman-forum`, `heart-of-ancient-rome`, `rome-complete` |
| Begin-flow pace | `src/data/romePacing.js` + `src/data/tourTiers.js` | `central`, `classic`, `heroic`, `own` |

Always map kebab ↔ `wXX` in `src/lib/debugWaypoint.js` → `SLUG_ALIASES`.

---

# 1) New stop / waypoint / location (Rome)

Work top-to-bottom. Check each box.

## 1.1 Journey (manifest) — required for the walk

- [ ] **`scripts/generate-rome-manifest.mjs`** — add geo, waypoint object, act membership, sequence `a`/`b`, transit(s), optional flags.
- [ ] Run **`npm run generate:rome-manifest`** so `src/content/rome/manifest.json` regenerates.
- [ ] Confirm **`src/content/rome/manifest.json`**: chapters, photo/reconstruction paths, geofence, transcripts, `product.*` counts (`publicPlaceCount`, `visitStopCount`, `storyStopCount`, `actCount`, `distanceLabel`).
- [ ] **`src/data/romePacing.js` → `ROME_ACTS`** — insert into the correct act `waypoints[]`; update entry/promise copy if the story changes.
- [ ] **`src/data/tourTiers.js` → `TOUR_TIER_WAYPOINTS` / `TOUR_TIER_ACT_IDS`** — include in `central` and/or `classic` when the stop belongs there.
- [ ] **`src/content/optionalPromotion.js`** — only if GPS-optional / promote-able (like `w04`).
- [ ] **`src/content/actBoundaries.js`** — only if classic day-break boundaries move.
- [ ] **`src/lib/debugWaypoint.js` → `SLUG_ALIASES`** — map kebab slug ↔ `wXX` for `?debugStop=` / Asset Studio.
- [ ] **`scripts/now-files-manifest.json` → `manifestWaypoints`** — map `wXX` → `public/waypoints/...` folder.
- [ ] **`src/redesign/lib/waypointPresentation.js` → `PHOTO_STOP_ALIASES`** — only if asset folder slug ≠ marketing slug (e.g. `via-appia` ↔ `appian-way`).

## 1.2 Media folder + offline seed — required for Threshold / offline

- [ ] Create **`public/waypoints/<kebab-id>/`** (Forum: `public/waypoints/forum-cluster/<id>/`). Copy `scripts/templates/incoming-README.md` into `incoming/` when using the video pipeline.
- [ ] Add seed:
  - **Forum stop:** `src/data/forumWaypoints.js` (`ROMAN_FORUM_STOP_IDS` + `FORUM_STOP_META`)
  - **Expansion stop:** `src/data/expansionWaypoints.js` (`EXPANSION_STOP_META`) and/or **`src/data/<id>.js`**
- [ ] Register in **`src/services/waypointMerge.js` → `LOCAL_WAYPOINTS`** (forum/expansion spread automatically if listed there).
- [ ] **`src/data/waypointGeo.js`** — map pin, debug GPS, arrival radius, zoom.
- [ ] Tour membership (whichever packages include it):  
  `src/data/central-rome-tour.js`, `roman-forum-tour.js`, `heart-of-ancient-rome-tour.js`, `rome-core-tour.js`
- [ ] If inventing a **new tour id**: register in **`src/services/tourRegistry.js`**.

## 1.3 Landing route & monuments — required if marketed / shown on landing

- [ ] **`src/landing/landingTierRoutes.js` → `LANDING_ROUTE_STOPS`** — geo + display title/short.
- [ ] **`LANDING_TIER_ROUTES` / complete & essential route arrays** — walk order per package.
- [ ] **`src/landing/landingMonuments.js`**:
  - `LANDING_ROUTE_CHAPTERS` — narrative chapter membership
  - `LANDING_ROUTE_PREVIEW_IDS` — highlight strip (interstitial dots on the preview timeline are derived from index gaps between these IDs)
- [ ] **`src/landing/landingData.js`** — any copy that names the stop or hardcodes stop counts (“22 places”, package bullets).
- [ ] **`src/content/modernPhotoRegistry.js` → `MODERN_PHOTO_PATHS[<slug>]`**.
- [ ] Optional: named export in **`src/redesign/images.js`**.

## 1.4 Process & verify media — required before shipping visuals

- [ ] Drop sources in `public/waypoints/<id>/incoming/` (see `WAYPOINT_ASSET_PIPELINE.md`).
- [ ] **`npm run process-waypoint -- <id>`** then **`npm run verify-waypoint -- <id>`**.
- [ ] Add id to **`scripts/verify-all-waypoint-assets.sh` → `STOP_IDS`** when shippable.
- [ ] Update **`scripts/modern-photo-manifest.json`** and/or **`scripts/now-files-manifest.json` → `photos[]`** if using those installers.
- [ ] **`npm run install:modern-photos`** / **`npm run install:now-files`** when stills are ready.
- [ ] Bump seed **`media_cache_version`** when replacing files at the same URL.
- [ ] Optional: `scripts/lib/waypoint-incoming.sh` aliases if Gemini dumps odd folder names; `package.json` process/verify aliases; expansion batch scripts.

## 1.5 Narration / transcripts / audio — required for a real stop

- [ ] Manifest chapter/transit **`transcript`** fields (canonical read-along).
- [ ] Audio under declared R2 / local paths (`/rome/audio/narration/...` etc.).
- [ ] **`npm run normalize-audio`** when new arrival/transit audio lands.
- [ ] **`npm run measure:durations`** to refresh the durations map.
- [ ] **`npm run check:content`** (and `:local` / `:strict` as needed).
- [ ] Optional polish:
  - `src/content/launchStoryChapters.js`
  - `src/content/launchStoryTranscripts.js`
  - `src/content/launchJourneyMemories.js` → `PLACE_LINES`
  - `src/content/reconstructionHotspots.js`
- [ ] Optional: `node scripts/apply-recording-master-scripts.mjs` when master DOCX scripts land.

## 1.6 Maps / offline / family — usually automatic after membership

- [ ] Geofence lat/lng/radius correct in manifest + `waypointGeo.js`.
- [ ] After **route order** changes: clear field-test route geometry cache / rewalk legs (`src/utils/routeGeometryCache.js` is runtime — no list edit).
- [ ] Offline packs follow tour `stopIds` via `tourRegistry` — fix tour defs, not offline internals.
- [ ] Family walk stores `waypoint_id` as free text — no SQL change for a new stop id.

## 1.7 Docs & test URLs

- [ ] `WAYPOINT_PLAYBOOK.md`, `WAYPOINT_ASSET_PIPELINE.md` if process changed.
- [ ] `TOUR_TEST_LINKS.md`, `ASSET_STUDIO_LINKS.md` — add `?debugStop=` / Asset Studio links.
- [ ] `public/waypoints/README.md` folder index.
- [ ] Content backlog (`content/batches/`, `content/POLISH_BACKLOG.md`) as needed.

## 1.8 Tests that will fail if lists/counts drift — update them

- [ ] `src/content/__tests__/tourProductTruth.test.js`
- [ ] `src/data/__tests__/tourTiers.test.js`
- [ ] `src/data/__tests__/tourProducts.test.js`
- [ ] `src/landing/__tests__/landingTierRoutes.test.js`
- [ ] `src/landing/__tests__/landingMonuments.test.js` (preview skip counts, chapter coverage)
- [ ] `src/content/__tests__/modernPhotoRegistry.test.js`
- [ ] `src/data/__tests__/waypointPublicAssets.test.js`
- [ ] `src/lib/__tests__/tour.test.js`
- [ ] Any journey/offline tests hardcoding specific ids or sequence lengths

### Quick npm cheat sheet (stops)

```bash
npm run generate:rome-manifest
npm run process-waypoint -- <id>
npm run verify-waypoint -- <id>
npm run verify-all-waypoints
npm run install:modern-photos
npm run install:now-files
npm run normalize-audio
npm run measure:durations
npm run check:content
```

---

# 2) New package / tier / product

Keep **landing id → catalog product → begin-flow pace → Lemon `product_id`** aligned.

## 2.1 Landing cards — required

- [ ] **`src/landing/landingData.js` → `ROME_TIERS`** — `{ id, name, price, priceCents, bullets, … }`.
- [ ] **`src/landing/landingCheckout.js`** — today only `rome-complete` uses live AB price; extend if the new tier should.
- [ ] **`src/landing/landingTierRoutes.js`** — `LANDING_TIER_ROUTES`, `TIER_MAP_PADDING`.
- [ ] **`src/landing/landingTierStats.js`** — `AUDIO_MINUTES_BY_TIER`, `DISTANCE_KM_OVERRIDE`.
- [ ] **`src/landing/landingMapboxStatic.js`** + **`scripts/fetch-rome-landing-basemap.mjs`** + **`public/landing/rome-pricing-basemap-*.jpg`**.
- [ ] **`src/landing/LandingRomeTiersSection.jsx`** — featured packaging if the new tier should be highlighted (`rome-complete` is hardcoded today).
- [ ] FAQ / trust / pricing prose in **`landingData.js`** that names packages.
- [ ] `src/landing/landingSeo.js` usually follows `ROME_TIERS` automatically.

## 2.2 Catalog / entitlements / begin flow — required

- [ ] New tour def under **`src/data/*-tour.js`** (`id`, `productId`, `stopIds`).
- [ ] **`src/data/tourProducts.js`** — product entry + `TOUR_PRODUCT_LIST` order; bundle `includesProductIds`.
- [ ] **`src/services/tourRegistry.js`** — register for offline / map / Asset Studio.
- [ ] **`src/services/tourEntitlements.js`** — aliases if renaming.
- [ ] **`src/lib/pendingPurchase.js` → `paceIdForPurchaseTier`** — map landing id → `central` / `classic` / `heroic`.
- [ ] **`src/data/romePacing.js` → `PACE_OPTIONS`** — price labels, act dots, descriptions.
- [ ] **`src/data/tourTiers.js`** — waypoint/act membership for the new pace.
- [ ] **`src/lib/checkout.js`** — uses `ROME_TIERS`; update `TRANSACTION_STEPS` copy if package names change.
- [ ] **`src/content/launchTourDetail.js`** if defaults should change.

## 2.3 Lemon Squeezy / Cloudflare — required for live pay

- [ ] Create Lemon product/variant; pass custom `product_id` matching the landing/catalog id.
- [ ] Set **`VITE_LEMON_CHECKOUT_URL`** on Cloudflare Pages (**Preview + Production**). Without it, Begin Rome opens `/purchase` placeholders — see `docs/LEMON_SQUEEZY_TRANSACTIONS.md` and `docs/CLOUDFLARE_PAGES.md`.
- [ ] Optional: Supabase `app_config.checkout_url` override (loaded by `src/lib/config.js`).
- [ ] Document the new product in **`docs/LEMON_SQUEEZY_TRANSACTIONS.md`**.

## 2.4 Family seat packages (orthogonal)

- [ ] **`src/lib/familyWalk.js` → `FAMILY_TIERS`** only for couple/family seat SKUs.
- [ ] **`supabase/family_walk.sql`** tier check constraint if adding a new family tier id.

## 2.5 Package tests

- [ ] `landingCheckout`, `landingPricingHierarchy`, `landingSeo`, `landingTier*`, `checkout.test.js`, `PurchaseFlowPage.test.jsx`, `tourProducts.test.js`

---

# 3) Media-only update (same stop, new assets)

- [ ] Replace files under `public/waypoints/<folder>/` (`modern-exterior.jpg`, `modern-poster.jpg`, `ancient-reconstruction.*`, `modern.mp4`, arrival wav).
- [ ] Bump **`media_cache_version`** on the seed.
- [ ] Re-run **`verify-waypoint`** / **`verify-all-waypoints`**.
- [ ] If paths change: **`modernPhotoRegistry.js`**, manifests, landing Threshold assets (`src/landing/landingVisualAssets.js`, `public/landing/threshold/` for Colosseum demo pair).
- [ ] Free preview: `LANDING_PREVIEW_AUDIO_FILE` in `landingData.js`, `src/data/freePreview.js`, `thresholdDemo.js`.
- [ ] Landing cinematics (hero / interlude / after-rome): drop masters in `public/landing/cinematic/_masters/` → **`npm run prepare:landing-cinematic`** (not per-stop).

---

# 4) Pricing-only update

Keep every source in sync (USD cents):

| Source | File / place |
|--------|----------------|
| Landing tiers | `src/landing/landingData.js` → `ROME_TIERS` + `LANDING_PRICE_FALLBACK_CENTS` |
| Catalog | `src/data/tourProducts.js` |
| Begin-flow | `src/data/romePacing.js` → `PACE_OPTIONS` |
| Manifest fallback | `src/content/rome/manifest.json` (+ regenerate from `scripts/generate-rome-manifest.mjs`) |
| Offline / AB fallback | `src/lib/config.js` → `FALLBACK_CONFIG` |
| Live remote | Supabase `app_config` (`supabase/v2_app_config.sql` sample may lag — prefer dashboard) |
| Charged amount | Lemon Squeezy dashboard |
| Docs | `docs/LEMON_SQUEEZY_TRANSACTIONS.md`, `docs/LANDING_POST_LAUNCH_AB.md` |

Then update pricing tests listed in §2.5 / §1.8.

---

# 5) New city / destination (scaffolding only today)

Rome is the only full tour engine (`loadRomeManifest()` is Rome-hardcoded). Placeholders:

- [ ] `src/content/launchDestinations.js` — set `available: true` only when real.
- [ ] `src/content/launchExploreMore.js` — teaser cards.
- [ ] `src/data/welcomeConfig.js` → `PLATFORM_CITIES`
- [ ] City accent tokens (`src/design/tokens.css` / tokens)
- [ ] Hero art under `public/destinations/<city>-hero.jpg`

A real city needs a full mirror of `src/content/rome/` + products + tiers + maps + landing — not just a card.

Field-test GPS remaps only: `src/content/devGeofenceOverrides.santiago.js`.

---

# 6) Ship checklist (every content change)

1. [ ] Dual IDs aligned (manifest `wXX` ↔ kebab ↔ packages).
2. [ ] Media processed + verified.
3. [ ] Landing routes / monuments / package cards updated if travelers will see them.
4. [ ] Tests updated and green (`npm test` for touched areas; full suite before merge to `figma`).
5. [ ] Merge / push **`figma`** (production branch for chronowalk.com).
6. [ ] If commerce changed: Cloudflare `VITE_LEMON_CHECKOUT_URL` + Lemon product exists.
7. [ ] Purge Cloudflare cache / confirm `/sw.js` build id if testers see a stale UI (`docs/CLOUDFLARE_PAGES.md`).

---

## Related docs

| Doc | Topic |
|-----|--------|
| `WAYPOINT_PLAYBOOK.md` | Stop production process |
| `WAYPOINT_ASSET_PIPELINE.md` | Incoming → processed media |
| `docs/LEMON_SQUEEZY_TRANSACTIONS.md` | Checkout + access handoff |
| `docs/CLOUDFLARE_PAGES.md` | Production env + cache |
| `docs/AUDIO_PRODUCTION_PLAYBOOK.md` | Narration |
| `docs/LANDING_EDITORIAL_ARCHITECTURE.md` | Landing structure |

When this checklist drifts from the code, update **this file in the same PR**.
