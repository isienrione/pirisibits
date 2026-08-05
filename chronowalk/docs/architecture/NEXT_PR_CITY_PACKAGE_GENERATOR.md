# Next PR note (historical)

The generic city package generator described here has landed. See
[CITY_PACKAGE_GENERATOR.md](./CITY_PACKAGE_GENERATOR.md).

## Original intent

**PR 2** introduced a generic city package generator that emits versioned city
packages conforming to the domain contracts in `src/domain/`
(`CITY_PACKAGE_SCHEMA_VERSION`, catalog entities, download manifests).

## Compatibility (delivered)

- **`npm run generate:rome-manifest`** remains a **compatibility alias** that
  produces today’s Rome `manifest.json` for the live PWA via
  `generateCityManifest({ cityId: 'rome' })`.
- Prefer `npm run generate:city -- --city rome` for new scripts.
- Rome package SSOT: `src/content/cities/rome/`.
- Runtime load path unchanged: `src/content/rome/manifest.json`.

## Still out of scope

- Wiring production screens to `src/domain/` / city packages
- Capacitor / iOS adapters
- Supabase or commerce backend changes
- AI features
