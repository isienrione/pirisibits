# ChronoWalk Traveler (demo)

Expo development-build app. **DEMO_ONLY** — `DemoTravelerAppService` is a replaceable adapter. Screens do not import Rome JSON at runtime; they consume view models from the service. The fixture is generated from existing Rome sources.

## Run

```sh
# from repository root
pnpm install
pnpm generate:fixture
pnpm --filter @chronowalk/traveler start
```

iOS/Android need a development build. This environment has no simulator; use:

```sh
pnpm typecheck
pnpm test
```

Mapbox: set `EXPO_PUBLIC_MAPBOX_TOKEN`. Without it, the map stays a paper plot of sourced geofence centers (never a blank crash).

## Fonts

Fraunces / DM Sans / Barlow Condensed are requested by name with system fallbacks (`Georgia` / `System`). Google-font packages were not pinned in this sprint so install stays reliable.

## Replace the engine

Swap `createTravelerAppService()` in `src/demo/compositionRoot.ts`. Do not change screens.
