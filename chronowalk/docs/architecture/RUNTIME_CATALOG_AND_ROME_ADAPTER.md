# Runtime catalog and Rome adapter

## Status

Shipped as an architecture bridge (PR 3). Production screens are **not** wired to
`src/catalog/` yet. The live Rome PWA still loads
`src/content/rome/manifest.json` via `loadRomeManifest()`.

## Source of truth

| Role | Path |
|------|------|
| Editable city package (SSOT) | `src/content/cities/rome/` |
| Runtime compatibility output | `src/content/rome/manifest.json` |
| Generator sync | `generateCityManifest({ cityId: 'rome' })` copies package → runtime path |

Do **not** edit the runtime manifest independently. Change the city package, then
run `npm run generate:rome-manifest` (or `generate:city -- --city rome`).

## Runtime catalog

Module: `src/catalog/`

Facade: `catalogService.js` / `index.js`

| API | Purpose |
|-----|---------|
| `getPublishedCities()` | Published cities only |
| `getCityById` / `getCityBySlug` | City lookup |
| `getProductsForCity` / `getProductById` / `getProductBySlug` | Products |
| `getRoutesForProduct` / `getRouteById` | Routes |
| `getStopsForRoute` / `getStopById` | Stops |
| `resolveLegacyStopId` / `resolveLegacyWaypoint` | Slug → stopId |
| `resolveLegacyRoute` | Path/tour → routeId |
| `resolveLegacyProductId` | Launch SKU → package productId |

Registries load data from `src/content/cityPackage` (`loadCityPackage`).

## Published city registry

- Only packages with `metadata.published === true` and `isFixture === false`.
- Today: **Rome** only.
- **Harbor** (`cities/__fixtures__/harbor`) is never published.
- Adding Athens later: add `cities/athens/` with `published: true` — no registry code change required.

## Legacy Rome adapter

Module: `legacyRomeAdapter.js`

Translates; does not fork journey logic.

| Concern | Bridge |
|---------|--------|
| Waypoint / stop IDs | `LEGACY_STOP_ALIASES` (`colosseum` → `w01`) |
| Routes / paths | `a`/`b` → `rome-eternal-main` / `rome-eternal-path-b` |
| Tour registry ids | Map onto path A route for identity only |
| Product / SKU ids | Launch SKUs → `rome-eternal` package product |
| Progress refs | Same stopId strings (plus slug resolve) |
| Preview | `system.preview` audio → stop `w17` |
| Optional stops | `journey.optional_waypoints` from package manifest |

## Remaining legacy components (unchanged)

- `loadRomeManifest()` + Zod Rome schema
- `src/services/tourRegistry.js` kebab tours
- Landing / launch commerce SKUs
- `debugWaypoint.js` slug helpers (UI debug)
- Offline package + audio path helpers keyed to `/rome/...`

## Future city onboarding

1. Create `src/content/cities/<cityId>/` package (entities + manifest).
2. Set `metadata.published: true`.
3. Run `npm run generate:city -- --city <cityId>` (and any runtimeCompat path).
4. Catalog APIs pick it up automatically.
5. Wire experience screens in a later PR (not this one).

## PR 4 responsibilities (planned)

- Begin switching selected loaders/callers from Rome-hardcoded imports to
  `src/catalog` + city packages.
- Decide how launch SKUs relate to package products (entitlement mapping).
- Relax Zod `city: z.literal('rome')` when a second city is actually published.
- Optionally dedupe `debugWaypoint` aliases with `LEGACY_STOP_ALIASES`.
- Still no customer-visible behavior change unless explicitly scoped.
