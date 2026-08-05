# City package generator

## Status

Shipped (architecture migration). Customer-facing Rome PWA behavior is unchanged.

## What changed

- City content lives under `src/content/cities/<cityId>/`.
- Generic API: `generateCityManifest({ cityId })`.
- `npm run generate:rome-manifest` is a compatibility alias for
  `generateCityManifest({ cityId: 'rome' })` (also `npm run generate:city -- --city rome`).
- Runtime still loads `src/content/rome/manifest.json` via `loadRomeManifest()`.
  That path is written from `src/content/cities/rome/manifest.json`.

## Schema versions

| Constant | Initial | Location |
|----------|---------|----------|
| Catalog schema | 1 | `src/domain` + `cities/schemaVersions.js` |
| City package schema | 1 | same |
| Manifest schema | 1 | `cities/schemaVersions.js` (`MANIFEST_SCHEMA_VERSION`) |

## Validation

`validateCity(pkg)` and `validateCatalog(packages)` detect duplicate IDs, missing
assets/audio/products/previews, broken route references, invalid coordinates,
schema mismatches, duplicate display orders, orphan stops, and invalid locale
references.

## Next steps (not this PR)

- Wire production screens to city packages / `src/domain` gradually.
- Relax Zod `city: z.literal('rome')` when a second published city ships.
- Optional: reassemble live manifests from entity JSON instead of storing the
  full live-shape `manifest.json` in the package.
