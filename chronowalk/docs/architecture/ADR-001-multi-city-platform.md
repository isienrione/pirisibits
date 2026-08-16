# ADR-001: Multi-city platform foundation

## Status

Accepted (architecture extraction only — no runtime cutover in this PR).

## Context

ChronoWalk launched with Rome as a single published city on browser/PWA. The product roadmap includes additional cities and an iOS shell. Rome-specific field names and identity schemes (`hasRomeAccess`, `romeRoute`, `romeStops`, `waypoint12`, route index as identity) do not scale.

## Decision

1. **ChronoWalk is a multi-city platform.** Catalog, commerce, progress, downloads, and platform contracts are city-generic.
2. **Rome is the first published city.** Existing Rome web/PWA behavior remains the production experience until later cutover PRs.
3. **Browser/PWA and iOS share domain and experience code.** UI and narration flows should not fork by platform except at adapter boundaries.
4. **Platform-specific capabilities use adapters.** Purchases, downloads, audio, location, storage, deep links, and app lifecycle are injected as `PlatformServices`.
5. **Purchases from Paddle, Apple, and OTAs normalize into entitlements.** Store-specific receipts stay behind `PurchaseAdapter`; access is expressed as `Entitlement` on `productId` (and optional `cityId`).
6. **Content packages are versioned.** Catalog, city package, and download manifest payloads carry schema version constants starting at `1`.
7. **AI features are not being built now.** No generative or assistant surfaces ship in this foundation.
8. **Future AI will require curated source provenance and structured stop metadata.** Any later AI work must ground answers in versioned, attributable stop content — not free-form scraping of the UI.

## Consequences

- New domain modules live under `src/domain/` and are not wired into production screens yet.
- Rome continues to use its current manifests, routes, checkout, and offline paths unchanged.
- Follow-up work introduces a generic city package generator; `generate:rome-manifest` remains a compatibility alias (see `NEXT_PR_CITY_PACKAGE_GENERATOR.md`).

## Non-goals (this PR)

- Capacitor / native project scaffolding
- Supabase schema changes
- Customer-facing UI, routes, checkout, audio, prices, copy, or analytics changes
- Replacing the live Rome manifest or ID systems in production
