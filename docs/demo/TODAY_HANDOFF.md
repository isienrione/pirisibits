# Today’s handoff — Traveler demo

## Result

A navigable Expo Traveler **draft** lives at `apps/traveler`. The Rome PWA in `chronowalk/` is untouched.

Vertical slice: A01 → onboarding (5 beats) → K01 → B01/B04/B05/B06 → C01 → C03 → Hero/Discovery/Mystery/Reveal → E01/E03 → C07 resume. Map, GPS weak, offline, saved, settings, diagnostics, and a Dev Gallery are wired.

It is **DEMO_ONLY**. `DemoTravelerAppService` is the only composer. Swap it in `src/demo/compositionRoot.ts`.

## What is simulated

| Piece | Where | Replacement |
| --- | --- | --- |
| Route composition | `DemoTravelerAppService` | City Engine at the composition root |
| 60/120/180 drafts | generated fixture | Engine `ComposedRoute` |
| Mapbox native map | paper plot of sourced geofences | `@rnmapbox/maps` when a token and native build exist |
| GPS | `expo-location` when granted on walk screens; DEV sims otherwise | production location adapter |
| Then/Now imagery | placeholder frames + provenance captions | real archive bitmaps when curated |

## What is sourced (not invented)

- Titles, geofence centers, radii, approach/arrival lines, reconstruction captions: `chronowalk/src/content/rome/manifest.json`
- Visit-minute ranges and several walk minutes: `docs/core_a/ROME_ROUTE_MASTER_FACTS.json` (from `Chronowalk Rome Route Master.md.rtf`)
- Walk minutes “nine minutes” / “Eight minutes”: current transit transcripts
- Losing alternative copy: `chronowalk/src/data/romePacing.js` Roma Historica
- Mystery hint: production script tease already in the Via Sacra chapter (`A different room…`)
- Mystery true title: waypoint `w20` in the manifest, shown only after reveal

Unpublished walks (e.g. Colosseum exterior → Arch of Titus) are `NEEDS_FIELD_QA`. No coordinates were guessed.

## Screens

`07_SCREEN_INVENTORY.md` is **not in this repo**. Registry = every Gate S id named in the sprint prompts, plus Diagnostics and Gallery as tools.

- **functional**: the vertical slice and accessed system screens listed in `src/registry/screenInventory.ts`
- **visual-draft**: `L01` Detail Hunt (no hunt clue/target/payoff in the sources used)
- **not-started**: none invented to pad a count of 41

Count today: **38 product ids + 2 dev tools**. Not claimed as the canonical 41.

## Tests

```
pnpm test       # 12 traveler tests + domain passWithNoTests
pnpm typecheck  # domain + traveler
```

All passing in this environment.

## Failures / blockages

- **No iOS/Android simulator** here — visual QA is not signed off. Use `pnpm --filter @chronowalk/traveler start` on a machine with Xcode or Android Studio.
- Canonical docs `01`–`08` and Santiago `docs/core_a` JSON are absent. Rome sources substituted; recorded as a canonical conflict.
- Figma MCP unauthenticated.
- Mapbox token unset.
- Expo Google Fonts not installed; system fallbacks documented.
- Native Mapbox SDK not linked (would require a dev client). Token-missing and token-present both show a sourced paper plot instead of a white screen.

## Files (principal)

- `apps/traveler/**`
- `packages/domain/**`
- `scripts/generate-demo-fixture.mjs`
- `docs/core_a/ROME_ROUTE_MASTER_FACTS.json`
- `docs/demo/**`
- `prompts/cursor-today/**`
- `.cursor/rules/chronowalk-product.mdc`
- root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`

## Next five tickets (DoD)

1. **Restore canonical inventory** — add `docs/canonical/07_SCREEN_INVENTORY.md` and reconcile the registry to the real 41 Gate S ids. DoD: count matches the doc; no invented screens.
2. **City Engine adapter** — implement `EngineTravelerAppService` behind the same port; keep Demo behind a flag. DoD: screens unchanged; golden fixture test vs Engine.
3. **Field-QA walking minutes** — measure Colosseum exterior → Arch of Titus (and any `NEEDS_FIELD_QA` walks). DoD: 120-minute draft `walkingMinComplete === true`.
4. **Mapbox development build** — token + `@rnmapbox/maps` in a dev client; keep the no-token paper plot. DoD: token present draws native map; token absent never blanks.
5. **Detail Hunt content** — only if a sourced clue, target, and payoff exist. DoD: L01 moves to `functional` or stays visual-draft honestly.
