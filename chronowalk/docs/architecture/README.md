| Document | Purpose |
|----------|---------|
| [ADR-001-multi-city-platform.md](./ADR-001-multi-city-platform.md) | Platform decisions: multi-city, adapters, entitlements, versioned packages |
| [STABLE_ID_CONVENTION.md](./STABLE_ID_CONVENTION.md) | Stable string IDs; route order ≠ identity; legacy aliasing |
| [CITY_PACKAGE_GENERATOR.md](./CITY_PACKAGE_GENERATOR.md) | Generic city packages + `generateCityManifest({ cityId })` |
| [RUNTIME_CATALOG_AND_ROME_ADAPTER.md](./RUNTIME_CATALOG_AND_ROME_ADAPTER.md) | Runtime catalog + legacy Rome adapter (PR 3) |
| [GENERIC_COMMERCE_AND_ENTITLEMENTS.md](./GENERIC_COMMERCE_AND_ENTITLEMENTS.md) | Generic entitlements + Paddle compatibility (PR 4) |
| [GENERIC_NAVIGATION_AND_ROUTING.md](./GENERIC_NAVIGATION_AND_ROUTING.md) | Generic navigation + legacy URL compatibility (PR 5) |
| [CAPACITOR_IOS_SHELL.md](./CAPACITOR_IOS_SHELL.md) | Capacitor iOS shell + untracked ios/ safety (PR 6) |
| [NATIVE_DOWNLOAD_MANAGER.md](./NATIVE_DOWNLOAD_MANAGER.md) | Versioned native/web download manager (PR 7) |
| [NEXT_PR_CITY_PACKAGE_GENERATOR.md](./NEXT_PR_CITY_PACKAGE_GENERATOR.md) | Historical intent note (generator landed; see CITY_PACKAGE_GENERATOR.md) |

## Roadmap status

| PR | Topic | Status |
|----|-------|--------|
| 1 | Domain contracts | Done |
| 2 | City package generator | Done |
| 3 | Runtime catalog + Rome adapter | Done |
| 4 | Generic commerce / entitlements | Done |
| 5 | Generic navigation + routing | Done |
| 6 | Capacitor iOS shell foundation | Done |
| 7 | Native download manager | **This PR** |
| 8+ | StoreKit, entitlement sync, background audio/location, App Link polish | Later |
