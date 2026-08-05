# City packages

ChronoWalk content is organized as **city packages** under `src/content/cities/`.

Rome is the first published city. The live PWA still loads
`src/content/rome/manifest.json` via `loadRomeManifest()` — that file is a
**runtime compatibility output** of the Rome city package, not a second source
of truth.

## Layout

```text
src/content/cities/
  <cityId>/
    city.json
    products.json
    routes.json
    stops.json
    assets.json
    manifest.json          # live-shape manifest for this city
    locales/<locale>/...
    metadata/package.json  # schema + package versions, runtimeCompat
    validation/rules.json
  __fixtures__/            # test-only packages (not published)
```

## Generator

```bash
npm run generate:city -- --city rome
npm run generate:rome-manifest   # compatibility alias → city rome
```

Implementation: `src/content/cityPackage/generateCityManifest.js`
(`generateCityManifest({ cityId })`).

## Validation

```js
import { validateCity, validateCatalog, loadCityPackage } from '../cityPackage/index.js'
```

See `docs/architecture/CITY_PACKAGE_GENERATOR.md`.
