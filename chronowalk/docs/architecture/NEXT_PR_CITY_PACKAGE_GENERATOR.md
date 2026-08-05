# Next PR: generic city package generator

## Intent

**PR 2** will introduce a generic city package generator that emits versioned city packages conforming to the domain contracts in `src/domain/` (`CITY_PACKAGE_SCHEMA_VERSION`, catalog entities, download manifests).

## Compatibility

- Keep **`npm run generate:rome-manifest`** as a **compatibility alias** that continues to produce today’s Rome `manifest.json` for the live PWA.
- Prefer implementing the shared generator first, then pointing the Rome script at it (or wrapping it) so Rome output stays byte-compatible unless an intentional migration follows.
- Do not remove or rename Rome-specific content paths in PR 2 without a dedicated cutover plan.

## Out of scope until later

- Wiring production screens to `src/domain/`
- Capacitor / iOS adapters
- Supabase or commerce backend changes
- AI features
